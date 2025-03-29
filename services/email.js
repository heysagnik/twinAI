// services/email.js
const nodemailer = require('nodemailer');

async function sendEmail(to, subject, body) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to, // Use the parsed 'to' value
            subject, // Use the parsed 'subject'
            text: body, // Use the parsed 'body'
        });

        return `Email sent to ${to}. Vibes delivered!`; // Reflects the actual recipient
    } catch (error) {
        return `Email failed to vibe: ${error.message}`;
    }
}

module.exports = { sendEmail };