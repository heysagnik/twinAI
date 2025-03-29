// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatService = require('./services/chat');
const connectDB = require('./db/connection');
const cookieParser = require('cookie-parser'); // Added cookie-parser

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true  // Allow cookies in CORS
}));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser

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
    // Set auth cookie after successful authentication
    res.cookie('googleAuthToken', 'authenticated', {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    
    // Redirect to the frontend
    res.redirect('http://localhost:5173');
});

// Also add a route to check auth status
app.get('/auth/status', async (req, res) => {
    try {
        // Check if we have a valid auth cookie
        const authCookie = req.cookies.googleAuthToken;
        
        if (!authCookie) {
            return res.json({ authenticated: false, reason: "no_cookie" });
        }
        
        const { getAuthClient } = require('./services/auth/googleAuth');
        
        try {
            const authClient = await getAuthClient();
            
            if (authClient) {
                // Verify token is valid with a test request
                const { getCalendarClient } = require('./services/auth/googleAuth');
                const calendar = await getCalendarClient();
                await calendar.calendarList.list({ maxResults: 1 });
                
                res.json({ 
                    authenticated: true,
                    services: {
                        gmail: true,
                        calendar: true
                    }
                });
            } else {
                res.clearCookie('googleAuthToken');
                res.json({ authenticated: false, reason: "invalid_token" });
            }
        } catch (error) {
            // Authentication token exists but might be invalid
            res.clearCookie('googleAuthToken');
            res.json({ 
                authenticated: false,
                reason: "token_error",
                error: "Invalid or expired token"
            });
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
        // Check if already authenticated via cookie
        if (req.cookies.googleAuthToken) {
            return res.redirect('http://localhost:5173');
        }
        
        const { getAuthClient } = require('./services/auth/googleAuth');
        // This will trigger the auth flow
        await getAuthClient();
        
        // Note: The actual cookie will be set in the callback route
        // This redirect might not happen if auth flow redirects to Google
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
        
        // Clear the auth cookie
        res.clearCookie('googleAuthToken');
        
        // Redirect back to the frontend
        res.redirect('http://localhost:5173');
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).send('Error during logout');
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server vibin' on port ${PORT}`));