import express from 'express';
import EmailController from '../controllers/emailController.js';

const router = express.Router();
const emailController = new EmailController();

// Route to retrieve unread emails
router.get('/unread', emailController.getUnreadEmails);

// Route to generate a personalized email response
router.post('/response', emailController.generatePersonalizedResponse);

// Route to send an email
router.post('/send', emailController.sendEmail);

export default router;