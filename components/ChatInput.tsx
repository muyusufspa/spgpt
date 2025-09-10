import React, { useState } from 'react';
import { SendIcon } from './icons/SendIcon';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder: string;
  commands?: string[];
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, placeholder, commands = [] }) => {
  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value && commands.length > 0) {
      const foundCommand = commands.find(cmd => cmd.startsWith(value.toLowerCase()) && cmd !== value);
      setSuggestion(foundCommand || '');
    } else {
      setSuggestion('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion && input) {
        // Accept suggestion only if cursor is at the end of the input
        if (e.currentTarget.selectionStart === input.length) {
            e.preventDefault();
            setInput(suggestion);
            setSuggestion('');
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput('');
      setSuggestion('');
    }
  };

  const showSuggestion = suggestion && input && suggestion.startsWith(input);

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <div className="relative flex-grow">
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Processing..." : placeholder}
          disabled={disabled}
          className="relative z-10 w-full bg-white/50 border border-slate-300 rounded-lg py-2.5 px-4 text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-200"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {showSuggestion && (
            <div className="absolute inset-y-0 left-0 z-0 flex items-center px-4 pointer-events-none">
                <span className="invisible">{input}</span>
                <span className="text-slate-400">{suggestion.substring(input.length)}</span>
            </div>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg p-2.5 hover:from-sky-500 hover:to-blue-600 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white/5"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
};