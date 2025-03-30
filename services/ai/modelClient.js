const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const logger = require('../utils/logger');

class AIModelClient {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async generateContent(prompt, temperature = 0.7, maxTokens = 500) {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });
      return result.response.text();
    } catch (error) {
      logger.error('AI generation error', { error, prompt });
      throw new Error('Failed to generate AI content');
    }
  }

  async startChatSession(history = []) {
    return this.model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 350,
      }
    });
  }
}

module.exports = new AIModelClient();