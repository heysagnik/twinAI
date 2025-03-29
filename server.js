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

// Add auth endpoint to handle Google OAuth redirects
app.get('/auth/google/callback', (req, res) => {
    // After successful authentication, redirect to the frontend
    res.redirect('http://localhost:5173');
});

// Also add a route to check auth status
app.get('/auth/status', async (req, res) => {
    try {
        const { getAuthClient } = require('./services/auth/googleAuth');
        const authClient = await getAuthClient();
        
        if (authClient) {
            // Check if token is valid by making a test request
            try {
                const calendar = await getCalendarClient();
                await calendar.calendarList.list({ maxResults: 1 });
                
                res.json({ 
                    authenticated: true,
                    services: {
                        gmail: true,
                        calendar: true
                    }
                });
            } catch (error) {
                // Authentication token exists but might be invalid
                res.json({ 
                    authenticated: false,
                    error: "Invalid or expired token"
                });
            }
        } else {
            res.json({ authenticated: false });
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        res.status(500).json({ 
            authenticated: false, 
            error: "Server error checking authentication"
        });
    }
});

// Route to initiate authentication
app.get('/auth/google', async (req, res) => {
    try {
        const { getAuthClient } = require('./services/auth/googleAuth');
        // This will trigger the auth flow if not authenticated
        await getAuthClient();
        res.redirect('http://localhost:5173');
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Logout route
app.get('/auth/logout', async (req, res) => {
    try {
        // Delete the token file
        const fs = require('fs').promises;
        const path = require('path');
        const TOKEN_PATH = path.join(process.cwd(), 'google_token.json');
        
        try {
            await fs.unlink(TOKEN_PATH);
            console.log('Token file deleted successfully');
        } catch (error) {
            console.log('No token file found to delete');
        }
        
        // Redirect back to the frontend
        res.redirect('http://localhost:5173');
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).send('Error during logout');
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server vibin' on port ${PORT}`));