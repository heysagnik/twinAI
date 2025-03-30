const modelClient = require('./modelClient');
const logger = require('../utils/logger');
const { isInEmailFlow } = require('../email/emailService');

class EntityService {
  async extractEntities(text, intentType) {
    try {
      switch (intentType) {
        case 'research_intent':
          return await this.extractResearchEntities(text);
        case 'calendar_intent':
          return await this.extractCalendarEntities(text);
        case 'email_intent':
          return await this.extractEmailEntities(text);
        default:
          return {}; // Default empty entities
      }
    } catch (error) {
      logger.error('Entity extraction error:', { error, text, intentType });
      return this.fallbackEntityExtraction(text, intentType);
    }
  }

  async extractResearchEntities(text) {
    const prompt = `
      Extract the precise research topic from this text: "${text}"
      The user is requesting deep research on a topic.
      Remove phrases like "I want research on" or "Please do deep research about".
      Only output the core topic that needs to be researched, with no additional text.
      For example:
      - From "I need deep research on quantum computing" → "quantum computing"
      - From "Do comprehensive research about climate change impacts" → "climate change impacts"
    `;
    const topic = await modelClient.generateContent(prompt);
    return { topic: topic || 'AI' };
  }

  async extractCalendarEntities(text) {
    const prompt = `
      Extract the following information from this text: "${text}"
      - eventName: The name of the event (default to "Meeting" if not found)
      - dateTime: The date and time of the event (use ISO format YYYY-MM-DDTHH:MM:SSZ)
      
      If no specific event name is mentioned, use "Meeting" as the default name.
      If only "tomorrow" is mentioned for time, use tomorrow at 10:00 AM.
      
      Return as JSON like: {"eventName": "event name", "dateTime": "date time"}
    `;
    const response = await modelClient.generateContent(prompt);
    
    try {
      // Try to parse JSON from the response
      const jsonMatch = response.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      logger.error('JSON parsing error:', { error: e });
    }
    
    // Fallback
    const eventMatch = text.match(/called\s+["']?(.+?)["']?/i);
    const eventName = eventMatch ? eventMatch[1] : 'Meeting';
    
    // Calculate tomorrow's date properly
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const dateTime = text.includes('tomorrow') ? 
      tomorrow.toISOString() : 
      new Date().toISOString();
    
    return { eventName, dateTime };
  }

  async extractEmailEntities(text) {
    // First check if we're in an active email flow
    if (isInEmailFlow()) {
      // We're already collecting email info, don't extract again
      return {};
    }
    
    const prompt = `
      Extract the following information from this text: "${text}"
      - to: The recipient's email (output MISSING if not found)
      - subject: The email subject (output MISSING if not found)
      - body: The email body (output MISSING if not found)
      
      Return as JSON like: {"to": "email or MISSING", "subject": "subject line or MISSING", "body": "email body or MISSING"}
    `;
    const response = await modelClient.generateContent(prompt);
    
    let emailData = {
      to: 'MISSING',
      subject: 'MISSING',
      body: 'MISSING'
    };
    
    try {
      // Try to parse JSON from the response
      const jsonMatch = response.match(/\{.*\}/s);
      if (jsonMatch) {
        emailData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      logger.error('JSON parsing error:', { error: e });
      // Use fallback regex extraction
      this.extractEmailEntitiesByRegex(text, emailData);
    }
    
    return emailData;
  }

  extractEmailEntitiesByRegex(text, emailData) {
    const toMatch = text.match(/to\s+([^\s]+@[^\s]+)/);
    const subjectMatch = text.match(/subject\s+["']?(.+?)["']?(?=\s+and|$)/i);
    const bodyMatch = text.match(/body\s+["']?(.+?)["']?$/i);
    
    if (toMatch) emailData.to = toMatch[1];
    if (subjectMatch) emailData.subject = subjectMatch[1];
    if (bodyMatch) emailData.body = bodyMatch[1];
    
    return emailData;
  }

  // Fallback extraction using regex patterns
  fallbackEntityExtraction(text, intentType) {
    const entities = {};
    
    if (intentType === 'research_intent') {
      entities.topic = text.split('research')[1]?.trim() || 'AI';
    } else if (intentType === 'calendar_intent') {
      const parts = text.match(/schedule.*?called\s+["']?(.+?)["']?.*?(tomorrow|\d{4}-\d{2}-\d{2}).*?(\d{1,2}\s*(?:AM|PM))/i);
      entities.eventName = parts ? parts[1] : 'Vibe Session';
      
      // Default to tomorrow 2pm if parsing fails
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      
      entities.dateTime = parts && parts[2] === 'tomorrow' ? 
        tomorrow.toISOString() : 
        '2025-03-29T11:00:00Z';
    } else if (intentType === 'email_intent') {
      entities.to = 'friend@example.com';
      entities.subject = 'AI Vibes';
      entities.body = 'Hello from AI assistant';
      this.extractEmailEntitiesByRegex(text, entities);
    }
    
    return entities;
  }
}

module.exports = new EntityService();