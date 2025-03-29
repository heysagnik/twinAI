const express = require('express');
const MeetingController = require('../controllers/meetingController.js');
const router = express.Router();

// Instantiate MeetingController (pass meetingService if needed)
const meetingController = new MeetingController();

// Use POST endpoints (or get if that is intended) and bind the controller methods
router.post('/schedule', meetingController.scheduleMeeting.bind(meetingController));
router.post('/reminder', meetingController.setReminder.bind(meetingController));

module.exports = router;