const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Prometheus metrics
// const client = require('prom-client');
// const collectDefaultMetrics = client.collectDefaultMetrics;
// collectDefaultMetrics();

// Create custom metrics
/* const httpRequestCount = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
}); */

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'stickly-data.json');

const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env['NEXT_PUBLIC_*SUPABASE_URL'];
const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
const supabase = (supabaseUrl && supabaseServiceRoleKey)
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;
const supabaseMessagesTable = process.env.SUPABASE_MESSAGES_TABLE || 'stickly_messages';
const supabaseMissingConfigMessage =
    'Missing Supabase env vars. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_*SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY).';

function toSupabaseMessageRow(messagePayload, reports = []) {
    return {
        message_id: messagePayload.id,
        text: messagePayload.text || '',
        category: messagePayload.category || 'thoughts',
        timestamp: messagePayload.timestamp || new Date().toISOString(),
        image: messagePayload.image || null,
        likes: Number.isFinite(messagePayload.likes) ? messagePayload.likes : 0,
        username: messagePayload.username || 'Anonymous',
        avatar: messagePayload.avatar || '👤',
        expires_at: messagePayload.expiresAt || null,
        replies: Array.isArray(messagePayload.replies) ? messagePayload.replies : [],
        reports: Array.isArray(reports) ? reports : [],
        deleted: false,
        updated_at: new Date().toISOString()
    };
}

async function upsertMessageToSupabase(messagePayload, reports = []) {
    if (!supabase || !messagePayload) {
        return;
    }

    const row = toSupabaseMessageRow(messagePayload, reports);
    const { error } = await supabase
        .from(supabaseMessagesTable)
        .upsert(row, { onConflict: 'message_id' });

    if (error) {
        console.error('Supabase message sync failed:', error.message);
    }
}

async function syncMessageStateToSupabase(messageId) {
    if (!supabase) {
        return;
    }

    const message = messages.find(msg => msg.id === messageId);
    if (!message) {
        return;
    }

    const reports = Array.isArray(messageReports[messageId]) ? messageReports[messageId] : [];
    await upsertMessageToSupabase(message, reports);
}

async function markMessageDeletedInSupabase(messageId) {
    if (!supabase) {
        return;
    }

    const { error } = await supabase
        .from(supabaseMessagesTable)
        .update({ deleted: true, updated_at: new Date().toISOString() })
        .eq('message_id', messageId);

    if (error) {
        console.error('Supabase delete sync failed:', error.message);
    }
}

function normalizeMessageFromSupabase(row) {
    return {
        id: row.message_id,
        text: row.text || '',
        category: row.category || 'thoughts',
        timestamp: row.timestamp || new Date().toISOString(),
        image: row.image || null,
        likes: Number.isFinite(row.likes) ? row.likes : 0,
        username: row.username || 'Anonymous',
        avatar: row.avatar || '👤',
        expiresAt: row.expires_at || null,
        replies: normalizeReplyTree(row.replies)
    };
}

function normalizeReplyTree(replies) {
    if (!Array.isArray(replies)) {
        return [];
    }

    return replies.map(reply => ({
        id: Number.isFinite(reply?.id) ? reply.id : Date.now() + Math.floor(Math.random() * 1000),
        text: typeof reply?.text === 'string' ? reply.text : '',
        username: reply?.username || 'Anonymous',
        avatar: reply?.avatar || '👤',
        timestamp: reply?.timestamp || new Date().toISOString(),
        likes: Number.isFinite(reply?.likes) ? reply.likes : 0,
        replies: normalizeReplyTree(reply?.replies)
    }));
}

function findReplyById(replyList, replyId) {
    if (!Array.isArray(replyList)) {
        return null;
    }

    for (const reply of replyList) {
        if (reply.id === replyId) {
            return reply;
        }

        const nestedMatch = findReplyById(reply.replies, replyId);
        if (nestedMatch) {
            return nestedMatch;
        }
    }

    return null;
}

function rebuildLocalIndexesFromMessages(rows) {
    messageLikes = {};
    messageReports = {};

    rows.forEach(message => {
        messageLikes[message.id] = Number.isFinite(message.likes) ? message.likes : 0;
        if (Array.isArray(message.reports) && message.reports.length > 0) {
            messageReports[message.id] = message.reports;
        }
    });
}

async function purgeExpiredMessagesInSupabase() {
    if (!supabase) {
        return;
    }

    const nowIso = new Date().toISOString();
    const { error } = await supabase
        .from(supabaseMessagesTable)
        .update({ deleted: true, updated_at: nowIso })
        .eq('deleted', false)
        .lte('expires_at', nowIso);

    if (error) {
        console.error('Supabase expiry sync failed:', error.message);
    }
}

async function hydrateMessagesFromSupabase() {
    if (!supabase) {
        return;
    }

    await purgeExpiredMessagesInSupabase();

    const { data, error } = await supabase
        .from(supabaseMessagesTable)
        .select('*')
        .eq('deleted', false)
        .order('timestamp', { ascending: false })
        .limit(500);

    if (error) {
        console.error('Supabase read failed:', error.message);
        return;
    }

    const now = Date.now();
    const filtered = (data || []).filter(row => {
        if (!row.expires_at) {
            return true;
        }

        const expiryMs = new Date(row.expires_at).getTime();
        return Number.isFinite(expiryMs) && expiryMs > now;
    });

    messages = filtered.map(normalizeMessageFromSupabase);
    rebuildLocalIndexesFromMessages(filtered);
    savePersistedState();
}

// Admin credentials (in production, use environment variables and hashed passwords)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
let adminSessions = new Set(); // Store active admin sessions

// Configure multer for image uploads
// For Vercel, we need to handle this differently since serverless functions don't have persistent file storage
const storage = multer.memoryStorage(); // Use memory storage for serverless compatibility

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|gif|png/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG, JPG, GIF, and PNG images are allowed'));
    }
});

function loadPersistedState() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return { messages: [], messageLikes: {}, messageReports: {} };
        }

        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        if (!raw.trim()) {
            return { messages: [], messageLikes: {}, messageReports: {} };
        }

        const parsed = JSON.parse(raw);
        return {
            messages: Array.isArray(parsed.messages) ? parsed.messages : [],
            messageLikes: parsed.messageLikes && typeof parsed.messageLikes === 'object' ? parsed.messageLikes : {},
            messageReports: parsed.messageReports && typeof parsed.messageReports === 'object' ? parsed.messageReports : {}
        };
    } catch (error) {
        console.error('Failed to load persisted data, starting with empty state:', error.message);
        return { messages: [], messageLikes: {}, messageReports: {} };
    }
}

function savePersistedState() {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify({ messages, messageLikes, messageReports }, null, 2),
            'utf8'
        );
    } catch (error) {
        console.error('Failed to save persisted data:', error.message);
    }
}

const persistedState = loadPersistedState();
let messages = persistedState.messages.map(message => ({
    ...message,
    replies: normalizeReplyTree(message.replies)
}));
let messageLikes = persistedState.messageLikes; // Track likes per message: { messageId: count }
let messageReports = persistedState.messageReports; // Track reports per message: { messageId: [reasons] }
const AUTO_DELETE_MINUTES = new Set([1, 30, 60, 1440, 10080]);

function purgeExpiredMessages() {
    const now = Date.now();
    const expiredMessageIds = [];

    messages = messages.filter(message => {
        if (!message.expiresAt) return true;

        const expiresAtMs = new Date(message.expiresAt).getTime();
        const isActive = Number.isFinite(expiresAtMs) && expiresAtMs > now;
        if (!isActive) {
            expiredMessageIds.push(message.id);
        }
        return isActive;
    });

    expiredMessageIds.forEach(messageId => {
        delete messageLikes[messageId];
        delete messageReports[messageId];

        markMessageDeletedInSupabase(messageId).catch(err => {
            console.error('Supabase delete sync failed:', err.message);
        });
    });

    if (expiredMessageIds.length > 0) {
        savePersistedState();
    }
}

const purgeInterval = setInterval(purgeExpiredMessages, 30 * 1000);
if (typeof purgeInterval.unref === 'function') {
    purgeInterval.unref();
}

// Middleware to measure metrics
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  /* const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    httpRequestCount.labels(req.method, req.path, res.statusCode).inc();
    end({ method: req.method, route: req.path, status: res.statusCode });
  }); */
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all messages or filter by category
app.get('/api/messages', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const { category } = req.query;
    
    if (category && category !== 'all') {
        const filtered = messages.filter(msg => msg.category === category);
        return res.json(filtered);
    }
    
    res.json(messages);
});

app.get('/api/messages/cloud', async (req, res) => {
    if (!supabase) {
        return res.status(500).json({
            ok: false,
            error: supabaseMissingConfigMessage
        });
    }

    await purgeExpiredMessagesInSupabase();

    const { category, includeDeleted } = req.query;
    let query = supabase
        .from(supabaseMessagesTable)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

    if (includeDeleted !== 'true') {
        query = query.eq('deleted', false);
    }

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ ok: false, error: error.message });
    }

    const now = Date.now();
    const activeData = (data || []).filter(row => {
        if (!row.expires_at) {
            return true;
        }

        const expiryMs = new Date(row.expires_at).getTime();
        return Number.isFinite(expiryMs) && expiryMs > now;
    });

    return res.json({ ok: true, table: supabaseMessagesTable, count: activeData.length, data: activeData });
});

app.get('/api/supabase-test', async (req, res) => {
    if (!supabase) {
        return res.status(500).json({
            ok: false,
            error: supabaseMissingConfigMessage
        });
    }

    const { data, error } = await supabase.from('notes').select('*').limit(10);

    if (error) {
        return res.status(500).json({ ok: false, error: error.message });
    }

    return res.json({ ok: true, data });
});

app.post('/api/supabase-test', async (req, res) => {
    if (!supabase) {
        return res.status(500).json({
            ok: false,
            error: supabaseMissingConfigMessage
        });
    }

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title) {
        return res.status(400).json({ ok: false, error: 'title is required' });
    }

    const { data, error } = await supabase
        .from('notes')
        .insert({ title })
        .select('*')
        .single();

    if (error) {
        return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(201).json({ ok: true, data });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const sessionId = Date.now() + '-' + Math.random().toString(36);
        adminSessions.add(sessionId);
        res.json({ success: true, sessionId });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
    const { sessionId } = req.body;
    adminSessions.delete(sessionId);
    res.json({ success: true });
});

// Check admin status
app.post('/api/admin/check', (req, res) => {
    const { sessionId } = req.body;
    res.json({ isAdmin: adminSessions.has(sessionId) });
});

app.post('/api/admin/migrate-local-to-cloud', async (req, res) => {
    const { sessionId } = req.body;

    if (!adminSessions.has(sessionId)) {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }

    if (!supabase) {
        return res.status(500).json({
            ok: false,
            error: supabaseMissingConfigMessage
        });
    }

    purgeExpiredMessages();

    const migrationRows = messages.map(message => {
        const reports = Array.isArray(messageReports[message.id]) ? messageReports[message.id] : [];
        return toSupabaseMessageRow(message, reports);
    });

    if (migrationRows.length === 0) {
        return res.json({ ok: true, migrated: 0, skipped: 0, table: supabaseMessagesTable });
    }

    const { error } = await supabase
        .from(supabaseMessagesTable)
        .upsert(migrationRows, { onConflict: 'message_id' });

    if (error) {
        return res.status(500).json({ ok: false, error: error.message });
    }

    return res.json({
        ok: true,
        migrated: migrationRows.length,
        skipped: 0,
        table: supabaseMessagesTable
    });
});

// Post a new message with optional image
app.post('/api/messages', upload.single('image'), async (req, res) => {
    purgeExpiredMessages();
    const { message, category, imageUrl, username, avatar, autoDeleteMinutes } = req.body;
    
    // Allow posting if either message, file, or URL is present
    if ((!message || message.trim() === '') && !req.file && (!imageUrl || !imageUrl.trim())) {
        return res.status(400).json({ error: 'Message or image is required' });
    }
    
    const validCategories = ['whistleblower', 'controversy', 'thoughts', 'confessions', 'others'];
    const messageCategory = validCategories.includes(category) ? category : 'thoughts';

    const parsedMinutes = (autoDeleteMinutes === undefined || autoDeleteMinutes === null || String(autoDeleteMinutes).trim() === '')
        ? 1440
        : parseInt(String(autoDeleteMinutes), 10);

    if (!AUTO_DELETE_MINUTES.has(parsedMinutes)) {
        return res.status(400).json({ error: 'Invalid auto-delete duration selected.' });
    }

    const expiresAt = new Date(Date.now() + parsedMinutes * 60 * 1000).toISOString();
    
    // Handle image - either from file upload or URL
    let imageDataUrl = null;
    if (req.file) {
        // Convert uploaded file buffer to base64 data URL for serverless compatibility
        const base64 = req.file.buffer.toString('base64');
        imageDataUrl = `data:${req.file.mimetype};base64,${base64}`;
    } else if (imageUrl && imageUrl.trim()) {
        // Use the provided URL directly
        imageDataUrl = imageUrl.trim();
    }
    
    const newMessage = {
        id: Date.now(),
        text: message ? message.trim() : '',
        category: messageCategory,
        timestamp: new Date().toISOString(),
        image: imageDataUrl,
        likes: 0,
        username: username || 'Anonymous',
        avatar: avatar || '👤',
        expiresAt,
        replies: []
    };
    
    messages.unshift(newMessage); // Add to beginning of array
    savePersistedState();

    await upsertMessageToSupabase(newMessage);

    res.status(201).json(newMessage);
});

// Delete a message (admin only)
app.delete('/api/messages/:id', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const { sessionId } = req.body;
    
    // Check if user is admin
    if (!adminSessions.has(sessionId)) {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }
    
    const messageId = parseInt(req.params.id);
    const index = messages.findIndex(msg => msg.id === messageId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    messages.splice(index, 1);

    await markMessageDeletedInSupabase(messageId);

    // Clean up likes and reports
    delete messageLikes[messageId];
    delete messageReports[messageId];
    savePersistedState();
    res.status(200).json({ success: true });
});

// Like a message
app.post('/api/messages/:id/like', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const messageId = parseInt(req.params.id);
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    // Initialize likes count if not exists
    if (!messageLikes[messageId]) {
        messageLikes[messageId] = 0;
    }
    
    messageLikes[messageId]++;
    message.likes = messageLikes[messageId];
    savePersistedState();

    await syncMessageStateToSupabase(messageId);
    
    res.json({ likes: messageLikes[messageId] });
});

// Unlike a message
app.post('/api/messages/:id/unlike', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const messageId = parseInt(req.params.id);
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    if (messageLikes[messageId] && messageLikes[messageId] > 0) {
        messageLikes[messageId]--;
        message.likes = messageLikes[messageId];
        savePersistedState();

        await syncMessageStateToSupabase(messageId);
    }
    
    res.json({ likes: messageLikes[messageId] || 0 });
});

// Reply to a message
app.post('/api/messages/:id/reply', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const messageId = parseInt(req.params.id);
    const { text, username, avatar } = req.body;
    const message = messages.find(msg => msg.id === messageId);

    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Reply text is required' });
    }

    if (!message.replies) {
        message.replies = [];
    }

    const reply = {
        id: Date.now(),
        text: text.trim(),
        username: username || 'Anonymous',
        avatar: avatar || '👤',
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
    };

    message.replies.push(reply);
    savePersistedState();

    await syncMessageStateToSupabase(messageId);

    res.status(201).json(reply);
});

// Like a comment/reply
app.post('/api/messages/:id/replies/:replyId/like', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const messageId = parseInt(req.params.id);
    const replyId = parseInt(req.params.replyId);
    const message = messages.find(msg => msg.id === messageId);

    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }

    const reply = findReplyById(message.replies, replyId);
    if (!reply) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    if (!Number.isFinite(reply.likes)) {
        reply.likes = 0;
    }

    reply.likes += 1;
    savePersistedState();

    await syncMessageStateToSupabase(messageId);

    res.json({ likes: reply.likes });
});

// Unlike a comment/reply
app.post('/api/messages/:id/replies/:replyId/unlike', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const messageId = parseInt(req.params.id);
    const replyId = parseInt(req.params.replyId);
    const message = messages.find(msg => msg.id === messageId);

    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }

    const reply = findReplyById(message.replies, replyId);
    if (!reply) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    if (!Number.isFinite(reply.likes)) {
        reply.likes = 0;
    }

    if (reply.likes > 0) {
        reply.likes -= 1;
    }

    savePersistedState();

    await syncMessageStateToSupabase(messageId);

    res.json({ likes: reply.likes });
});

// Reply to an existing comment/reply
app.post('/api/messages/:id/replies/:replyId/reply', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const messageId = parseInt(req.params.id);
    const replyId = parseInt(req.params.replyId);
    const { text, username, avatar } = req.body;
    const message = messages.find(msg => msg.id === messageId);

    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Reply text is required' });
    }

    const parentReply = findReplyById(message.replies, replyId);
    if (!parentReply) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    if (!Array.isArray(parentReply.replies)) {
        parentReply.replies = [];
    }

    const nestedReply = {
        id: Date.now(),
        text: text.trim(),
        username: username || 'Anonymous',
        avatar: avatar || '👤',
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
    };

    parentReply.replies.push(nestedReply);
    savePersistedState();

    await syncMessageStateToSupabase(messageId);

    res.status(201).json(nestedReply);
});

// Report a message
app.post('/api/messages/:id/report', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const messageId = parseInt(req.params.id);
    const { reason } = req.body;
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    if (!messageReports[messageId]) {
        messageReports[messageId] = [];
    }
    
    messageReports[messageId].push({
        reason: reason || 'No reason provided',
        timestamp: new Date().toISOString()
    });

    savePersistedState();

    await syncMessageStateToSupabase(messageId);
    
    res.json({ success: true, reportCount: messageReports[messageId].length });
});

// Get reported messages (admin only)
app.post('/api/admin/reports', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const { sessionId } = req.body;
    
    if (!adminSessions.has(sessionId)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const reportedMessages = Object.keys(messageReports)
        .map(msgId => {
            const message = messages.find(m => m.id === parseInt(msgId));
            return message ? {
                ...message,
                reports: messageReports[msgId]
            } : null;
        })
        .filter(m => m !== null);
    
    res.json(reportedMessages);
});

// Get message counts by category
app.get('/api/messages/counts', async (req, res) => {
    purgeExpiredMessages();
    await hydrateMessagesFromSupabase();

    const counts = {
        all: messages.length,
        whistleblower: messages.filter(m => m.category === 'whistleblower').length,
        controversy: messages.filter(m => m.category === 'controversy').length,
        thoughts: messages.filter(m => m.category === 'thoughts').length,
        confessions: messages.filter(m => m.category === 'confessions').length,
        others: messages.filter(m => m.category === 'others').length
    };
    res.json(counts);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        // res.set('Content-Type', client.register.contentType);
        // res.end(await client.register.metrics());
        res.status(501).send('Metrics disabled'); 
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Export for Vercel serverless
module.exports = app;

// Start server locally
if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });

    // Handle server errors
    server.on('error', (err) => {
        console.error('Server error:', err);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
    });
}
