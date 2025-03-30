const modelClient = require('./modelClient');
const intentService = require('./intentService');
const entityService = require('./entityService');
const logger = require('../utils/logger');

/**
 * AI Service - Provides centralized access to all AI capabilities
 */
module.exports = {
  // Service modules
  modelClient,
  intentService,
  entityService,
  
  // Core AI functions
  generateContent: async (prompt, temperature = 0.7, maxTokens = 500) => {
    return modelClient.generateContent(prompt, temperature, maxTokens);
  },
  
  classifyIntent: async (text) => {
    return intentService.classifyIntent(text);
  },
  
  extractEntities: async (text, intentType) => {
    return entityService.extractEntities(text, intentType);
  },
  
  // Sentiment analysis
  analyzeSentiment: async (text) => {
    try {
      const prompt = `
        Analyze the sentiment of the following text and return ONLY the word "POSITIVE" or "NEGATIVE".
        Text: "${text}"
        Sentiment:
      `;
      
      const response = await modelClient.generateContent(prompt);
      
      if (response.toUpperCase().includes('POSITIVE')) return 'POSITIVE';
      return 'NEGATIVE';
    } catch (error) {
      logger.error('Sentiment analysis error:', { error, text });
      return 'NEUTRAL';
    }
  },

  // Generate chat response
  generateChatResponse: async (conversationHistory, userInput, temperature = 0.7) => {
    try {
      // Convert history to model format
      const chatHistory = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ 
          text: typeof msg.content === 'string' ? 
                msg.content : 
                JSON.stringify(msg.content) 
        }]
      }));
      
      // Start chat session
      const chat = modelClient.startChatSession(chatHistory);
      
      // Send user message and get response
      const result = await chat.sendMessage(userInput);
      return result.response.text();
    } catch (error) {
      logger.error('Chat generation error:', { error, userInput });
      return `I'm having trouble processing that request. Could you try rephrasing it?`;
    }
  }
};