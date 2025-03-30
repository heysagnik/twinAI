import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Download } from 'lucide-react';

const ChatMessage = ({ message, isUser }) => {
  const [messageType, setMessageType] = useState('text');
  const [parsedContent, setParsedContent] = useState('');

  // Process the message when it arrives
  useEffect(() => {
    if (isUser) {
      // User messages are always text
      setMessageType('text');
      setParsedContent(message);
      return;
    }

    // Check if message is an object with type field
    if (typeof message === 'object' && message.type && message.content) {
      setMessageType(message.type);
      setParsedContent(message.content);
      return;
    }
    
    // If the message is a string or unknown format, try to detect type
    const content = typeof message === 'string' ? message : 
                   (message.content ? message.content : JSON.stringify(message));
    
    // Only detect research content, handle everything else as text
    if (typeof content === 'string') {
      if ((content.includes('Source') || content.includes('Reference')) &&
          (content.includes('Wikipedia') || content.includes('arXiv'))) {
        setMessageType('research');
      } else {
        setMessageType('text');
      }
      
      setParsedContent(content);
    } else {
      setMessageType('text');
      setParsedContent(JSON.stringify(content));
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
          <ReactMarkdown>{typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent)}</ReactMarkdown>
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

  // Regular text content
  const TextContent = () => (
    <div className="prose prose-gray prose-p:text-gray-700 prose-headings:text-gray-800 prose-a:text-orange-600 max-w-none">
      <ReactMarkdown>{typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent)}</ReactMarkdown>
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
                {typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent)}
              </div>
            ) : (
              <>
                {messageType === 'research' && <ResearchContent />}
                {messageType !== 'research' && <TextContent />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;