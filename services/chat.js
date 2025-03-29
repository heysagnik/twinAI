// services/chat.js
const { HfInference } = require('@huggingface/inference');
const { research } = require('./research');
const { scheduleEvent } = require('./calendar');
const { sendEmail } = require('./email');

const hf = new HfInference();

async function processInput(userInput) {
    const inputLower = userInput.toLowerCase();

    if (inputLower.includes('research')) {
        const topic = userInput.split('research')[1]?.trim() || 'AI';
        return await research(topic);
    } else if (inputLower.includes('schedule')) {
        const parts = userInput.match(/schedule.*?called\s+["']?(.+?)["']?.*?(tomorrow|\d{4}-\d{2}-\d{2}).*?(\d{1,2}\s*(?:AM|PM))/i);
        const summary = parts ? parts[1] : 'Vibe Session';
        const dateTime = parts && parts[2] === 'tomorrow' ? '2025-03-30T14:00:00Z' : '2025-03-29T11:00:00Z'; // Default for demo
        return await scheduleEvent(summary, dateTime);
    } else if (inputLower.includes('email')) {
        const toMatch = userInput.match(/to\s+([^\s]+)/); // Extract email after "to"
        const subjectMatch = userInput.match(/subject\s+["']?(.+?)["']?(?=\s+and|$)/i); // Extract subject
        const bodyMatch = userInput.match(/body\s+["']?(.+?)["']?$/i); // Extract body
        const to = toMatch ? toMatch[1] : 'friend@example.com'; // Default if parsing fails
        const subject = subjectMatch ? subjectMatch[1] : 'AI Vibes'; // Default if parsing fails
        const body = bodyMatch ? bodyMatch[1] : 'Yo, we’re automating!'; // Default if parsing fails
        return await sendEmail(to, subject, body);
    } else if (inputLower.includes('quit')) {
        return 'Peace out!';
    } else {
        try {
            const response = await hf.textGeneration({
                model: 'EleutherAI/gpt-neo-125M',
                inputs: userInput,
                parameters: { max_new_tokens: 50 }
            });
            return `AI: ${response.generated_text}`;
        } catch (error) {
            return `AI: Couldn’t vibe on that one: ${error.message}`;
        }
    }
}

module.exports = { processInput };