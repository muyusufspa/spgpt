

import React, { useEffect, useRef, useState } from 'react';
import type { AppStatus, ChatMessage } from '../types';
import { ChatBubble } from './ChatBubble';
import { QAChatInput } from './QAChatInput';

interface QAChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  status: AppStatus;
}

const FlightPathBackground = () => (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-[0.07]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="flight-paths" patternUnits="userSpaceOnUse" width="400" height="400" patternTransform="scale(1) rotate(0)">
                    <path d="M-100 150 Q 150 100 400 200 T 700 100" stroke="#0ea5e9" strokeWidth="1" fill="none" strokeDasharray="4 7" />
                    <path d="M-50 350 Q 200 400 450 300 T 800 350" stroke="#0ea5e9" strokeWidth="0.5" fill="none" strokeDasharray="4 7" />
                    <path d="M20 400 Q 150 300 250 320 T 450 250" stroke="#3b82f6" strokeWidth="0.5" fill="none" strokeDasharray="3 6" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#flight-paths)" />
        </svg>
    </div>
);


export const QAChatWindow: React.FC<QAChatWindowProps> = ({ messages, onSendMessage, status }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
        setShowJumpToBottom(false);
    }
  }, [messages]);

  const handleScroll = () => {
    const node = scrollRef.current;
    if (node) {
        const { scrollTop, scrollHeight, clientHeight } = node;
        const atBottom = scrollHeight - scrollTop - clientHeight <= 120;
        isAtBottomRef.current = atBottom;
        setShowJumpToBottom(!atBottom && (scrollHeight - scrollTop - clientHeight > 300));
    }
  };

  const jumpToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="h-full flex flex-col">
        {/* The inner container has the glass effect and manages the chat layout */}
        <div className="glass-card rounded-2xl flex flex-col h-full overflow-hidden relative">
            <FlightPathBackground />
            <div 
                ref={scrollRef} 
                onScroll={handleScroll}
                className="relative z-10 flex-grow min-h-0 p-4 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar overscroll-y-contain"
                aria-live="polite"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {messages.map((msg, index) => (
                <ChatBubble key={index} message={msg} />
                ))}
            </div>
            {showJumpToBottom && (
                <button 
                    onClick={jumpToBottom}
                    className="absolute bottom-28 right-6 bg-sky-500/80 backdrop-blur-sm text-white rounded-full p-3 shadow-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-100 transition-all duration-300 animate-fade-in"
                    aria-label="Jump to latest messages"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                    </svg>
                </button>
            )}
            <div className="relative z-10 flex-shrink-0 px-2 pt-2 sm:px-4 sm:pt-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-white/30">
                <QAChatInput 
                    onSendMessage={onSendMessage} 
                    disabled={status === 'processing'}
                />
            </div>
        </div>
    </div>
  );
};