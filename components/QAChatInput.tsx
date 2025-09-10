import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';

interface QAChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export const QAChatInput: React.FC<QAChatInputProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Corresponds to approx. 4 rows
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit();
  }

  return (
    <form onSubmit={handleFormSubmit} className="flex items-end space-x-2 sm:space-x-3 bg-white/20 backdrop-blur-lg p-2 rounded-full border border-white/30">
      <textarea
        id="qa-chat-input"
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "AI is thinking..." : "Ask me anything…"}
        disabled={disabled}
        className="flex-grow bg-transparent border-none rounded-lg py-2.5 px-4 text-slate-800 placeholder-slate-500 focus:ring-0 focus:outline-none resize-none custom-scrollbar"
        style={{ maxHeight: '120px' }}
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="flex-shrink-0 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-full p-3 w-11 h-11 flex items-center justify-center hover:from-sky-500 hover:to-blue-600 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white/5"
        aria-label="Send message"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
};