import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";
import BlankPage from "./components/BlankPage";
import AuthPage from "./AuthPage";

export default function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingPrompt, setTypingPrompt] = useState("");
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated initially
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/auth/status', {
        credentials: 'include' // include cookies
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  // Mock chats data
  const mockChats = {
    today: [
      { id: 1, title: "How do I design interface for my startup?" }
    ],
    yesterday: [
      { id: 2, title: "What is design?" },
      { id: 3, title: "How is visual hierarchy achieved?" },
      { id: 4, title: "FAANG design practices" },
      { id: 5, title: "Quantitative Research Types" }
    ]
  };

  // Handle feature card selection from BlankPage
  const handleSelectPrompt = (prompt) => {
    setTypingPrompt(prompt);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    // Check if message needs Google integration
    if (
      message.toLowerCase().includes("schedule") || 
      message.toLowerCase().includes("email") || 
      message.toLowerCase().includes("calendar")
    ) {
      if (!isAuthenticated) {
        // Show auth page if trying to use Google features without authentication
        setShowAuthPage(true);
        return;
      }
    }

    // Add user message to chat
    const userMessage = { message, isUser: true };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // include cookies
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, {
        message: data.response,
        isUser: false
      }]);
    } catch (error) {
      console.error('Error:', error);
      // Handle error appropriately
      setChatHistory(prev => [...prev, {
        message: "Sorry, there was an error processing your request. Please try again.",
        isUser: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthComplete = (authenticated) => {
    setIsAuthenticated(authenticated);
    setShowAuthPage(false);
  };

  if (showAuthPage) {
    return <AuthPage onAuthComplete={handleAuthComplete} />;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        currentUser={{
          username: "raghav",
          avatar: null
        }}
        chats={mockChats}
        onNewChat={() => setChatHistory([])}
        onConnectGoogle={() => setShowAuthPage(true)}
        isAuthenticated={isAuthenticated}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header 
          model="Open AI GPT-4.0"
          onShare={() => {}}
          onReport={() => {}}
          isAuthenticated={isAuthenticated}
          onConnectGoogle={() => setShowAuthPage(true)}
        />

        <main className="flex-1 overflow-y-auto bg-white">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="max-w-3xl w-full px-4">
                  <BlankPage 
                    onSelectPrompt={handleSelectPrompt}
                    isAuthenticated={isAuthenticated}
                    onConnectGoogle={() => setShowAuthPage(true)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="pb-20">
              {chatHistory.map((chat, index) => (
                <ChatMessage
                  key={index}
                  message={chat.message}
                  isUser={chat.isUser}
                />
              ))}
              {loading && (
                <div className="py-8 bg-gray-50">
                  <div className="max-w-3xl mx-auto px-4">
                    <div className="animate-pulse flex gap-4">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <div className="fixed bottom-0 left-[260px] right-0 bg-white border-t border-gray-100">
          <ChatInput
            value={message}
            onChange={setMessage}
            onSubmit={handleSubmit}
            typingPrompt={typingPrompt}
          />
        </div>
      </div>
    </div>
  );
}
