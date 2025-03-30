import { Menu, Share2 } from 'lucide-react';

const Header = ({ 
  onShare, 
  onMenuClick,
  isBlankPage = false
}) => {
  return (
    <header className="border-b border-gray-100 py-3 px-4 bg-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {/* Mobile menu toggle - keeping this for mobile navigation */}
          <button 
            onClick={onMenuClick}
            className="mr-4 p-1.5 rounded-lg hover:bg-gray-100 md:hidden"
          >
            <Menu size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="flex items-center">
          {/* Only show Share button when not on blank page */}
          {!isBlankPage && (
            <button 
              onClick={onShare}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Share"
              title="Share conversation"
            >
              <Share2 size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;