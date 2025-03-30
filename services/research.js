// services/research.js
const { HfInference } = require('@huggingface/inference');
const axios = require('axios');
const xml2js = require('xml2js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Initialize Hugging Face with proper error handling
let hf;
try {
  const hfApiKey = process.env.HF_API_KEY;
  if (hfApiKey && hfApiKey.trim() !== '') {
    hf = new HfInference(hfApiKey);
  } else {
    console.warn('HF_API_KEY not found. Will use Gemini for summarization instead.');
    hf = null;
  }
} catch (error) {
  console.error('Failed to initialize Hugging Face client:', error);
  hf = null;
}

const userProfile = {
    name: "Raghav",
    interests: ["cosmic stuff", "tech", "quantum vibes"],
};

async function fetchWikipediaContent(topic) {
    try {
        const normalizedTopic = topic.replace(/\b\w/g, c => c.toLowerCase());
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&titles=${encodeURIComponent(normalizedTopic)}&redirects=1`;
        const response = await axios.get(url);
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId === "-1" || !pages[pageId].extract) {
            throw new Error("No deep dive found on Wikipedia!");
        }
        return pages[pageId].extract;
    } catch (error) {
        console.error('Wiki fetch error:', error.message);
        throw error;
    }
}

async function fetchArXivContent(topic) {
    try {
        const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(topic)}&start=0&max_results=1&sortBy=relevance`;
        const response = await axios.get(url);
        const xmlString = response.data;
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlString);
        const entry = result.feed.entry || {};
        const summary = entry.summary || "No arXiv scoop yet.";
        const link = entry.id || "No link.";
        return { summary, link };
    } catch (error) {
        console.error('arXiv fetch error:', error.message);
        return { summary: "Couldn't dig into arXiv this time.", link: "" };
    }
}

// Updated to use Gemini API as fallback for summarization
async function summarizeContent(content) {
    // First try Hugging Face if available
    if (hf) {
        try {
            const summary = await hf.summarization({
                model: 'facebook/bart-large-cnn',
                inputs: content.slice(0, 1000),
                parameters: { max_length: 150, min_length: 50 },
            });
            return summary.summary_text;
        } catch (error) {
            console.error('Hugging Face summarization error:', error.message);
            console.log('Falling back to Gemini for summarization');
            // Fall through to Gemini fallback
        }
    }
    
    // Fallback to Gemini
    try {
        const prompt = `
        Analyze the following content and produce a research paper-styled summary with the following characteristics:
        - Use academic/scientific terminology appropriate to the subject
        - Structure with clear sections: Introduction, Key Findings, Analysis, and Conclusion
        - Highlight methodologies and significant discoveries where applicable
        - Maintain critical analysis of the information
        - Total length should be approximately 250-300 words
        
        Content to analyze:
        ${content.slice(0, 3800)}
        
        Research Summary:
        `;
        
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error('Gemini summarization error:', error.message);
        throw new Error(`Summarization error: ${error.message}`);
    }
}

async function personalizeResponse(summary, topic, sources) {
    const { name, interests } = userProfile;

    const prompt = `
    You are an AI personalizing a research summary for ${name}. 
    The topic is "${topic}". 
    The user has the following interests: ${interests.join(", ")}.

    Craft a concise and engaging personalized response that makes the topic feel relevant and interesting to the user.
    The response should naturally incorporate the summary and mention sources where applicable.
    Avoid generic introductions, unnecessary sections, or forced enthusiasm.
    
    Summary information to incorporate:
    ${summary}
    
    Sources to mention at the end:
    ${sources.map(s => `- ${s.name}: ${s.link}`).join('\n')}
    `;

    try {
        const response = await model.generateContent(prompt);
        return response.response.text().trim();
    } catch (error) {
        console.error('AI personalization error:', error.message);
        // Basic fallback if personalization fails
        return `Hey ${name}, here's what I found about "${topic}": ${summary}\n\nSources: ${sources.map(s => s.name).join(', ')}`;
    }
}

async function research(topic) {
    try {
        console.log(`Digging deep into ${topic} for ${userProfile.name}...`);

        const wikiContent = await fetchWikipediaContent(topic);
        const wikiSummary = await summarizeContent(wikiContent);
        
        let arXivData = { summary: "", link: "" };
        if (["cosmic", "tech", "quantum", "black hole", "ai"].some(keyword => topic.toLowerCase().includes(keyword))) {
            arXivData = await fetchArXivContent(topic);
        }

        const fullSummary = arXivData.summary 
            ? `${wikiSummary} Plus, the brainiacs say: ${arXivData.summary}`
            : wikiSummary;
        
        const sources = [
            { name: "Wikipedia", link: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}` },
        ];
        if (arXivData.link) {
            sources.push({ name: "arXiv", link: arXivData.link });
        }

        return await personalizeResponse(fullSummary, topic, sources);
    } catch (error) {
        console.error('Research error:', error.message);
        
        // Provide a meaningful fallback response
        try {
            // If everything fails, just ask Gemini directly about the topic
            const prompt = `Provide a helpful summary about "${topic}" in a friendly, conversational tone.`;
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (backupError) {
            return `I'm having trouble researching "${topic}" right now. Please try again later or ask me something else.`;
        }
    }
}

module.exports = { research };

