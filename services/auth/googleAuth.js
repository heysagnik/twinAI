const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Use environment variable for token storage when available.  
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || path.join(process.cwd(), 'google_token.json');
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || path.join(process.cwd(), 'credentials.json');
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/auth/google/callback';

let authClient = null;
let gmailClient = null;
let calendarClient = null;
let lastClientRefresh = 0;
const CLIENT_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

async function tokenExists() {
  try {
    await fs.access(TOKEN_PATH);
    return true;
  } catch (error) {
    return false;
  }
}

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
      prompt: 'consent'
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw error;
  }
}

async function getAuthClient(skipBrowserAuth = false) {
  try {
    const now = Date.now();
    if (authClient && (now - lastClientRefresh) < CLIENT_REFRESH_INTERVAL) {
      return authClient;
    }
    
    console.log('Initializing Google auth client...');
    let client = null;
    try {
      const content = await fs.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content);
      client = google.auth.fromJSON(credentials);
      console.log('Loaded existing token from', TOKEN_PATH);
    } catch (err) {
      console.log('No saved token found.');
      if (skipBrowserAuth) {
        console.log('Skipping browser auth as requested.');
        return null;
      }
    }
    
    if (!client && !skipBrowserAuth) {
      client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
        redirectUri: REDIRECT_URL
      });
      
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
        console.log('Token saved to', TOKEN_PATH);
      }
    }
    
    if (client) {
      authClient = client;
      lastClientRefresh = now;
      gmailClient = null;
      calendarClient = null;
    }
    
    return authClient;
  } catch (error) {
    console.error('Error in Google authentication:', error);
    throw error;
  }
}

async function getGmailClient(skipBrowserAuth = false) {
  if (gmailClient) return gmailClient;
  
  const authClient = await getAuthClient(skipBrowserAuth);
  if (!authClient) return null;
  
  gmailClient = google.gmail({ version: 'v1', auth: authClient });
  return gmailClient;
}

async function getCalendarClient(skipBrowserAuth = false) {
  if (calendarClient) return calendarClient;
  
  const authClient = await getAuthClient(skipBrowserAuth);
  if (!authClient) return null;
  
  calendarClient = google.calendar({ version: 'v3', auth: authClient });
  return calendarClient;
}

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
    
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: tokens.refresh_token || '',
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
    });
    
    await fs.writeFile(TOKEN_PATH, payload);
    console.log('Token saved to', TOKEN_PATH);
    
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