const express = require('express');
const router = express.Router();
const MeetingController = require('../controllers/meetingController');

const meetingController = new MeetingController();

// Route to schedule a meeting
router.post('/schedule', meetingController.scheduleMeeting);

// Route to set a reminder for a meeting
router.post('/reminder', meetingController.setReminder);

// Route to retrieve all scheduled meetings
router.get('/', meetingController.getAllMeetings);

// Route to retrieve a specific meeting by ID
router.get('/:id', meetingController.getMeetingById);

// Route to delete a meeting by ID
router.delete('/:id', meetingController.deleteMeeting);

module.exports = router;