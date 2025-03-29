class EmailController {
    constructor(emailService) {
        this.emailService = emailService;
    }

    async getUnreadEmails(req, res) {
        try {
            const unreadEmails = await this.emailService.fetchUnreadEmails();
            res.status(200).json({ success: true, data: unreadEmails });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async generatePersonalizedResponse(req, res) {
        const { emailContent } = req.body;
        try {
            const response = await this.emailService.createPersonalizedResponse(emailContent);
            res.status(200).json({ success: true, data: response });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async sendEmail(req, res) {
        const { recipient, subject, body } = req.body;
        try {
            await this.emailService.sendEmail(recipient, subject, body);
            res.status(200).json({ success: true, message: 'Email sent successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = EmailController;