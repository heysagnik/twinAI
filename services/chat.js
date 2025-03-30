// services/chat.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { research } = require('./research');
const calendarService = require('./calendar');
require('./email');
const { 
  handleEmailIntent, 
  isInEmailFlow 
} = require('./emailService');
require('dotenv').config();
const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Add conversation context
let conversationHistory = [];

// Updated intent classification function with better research intent detection
async function classifyIntent(text) {
  try {
    // First check for explicit deep research requests
    const deepResearchPatterns = [
      /deep research/i,
      /comprehensive research/i,
      /thorough analysis/i,
      /detailed study/i,
      /in-depth report/i,
      /academic paper/i,
      /scholarly (article|research)/i,
      /literature review/i
    ];
    
    // Check if any deep research patterns match
    const isDeepResearch = deepResearchPatterns.some(pattern => pattern.test(text));
    
    // If it's a deep research request, immediately return research intent
    if (isDeepResearch) {
      return 'research_intent';
    }
    
    // Otherwise, proceed with normal intent classification
    const prompt = `
      Classify the intent of the following text into one of these categories:
      - calendar_intent: For scheduling events or meetings
      - email_intent: For sending emails
      - exit_intent: For exiting or ending the conversation
      - chat_intent: For general conversation or basic questions
      
      Note: Only classify as research_intent if the user specifically requests detailed research, 
      otherwise classify as chat_intent for simple questions.
      
      Text: "${text}"
      
      Intent:`;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    // Check if the response contains any of the intent types
    if (response.toLowerCase().includes('calendar_intent')) return 'calendar_intent';
    if (response.toLowerCase().includes('email_intent')) return 'email_intent';
    if (response.toLowerCase().includes('exit_intent')) return 'exit_intent';
    
    // Fallback to keyword matching for non-research intents
    const intentMap = {
      'schedule': 'calendar_intent', 
      'meeting': 'calendar_intent',
      'appointment': 'calendar_intent',
      'email': 'email_intent',
      'send': 'email_intent',
      'quit': 'exit_intent',
      'bye': 'exit_intent',
      'goodbye': 'exit_intent'
    };
    
    for (const [keyword, intent] of Object.entries(intentMap)) {
      if (text.toLowerCase().includes(keyword)) {
        return intent;
      }
    }
    
    // Return chat_intent as default for all questions not explicitly requesting research
    return 'chat_intent';
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
        Extract the precise research topic from this text: "${text}"
        The user is requesting deep research on a topic.
        Remove phrases like "I want research on" or "Please do deep research about".
        Only output the core topic that needs to be researched, with no additional text.
        For example:
        - From "I need deep research on quantum computing" → "quantum computing"
        - From "Do comprehensive research about climate change impacts" → "climate change impacts"
      `;
      const result = await model.generateContent(prompt);
      const topic = result.response.text().trim();
      return { topic: topic || 'AI' };
      
    } else if (intentType === 'calendar_intent') {
      prompt = `
        Extract the following information from this text: "${text}"
        - eventName: The name of the event (default to "Meeting" if not found)
        - dateTime: The date and time of the event (use ISO format YYYY-MM-DDTHH:MM:SSZ)
        
        If no specific event name is mentioned, use "Meeting" as the default name.
        If only "tomorrow" is mentioned for time, use tomorrow at 10:00 AM.
        
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
      
      // Improve the fallback
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

// Add this function to handle calendar confirmations
async function checkForPendingCalendarEvents(userInput) {
    // Look for pending calendar events in conversation history
    const pendingEvents = conversationHistory.filter(
        msg => msg.role === 'system' && msg.content.includes('pendingCalendarEvent')
    );
    
    if (pendingEvents.length > 0) {
        try {
            // Get the most recent pending event
            const pendingData = JSON.parse(pendingEvents[pendingEvents.length - 1].content);
            const pendingId = pendingData.pendingCalendarEvent;
            
            // Check if user confirmed
            const confirmed = userInput.toLowerCase().match(/yes|confirm|ok|sure|schedule it/);
            if (confirmed) {
                // Remove the pending event marker
                conversationHistory = conversationHistory.filter(
                    msg => !(msg.role === 'system' && msg.content.includes(pendingId))
                );
                
                return await calendarService.confirmCalendarEvent(pendingId, true);
            } else if (userInput.toLowerCase().match(/no|cancel|don't|dont|nope/)) {
                // Remove the pending event marker
                conversationHistory = conversationHistory.filter(
                    msg => !(msg.role === 'system' && msg.content.includes(pendingId))
                );
                
                return await calendarService.confirmCalendarEvent(pendingId, false);
            }
        } catch (e) {
            console.error('Error processing calendar confirmation:', e);
        }
    }
    
    return null;
}

// Helper function to format the response with type metadata
function formatResponse(content, type) {
  return {
    content,
    type
  };
}

// Process the user input and generate a response
async function processInput(userInput, sessionId, userId = null) {
  try {
    // Store user message in MongoDB
    await Message.create({
        sessionId,
        role: 'user',
        content: userInput
    });
    
    // Add input to conversation history (in-memory)
    conversationHistory.push({ role: 'user', content: userInput });
    if (conversationHistory.length > 10) conversationHistory.shift(); // Keep last 10 messages
    
    // Check for pending calendar events first
    const calendarResponse = await checkForPendingCalendarEvents(userInput);
    if (calendarResponse) {
        const formattedResponse = formatResponse(calendarResponse, 'calendar');
        conversationHistory.push({ 
          role: 'assistant', 
          content: formattedResponse.content,
          type: formattedResponse.type
        });
        return formattedResponse;
    }
    
    // Check for calendar suggestion responses
    const pendingSuggestions = conversationHistory.filter(
        msg => msg.role === 'system' && msg.content.includes('calendarSuggestions')
    );
    
    if (pendingSuggestions.length > 0) {
        try {
            // Get the most recent suggestion context
            const suggestionData = JSON.parse(pendingSuggestions[pendingSuggestions.length - 1].content);
            
            // Handle time selection
            const response = await calendarService.handleTimeSelection(userInput, suggestionData.context);
            
            // Remove the suggestion context from history
            conversationHistory = conversationHistory.filter(
                msg => !(msg.role === 'system' && msg.content.includes('calendarSuggestions'))
            );
            
            const formattedResponse = formatResponse(response, 'calendar');
            conversationHistory.push({ 
              role: 'assistant', 
              content: formattedResponse.content,
              type: formattedResponse.type
            });
            return formattedResponse;
        } catch (e) {
            console.error('Error handling calendar suggestion selection:', e);
        }
    }
    
    // If we're in the middle of an email flow, continue that
    if (isInEmailFlow()) {
        const response = await handleEmailIntent(userInput, {});
        const formattedResponse = formatResponse(response, 'email');
        conversationHistory.push({ 
          role: 'assistant', 
          content: formattedResponse.content,
          type: formattedResponse.type
        });
        return formattedResponse;
    }
    
    // Otherwise, process normally
    const intent = await classifyIntent(userInput);
    const entities = await extractEntities(userInput, intent);
    
    let response;
    let responseType = 'text';
    
    switch(intent) {
        case 'research_intent':
            console.log(`Deep research requested on topic: ${entities.topic}`);
            response = await research(entities.topic);
            responseType = 'research';
            break;
        case 'calendar_intent':
            console.log('Calendar intent detected:', {
                eventName: entities.eventName,
                userInput
            });
            
            // Use the enhanced schedule handler
            const scheduleResponse = await calendarService.handleScheduleIntent(userInput);
            responseType = 'calendar';
            
            // Check if the response is an object with suggestions that require a choice
            if (typeof scheduleResponse === 'object' && scheduleResponse.requiresChoice) {
                // Store the context for later use
                conversationHistory.push({ 
                    role: 'system', 
                    content: JSON.stringify({
                        calendarSuggestions: true,
                        context: {
                            suggestions: scheduleResponse.suggestions,
                            parsedInput: scheduleResponse.parsedInput
                        }
                    })
                });
                
                // Return the message to display
                response = scheduleResponse.message;
            } 
            // Handle other object response types
            else if (typeof scheduleResponse === 'object') {
                if (scheduleResponse.requiresConfirmation && scheduleResponse.pendingId) {
                    // Add pendingId to conversation history as a special marker
                    conversationHistory.push({ 
                        role: 'system', 
                        content: JSON.stringify({
                            pendingCalendarEvent: scheduleResponse.pendingId,
                            eventName: scheduleResponse.eventName
                        })
                    });
                }
                
                // Use the message field as the response
                response = scheduleResponse.message || JSON.stringify(scheduleResponse);
            } 
            // Simple string response
            else {
                response = scheduleResponse;
            }
            break;
        case 'email_intent':
            response = await handleEmailIntent(userInput, entities);
            responseType = 'email';
            break;
        case 'exit_intent':
            response = 'Peace out!';
            responseType = 'text';
            break;
        default:
            // For chat_intent and any other fallbacks
            try {
                // Check if it's a simple question that doesn't need deep research
                const isSimpleQuestion = userInput.match(/what|who|when|where|why|how/i) && 
                                        !userInput.match(/research|detail|comprehensive|thorough/i);
                
                // For simple questions about factual topics, use a direct approach
                if (isSimpleQuestion) {
                    const prompt = `
                        Answer this question in a conversational, helpful way: "${userInput}"
                        Keep your answer concise but informative. Don't use academic paper formatting.
                        Use a friendly tone as if you're chatting with a friend.
                    `;
                    
                    const result = await model.generateContent({
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 500,
                        },
                    });
                    
                    const assistantReply = result.response.text();
                    
                    // Add response to history
                    const formattedResponse = formatResponse(assistantReply, 'text');
                    conversationHistory.push({ 
                      role: 'assistant', 
                      content: formattedResponse.content,
                      type: formattedResponse.type
                    });
                    return formattedResponse;
                }
                
                // Otherwise use chat history for context
                const chatHistory = conversationHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
                }));
                
                // Remove the last user message since we'll send it separately
                const lastUserMessage = chatHistory.pop();
                
                // Create a chat session
                const chat = model.startChat({
                    history: chatHistory.length > 0 ? chatHistory : [],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 350,
                    }
                });
                
                // Send the user's message
                const result = await chat.sendMessage(lastUserMessage.parts[0].text);
                const assistantReply = result.response.text();
                
                // Add response to history
                const formattedResponse = formatResponse(assistantReply, 'text');
                conversationHistory.push({ 
                  role: 'assistant', 
                  content: formattedResponse.content,
                  type: formattedResponse.type
                });
                return formattedResponse;
            } catch (error) {
                console.error('Chat generation error:', error);
                response = `I'm having trouble processing that request. Could you try rephrasing it?`;
                responseType = 'text';
            }
    }
    
    // Format the response with type metadata
    const formattedResponse = formatResponse(response, responseType);
    
    // Add response to history and store in MongoDB
    conversationHistory.push({ 
      role: 'assistant', 
      content: formattedResponse.content,
      type: formattedResponse.type
    });
    
    // Store assistant response in MongoDB
    await Message.create({
        sessionId,
        role: 'assistant',
        content: response,
        metadata: { type: responseType }
    });
    
    // Save the conversation to MongoDB if userId is provided
    if (userId) {
      await saveConversation(sessionId, userId, userInput, formattedResponse);
    }
    
    return formattedResponse;
  } catch (error) {
    console.error('Error processing chat input:', error);
    throw error;
  }
}

async function saveConversation(sessionId, userId, userInput, aiResponse) {
  try {
    // Find or create the chat session
    let chat = await Chat.findOne({ sessionId, userId });
    
    if (!chat) {
      chat = new Chat({
        sessionId,
        userId,
        title: userInput.substring(0, 30) + (userInput.length > 30 ? '...' : ''),
        messages: []
      });
    }
    
    // Add the new messages
    chat.messages.push(
      { role: 'user', content: userInput },
      { 
        role: 'assistant', 
        content: typeof aiResponse === 'object' ? aiResponse.content : aiResponse,
        metadata: { 
          type: typeof aiResponse === 'object' ? aiResponse.type : 'text' 
        }
      }
    );
    
    // Update the timestamp
    chat.updatedAt = new Date();
    
    // Auto-generate a title from the first user message if not set yet
    if (chat.title === 'New Chat' && chat.messages.length <= 2) {
      chat.title = userInput.substring(0, 30) + (userInput.length > 30 ? '...' : '');
    }
    
    await chat.save();
    return chat;
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
}

async function getConversationHistory(sessionId, limit = 10, userId = null) {
  try {
    const query = { sessionId };
    if (userId) {
      query.userId = userId;
    }
    
    const chat = await Chat.findOne(query)
      .sort({ updatedAt: -1 })
      .limit(1);
      
    if (!chat) {
      return [];
    }
    
    // Return the latest messages up to the limit
    return chat.messages.slice(-limit);
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    throw error;
  }
}

async function getUserChats(userId, limit = 10, skip = 0) {
  try {
    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title updatedAt sessionId');
      
    return chats;
  } catch (error) {
    console.error('Error retrieving user chats:', error);
    throw error;
  }
}

module.exports = {
  processInput,
  analyzeSentiment,
  getConversationHistory,
  getUserChats,
  saveConversation
};