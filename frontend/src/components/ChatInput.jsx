import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Mic } from 'lucide-react';

const ChatInput = ({ value, onChange, onSubmit, typingPrompt }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const textareaRef = useRef(null);

  // Focus at the end of input when typing completes
  useEffect(() => {
    if (!isTyping && textareaRef.current && value) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(value.length, value.length);
    }
  }, [isTyping, value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Animation effect for typing the prompt
  useEffect(() => {
    if (!typingPrompt) return;
    
    // Reset and start new typing animation
    setIsTyping(true);
    setTypingIndex(0);
    onChange(""); // Clear existing input

    // Focus the input
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    
    const interval = setInterval(() => {
      setTypingIndex(prevIndex => {
        if (prevIndex >= typingPrompt.length) {
          setIsTyping(false);
          clearInterval(interval);
          return prevIndex;
        }
        
        // Update the input value with the next character
        onChange(typingPrompt.substring(0, prevIndex + 1));
        return prevIndex + 1;
      });
    }, 25); // Speed of typing animation
    
    return () => clearInterval(interval);
  }, [typingPrompt, onChange]);

  return (
    <div className="max-w-3xl mx-auto w-full px-2 sm:px-4 pb-4">
      {isRecording && (
        <div className="mb-2 p-2 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
          <span>Recording... Speak now</span>
        </div>
      )}

      {/* Input form with scrollable textarea */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="relative"
      >
        <textarea
          ref={textareaRef}
          placeholder="Ask anything or type / for commands..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full bg-white border border-gray-200 shadow-sm rounded-xl py-3 px-4 pr-20 sm:pr-24 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-colors resize-none overflow-y-auto min-h-[80px] h-[80px] ${isTyping ? 'caret-orange-500 animate-cursor-blink' : ''}`}
          readOnly={isTyping} // Prevent user input during typing animation
          rows="3"
        />
        
        {/* Controls positioned at bottom right */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg p-1">
          {/* Voice input button */}
          <button 
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`p-1.5 rounded-lg transition-colors ${
              isRecording 
                ? "bg-red-100 text-red-600" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Voice input"
            title="Voice input"
          >
            <Mic size={16} />
          </button>
          
          <div className="w-px h-5 bg-gray-200 mx-0.5"></div>
          
          {/* Submit button */}
          <button 
            type="submit"
            className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm"
            aria-label="Send message"
            disabled={isTyping || value.trim() === ''} // Disable during typing animation or when empty
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </form>

      {/* Custom styles for cursor blink animation */}
      <style jsx>{`
        @keyframes cursor-blink {
          0%, 100% { caret-color: transparent; }
          50% { caret-color: #f97316; }
        }
        
        .animate-cursor-blink {
          animation: cursor-blink 0.8s infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatInput;