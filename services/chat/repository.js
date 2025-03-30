const Message = require('../../models/Message');
const Chat = require('../../models/Chat');
const logger = require('../utils/logger');

class ChatRepository {
  async saveMessage(sessionId, role, content, metadata = {}) {
    try {
      return await Message.create({
        sessionId,
        role,
        content,
        metadata
      });
    } catch (error) {
      logger.error('Error saving message', { error, sessionId, role });
      throw new Error('Failed to save message');
    }
  }

  async getConversationHistory(sessionId, limit = 10, userId = null) {
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
      
      return chat.messages.slice(-limit);
    } catch (error) {
      logger.error('Error retrieving conversation history', { error, sessionId, userId });
      throw new Error('Failed to retrieve conversation history');
    }
  }

  async saveConversation(sessionId, userId, userInput, aiResponse) {
    try {
      // Use findOneAndUpdate with upsert for atomic operation
      const update = {
        $push: {
          messages: [
            { role: 'user', content: userInput },
            { 
              role: 'assistant', 
              content: typeof aiResponse === 'object' ? aiResponse.content : aiResponse,
              metadata: { 
                type: typeof aiResponse === 'object' ? aiResponse.type : 'text' 
              }
            }
          ]
        },
        $set: { updatedAt: new Date() },
        $setOnInsert: {
          title: userInput.substring(0, 30) + (userInput.length > 30 ? '...' : ''),
          createdAt: new Date()
        }
      };
      
      const options = { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      };
      
      return await Chat.findOneAndUpdate(
        { sessionId, userId }, 
        update,
        options
      );
    } catch (error) {
      logger.error('Error saving conversation', { error, sessionId, userId });
      throw new Error('Failed to save conversation');
    }
  }
}

module.exports = new ChatRepository();