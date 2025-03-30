import { Plus } from 'lucide-react';

const Sidebar = ({ onNewChat, currentUser, chats }) => {
  return (
    <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* User Profile */}
      <div className="p-3 flex items-center gap-2 border-b border-gray-200">
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full" />
        </div>
        <span className="text-sm text-gray-700">@{currentUser.username}</span>
      </div>

      {/* New Chat Button */}
      <div className="p-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <div className="text-xs font-medium text-gray-500 mb-2">TODAY</div>
          {chats.today?.map((chat) => (
            <div
              key={chat.id}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer truncate"
            >
              {chat.title}
            </div>
          ))}
        </div>

        <div className="px-3 py-2">
          <div className="text-xs font-medium text-gray-500 mb-2">YESTERDAY</div>
          {chats.yesterday?.map((chat) => (
            <div
              key={chat.id}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer truncate"
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-gray-200 p-2">
        <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          Settings
        </button>
        <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          Download for iOS
        </button>
        <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          AI Policy
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 