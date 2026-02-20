const express = require('express');
const path = require('path');
const multer = require('multer');

// Image processing and NSFW detection
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');
const jpeg = require('jpeg-js');
const png = require('pngjs').PNG;

let nsfwModel;
// Load the NSFW model
(async () => {
    try {
        nsfwModel = await nsfw.load();
        console.log("NSFW Model loaded");
    } catch (err) {
        console.error("Failed to load NSFW model:", err);
    }
})();

// Prometheus metrics
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Create custom metrics
const httpRequestCount = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials (in production, use environment variables and hashed passwords)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
let adminSessions = new Set(); // Store active admin sessions

// Import offensive words list
const OFFENSIVE_WORDS = require('./offensive-words.json');

function containsOffensiveContent(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    
    // Check for links
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|org|net|edu|gov|mil|int|info|biz|io|co|me)\b)/i;
    if (urlPattern.test(text)) {
        return true;
    }

    return OFFENSIVE_WORDS.some(word => lowerText.includes(word));
}

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

// Helper function to decode image buffer
async function decodeImage(buffer, mimeType) {
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        const image = jpeg.decode(buffer, { useTArray: true });
        const numChannels = 3;
        const numPixels = image.width * image.height;
        const values = new Int32Array(numPixels * numChannels);

        for (let i = 0; i < numPixels; i++) {
            for (let c = 0; c < numChannels; c++) {
                values[i * numChannels + c] = image.data[i * 4 + c];
            }
        }
        return tf.tensor3d(values, [image.height, image.width, numChannels], 'int32');
    } else if (mimeType === 'image/png') {
        return new Promise((resolve, reject) => {
            new png().parse(buffer, (err, image) => {
                if (err) return reject(err);
                
                const numChannels = 3;
                const numPixels = image.width * image.height;
                const values = new Int32Array(numPixels * numChannels);
                
                for (let i = 0; i < numPixels; i++) {
                    for (let c = 0; c < numChannels; c++) {
                        values[i * numChannels + c] = image.data[i * 4 + c];
                    }
                }
                resolve(tf.tensor3d(values, [image.height, image.width, numChannels], 'int32'));
            });
        });
    } else {
        throw new Error('Unsupported image format for NSFW check');
    }
}

// Stores the messages in memory (resets when server restarts !!)
let messages = [];
let messageLikes = {}; // Track likes per message: { messageId: count }
let messageReports = {}; // Track reports per message: { messageId: [reasons] }

// Middleware to measure metrics
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    httpRequestCount.labels(req.method, req.path, res.statusCode).inc();
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
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
app.get('/api/messages', (req, res) => {
    const { category } = req.query;
    
    if (category && category !== 'all') {
        const filtered = messages.filter(msg => msg.category === category);
        return res.json(filtered);
    }
    
    res.json(messages);
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

// Post a new message with optional image
app.post('/api/messages', upload.single('image'), async (req, res) => {
    const { message, category, imageUrl, username, avatar } = req.body;
    
    // Allow posting if either message, file, or URL is present
    if ((!message || message.trim() === '') && !req.file && (!imageUrl || !imageUrl.trim())) {
        return res.status(400).json({ error: 'Message or image is required' });
    }

    if (containsOffensiveContent(message)) {
        return res.status(400).json({ error: 'Message contains offensive content or links. Please keep the community safe.' });
    }
    
    // Check if filename contains offensive words
    if (req.file) {
        if (containsOffensiveContent(req.file.originalname)) {
             return res.status(400).json({ error: 'Image filename contains offensive content.' });
        }
    }

    // NSFW Check for uploaded images
    if (req.file && nsfwModel) {
        try {
            const imageTensor = await decodeImage(req.file.buffer, req.file.mimetype);
            const predictions = await nsfwModel.classify(imageTensor);
            imageTensor.dispose(); // Prevent memory leaks
            
            // Check top probability
            const topPrediction = predictions[0];
            const blockedCategories = ['Porn', 'Hentai', 'Sexy'];
            
            // Block if probability > 60% for Porn/Hentai or > 80% for Sexy
            const isPornOrHentai = (topPrediction.className === 'Porn' || topPrediction.className === 'Hentai') && topPrediction.probability > 0.6;
            const isSexy = topPrediction.className === 'Sexy' && topPrediction.probability > 0.8;
            
            if (isPornOrHentai || isSexy) {
                 return res.status(400).json({ error: 'Image content flagged as inappropriate.' });
            }
        } catch (err) {
            console.error('NSFW Check failed:', err);
             // Proceed cautiously or block if check fails? For now, we log and allow unless specific error strategy is desired.
             // If unsupported format (like gif), we might just skip the check or block.
             if (err.message === 'Unsupported image format for NSFW check') {
                 // Skip check for unsupported formats (e.g. gif)
             }
        }
    }

    const validCategories = ['whistleblower', 'knowledge', 'thoughts', 'confessions'];
    const messageCategory = validCategories.includes(category) ? category : 'thoughts';
    
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
        avatar: avatar || '👤'
    };
    
    messages.unshift(newMessage); // Add to beginning of array
    res.status(201).json(newMessage);
});

// Delete a message (admin only)
app.delete('/api/messages/:id', (req, res) => {
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
    // Clean up likes and reports
    delete messageLikes[messageId];
    delete messageReports[messageId];
    res.status(200).json({ success: true });
});

// Like a message
app.post('/api/messages/:id/like', (req, res) => {
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
    
    res.json({ likes: messageLikes[messageId] });
});

// Unlike a message
app.post('/api/messages/:id/unlike', (req, res) => {
    const messageId = parseInt(req.params.id);
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    if (messageLikes[messageId] && messageLikes[messageId] > 0) {
        messageLikes[messageId]--;
        message.likes = messageLikes[messageId];
    }
    
    res.json({ likes: messageLikes[messageId] || 0 });
});

// Report a message
app.post('/api/messages/:id/report', (req, res) => {
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
    
    res.json({ success: true, reportCount: messageReports[messageId].length });
});

// Get reported messages (admin only)
app.post('/api/admin/reports', (req, res) => {
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
app.get('/api/messages/counts', (req, res) => {
    const counts = {
        all: messages.length,
        whistleblower: messages.filter(m => m.category === 'whistleblower').length,
        knowledge: messages.filter(m => m.category === 'knowledge').length,
        thoughts: messages.filter(m => m.category === 'thoughts').length,
        confessions: messages.filter(m => m.category === 'confessions').length
    };
    res.json(counts);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Export for Vercel serverless
module.exports = app;

// Start server locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
