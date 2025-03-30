import { ChevronDown, Share } from 'lucide-react';

const Header = ({ model = "Open AI GPT-4.0", onShare, onReport }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          {model}
          <ChevronDown size={16} />
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onReport}
          className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Report
        </button>
        <button 
          onClick={onShare}
          className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-coral-500 hover:bg-coral-600 rounded-md"
        >
          <Share size={16} />
          Share
        </button>
      </div>
    </div>
  );
};

export default Header; 