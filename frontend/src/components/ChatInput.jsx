import { ArrowRight } from 'lucide-react';

const ChatInput = ({ value, onChange, onSubmit, promptsLeft = 3 }) => {
  return (
    <div className="max-w-3xl mx-auto w-full px-4">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="relative"
      >
        <input
          type="text"
          placeholder="Ask something..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 pr-24 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-coral-500"
        />
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">{promptsLeft} prompts left</span>
          <button 
            type="submit"
            className="p-1.5 bg-coral-500 hover:bg-coral-600 text-white rounded-lg"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput; 