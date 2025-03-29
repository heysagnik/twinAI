const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');

// Configuration
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = path.join(process.cwd(), 'calendar_token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// State management
let calendarClient = null;
let clientRefreshTime = 0;
const CLIENT_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const eventCache = new Map();

/**
 * Get authenticated Google Calendar client with caching
 */
async function getCalendarClient() {
  try {
    if (calendarClient && (Date.now() - clientRefreshTime) < CLIENT_REFRESH_INTERVAL) {
      console.log('Using cached calendar client');
      return calendarClient;
    }

    let client = null;

    try {
      const content = await fs.readFile(TOKEN_PATH);
      client = google.auth.fromJSON(JSON.parse(content));
      console.log('Loaded token from calendar_token.json');
    } catch (err) {
      console.log('No valid token found, initiating authentication...');
      client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
      });

      if (client.credentials) {
        const keys = JSON.parse(await fs.readFile(CREDENTIALS_PATH));
        const key = keys.installed || keys.web;
        await fs.writeFile(
          TOKEN_PATH,
          JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
          })
        );
        console.log('New token saved to calendar_token.json');
      } else {
        console.error('Authentication succeeded but no credentials received');
      }
    }

    calendarClient = google.calendar({ version: 'v3', auth: client });
    clientRefreshTime = Date.now();
    console.log('Calendar client obtained successfully');

    return calendarClient;
  } catch (error) {
    console.error('Error obtaining calendar client:', error.message);
    return null;
  }
}

/**
 * Get calendar events between two dates with caching
 */
async function getCalendarEvents(startTime, endTime) {
  try {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date input:', { startTime, endTime });
      return [];
    }

    const calendar = await getCalendarClient();
    if (!calendar) {
      console.error('No calendar client available');
      return [];
    }

    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();
    const cacheKey = `events_${timeMin}_${timeMax}`;

    if (eventCache.has(cacheKey)) {
      const cachedData = eventCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < 60 * 1000) {
        console.log('Using cached calendar events');
        return cachedData.events;
      }
    }

    console.log(`Fetching calendar events from ${timeMin} to ${timeMax}`);
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    });

    const events = response.data.items || [];
    eventCache.set(cacheKey, { events, timestamp: Date.now() });

    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error.message);
    return [];
  }
}

module.exports = {
  getCalendarClient,
  getCalendarEvents
};