const chatManager = require('./chatManager');
const repository = require('./repository');

module.exports = {
  processInput: chatManager.processInput,
  getConversationHistory: repository.getConversationHistory,
  getUserChats: chatManager.getUserChats,
  analyzeSentiment: chatManager.analyzeSentiment
};