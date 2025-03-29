module.exports = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'your-default-api-key',
    GEMINI_API_URL: process.env.GEMINI_API_URL || 'https://api.gemini.com/v1',
    TIMEOUT: process.env.GEMINI_TIMEOUT || 5000,
    MAX_RETRIES: process.env.GEMINI_MAX_RETRIES || 3,
};