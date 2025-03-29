const { getCalendarClient } = require('./calendarClient');

/**
 * Validate if a string is a valid email address
 * @param {string} email - Email address to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Create a new calendar event
 */
async function createCalendarEvent(eventDetails) {
  try {
    if (!eventDetails.title || !eventDetails.startTime || !eventDetails.endTime) {
      throw new Error('Missing required event details');
    }

    const calendar = await getCalendarClient();
    if (!calendar) {
      throw new Error('Calendar client unavailable');
    }

    // Filter out invalid email addresses
    const validAttendees = (eventDetails.attendees || [])
      .filter(email => typeof email === 'string' && isValidEmail(email))
      .map(email => ({
        email: email.trim(),
        responseStatus: 'needsAction'
      }));

    console.log('Filtered attendees for event:', 
      validAttendees.length > 0 ? validAttendees : 'No valid attendee emails');

    const event = {
      summary: eventDetails.title,
      description: eventDetails.description || '',
      start: {
        dateTime: eventDetails.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: eventDetails.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attendees: validAttendees.length > 0 ? validAttendees : undefined,
      status: eventDetails.tentative ? 'tentative' : 'confirmed',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      },
      conferenceData: eventDetails.videoConference ? {
        createRequest: { requestId: `meet-${Date.now()}` }
      } : undefined
    };

    if (eventDetails.location) event.location = eventDetails.location;

    // Log the event we're about to create
    console.log('Creating calendar event with details:', {
      title: event.summary,
      start: event.start.dateTime,
      end: event.end.dateTime,
      attendees: event.attendees ? event.attendees.length : 0,
      conferenceData: !!event.conferenceData
    });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: validAttendees.length > 0 ? 'all' : 'none',
      conferenceDataVersion: eventDetails.videoConference ? 1 : 0,
      requestId: `event-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`
    });

    console.log('Event created successfully, ID:', response.data.id);
    return { ...response.data, success: true };
  } catch (error) {
    console.error('Calendar creation error:', error.message);
    if (error.response) {
      console.error('API error details:', error.response.data);
    }
    // Return error information instead of throwing
    return { 
      success: false, 
      error: error.message,
      details: error.response ? error.response.data : null
    };
  }
}

/**
 * Confirm or update calendar event
 */
async function confirmCalendarEvent(eventId, confirmed, attendeeResponses = []) {
  try {
    if (!eventId) throw new Error('Event ID required');

    const calendar = await getCalendarClient();
    if (!calendar) throw new Error('Calendar client unavailable');

    const eventResponse = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId
    });

    const existingEvent = eventResponse.data;
    const updatedEvent = {
      ...existingEvent,
      status: confirmed ? 'confirmed' : 'tentative'
    };

    // Update attendee responses if provided
    if (attendeeResponses.length > 0 && updatedEvent.attendees) {
      const attendeeMap = new Map();
      updatedEvent.attendees.forEach(a => attendeeMap.set(a.email, a));

      // Filter for valid emails
      attendeeResponses
        .filter(({email}) => email && isValidEmail(email))
        .forEach(({email, response}) => {
          if (attendeeMap.has(email)) {
            const attendee = attendeeMap.get(email);
            attendee.responseStatus = response || 'accepted';
            attendeeMap.set(email, attendee);
          }
        });

      updatedEvent.attendees = Array.from(attendeeMap.values());
    }

    // Send update
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent,
      sendUpdates: (confirmed !== (existingEvent.status === 'confirmed') || 
                    attendeeResponses.length > 0) ? 'all' : 'none'
    });

    return {
      ...response.data,
      success: true,
      confirmation: {
        status: confirmed ? 'confirmed' : 'updated',
        attendeeResponses: attendeeResponses.length
      }
    };
  } catch (error) {
    console.error('Calendar confirmation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check for scheduling conflicts
 */
async function checkForConflicts(startTime, endTime) {
  try {
    // Ensure inputs are Date objects
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date input to checkForConflicts:', { startTime, endTime });
      return [];
    }

    const { getCalendarEvents } = require('./calendarClient');
    const events = await getCalendarEvents(start, end);

    return events.filter(event => {
      if (!event.start.dateTime) return false; // Skip all-day events

      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      return (
        (start >= eventStart && start < eventEnd) || 
        (end > eventStart && end <= eventEnd) ||
        (start <= eventStart && end >= eventEnd)
      );
    });
  } catch (error) {
    console.error('Error checking for conflicts:', error);
    return []; // Return empty to avoid blocking scheduling on error
  }
}

/**
 * Log all calendar events from 2 days before today to 2 days after today.
 */
async function logEventsAroundToday() {
  const { getCalendarEvents } = require('./calendarClient');
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 2);
  const end = new Date(today);
  end.setDate(today.getDate() + 2);
  const events = await getCalendarEvents(start, end);
  console.log(`Events from ${start.toISOString()} to ${end.toISOString()}:`);
  events.forEach(event => {
    const eventTime = event.start.dateTime || event.start.date;
    console.log(`- ${event.summary} at ${eventTime}`);
  });
}

module.exports = {
  createCalendarEvent,
  confirmCalendarEvent,
  checkForConflicts,
  logEventsAroundToday
};