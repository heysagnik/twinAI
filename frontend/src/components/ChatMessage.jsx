import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Mail, FileText, Calendar, BookOpen, Download } from 'lucide-react';

const ChatMessage = ({ message, isUser }) => {
  const [messageType, setMessageType] = useState('text');
  const [parsedContent, setParsedContent] = useState(message);

  // Detect message type and parse its content
  useEffect(() => {
    if (!isUser && typeof message === 'string') {
      // Detect research content
      if (
        (message.includes('Source') || message.includes('Reference')) &&
        (message.includes('Wikipedia') || message.includes('arXiv'))
      ) {
        setMessageType('research');
      }
      // Detect email draft
      else if (
        message.includes('Subject:') && 
        (message.includes('To:') || message.includes('From:'))
      ) {
        setMessageType('email');
        
        // Parse email parts
        const emailParts = {};
        
        const toMatch = message.match(/To:\s*([^\n]+)/);
        const subjectMatch = message.match(/Subject:\s*([^\n]+)/);
        const bodyMatch = message.match(/(?:Body:|Message:)([\s\S]+?)(?:Regards|Sincerely|Best|$)/i);
        
        if (toMatch) emailParts.to = toMatch[1].trim();
        if (subjectMatch) emailParts.subject = subjectMatch[1].trim();
        if (bodyMatch) emailParts.body = bodyMatch[1].trim();
        
        setParsedContent(emailParts);
      }
      // Detect calendar event
      else if (
        message.includes('scheduled') && 
        (message.includes('calendar') || message.includes('event'))
      ) {
        setMessageType('calendar');
      }
      else {
        setMessageType('text');
      }
    }
  }, [message, isUser]);

  // Research paper styled content
  const ResearchContent = () => (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center">
        <BookOpen size={18} className="text-orange-500 mr-2" />
        <h3 className="font-medium text-gray-800">Research Findings</h3>
      </div>
      <div className="p-4">
        <div className="prose prose-gray prose-headings:text-gray-800 prose-a:text-orange-600 max-w-none">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button className="flex items-center text-xs text-gray-500 hover:text-orange-600 transition-colors">
            <Download size={14} className="mr-1" />
            Save as PDF
          </button>
        </div>
      </div>
    </div>
  );

  // Email draft styled content
  const EmailContent = () => (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center">
        <Mail size={18} className="text-orange-500 mr-2" />
        <h3 className="font-medium text-gray-800">Email Draft</h3>
      </div>
      <div className="p-4 space-y-4">
        {parsedContent.to && (
          <div className="flex">
            <span className="text-sm font-medium text-gray-500 w-20">To:</span>
            <span className="text-sm text-gray-800">{parsedContent.to}</span>
          </div>
        )}
        {parsedContent.subject && (
          <div className="flex">
            <span className="text-sm font-medium text-gray-500 w-20">Subject:</span>
            <span className="text-sm text-gray-800 font-medium">{parsedContent.subject}</span>
          </div>
        )}
        {parsedContent.body && (
          <>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-sm text-gray-800 whitespace-pre-line">{parsedContent.body}</div>
            </div>
          </>
        )}
        <div className="pt-2 flex justify-end space-x-2">
          <button className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
            Edit Draft
          </button>
          <button className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors">
            Send Email
          </button>
        </div>
      </div>
    </div>
  );

  // Calendar event styled content
  const CalendarContent = () => (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center">
        <Calendar size={18} className="text-orange-500 mr-2" />
        <h3 className="font-medium text-gray-800">Calendar Event</h3>
      </div>
      <div className="p-4">
        <div className="prose prose-gray max-w-none">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end space-x-2">
          <button className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
            View in Calendar
          </button>
        </div>
      </div>
    </div>
  );

  // Regular text content
  const TextContent = () => (
    <div className="prose prose-gray prose-p:text-gray-700 prose-headings:text-gray-800 prose-a:text-orange-600 max-w-none">
      <ReactMarkdown>{message}</ReactMarkdown>
    </div>
  );

  return (
    <div className={`py-8 ${isUser ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {isUser ? (
              <span className="text-sm text-gray-500">U</span>
            ) : (
              <span className="text-sm text-orange-500">AI</span>
            )}
          </div>
          
          {/* Message Content based on type */}
          <div className="flex-1">
            {isUser ? (
              <div className="prose prose-gray max-w-none">
                {message}
              </div>
            ) : (
              <>
                {messageType === 'research' && <ResearchContent />}
                {messageType === 'email' && <EmailContent />}
                {messageType === 'calendar' && <CalendarContent />}
                {messageType === 'text' && <TextContent />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;