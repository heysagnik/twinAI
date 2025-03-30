import { Plus, LogOut, Settings, ChevronDown, MessageSquare, MessageCircle, HashIcon } from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ currentUser, chats, onNewChat, onConnectGoogle, isAuthenticated }) => {
  const [todayExpanded, setTodayExpanded] = useState(true);
  const [yesterdayExpanded, setYesterdayExpanded] = useState(true);
  
  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      // Call the logout endpoint
      const response = await fetch('http://localhost:3000/auth/logout', {
        method: 'GET',
        credentials: 'include', // Important to include cookies
      });
      
      if (response.ok) {
        // Reload the page after logout
        window.location.reload();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div 
      className="w-[260px] bg-white border-r border-gray-100 flex flex-col h-screen"
      style={{ 
        userSelect: 'none',
        WebkitUserDrag: 'none',
        userDrag: 'none',
        touchAction: 'none'
      }}
    >
      {/* User Profile */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-50 to-white border border-orange-100 shadow-sm flex items-center justify-center overflow-hidden">
          {currentUser?.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-full h-full object-cover" 
              draggable="false"
            />
          ) : (
            <span className="text-sm font-medium text-orange-500">{currentUser?.name?.charAt(0) || currentUser?.username?.charAt(0)}</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">@{currentUser?.username || 'user'}</span>
          {isAuthenticated && (
            <span className="text-xs text-green-600 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
              Connected
            </span>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
          draggable="false"
        >
          <Plus size={18} className="text-white" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2">
        {/* Today's Chats */}
        <div className="rounded-lg overflow-hidden">
          <button 
            onClick={() => setTodayExpanded(!todayExpanded)} 
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-500"
          >
            <span>TODAY</span>
            <ChevronDown 
              size={14} 
              className={`transition-transform duration-200 ${todayExpanded ? 'transform rotate-180' : ''}`}
            />
          </button>
          
          {todayExpanded && (
            <div className="mt-1 space-y-0.5">
              {chats?.today?.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer text-left transition-colors"
                  draggable="false"
                >
                  <HashIcon size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Yesterday's Chats */}
        <div className="rounded-lg overflow-hidden">
          <button 
            onClick={() => setYesterdayExpanded(!yesterdayExpanded)} 
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-500"
          >
            <span>YESTERDAY</span>
            <ChevronDown 
              size={14} 
              className={`transition-transform duration-200 ${yesterdayExpanded ? 'transform rotate-180' : ''}`}
            />
          </button>
          
          {yesterdayExpanded && (
            <div className="mt-1 space-y-0.5">
              {chats?.yesterday?.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer text-left transition-colors"
                  draggable="false"
                >
                  <HashIcon size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings and Sign Out */}
      <div className="border-t border-gray-100 p-3 space-y-2">
        {!isAuthenticated && (
          <button 
            onClick={onConnectGoogle}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 border border-orange-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5 active:translate-y-0"
            draggable="false"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M20.64 12.2c0-.63-.06-1.25-.16-1.84H12v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.63z" fill="#4285F4"/>
              <path d="M12 21a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26a5.4 5.4 0 0 1-8.09-2.85h-3v2.33A9 9 0 0 0 12 21z" fill="#34A853"/>
              <path d="M6.96 13.71a5.41 5.41 0 0 1 0-3.42V7.96h-3a9 9 0 0 0 0 8.08l3-2.33z" fill="#FBBC05"/>
              <path d="M12 6.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 3.96 7.95l3 2.34A5.36 5.36 0 0 1 12 6.58z" fill="#EA4335"/>
            </svg>
            <span>Connect Google</span>
          </button>
        )}
        
        <button 
          onClick={() => {}} // Settings action
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200"
          draggable="false"
        >
          <Settings size={16} className="text-gray-500" />
          <span>Settings</span>
        </button>
        
        {/* Sign Out Button with 3D effect */}
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-1 text-sm font-medium text-red-600 hover:text-red-700 bg-gradient-to-b from-white to-red-50 hover:from-red-50 hover:to-red-100 active:from-red-100 active:to-red-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-red-200 transform hover:-translate-y-0.5 active:translate-y-0"
          draggable="false"
        >
          <LogOut size={16} className="text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Apply global styles to ensure no draggable elements */}
      <style jsx>{`
        * {
          -webkit-user-drag: none;
          user-drag: none;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;