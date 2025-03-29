require('dotenv').config();

const env = {
    PORT: process.env.PORT || 3000,
    DB_URI: process.env.DB_URI,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_API_URL: process.env.GEMINI_API_URL,
    EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY,
    MEETING_SERVICE_API_KEY: process.env.MEETING_SERVICE_API_KEY,
    TODO_SERVICE_API_KEY: process.env.TODO_SERVICE_API_KEY,
};

module.exports = env;