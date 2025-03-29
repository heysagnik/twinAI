// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatService = require('./services/chat');

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

const PORT = 3000;
app.listen(PORT, () => console.log(`Server vibin' on port ${PORT}`));