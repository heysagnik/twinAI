class MeetingController {
    constructor(meetingService) {
        this.meetingService = meetingService;
    }

    async scheduleMeeting(req, res) {
        try {
            const { title, date, time, participants } = req.body;
            const meeting = await this.meetingService.scheduleMeeting(title, date, time, participants);
            res.status(201).json({ success: true, data: meeting });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async setReminder(req, res) {
        try {
            const { meetingId, reminderTime } = req.body;
            const reminder = await this.meetingService.setReminder(meetingId, reminderTime);
            res.status(200).json({ success: true, data: reminder });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = MeetingController;