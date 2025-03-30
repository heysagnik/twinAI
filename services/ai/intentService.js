const modelClient = require('./modelClient');
const logger = require('../utils/logger');
const cache = require('../utils/cache'); // Add Redis/Memcached cache

class IntentService {
  async classifyIntent(text) {
    try {
      // Try cache first
      const cachedIntent = await cache.get(`intent:${text}`);
      if (cachedIntent) {
        return cachedIntent;
      }
      
      // Check for explicit deep research requests with patterns
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
      
      if (deepResearchPatterns.some(pattern => pattern.test(text))) {
        await cache.set(`intent:${text}`, 'research_intent', 3600); // Cache for 1 hour
        return 'research_intent';
      }
      
      const prompt = `
        Classify the intent of the following text into one of these categories:
        - calendar_intent: For scheduling events or meetings
        - email_intent: For sending emails
        - exit_intent: For exiting or ending the conversation
        - chat_intent: For general conversation or basic questions
        
        Text: "${text}"
        
        Intent:`;
      
      const response = await modelClient.generateContent(prompt);
      
      let intent = 'chat_intent'; // Default
      
      if (response.toLowerCase().includes('calendar_intent')) intent = 'calendar_intent';
      else if (response.toLowerCase().includes('email_intent')) intent = 'email_intent';
      else if (response.toLowerCase().includes('exit_intent')) intent = 'exit_intent';
      
      // Cache the result
      await cache.set(`intent:${text}`, intent, 3600); // Cache for 1 hour
      return intent;
    } catch (error) {
      logger.error('Intent classification error', { error, text });
      return 'chat_intent'; // Default on error
    }
  }
}

module.exports = new IntentService();