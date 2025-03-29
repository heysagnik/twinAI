// services/chat.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { research } = require('./research');
const { scheduleEvent } = require('./calendar');
const { sendEmail } = require('./email');
require('dotenv').config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Add conversation context
let conversationHistory = [];

// Update the email state object
let emailState = {
  active: false,
  stage: 'init', // init, collecting_purpose, collecting_recipient, collecting_subject, collecting_body, confirming, editing, generating_body
  data: {
    to: '',
    subject: '',
    body: '',
    purpose: '',
    styleAnalysis: null
  }
};

// Add before processInput
function isInEmailFlow() {
  return emailState.active;
}

// Intent classification function using Gemini
async function classifyIntent(text) {
  try {
    const prompt = `
      Classify the intent of the following text into one of these categories:
      - research_intent: For requests about researching a topic
      - calendar_intent: For scheduling events or meetings
      - email_intent: For sending emails
      - exit_intent: For exiting or ending the conversation
      - chat_intent: For general conversation
      
      Text: "${text}"
      
      Intent:`;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    // Check if the response contains any of the intent types
    if (response.includes('research_intent')) return 'research_intent';
    if (response.includes('calendar_intent')) return 'calendar_intent';
    if (response.includes('email_intent')) return 'email_intent';
    if (response.includes('exit_intent')) return 'exit_intent';
    
    // Fallback to keyword matching if the model's response doesn't match expected format
    const intentMap = {
      'research': 'research_intent',
      'schedule': 'calendar_intent', 
      'email': 'email_intent',
      'quit': 'exit_intent'
    };
    
    for (const [keyword, intent] of Object.entries(intentMap)) {
      if (text.toLowerCase().includes(keyword)) {
        return intent;
      }
    }
    
    return 'chat_intent'; // Default fallback
  } catch (error) {
    console.error('Intent classification error:', error);
    return 'chat_intent'; // Default on error
  }
}

// Entity extraction using Gemini
async function extractEntities(text, intentType) {
  try {
    let prompt = '';
    
    if (intentType === 'research_intent') {
      prompt = `
        Extract the research topic from this text: "${text}"
        Output just the topic with no additional text.
      `;
      const result = await model.generateContent(prompt);
      const topic = result.response.text().trim();
      return { topic: topic || 'AI' };
      
    } else if (intentType === 'calendar_intent') {
      prompt = `
        Extract the following information from this text: "${text}"
        - eventName: The name of the event (default to "Meeting" if not found)
        - dateTime: The date and time of the event (use ISO format YYYY-MM-DDTHH:MM:SSZ)
        
        Return as JSON like: {"eventName": "event name", "dateTime": "date time"}
      `;
      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      try {
        // Try to parse JSON from the response
        const jsonMatch = response.match(/\{.*\}/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // If JSON parsing fails, use regex fallback
        console.error('JSON parsing error:', e);
      }
      
      // Fallback to regex
      const eventMatch = text.match(/called\s+["']?(.+?)["']?/i);
      const eventName = eventMatch ? eventMatch[1] : 'Meeting';
      const dateTime = text.includes('tomorrow') ? '2025-03-30T14:00:00Z' : '2025-03-29T11:00:00Z';
      return { eventName, dateTime };
      
    } else if (intentType === 'email_intent') {
      // First check if we're in an active email flow
      if (emailState.active) {
        // We're already collecting email info, don't extract again
        return emailState.data;
      }
      
      prompt = `
        Extract the following information from this text: "${text}"
        - to: The recipient's email (output MISSING if not found)
        - subject: The email subject (output MISSING if not found)
        - body: The email body (output MISSING if not found)
        
        Return as JSON like: {"to": "email or MISSING", "subject": "subject line or MISSING", "body": "email body or MISSING"}
      `;
      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      
      let emailData = {
        to: 'MISSING',
        subject: 'MISSING',
        body: 'MISSING'
      };
      
      try {
        // Try to parse JSON from the response
        const jsonMatch = response.match(/\{.*\}/s);
        if (jsonMatch) {
          emailData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('JSON parsing error:', e);
        // Use fallback regex extraction
        const toMatch = text.match(/to\s+([^\s]+@[^\s]+)/);
        const subjectMatch = text.match(/subject\s+["']?(.+?)["']?(?=\s+and|$)/i);
        const bodyMatch = text.match(/body\s+["']?(.+?)["']?$/i);
        
        if (toMatch) emailData.to = toMatch[1];
        if (subjectMatch) emailData.subject = subjectMatch[1];
        if (bodyMatch) emailData.body = bodyMatch[1];
      }
      
      return emailData;
    }
    
    return {}; // Default empty entities
  } catch (error) {
    console.error('Entity extraction error:', error);
    
    // Fallback to regex extraction
    const entities = {};
    if (intentType === 'research_intent') {
      entities.topic = text.split('research')[1]?.trim() || 'AI';
    } else if (intentType === 'calendar_intent') {
      const parts = text.match(/schedule.*?called\s+["']?(.+?)["']?.*?(tomorrow|\d{4}-\d{2}-\d{2}).*?(\d{1,2}\s*(?:AM|PM))/i);
      entities.eventName = parts ? parts[1] : 'Vibe Session';
      entities.dateTime = parts && parts[2] === 'tomorrow' ? '2025-03-30T14:00:00Z' : '2025-03-29T11:00:00Z';
    } else if (intentType === 'email_intent') {
      const toMatch = text.match(/to\s+([^\s]+)/);
      const subjectMatch = text.match(/subject\s+["']?(.+?)["']?(?=\s+and|$)/i);
      const bodyMatch = text.match(/body\s+["']?(.+?)["']?$/i);
      entities.to = toMatch ? toMatch[1] : 'friend@example.com';
      entities.subject = subjectMatch ? subjectMatch[1] : 'AI Vibes';
      entities.body = bodyMatch ? bodyMatch[1] : 'Hello from AI assistant';
    }
    return entities;
  }
}

// Analyze sentiment using Gemini
async function analyzeSentiment(text) {
  try {
    const prompt = `
      Analyze the sentiment of the following text and return ONLY the word "POSITIVE" or "NEGATIVE".
      Text: "${text}"
      Sentiment:
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    if (response.toUpperCase().includes('POSITIVE')) return 'POSITIVE';
    return 'NEGATIVE';
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return 'NEUTRAL';
  }
}

// Add after analyzeSentiment
async function analyzeEmailHistory(recipient) {
    try {
        // Mock email service for demonstration purposes
        // In production, replace with actual email API calls (Gmail, Outlook, etc.)
        const fetchEmailHistory = async (recipient) => {
            try {
            console.log(`Fetching email history for recipient: ${recipient}`);
            
            // In production, replace this with actual API integration:
            // const client = await authenticateEmailClient();
            // return await client.fetchEmails({
            //     to: recipient,
            //     limit: 10,
            //     orderBy: 'date desc'
            // });
            
            // Determine domain type for mock data
            const domain = recipient.split('@')[1] || '';
            const isBusiness = !domain.includes('gmail') && 
                      !domain.includes('yahoo') && 
                      !domain.includes('hotmail');
            
            // Return mock data for demonstration
            return {
                success: true,
                emails: Array(3).fill().map((_, i) => ({
                subject: isBusiness ? `Project Update ${i+1}` : `Weekend plans ${i+1}`,
                body: isBusiness ? 
                    `Dear recipient,\n\nPlease find attached the latest updates for the project.\n\nBest regards,\nSender` : 
                    `Hey!\n\nWhat are you up to this weekend? Want to hang out?\n\nCheers,\nSender`,
                date: new Date(Date.now() - i * 86400000).toISOString()
                }))
            };
            } catch (error) {
            console.error('Error fetching email history:', error);
            return { success: false, emails: [] };
            }
        };
        
        // Fetch previous communication history
        const emailHistory = await fetchEmailHistory(recipient);
        console.log(`Retrieved ${emailHistory.emails.length} previous emails for analysis`);
        
        const prompt = `
            Analyze previous communication patterns with ${recipient}:
            
            1. First determine if this appears to be a formal business contact or casual/personal contact
            2. Analyze typical tone used (formal, semiformal, casual, friendly, professional)
            3. Suggest appropriate greeting based on relationship (formal vs casual)
            4. Suggest appropriate closing based on relationship
            5. Analyze writing style (concise vs detailed, technical vs simple)
            
            Also consider the domain of the recipient's email address to inform formality.
            
            Return as JSON: {
                "relationship": "business/personal/unknown",
                "tone": "recommended tone",
                "greeting": "suggested greeting",
                "closing": "suggested closing",
                "style": "writing style recommendation"
            }
        `;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text().trim();
        
        try {
            // Try to parse JSON from the response
            const jsonMatch = response.match(/\{.*\}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Email analysis JSON parsing error:', e);
        }
        
        // Fallback based on email domain analysis
        const domain = recipient.split('@')[1] || '';
        if (domain.includes('gmail') || domain.includes('yahoo') || domain.includes('hotmail')) {
            return {
                relationship: "likely personal",
                tone: "friendly",
                greeting: "Hey there,",
                closing: "Cheers,",
                style: "casual and conversational"
            };
        } else {
            return {
                relationship: "likely business",
                tone: "professional",
                greeting: "Hello,",
                closing: "Best regards,",
                style: "concise and clear"
            };
        }
    } catch (error) {
        console.error('Email history analysis error:', error);
        return {
            relationship: "unknown",
            tone: "professional",
            greeting: "Hi there,",
            closing: "Best regards,",
            style: "concise and clear"
        };
    }
}

// Add before handleEmailIntent
async function generateEmailBody(recipient, subject, purpose, styleAnalysis) {
  try {
    const prompt = `
      Generate an email body for a ${purpose} email.
      
      Recipient: ${recipient}
      Subject: ${subject}
      
      Use the following communication style:
      - Tone: ${styleAnalysis.tone}
      - Typical greeting: ${styleAnalysis.greeting}
      - Typical closing: ${styleAnalysis.closing}
      - Writing style: ${styleAnalysis.style}
      
      The email should be clear, concise, and match the purpose of ${purpose}.
      Include appropriate greeting and closing.
      
      Email body:
    `;
    
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Email generation error:', error);
    
    // Fallback template if generation fails
    const greeting = styleAnalysis?.greeting || "Hi there,";
    const closing = styleAnalysis?.closing || "Best regards,\nAI Assistant";
    
    return `${greeting}\n\nI'm writing regarding ${subject}. This is an automatically generated email about ${purpose}.\n\n${closing}`;
  }
}

// Add this function before processInput
async function handleEmailIntent(userInput, entities) {
  // Check if we're starting a new email flow
  if (!emailState.active) {
    emailState.active = true;
    emailState.stage = 'collecting_purpose';
    emailState.data = {
      to: entities.to === 'MISSING' ? '' : entities.to,
      subject: entities.subject === 'MISSING' ? '' : entities.subject,
      body: entities.body === 'MISSING' ? '' : entities.body,
      purpose: '',
      styleAnalysis: null
    };
    
    // If we already know the recipient, analyze past emails
    if (emailState.data.to && emailState.data.to !== '') {
      emailState.data.styleAnalysis = await analyzeEmailHistory(emailState.data.to);
    }
    
    return "What's the purpose of this email? (e.g., follow-up, information request, meeting invitation, etc.)";
  }
  
  // Process based on current stage
  switch(emailState.stage) {
    case 'collecting_purpose':
      emailState.data.purpose = userInput.trim();
      
      if (!emailState.data.to) {
        emailState.stage = 'collecting_recipient';
        return "To whom would you like to send this email? Please provide their email address.";
      } else if (!emailState.data.subject) {
        emailState.stage = 'collecting_subject';
        return `What should be the subject of your ${emailState.data.purpose} email to ${emailState.data.to}?`;
      } else if (!emailState.data.body) {
        // If we have a purpose and recipient but no body, generate one
        emailState.stage = 'generating_body';
        
        // Ensure we have style analysis
        if (!emailState.data.styleAnalysis) {
          emailState.data.styleAnalysis = await analyzeEmailHistory(emailState.data.to);
        }
        
        // Generate email body
        const generatedBody = await generateEmailBody(
          emailState.data.to, 
          emailState.data.subject, 
          emailState.data.purpose, 
          emailState.data.styleAnalysis
        );
        
        emailState.data.body = generatedBody;
        emailState.stage = 'confirming';
        return `Here's your draft email:\n\nTo: ${emailState.data.to}\nSubject: ${emailState.data.subject}\nBody: ${emailState.data.body}\n\nShould I send this email? (yes/no)`;
      } else {
        emailState.stage = 'confirming';
        return `Here's your draft email:\n\nTo: ${emailState.data.to}\nSubject: ${emailState.data.subject}\nBody: ${emailState.data.body}\n\nShould I send this email? (yes/no)`;
      }
      
    case 'collecting_recipient':
      // Extract email from user input
      const emailMatch = userInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        emailState.data.to = emailMatch[0];
        
        // Analyze previous communication style with this recipient
        emailState.data.styleAnalysis = await analyzeEmailHistory(emailState.data.to);
        
        // Move to next missing field
        if (!emailState.data.subject) {
          emailState.stage = 'collecting_subject';
          return `What should be the subject of your ${emailState.data.purpose} email to ${emailState.data.to}?`;
        } else if (!emailState.data.body) {
          emailState.stage = 'generating_body';
          
          // Generate email body
          const generatedBody = await generateEmailBody(
            emailState.data.to, 
            emailState.data.subject, 
            emailState.data.purpose, 
            emailState.data.styleAnalysis
          );
          
          emailState.data.body = generatedBody;
          emailState.stage = 'confirming';
          return `Here's your draft email:\n\nTo: ${emailState.data.to}\nSubject: ${emailState.data.subject}\nBody: ${emailState.data.body}\n\nShould I send this email? (yes/no)`;
        } else {
          emailState.stage = 'confirming';
          return `Here's your draft email:\n\nTo: ${emailState.data.to}\nSubject: ${emailState.data.subject}\nBody: ${emailState.data.body}\n\nShould I send this email? (yes/no)`;
        }
      } else {
        return "I couldn't find a valid email address. Please provide a valid email address.";
      }
      
    case 'collecting_subject':
      emailState.data.subject = userInput.trim();
      
      // Generate email body based on purpose and style analysis
      emailState.stage = 'generating_body';
      
      // Generate email body
      const generatedBody = await generateEmailBody(
        emailState.data.to, 
        emailState.data.subject, 
        emailState.data.purpose, 
        emailState.data.styleAnalysis
      );
      
      emailState.data.body = generatedBody;
      emailState.stage = 'confirming';
      return `Here's your draft email:\n\nTo: ${emailState.data.to}\nSubject: ${emailState.data.subject}\nBody: ${generatedBody}\n\nShould I send this email? (yes/no)`;
      
    case 'confirming':
      if (userInput.toLowerCase().includes('yes')) {
        // Send the email
        const result = await sendEmail(emailState.data.to, emailState.data.subject, emailState.data.body);
        
        // Reset the email state
        emailState = {
          active: false,
          stage: 'init',
          data: { to: '', subject: '', body: '', purpose: '', styleAnalysis: null }
        };
        
        return result;
      } else if (userInput.toLowerCase().includes('no')) {
        // Ask if they want to edit any part
        emailState.stage = 'editing';
        return "Would you like to edit the subject, body, or cancel the email?";
      } else {
        return "Please confirm if you want to send this email (yes/no).";
      }
      
    case 'editing':
      if (userInput.toLowerCase().includes('subject')) {
        emailState.stage = 'collecting_subject';
        return "Please provide a new subject for your email.";
      } else if (userInput.toLowerCase().includes('body')) {
        emailState.stage = 'collecting_body';
        return "Please provide a new body for your email.";
      } else if (userInput.toLowerCase().includes('cancel')) {
        // Cancel the email
        emailState = {
          active: false,
          stage: 'init',
          data: { to: '', subject: '', body: '', purpose: '', styleAnalysis: null }
        };
        return "Email canceled. What else can I help you with?";
      } else {
        return "Would you like to edit the subject, body, or cancel the email?";
      }
      
    case 'collecting_body':
      emailState.data.body = userInput.trim();
      emailState.stage = 'confirming';
      return `Here's your updated draft email:\n\nTo: ${emailState.data.to}\nSubject: ${emailState.data.subject}\nBody: ${emailState.data.body}\n\nShould I send this email? (yes/no)`;
  }
}

// Process conversation with Gemini
async function processInput(userInput) {
    // Add input to conversation history
    conversationHistory.push({ role: 'user', content: userInput });
    if (conversationHistory.length > 10) conversationHistory.shift(); // Keep last 10 messages
    
    // If we're in the middle of an email flow, continue that
    if (isInEmailFlow()) {
        const response = await handleEmailIntent(userInput, {});
        conversationHistory.push({ role: 'assistant', content: response });
        return response;
    }
    
    // Otherwise, process normally
    const intent = await classifyIntent(userInput);
    const entities = await extractEntities(userInput, intent);
    
    let response;
    
    switch(intent) {
        case 'research_intent':
            response = await research(entities.topic);
            break;
        case 'calendar_intent':
            response = await scheduleEvent(entities.eventName, entities.dateTime);
            break;
        case 'email_intent':
            // Check if we're in an active email conversation
            if (emailState.active || entities.to === 'MISSING' || entities.subject === 'MISSING' || entities.body === 'MISSING') {
                response = await handleEmailIntent(userInput, entities);
            } else {
                // We have all the information, send directly
                response = await sendEmail(entities.to, entities.subject, entities.body);
                
                // Reset the email state just in case
                emailState = {
                    active: false,
                    stage: 'init',
                    data: { to: '', subject: '', body: '' }
                };
            }
            break;
        case 'exit_intent':
            response = 'Peace out!';
            break;
        default:
            try {
                // Create a chat history for Gemini
                const chatHistory = conversationHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));
                
                // Remove the last user message since we'll send it separately
                const lastUserMessage = chatHistory.pop();
                
                // Create a chat session
                const chat = model.startChat({
                    history: chatHistory.length > 0 ? chatHistory : [],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150,
                    }
                });
                
                // Send the user's message
                const result = await chat.sendMessage(lastUserMessage.parts[0].text);
                const assistantReply = result.response.text();
                
                // Add response to history
                conversationHistory.push({ role: 'assistant', content: assistantReply });
                return assistantReply;
            } catch (error) {
                console.error('Chat generation error:', error);
                response = `AI: Couldn't process that: ${error.message}`;
            }
    }
    
    // Add response to history
    conversationHistory.push({ role: 'assistant', content: response });
    return response;
}

module.exports = { processInput, analyzeSentiment };