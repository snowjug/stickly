const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Admin credentials (in production, use environment variables and hashed passwords)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
let adminSessions = new Set(); // Store active admin sessions

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

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

// Store messages in memory (resets when server restarts)
let messages = [];

// Middleware
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
app.post('/api/messages', upload.single('image'), (req, res) => {
    const { message, category } = req.body;
    
    // Allow posting if either message or image is present
    if ((!message || message.trim() === '') && !req.file) {
        return res.status(400).json({ error: 'Message or image is required' });
    }
    
    const validCategories = ['inspiration', 'knowledge', 'thoughts', 'confessions'];
    const messageCategory = validCategories.includes(category) ? category : 'thoughts';
    
    const newMessage = {
        id: Date.now(),
        text: message ? message.trim() : '',
        category: messageCategory,
        timestamp: new Date().toISOString(),
        image: req.file ? `/uploads/${req.file.filename}` : null
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
    
    const message = messages[index];
    
    // Delete image file if it exists
    if (message.image) {
        const imagePath = path.join(__dirname, 'public', message.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }
    
    messages.splice(index, 1);
    res.status(200).json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
