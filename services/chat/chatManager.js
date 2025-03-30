const ai = require('../ai');
const calendarService = require('../calendar');
const { handleEmailIntent, isInEmailFlow } = require('../email/emailService');
const { research } = require('../research');
const logger = require('../utils/logger');
const repository = require('./repository');
const cache = require('../utils/cache'); // Redis/Memcached client

class ChatManager {
  constructor() {
    // In-memory LRU cache for active sessions (fallback if Redis unavailable)
    this.sessionCache = new Map();
    this.MAX_CACHE_ITEMS = 1000;
  }
  
  /**
   * Format response with type metadata
   */
  formatResponse(content, type) {
    return { content, type };
  }
  
  /**
   * Get conversation history from cache or database
   */
  async getConversationHistory(sessionId, userId = null, limit = 10) {
    const cacheKey = `chat:history:${sessionId}`;
    
    try {
      // Try distributed cache first
      const cachedHistory = await cache.get(cacheKey);
      if (cachedHistory) {
        return JSON.parse(cachedHistory);
      }
      
      // Try in-memory cache next
      if (this.sessionCache.has(sessionId)) {
        const history = this.sessionCache.get(sessionId);
        return history.slice(-limit);
      }
      
      // Fall back to database
      const history = await repository.getConversationHistory(sessionId, limit, userId);
      
      // Update both caches
      this.updateCaches(sessionId, history);
      
      return history;
    } catch (error) {
      logger.error('Error retrieving conversation history', { error, sessionId, userId });
      return [];
    }
  }
  
  /**
   * Update all cache layers with new conversation data
   */
  async updateCaches(sessionId, history) {
    try {
      // Update in-memory cache
      this.sessionCache.set(sessionId, history);
      
      // Maintain cache size (LRU eviction)
      if (this.sessionCache.size > this.MAX_CACHE_ITEMS) {
        const oldestKey = this.sessionCache.keys().next().value;
        this.sessionCache.delete(oldestKey);
      }
      
      // Update distributed cache with 30 minute expiry
      await cache.set(`chat:history:${sessionId}`, JSON.stringify(history), 1800);
    } catch (error) {
      logger.warn('Cache update failed', { error, sessionId });
      // Non-fatal error, continue execution
    }
  }
  
  /**
   * Add message to conversation history and update caches
   */
  async addMessage(sessionId, message, userId = null) {
    try {
      // Get current history
      let history = await this.getConversationHistory(sessionId, userId);
      
      // Add new message
      history.push(message);
      
      // Trim history if too long (keep most recent 20)
      if (history.length > 20) {
        history = history.slice(-20);
      }
      
      // Update caches
      await this.updateCaches(sessionId, history);
      
      // Store in database
      await repository.saveMessage(
        sessionId, 
        message.role, 
        message.content,
        { type: message.type || 'text' }
      );
      
      return history;
    } catch (error) {
      logger.error('Error adding message', { error, sessionId, message });
      throw error;
    }
  }
  
  /**
   * Check for pending calendar events in conversation history
   */
  async checkForPendingCalendarEvents(userInput, conversationHistory) {
    const pendingEvents = conversationHistory.filter(
      msg => msg.role === 'system' && 
             typeof msg.content === 'string' && 
             msg.content.includes('pendingCalendarEvent')
    );
    
    if (pendingEvents.length > 0) {
      try {
        // Get the most recent pending event
        const pendingData = JSON.parse(pendingEvents[pendingEvents.length - 1].content);
        const pendingId = pendingData.pendingCalendarEvent;
        
        // Check if user confirmed
        const confirmed = userInput.toLowerCase().match(/yes|confirm|ok|sure|schedule it/);
        if (confirmed) {
          return await calendarService.confirmCalendarEvent(pendingId, true);
        } else if (userInput.toLowerCase().match(/no|cancel|don't|dont|nope/)) {
          return await calendarService.confirmCalendarEvent(pendingId, false);
        }
      } catch (error) {
        logger.error('Error processing calendar confirmation', { error, userInput });
      }
    }
    
    return null;
  }
  
  /**
   * Check and handle calendar suggestions
   */
  async checkForCalendarSuggestions(userInput, conversationHistory) {
    const pendingSuggestions = conversationHistory.filter(
      msg => msg.role === 'system' && 
             typeof msg.content === 'string' && 
             msg.content.includes('calendarSuggestions')
    );
    
    if (pendingSuggestions.length > 0) {
      try {
        // Get the most recent suggestion context
        const suggestionData = JSON.parse(pendingSuggestions[pendingSuggestions.length - 1].content);
        
        // Handle time selection
        return await calendarService.handleTimeSelection(userInput, suggestionData.context);
      } catch (error) {
        logger.error('Error handling calendar suggestion selection', { error, userInput });
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Process user input and generate response
   */
  async processInput(userInput, sessionId, userId = null) {
    try {
      // Store user message
      await this.addMessage(
        sessionId, 
        { role: 'user', content: userInput, type: 'text' }, 
        userId
      );
      
      // Get current conversation history
      const conversationHistory = await this.getConversationHistory(sessionId, userId);
      
      // Check for pending calendar events first
      const calendarResponse = await this.checkForPendingCalendarEvents(userInput, conversationHistory);
      if (calendarResponse) {
        const formattedResponse = this.formatResponse(calendarResponse, 'calendar');
        await this.addMessage(
          sessionId, 
          { role: 'assistant', content: formattedResponse.content, type: formattedResponse.type }, 
          userId
        );
        return formattedResponse;
      }
      
      // Check for calendar suggestion responses
      const suggestionResponse = await this.checkForCalendarSuggestions(userInput, conversationHistory);
      if (suggestionResponse) {
        const formattedResponse = this.formatResponse(suggestionResponse, 'calendar');
        await this.addMessage(
          sessionId, 
          { role: 'assistant', content: formattedResponse.content, type: formattedResponse.type }, 
          userId
        );
        return formattedResponse;
      }
      
      // If we're in the middle of an email flow, continue that
      if (isInEmailFlow()) {
        const response = await handleEmailIntent(userInput, {});
        const formattedResponse = this.formatResponse(response, 'email');
        await this.addMessage(
          sessionId, 
          { role: 'assistant', content: formattedResponse.content, type: formattedResponse.type }, 
          userId
        );
        return formattedResponse;
      }
      
      // Otherwise, process normally
      const intent = await ai.classifyIntent(userInput);
      const entities = await ai.extractEntities(userInput, intent);
      
      let response;
      let responseType = 'text';
      
      switch(intent) {
        case 'research_intent':
          logger.info('Research intent detected', { topic: entities.topic });
          response = await research(entities.topic);
          responseType = 'research';
          break;
          
        case 'calendar_intent':
          logger.info('Calendar intent detected', { eventName: entities.eventName });
          
          // Use the enhanced schedule handler
          const scheduleResponse = await calendarService.handleScheduleIntent(userInput);
          responseType = 'calendar';
          
          // Check if the response is an object with suggestions that require a choice
          if (typeof scheduleResponse === 'object' && scheduleResponse.requiresChoice) {
            // Store the context for later use
            await this.addMessage(
              sessionId, 
              { 
                role: 'system', 
                content: JSON.stringify({
                  calendarSuggestions: true,
                  context: {
                    suggestions: scheduleResponse.suggestions,
                    parsedInput: scheduleResponse.parsedInput
                  }
                }),
                type: 'system'
              }, 
              userId
            );
            
            // Return the message to display
            response = scheduleResponse.message;
          } 
          // Handle other object response types
          else if (typeof scheduleResponse === 'object') {
            if (scheduleResponse.requiresConfirmation && scheduleResponse.pendingId) {
              // Add pendingId to conversation history as a special marker
              await this.addMessage(
                sessionId, 
                { 
                  role: 'system', 
                  content: JSON.stringify({
                    pendingCalendarEvent: scheduleResponse.pendingId,
                    eventName: scheduleResponse.eventName
                  }),
                  type: 'system'
                }, 
                userId
              );
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
          // Convert history to format needed by the AI model
          const aiHistory = conversationHistory
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
            }));
          
          // Generate response using conversation history context
          response = await ai.generateChatResponse(userInput, aiHistory);
          responseType = 'text';
      }
      
      // Format the response with type metadata
      const formattedResponse = this.formatResponse(response, responseType);
      
      // Add response to history
      await this.addMessage(
        sessionId, 
        { role: 'assistant', content: formattedResponse.content, type: formattedResponse.type }, 
        userId
      );
      
      // Save the full conversation
      if (userId) {
        await repository.saveConversation(sessionId, userId, userInput, formattedResponse);
      }
      
      return formattedResponse;
    } catch (error) {
      logger.error('Error processing chat input', { error, sessionId, userId, userInput });
      
      // Return a graceful error response
      const errorResponse = this.formatResponse(
        "I'm having trouble processing your request right now. Please try again in a moment.",
        'text'
      );
      
      try {
        // Try to add the error response to conversation history
        await this.addMessage(
          sessionId, 
          { role: 'assistant', content: errorResponse.content, type: 'text' }, 
          userId
        );
      } catch (innerError) {
        // If this fails too, just log it - we'll still return the error message
        logger.error('Failed to save error response', { error: innerError });
      }
      
      return errorResponse;
    }
  }
  
  /**
   * Get all chats for a user
   */
  async getUserChats(userId, limit = 10, skip = 0) {
    try {
      return await repository.getUserChats(userId, limit, skip);
    } catch (error) {
      logger.error('Error retrieving user chats', { error, userId });
      return [];
    }
  }
  
  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text) {
    return ai.analyzeSentiment(text);
  }
}

module.exports = new ChatManager();