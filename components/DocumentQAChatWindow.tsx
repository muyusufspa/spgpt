

import React, { useEffect, useRef, useState } from 'react';
import type { AppStatus, ChatMessage } from '../types';
import { ChatBubble } from './ChatBubble';
import { QAChatInput } from './QAChatInput';
import { FileUploader } from './FileUploader';

interface DocumentQAChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  status: AppStatus;
  docQAFile: File | null;
  onDocFileUpload: (file: File | null) => void;
}

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.txt,.csv,.xls,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv";

export const DocumentQAChatWindow: React.FC<DocumentQAChatWindowProps> = ({ messages, onSendMessage, status, docQAFile, onDocFileUpload }) => {
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

  const isProcessing = status === 'processing';
  const isReady = !!docQAFile;
  
  const placeholder = isReady ? "Ask a question about the document..." : "Please upload a document first";

  return (
    <div className="h-full flex flex-col">
        <div className="glass-card rounded-2xl flex flex-col h-full overflow-hidden relative">
            <div className="flex-shrink-0 p-4 border-b border-slate-300/70">
                <FileUploader 
                    onFileSelect={onDocFileUpload} 
                    currentFile={docQAFile} 
                    disabled={isProcessing} 
                    accept={ACCEPTED_FILE_TYPES}
                    buttonId="doc-qa-file-upload-button"
                />
            </div>
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-grow min-h-0 p-6 space-y-6 overflow-y-auto custom-scrollbar overscroll-y-contain" 
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
            <div className="flex-shrink-0 px-2 pt-2 sm:px-4 sm:pt-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-white/30">
                <QAChatInput 
                    onSendMessage={onSendMessage} 
                    disabled={isProcessing || !isReady} 
                />
            </div>
        </div>
    </div>
  );
};