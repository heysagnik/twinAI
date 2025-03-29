import { GeminiService } from '../services/geminiService';

class TwinController {
    async createDigitalTwin(req, res) {
        try {
            const userId = req.user.id; // Assuming user ID is available in the request
            const twinData = await GeminiService.createTwin(userId);
            res.status(201).json({ success: true, data: twinData });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async scheduleMeeting(req, res) {
        try {
            const { dateTime, participants } = req.body;
            const meetingDetails = await GeminiService.scheduleMeeting(dateTime, participants);
            res.status(200).json({ success: true, data: meetingDetails });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async retrieveUnreadEmails(req, res) {
        try {
            const unreadEmails = await GeminiService.getUnreadEmails(req.user.id);
            res.status(200).json({ success: true, data: unreadEmails });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async generateEmailResponse(req, res) {
        try {
            const { emailContent } = req.body;
            const response = await GeminiService.generateEmailResponse(emailContent);
            res.status(200).json({ success: true, data: response });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createToDoList(req, res) {
        try {
            const { tasks } = req.body;
            const todoList = await GeminiService.createToDoList(tasks);
            res.status(201).json({ success: true, data: todoList });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new TwinController();