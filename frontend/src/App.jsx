import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ArrowUp, Plus, Search, ChevronDown, RefreshCw, Copy, Home, Globe, Layers, BookOpen, Mic, Mic2 } from "lucide-react";

export default function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newChat, setNewChat] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Initialize or retrieve sessionId
    const storedSessionId = localStorage.getItem("twinAI_sessionId");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("twinAI_sessionId", newSessionId);
      setSessionId(newSessionId);
    }
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Load conversation history when sessionId is available
    if (sessionId) {
      fetchConversationHistory();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversationHistory = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/history/${sessionId}?limit=50`);
      
      if (response.data.history && response.data.history.length > 0) {
        // Convert MongoDB message format to the app's chat format
        const formattedChats = [];
        
        // Group messages into user-assistant pairs
        let currentUserMessage = null;
        
        // Process messages in reverse to get chronological order (oldest first)
        const sortedMessages = [...response.data.history].sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        for (const message of sortedMessages) {
          if (message.role === "user") {
            currentUserMessage = message.content;
          } else if (message.role === "assistant" && currentUserMessage) {
            formattedChats.push({
              userMessage: currentUserMessage,
              llmResponse: message.content
            });
            currentUserMessage = null;
          }
        }
        
        // If there's a hanging user message without a response
        if (currentUserMessage) {
          formattedChats.push({
            userMessage: currentUserMessage,
            llmResponse: "..."
          });
        }
        
        setChats(formattedChats);
      }
    } catch (error) {
      console.error("Error fetching conversation history:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    // Generate a new session ID for a new chat
    const newSessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("twinAI_sessionId", newSessionId);
    setSessionId(newSessionId);
    setChats([]);
    setNewChat(true);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
  
    const newUserMessage = { userMessage: message, llmResponse: "..." };
    setChats((prevChats) => [...prevChats, newUserMessage]);
  
    try {
      const res = await axios.post("http://localhost:3000/chat", { 
        message, 
        sessionId 
      });
  
      // Replace placeholder with actual response
      setChats((prevChats) =>
        prevChats.map((chat, index) =>
          index === prevChats.length - 1
            ? { ...chat, llmResponse: res.data.response }
            : chat
        )
      );
    } catch (error) {
      console.error("Error:", error);
      // Update UI to show error
      setChats((prevChats) =>
        prevChats.map((chat, index) =>
          index === prevChats.length - 1
            ? { ...chat, llmResponse: "Sorry, there was an error processing your message." }
            : chat
        )
      );
    } finally {
      setLoading(false);
      setMessage("");
      setNewChat(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const clearConversation = () => {
    startNewChat();
  };
  
  return (
    <div className="flex flex-col min-h-screen h-full bg-black text-white">
      {/* Top bar with avatar */}
      <div className="fixed top-0 right-0 p-4 z-50">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <span className="text-sm">U</span>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-black border border-gray-800 rounded-lg shadow-lg py-1">
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-sm font-medium">User</p>
                <p className="text-xs text-gray-400 truncate">{sessionId}</p>
              </div>
              <button 
                onClick={startNewChat}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]"
              >
                New Chat
              </button>
              <button 
                onClick={clearConversation}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]"
              >
                Clear Conversation
              </button>
              <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]">Help</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]">Sign out</a>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-black">
        {chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 pb-32">
            <h1 className="text-4xl font-semibold mb-8">What do you want to know?</h1>
            <div className="w-full max-w-2xl">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-black rounded-full py-4 px-6 pr-32 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
                />
                <div className="absolute right-2 top-2 flex items-center gap-2">
                  <button 
                    type="button"
                    className="p-2 hover:bg-[#2a2a2a] rounded-lg"
                  >
                    <Mic size={20} className="text-gray-400" />
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading || !message.trim()}
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-sm p-3 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col pt-16 pb-32"> {/* Added padding-bottom for floating input */}
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto py-8 px-4">
                {chats.map((chat, index) => (
                  <div key={index} className="mb-8">
                    {/* User Message */}
                    <div className="mb-6 flex justify-end">
                      <div className="bg-gradient-to-r from-[#0a84ff] to-[#4293ff] px-5 py-3 rounded-2xl rounded-tr-md max-w-[80%] shadow-sm">
                        <p className="text-white text-[15px] leading-snug">{chat.userMessage}</p>
                      </div>
                    </div>
                    
                    {/* AI Response */}
                    <div className="flex">
                      <div className="bg-[#262626] px-5 py-3 rounded-2xl rounded-tl-md max-w-[80%] shadow-sm border border-[#333333]">
                        <div className={`text-[15px] leading-snug ${chat.llmResponse === "..." ? "animate-pulse" : ""}`}>
                          {chat.llmResponse}
                        </div>
                        
                        {/* Response actions */}
                        {chat.llmResponse !== "..." && (
                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                            <button 
                              onClick={() => copyToClipboard(chat.llmResponse)}
                              className="hover:text-gray-200 flex items-center gap-1.5 transition-colors"
                            >
                              <Copy size={14} />
                              Copy
                            </button>
                            <button className="hover:text-gray-200 flex items-center gap-1.5 transition-colors">
                              <RefreshCw size={14} />
                              Regenerate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Floating input area at the bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 z-10 bg-black border-t border-gray-800">
              <div className="max-w-3xl mx-auto">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Ask a follow-up question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-black rounded-full py-4 px-6 pr-32 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600 shadow-lg"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    <button 
                      type="button"
                      className="p-2 hover:bg-[#2a2a2a] rounded-full"
                    >
                      <Mic size={20} className="text-gray-400" />
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !message.trim()}
                      className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-sm p-3 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ArrowUp size={16} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}