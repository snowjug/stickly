const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

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

// Post a new message
app.post('/api/messages', (req, res) => {
    const { message, category } = req.body;
    
    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    const validCategories = ['inspiration', 'knowledge', 'thoughts', 'confessions'];
    const messageCategory = validCategories.includes(category) ? category : 'thoughts';
    
    const newMessage = {
        id: Date.now(),
        text: message.trim(),
        category: messageCategory,
        timestamp: new Date().toISOString()
    };
    
    messages.unshift(newMessage); // Add to beginning of array
    res.status(201).json(newMessage);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
