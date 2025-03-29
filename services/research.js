// services/research.js
const { HfInference } = require('@huggingface/inference');
const axios = require('axios');
const xml2js = require('xml2js');

const hf = new HfInference(process.env.HF_API_KEY || undefined);

const userProfile = {
    name: "Raghav",
    interests: ["cosmic stuff", "tech", "quantum vibes"],
};

async function fetchWikipediaContent(topic) {
    try {
        const normalizedTopic = topic.replace(/\b\w/g, c => c.toLowerCase());
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&titles=${encodeURIComponent(normalizedTopic)}&redirects=1`;
        const response = await axios.get(url);
        console.log('Wiki response:', JSON.stringify(response.data, null, 2));
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
        return { summary: "Couldn’t dig into arXiv this time.", link: "" };
    }
}

async function summarizeContent(content) {
    try {
        const summary = await hf.summarization({
            model: 'facebook/bart-large-cnn',
            inputs: content.slice(0, 1000),
            parameters: { max_length: 150, min_length: 50 },
        });
        return summary.summary_text;
    } catch (error) {
        console.error('Summarization error:', error.message);
        throw new Error(`Summarization hit a snag: ${error.message}`);
    }
}

function personalizeResponse(summary, topic, sources) {
    const { name, interests } = userProfile;
    let intro = `Greetings, ${name}! Prepare for an exquisite plunge into the abyss of ${topic}. `;
    
    if (interests.includes("cosmic stuff") && topic.toLowerCase().includes("black hole")) {
        intro += "Your passion for the cosmos will find this utterly mesmerizing—";
    } else if (interests.includes("tech") && topic.toLowerCase().includes("ai")) {
        intro += "A tech savant like you will revel in this intricate weave—";
    } else if (interests.includes("quantum vibes") && topic.toLowerCase().includes("quantum")) {
        intro += "Your quantum curiosity is about to be richly rewarded—";
    }

    const [wikiPart, arXivPart] = summary.split(" Plus, the brainiacs say: ");
    const sourceLines = sources.map(s => `  • *${s.name}*: [${s.link}](${s.link})`).join('\n');

    return `${intro}\n\n\n**The Cosmic Essence**\n${wikiPart.trim()}\n\n\n**The Scholars’ Insight**\n${arXivPart ? arXivPart.trim() : "No arXiv wisdom this time—stay tuned for more cosmic revelations!"}\n\n\n**Sources to Explore**\n${sourceLines}`;
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

        return personalizeResponse(fullSummary, topic, sources);
    } catch (error) {
        console.error('Research glitch:', error.message);
        return `Oops, ${userProfile.name}, we hit a cosmic wall: ${error.message}`;
    }
}

module.exports = { research };

if (require.main === module) {
    (async () => {
        console.log(await research("Black Holes"));
    })();
}