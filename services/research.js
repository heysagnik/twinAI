// services/research.js
const { HfInference } = require('@huggingface/inference');
const axios = require('axios');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
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

// Enhanced Wikipedia content fetching with more detail
async function fetchWikipediaContent(topic) {
    try {
        const normalizedTopic = topic.replace(/\b\w/g, c => c.toLowerCase());
        // Request more content by removing the exintro flag
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&format=json&titles=${encodeURIComponent(normalizedTopic)}&redirects=1`;
        const response = await axios.get(url);
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId === "-1" || !pages[pageId].extract) {
            throw new Error("No Wikipedia content found");
        }
        return pages[pageId].extract;
    } catch (error) {
        console.error('Wikipedia fetch error:', error.message);
        throw error;
    }
}

// Enhanced arXiv content fetching with more results
async function fetchArXivContent(topic) {
    try {
        // Fetch up to 3 results for more comprehensive coverage
        const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(topic)}&start=0&max_results=3&sortBy=relevance`;
        const response = await axios.get(url);
        const xmlString = response.data;
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlString);
        
        if (!result.feed.entry) {
            return { summaries: [], links: [] };
        }
        
        // Handle both single and multiple entries
        const entries = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
        
        const summaries = entries.map(entry => entry.summary || "").filter(Boolean);
        const links = entries.map(entry => entry.id || "").filter(Boolean);
        const titles = entries.map(entry => entry.title || "").filter(Boolean);
        
        return { 
            summaries, 
            links,
            titles
        };
    } catch (error) {
        console.error('arXiv fetch error:', error.message);
        return { summaries: [], links: [], titles: [] };
    }
}

// New function to scrape Google Scholar
async function fetchGoogleScholar(topic) {
    try {
        const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}&hl=en`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const results = [];
        
        $('.gs_ri').each((i, element) => {
            if (i < 3) { // Limit to first 3 results
                const title = $(element).find('.gs_rt').text().trim();
                const snippet = $(element).find('.gs_rs').text().trim();
                const link = $(element).find('.gs_rt a').attr('href') || "";
                
                if (title && snippet) {
                    results.push({ title, snippet, link });
                }
            }
        });
        
        return results;
    } catch (error) {
        console.error('Google Scholar fetch error:', error.message);
        return [];
    }
}

// Fetch news articles related to the topic
async function fetchNewsArticles(topic) {
    try {
        // Using a mocked news API endpoint - replace with actual News API
        const encodedTopic = encodeURIComponent(topic);
        const url = `https://newsapi.org/v2/everything?q=${encodedTopic}&apiKey=${process.env.NEWS_API_KEY || 'dummy_key'}&pageSize=3`;
        
        let articles = [];
        try {
            const response = await axios.get(url);
            if (response.data.articles && response.data.articles.length > 0) {
                articles = response.data.articles.map(article => ({
                    title: article.title,
                    description: article.description,
                    source: article.source.name,
                    url: article.url,
                    publishedAt: article.publishedAt
                }));
            }
        } catch (e) {
            console.log('News API failed, using mock data');
            // Mock data in case the API fails
            const currentDate = new Date().toISOString();
            articles = [
                {
                    title: `Latest developments in ${topic}`,
                    description: `Recent research on ${topic} has shown promising results in various applications.`,
                    source: 'Science Daily',
                    url: `https://www.sciencedaily.com/search/?keyword=${encodedTopic}`,
                    publishedAt: currentDate
                }
            ];
        }
        
        return articles;
    } catch (error) {
        console.error('News fetch error:', error.message);
        return [];
    }
}

// Format research into academic paper style
async function formatAsResearchPaper(topic, sources) {
    try {
        // Extract all collected content
        let allContentText = '';
        
        // Add Wikipedia content
        if (sources.wikipedia) {
            allContentText += `WIKIPEDIA: ${sources.wikipedia.substring(0, 2000)}\n\n`;
        }
        
        // Add arXiv content
        if (sources.arxiv && sources.arxiv.summaries.length > 0) {
            allContentText += "ARXIV PAPERS:\n";
            sources.arxiv.summaries.forEach((summary, i) => {
                const title = sources.arxiv.titles[i] || `Paper ${i+1}`;
                allContentText += `TITLE: ${title}\nSUMMARY: ${summary.substring(0, 500)}\n\n`;
            });
        }
        
        // Add Google Scholar content
        if (sources.scholar && sources.scholar.length > 0) {
            allContentText += "SCHOLARLY ARTICLES:\n";
            sources.scholar.forEach(item => {
                allContentText += `TITLE: ${item.title}\nSNIPPET: ${item.snippet}\n\n`;
            });
        }
        
        // Add News content
        if (sources.news && sources.news.length > 0) {
            allContentText += "RECENT NEWS:\n";
            sources.news.forEach(item => {
                allContentText += `TITLE: ${item.title}\nDESCRIPTION: ${item.description}\nSOURCE: ${item.source}\n\n`;
            });
        }
        
        // Format as academic paper using Gemini
        const prompt = `
        As a professional research analyst, create a formal research paper on "${topic}" based on the following sources.
        Format the paper with these sections:
        
        # ${topic.toUpperCase()}: A COMPREHENSIVE ANALYSIS
        
        ## Abstract
        A brief overview of the research topic and key findings (1 paragraph)
        
        ## 1. Introduction
        Background information on ${topic} and why it's significant (1-2 paragraphs)
        
        ## 2. Methodology
        Describe the systematic review of literature conducted for this analysis (1 paragraph)
        
        ## 3. Literature Review
        Analysis of existing research and key theories (2-3 paragraphs)
        
        ## 4. Current Developments
        Recent breakthroughs and ongoing research (1-2 paragraphs)
        
        ## 5. Analysis and Discussion
        Critical evaluation of findings and their implications (2 paragraphs)
        
        ## 6. Conclusion
        Summary of key insights and future research directions (1 paragraph)
        
        ## References
        List of all sources cited in the paper
        
        Source material to synthesize:
        ${allContentText}
        
        Important guidelines:
        1. Use formal, academic language and tone throughout
        2. Cite sources appropriately in the text (Author, Year) format
        3. Include critical analysis, not just information reporting
        4. Make connections between different sources and findings
        5. Ensure the paper flows logically between sections
        6. The paper should be thorough yet concise, focusing on the most significant information
        7. Include at least 5-7 references in the References section
        `;
        
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4000,
            },
        });
        
        return result.response.text().trim();
    } catch (error) {
        console.error('Research paper formatting error:', error.message);
        
        // Fallback to a simpler format if the complex formatting fails
        return `
# Research on ${topic}

## Summary
${sources.wikipedia ? sources.wikipedia.substring(0, 300) + '...' : 'No Wikipedia information available.'}

## Key Findings
${sources.arxiv && sources.arxiv.summaries.length > 0 ? 
  sources.arxiv.summaries[0].substring(0, 200) + '...' : 
  'No academic papers found on this topic.'}

## References
- Wikipedia
${sources.arxiv && sources.arxiv.links.length > 0 ? 
  sources.arxiv.links.map(link => `- ${link}`).join('\n') : ''}
`;
    }
}

// Main research function - now more comprehensive
async function research(topic) {
    try {
        console.log(`Starting comprehensive research on "${topic}"...`);
        
        // Collect data from multiple sources in parallel
        const sources = {};
        
        // Wikipedia (try/catch for each source to prevent one failure from stopping everything)
        try {
            sources.wikipedia = await fetchWikipediaContent(topic);
            console.log(`Wikipedia data collected for "${topic}"`);
        } catch (error) {
            console.error('Wikipedia research failed:', error.message);
        }
        
        // arXiv
        try {
            sources.arxiv = await fetchArXivContent(topic);
            console.log(`arXiv data collected: ${sources.arxiv.summaries.length} papers found`);
        } catch (error) {
            console.error('arXiv research failed:', error.message);
            sources.arxiv = { summaries: [], links: [], titles: [] };
        }
        
        // Google Scholar
        try {
            sources.scholar = await fetchGoogleScholar(topic);
            console.log(`Google Scholar data collected: ${sources.scholar.length} articles found`);
        } catch (error) {
            console.error('Google Scholar research failed:', error.message);
            sources.scholar = [];
        }
        
        // News articles
        try {
            sources.news = await fetchNewsArticles(topic);
            console.log(`News data collected: ${sources.news.length} articles found`);
        } catch (error) {
            console.error('News research failed:', error.message);
            sources.news = [];
        }
        
        // Format as research paper
        const researchPaper = await formatAsResearchPaper(topic, sources);
        
        // Add source URLs for citation
        let sourceLinks = "## Source Links\n";
        
        // Add Wikipedia link
        sourceLinks += `- [Wikipedia](https://en.wikipedia.org/wiki/${encodeURIComponent(topic)})\n`;
        
        // Add arXiv links
        if (sources.arxiv && sources.arxiv.links.length > 0) {
            sources.arxiv.links.forEach((link, i) => {
                const title = sources.arxiv.titles[i] || `arXiv paper ${i+1}`;
                sourceLinks += `- [${title}](${link})\n`;
            });
        }
        
        // Add Scholar links
        if (sources.scholar && sources.scholar.length > 0) {
            sources.scholar.forEach((item, i) => {
                if (item.link) {
                    sourceLinks += `- [${item.title || 'Scholar article ' + (i+1)}](${item.link})\n`;
                }
            });
        }
        
        // Add News links
        if (sources.news && sources.news.length > 0) {
            sources.news.forEach(item => {
                if (item.url) {
                    sourceLinks += `- [${item.title || 'News article'} (${item.source || 'Source'})](${item.url})\n`;
                }
            });
        }
        
        // Combine research paper with source links
        return `${researchPaper}\n\n${sourceLinks}`;
        
    } catch (error) {
        console.error('Complete research process failed:', error.message);
        
        // If all else fails, generate a direct response from Gemini
        try {
            const prompt = `
            Create a detailed research paper about "${topic}" with the following structure:
            
            # ${topic.toUpperCase()}: RESEARCH ANALYSIS
            
            ## Abstract
            [Brief overview]
            
            ## Introduction
            [Background information]
            
            ## Key Findings
            [Major discoveries and insights]
            
            ## Analysis
            [Critical evaluation]
            
            ## Conclusion
            [Summary and future directions]
            
            ## References
            [Minimum 5 credible sources]
            
            Make this academically rigorous, well-structured, and informative.
            `;
            
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (backupError) {
            return `I apologize, but I'm experiencing difficulties conducting thorough research on "${topic}" at the moment. Please try another query or try again later.`;
        }
    }
}

module.exports = { research };

