const { HfInference } = require('@huggingface/inference');
const hf = new HfInference();

const axios = require('axios');
async function research(topic) {
    try {
        console.log(`Researching ${topic}, hold tight...`);
        const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
        const context = response.data.extract || 'No info found.';
        const summary = await hf.summarization({
            model: 'facebook/bart-large-cnn',
            inputs: context.slice(0, 1000), // Limit for API
            parameters: { max_length: 100, min_length: 30 }
        });
        return `Here’s the vibe: ${summary.summary_text}`;
    } catch (error) {
        return `Oops, research hit a snag: ${error.message}`;
    }
}

module.exports = { research };