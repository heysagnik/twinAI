// services/calendar.js
const { google } = require('googleapis');

async function scheduleEvent(summary, startTime) {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: './credentials.json',
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        const calendar = google.calendar({ version: 'v3', auth });

        const event = {
            summary,
            start: { dateTime: startTime, timeZone: 'UTC' },
            end: { dateTime: startTime, timeZone: 'UTC' },
        };

        await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        return `Scheduled ${summary} at ${startTime}. You’re locked in!`;
    } catch (error) {
        return `Calendar vibes off: ${error.message}`;
    }
}

module.exports = { scheduleEvent };