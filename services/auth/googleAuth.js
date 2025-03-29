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
const REDIRECT_URL = 'http://localhost:3000/auth/google/callback'; // Change to server callback

// Cache for client instances
let authClient = null;
let gmailClient = null;
let calendarClient = null;
let lastClientRefresh = 0;
const CLIENT_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

/**
 * Check if token file exists
 * @returns {Promise<boolean>} True if token exists
 */
async function tokenExists() {
  try {
    await fs.access(TOKEN_PATH);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get authentication URL for frontend to redirect to
 * @returns {Promise<string>} Authentication URL
 */
async function getAuthUrl() {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    
    const oAuth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      REDIRECT_URL
    );
    
    return oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force to get refresh token
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw error;
  }
}

/**
 * Get authenticated Google client with unified scopes
 * @param {boolean} skipBrowserAuth - If true, don't open browser for auth
 * @returns {Promise<Object|null>} OAuth2 client or null if auth needed
 */
async function getAuthClient(skipBrowserAuth = false) {
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
      console.log('No saved token found.');
      
      if (skipBrowserAuth) {
        console.log('Skipping browser auth as requested.');
        return null;
      }
    }

    if (!client && !skipBrowserAuth) {
      // Authenticate with browser flow if no saved credentials
      client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
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
    
    if (client) {
      authClient = client;
      lastClientRefresh = now;
      
      // Reset service clients to force recreation with new auth
      gmailClient = null;
      calendarClient = null;
    }
    
    return authClient;
  } catch (error) {
    console.error('Error in Google authentication:', error);
    throw error;
  }
}

/**
 * Get Gmail client using unified auth
 * @param {boolean} skipBrowserAuth - If true, don't open browser for auth
 * @returns {Promise<Object|null>} Gmail client or null if auth needed
 */
async function getGmailClient(skipBrowserAuth = false) {
  if (gmailClient) return gmailClient;
  
  const authClient = await getAuthClient(skipBrowserAuth);
  if (!authClient) return null;
  
  gmailClient = google.gmail({ version: 'v1', auth: authClient });
  return gmailClient;
}

/**
 * Get Calendar client using unified auth
 * @param {boolean} skipBrowserAuth - If true, don't open browser for auth
 * @returns {Promise<Object|null>} Calendar client or null if auth needed
 */
async function getCalendarClient(skipBrowserAuth = false) {
  if (calendarClient) return calendarClient;
  
  const authClient = await getAuthClient(skipBrowserAuth);
  if (!authClient) return null;
  
  calendarClient = google.calendar({ version: 'v3', auth: authClient });
  return calendarClient;
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} Auth client
 */
async function exchangeCodeForTokens(code) {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    
    const oAuth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      REDIRECT_URL
    );
    
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    
    // Save the token
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: tokens.refresh_token || '',
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
    });
    
    await fs.writeFile(TOKEN_PATH, payload);
    console.log('Token saved to google_token.json');
    
    // Reset clients
    authClient = oAuth2Client;
    gmailClient = null;
    calendarClient = null;
    lastClientRefresh = Date.now();
    
    return oAuth2Client;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

module.exports = {
  getAuthClient,
  getGmailClient,
  getCalendarClient,
  getAuthUrl,
  tokenExists,
  exchangeCodeForTokens
};