// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatService = require('./services/chat');
const connectDB = require('./db/connection');

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Chat endpoint with session ID
app.post('/chat', async (req, res) => {
    const userInput = req.body.message;
    const sessionId = req.body.sessionId || 'default'; // Use sessionId from client or default
    const response = await chatService.processInput(userInput, sessionId);
    res.json({ response });
});

// Add endpoint to retrieve conversation history
app.get('/history/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const limit = parseInt(req.query.limit) || 10;
        const history = await chatService.getConversationHistory(sessionId, limit);
        res.json({ history });
    } catch (error) {
        console.error('Error retrieving conversation history:', error);
        res.status(500).json({ error: 'Failed to retrieve conversation history' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server vibin' on port ${PORT}`));