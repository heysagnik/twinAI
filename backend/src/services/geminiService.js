import axios from 'axios';
import config from '../config/gemini';

const GeminiService = {
    scheduleMeeting: async (meetingDetails) => {
        try {
            const response = await axios.post(`${config.apiUrl}/scheduleMeeting`, meetingDetails, {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            throw new Error('Error scheduling meeting: ' + error.message);
        }
    },

    retrieveUnreadEmails: async (userId) => {
        try {
            const response = await axios.get(`${config.apiUrl}/unreadEmails/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            throw new Error('Error retrieving unread emails: ' + error.message);
        }
    },

    generatePersonalizedEmailResponse: async (emailContent) => {
        try {
            const response = await axios.post(`${config.apiUrl}/generateEmailResponse`, emailContent, {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            throw new Error('Error generating email response: ' + error.message);
        }
    },

    createToDoList: async (todoItems) => {
        try {
            const response = await axios.post(`${config.apiUrl}/createToDoList`, { items: todoItems }, {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            throw new Error('Error creating to-do list: ' + error.message);
        }
    }
};

export default GeminiService;