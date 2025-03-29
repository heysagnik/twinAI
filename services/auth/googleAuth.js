const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');

// Combined scopes for Gmail and Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Unified token path
const TOKEN_PATH = path.join(process.cwd(), 'google_token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Frontend application URL for redirect after authentication
const REDIRECT_URL = 'http://localhost:5173';

// Cache for client instances
let authClient = null;
let gmailClient = null;
let calendarClient = null;
let lastClientRefresh = 0;
const CLIENT_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

/**
 * Get authenticated Google client with unified scopes
 * @returns {Promise<Object>} OAuth2 client
 */
async function getAuthClient() {
  try {
    const now = Date.now();
    
    // Return cached client if valid
    if (authClient && (now - lastClientRefresh) < CLIENT_REFRESH_INTERVAL) {
      return authClient;
    }
    
    console.log('Initializing Google auth client...');
    
    // Try to load saved credentials
    let client = null;
    try {
      const content = await fs.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content);
      client = google.auth.fromJSON(credentials);
      console.log('Loaded existing token from google_token.json');
    } catch (err) {
      console.log('No saved token found. Starting new authentication flow...');
    }

    if (!client) {
      // Authenticate with browser flow if no saved credentials
      client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
        // Add the redirect settings
        redirectUri: REDIRECT_URL
      });
      
      // Save credentials for future use
      if (client.credentials) {
        const keys = JSON.parse(await fs.readFile(CREDENTIALS_PATH));
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
          type: 'authorized_user',
          client_id: key.client_id,
          client_secret: key.client_secret,
          refresh_token: client.credentials.refresh_token,
        });
        await fs.writeFile(TOKEN_PATH, payload);
        console.log('Token saved to google_token.json');
      }
    }
    
    authClient = client;
    lastClientRefresh = now;
    
    // Reset service clients to force recreation with new auth
    gmailClient = null;
    calendarClient = null;
    
    return authClient;
  } catch (error) {
    console.error('Error in Google authentication:', error);
    throw error;
  }
}

/**
 * Get Gmail client using unified auth
 * @returns {Promise<Object>} Gmail client
 */
async function getGmailClient() {
  if (gmailClient) return gmailClient;
  
  const authClient = await getAuthClient();
  gmailClient = google.gmail({ version: 'v1', auth: authClient });
  
  return gmailClient;
}

/**
 * Get Calendar client using unified auth
 * @returns {Promise<Object>} Calendar client
 */
async function getCalendarClient() {
  if (calendarClient) return calendarClient;
  
  const authClient = await getAuthClient();
  calendarClient = google.calendar({ version: 'v3', auth: authClient });
  
  return calendarClient;
}

module.exports = {
  getAuthClient,
  getGmailClient,
  getCalendarClient
};