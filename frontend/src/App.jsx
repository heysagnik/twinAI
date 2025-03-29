import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, Plus, Search, ChevronDown } from "lucide-react";

export default function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/chats");
      setChats(res.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
  
    const newChat = { userMessage: message, llmResponse: "..." };
    setChats((prevChats) => [...prevChats, newChat]);
  
    try {
      const res = await axios.post("http://localhost:5000/chat", { message });
  
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
    } finally {
      setLoading(false);
      setMessage("");
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Main content area that takes up the whole screen */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl px-4">
            <h1 className="text-4xl font-semibold mb-20 text-center">What do you want to know?</h1>
            <div className="w-full">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="bg-[#1a1a1a] rounded-xl border border-gray-700 p-1 flex items-center w-full"
              >
                
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none px-2 py-2 text-white placeholder-gray-500"
                />
                <div className="flex items-center gap-1 px-2">
                  
                  
                  <button 
                    type="submit" 
                    disabled={loading || !message.trim()}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2a2a2a] hover:bg-gray-700 transition-colors"
                  >
                    <Send size={16} className="text-gray-300" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          // Chat history and input when there are messages
          <div className="flex flex-col w-full h-full">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {chats.map((chat, index) => (
                  <div key={index} className="space-y-6">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-600 px-4 py-2 rounded-lg max-w-md">
                        {chat.userMessage}
                      </div>
                    </div>
                    
                    {/* AI Response */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        AI
                      </div>
                      <div className={`text-gray-200 max-w-md ${
                        chat.llmResponse === "..." ? "animate-pulse" : ""
                        }`}>
                        {chat.llmResponse}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Input area when there are messages */}
            <div className="border-t border-gray-800 p-4">
              <div className="max-w-2xl mx-auto">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="bg-[#1a1a1a] rounded-xl border border-gray-700 p-1 flex items-center w-full"
                >
                  <div className="flex items-center px-2">
                  </div>
                  <input
                    type="text"
                    placeholder="Ask anything..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none px-2 py-2 text-white placeholder-gray-500"
                  />
                  <div className="flex items-center gap-1 px-2">
                    
                    <button 
                      type="submit" 
                      disabled={loading || !message.trim()}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2a2a2a] hover:bg-gray-700 transition-colors"
                    >
                      <Send size={16} className="text-gray-300" />
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