// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const chatService = require('./services/chat');
const connectDB = require('./db/connection');

// Connect to MongoDB
connectDB();

const app = express();

// Use Helmet for better security
app.use(helmet());

// Use environment variables for production support
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use(express.static('public'));

// Chat endpoint with session ID
app.post('/chat', async (req, res, next) => {
    try {
        const userInput = req.body.message;
        const sessionId = req.body.sessionId || 'default';
        const response = await chatService.processInput(userInput, sessionId);
        res.json({ response });
    } catch (error) {
        next(error);
    }
});

// Add endpoint to retrieve conversation history
app.get('/history/:sessionId', async (req, res, next) => {
    try {
        const sessionId = req.params.sessionId;
        const limit = parseInt(req.query.limit) || 10;
        const history = await chatService.getConversationHistory(sessionId, limit);
        res.json({ history });
    } catch (error) {
        next(error);
    }
});

// Auth endpoints remain similar; production logging and error handling added
app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).send('No authorization code provided');
        }
        const { exchangeCodeForTokens } = require('./services/auth/googleAuth');
        await exchangeCodeForTokens(code);
        res.redirect(`${FRONTEND_URL}/auth-success`);
    } catch (error) {
        console.error('Error in auth callback:', error);
        res.redirect(`${FRONTEND_URL}/auth-error`);
    }
});

app.get('/auth/status', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({ authenticated: false, reason: "no_token" });
        }
        const { getAuthClient, tokenExists } = require('./services/auth/googleAuth');
        const hasToken = await tokenExists();
        if (!hasToken) {
            return res.json({ authenticated: false, reason: "no_token_file" });
        }
        
        try {
            const authClient = await getAuthClient(true);
            if (authClient) {
                const { getCalendarClient } = require('./services/auth/googleAuth');
                const calendar = await getCalendarClient(true);
                await calendar.calendarList.list({ maxResults: 1 });
                
                res.json({ 
                    authenticated: true,
                    services: {
                        gmail: true,
                        calendar: true
                    }
                });
            } else {
                res.json({ authenticated: false, reason: "invalid_token" });
            }
        } catch (error) {
            res.json({ 
                authenticated: false,
                reason: "token_error",
                error: "Invalid or expired token"
            });
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        res.status(500).json({ authenticated: false, error: "Server error checking authentication" });
    }
});

app.get('/auth/google', async (req, res) => {
    try {
        const { getAuthUrl } = require('./services/auth/googleAuth');
        const authUrl = await getAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).send('Authentication failed');
    }
});

app.get('/auth/logout', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || path.join(process.cwd(), 'google_token.json');
        
        try {
            await fs.unlink(TOKEN_PATH);
            console.log('Token file deleted successfully');
        } catch (error) {
            console.log('No token file found to delete');
        }
        res.redirect(`${FRONTEND_URL}/logout`);
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).send('Error during logout');
    }
});

// Global error handler (for scalability)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server vibin' on port ${PORT}`));