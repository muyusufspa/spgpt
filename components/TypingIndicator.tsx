import React from 'react';

export const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1.5 py-1">
    <div className="h-2 w-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 bg-slate-500 rounded-full animate-pulse"></div>
  </div>
);