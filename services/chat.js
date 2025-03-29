// services/chat.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { research } = require('./research');
const { scheduleEvent } = require('./calendar');
const { sendEmail } = require('./email');
const { 
  handleEmailIntent, 
  isInEmailFlow 
} = require('./emailService');
require('dotenv').config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Add conversation context
let conversationHistory = [];

// Intent classification function using Gemini
async function classifyIntent(text) {
  try {
    const prompt = `
      Classify the intent of the following text into one of these categories:
      - research_intent: For requests about researching a topic
      - calendar_intent: For scheduling events or meetings
      - email_intent: For sending emails
      - exit_intent: For exiting or ending the conversation
      - chat_intent: For general conversation
      
      Text: "${text}"
      
      Intent:`;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    // Check if the response contains any of the intent types
    if (response.includes('research_intent')) return 'research_intent';
    if (response.includes('calendar_intent')) return 'calendar_intent';
    if (response.includes('email_intent')) return 'email_intent';
    if (response.includes('exit_intent')) return 'exit_intent';
    
    // Fallback to keyword matching if the model's response doesn't match expected format
    const intentMap = {
      'research': 'research_intent',
      'schedule': 'calendar_intent', 
      'email': 'email_intent',
      'quit': 'exit_intent'
    };
    
    for (const [keyword, intent] of Object.entries(intentMap)) {
      if (text.toLowerCase().includes(keyword)) {
        return intent;
      }
    }
    
    return 'chat_intent'; // Default fallback
  } catch (error) {
    console.error('Intent classification error:', error);
    return 'chat_intent'; // Default on error
  }
}

// Entity extraction using Gemini
async function extractEntities(text, intentType) {
  try {
    let prompt = '';
    
    if (intentType === 'research_intent') {
      prompt = `
        Extract the research topic from this text: "${text}"
        Output just the topic with no additional text.
      `;
      const result = await model.generateContent(prompt);
      const topic = result.response.text().trim();
      return { topic: topic || 'AI' };
      
    } else if (intentType === 'calendar_intent') {
      prompt = `
        Extract the following information from this text: "${text}"
        - eventName: The name of the event (default to "Meeting" if not found)
        - dateTime: The date and time of the event (use ISO format YYYY-MM-DDTHH:MM:SSZ)
        
        Return as JSON like: {"eventName": "event name", "dateTime": "date time"}
      `;
      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      try {
        // Try to parse JSON from the response
        const jsonMatch = response.match(/\{.*\}/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // If JSON parsing fails, use regex fallback
        console.error('JSON parsing error:', e);
      }
      
      // Fallback to regex
      const eventMatch = text.match(/called\s+["']?(.+?)["']?/i);
      const eventName = eventMatch ? eventMatch[1] : 'Meeting';
      const dateTime = text.includes('tomorrow') ? '2025-03-30T14:00:00Z' : '2025-03-29T11:00:00Z';
      return { eventName, dateTime };
      
    } else if (intentType === 'email_intent') {
      // First check if we're in an active email flow
      if (isInEmailFlow()) {
        // We're already collecting email info, don't extract again
        return {};
      }
      
      prompt = `
        Extract the following information from this text: "${text}"
        - to: The recipient's email (output MISSING if not found)
        - subject: The email subject (output MISSING if not found)
        - body: The email body (output MISSING if not found)
        
        Return as JSON like: {"to": "email or MISSING", "subject": "subject line or MISSING", "body": "email body or MISSING"}
      `;
      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      
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
        console.error('JSON parsing error:', e);
        // Use fallback regex extraction
        const toMatch = text.match(/to\s+([^\s]+@[^\s]+)/);
        const subjectMatch = text.match(/subject\s+["']?(.+?)["']?(?=\s+and|$)/i);
        const bodyMatch = text.match(/body\s+["']?(.+?)["']?$/i);
        
        if (toMatch) emailData.to = toMatch[1];
        if (subjectMatch) emailData.subject = subjectMatch[1];
        if (bodyMatch) emailData.body = bodyMatch[1];
      }
      
      return emailData;
    }
    
    return {}; // Default empty entities
  } catch (error) {
    console.error('Entity extraction error:', error);
    
    // Fallback to regex extraction
    const entities = {};
    if (intentType === 'research_intent') {
      entities.topic = text.split('research')[1]?.trim() || 'AI';
    } else if (intentType === 'calendar_intent') {
      const parts = text.match(/schedule.*?called\s+["']?(.+?)["']?.*?(tomorrow|\d{4}-\d{2}-\d{2}).*?(\d{1,2}\s*(?:AM|PM))/i);
      entities.eventName = parts ? parts[1] : 'Vibe Session';
      entities.dateTime = parts && parts[2] === 'tomorrow' ? '2025-03-30T14:00:00Z' : '2025-03-29T11:00:00Z';
    } else if (intentType === 'email_intent') {
      const toMatch = text.match(/to\s+([^\s]+)/);
      const subjectMatch = text.match(/subject\s+["']?(.+?)["']?(?=\s+and|$)/i);
      const bodyMatch = text.match(/body\s+["']?(.+?)["']?$/i);
      entities.to = toMatch ? toMatch[1] : 'friend@example.com';
      entities.subject = subjectMatch ? subjectMatch[1] : 'AI Vibes';
      entities.body = bodyMatch ? bodyMatch[1] : 'Hello from AI assistant';
    }
    return entities;
  }
}

// Analyze sentiment using Gemini
async function analyzeSentiment(text) {
  try {
    const prompt = `
      Analyze the sentiment of the following text and return ONLY the word "POSITIVE" or "NEGATIVE".
      Text: "${text}"
      Sentiment:
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    if (response.toUpperCase().includes('POSITIVE')) return 'POSITIVE';
    return 'NEGATIVE';
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return 'NEUTRAL';
  }
}

// Process conversation with Gemini
async function processInput(userInput) {
    // Add input to conversation history
    conversationHistory.push({ role: 'user', content: userInput });
    if (conversationHistory.length > 10) conversationHistory.shift(); // Keep last 10 messages
    
    // If we're in the middle of an email flow, continue that
    if (isInEmailFlow()) {
        const response = await handleEmailIntent(userInput, {});
        conversationHistory.push({ role: 'assistant', content: response });
        return response;
    }
    
    // Otherwise, process normally
    const intent = await classifyIntent(userInput);
    const entities = await extractEntities(userInput, intent);
    
    let response;
    
    switch(intent) {
        case 'research_intent':
            response = await research(entities.topic);
            break;
        case 'calendar_intent':
            response = await scheduleEvent(entities.eventName, entities.dateTime);
            break;
        case 'email_intent':
            response = await handleEmailIntent(userInput, entities);
            break;
        case 'exit_intent':
            response = 'Peace out!';
            break;
        default:
            try {
                // Create a chat history for Gemini
                const chatHistory = conversationHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));
                
                // Remove the last user message since we'll send it separately
                const lastUserMessage = chatHistory.pop();
                
                // Create a chat session
                const chat = model.startChat({
                    history: chatHistory.length > 0 ? chatHistory : [],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150,
                    }
                });
                
                // Send the user's message
                const result = await chat.sendMessage(lastUserMessage.parts[0].text);
                const assistantReply = result.response.text();
                
                // Add response to history
                conversationHistory.push({ role: 'assistant', content: assistantReply });
                return assistantReply;
            } catch (error) {
                console.error('Chat generation error:', error);
                response = `AI: Couldn't process that: ${error.message}`;
            }
    }
    
    // Add response to history
    conversationHistory.push({ role: 'assistant', content: response });
    return response;
}

module.exports = { processInput, analyzeSentiment };