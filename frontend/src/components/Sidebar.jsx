import { Plus, LogOut } from 'lucide-react';

const Sidebar = ({ currentUser, chats, onNewChat }) => {
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
        userSelect: 'none',       // Prevents text selection
        WebkitUserDrag: 'none',   // Prevents dragging in webkit browsers
        userDrag: 'none',         // Prevents dragging in other browsers
        touchAction: 'none'       // Prevents touch dragging
      }}
    >
      {/* User Profile */}
      <div className="p-3 flex items-center gap-2 border-b border-gray-100">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
          {currentUser?.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-full h-full object-cover" 
              draggable="false" // Prevents image from being draggable
            />
          ) : (
            <span className="text-sm text-gray-500">{currentUser?.name?.charAt(0) || currentUser?.username?.charAt(0)}</span>
          )}
        </div>
        <span className="text-sm text-gray-700">@{currentUser?.username || 'user'}</span>
      </div>

      {/* New Chat Button */}
      <div className="p-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-all duration-200 shadow-sm"
          draggable="false"
        >
          <Plus size={16} className="text-gray-500" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <div className="text-xs font-medium text-gray-400 mb-2">TODAY</div>
          {chats?.today?.map((chat) => (
            <div
              key={chat.id}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer truncate"
              draggable="false"
            >
              {chat.title}
            </div>
          ))}
        </div>

        <div className="px-3 py-2">
          <div className="text-xs font-medium text-gray-400 mb-2">YESTERDAY</div>
          {chats?.yesterday?.map((chat) => (
            <div
              key={chat.id}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer truncate"
              draggable="false"
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-gray-100 p-2">
        {/* Sign Out Button */}
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 text-sm font-medium text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 border border-red-200"
          draggable="false"
        >
          <LogOut size={16} />
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