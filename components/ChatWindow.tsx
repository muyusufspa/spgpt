
import React, { useEffect, useRef, useState } from 'react';
import type { AppStatus, ChatMessage, InvoiceData } from '../types';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { InvoiceDisplay } from './InvoiceDisplay';
import { ConfirmationButtons } from './ConfirmationButtons';
import { AirportSelector } from './AirportSelector';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onConfirmRsaf: (confirmed: boolean) => void;
  onSaveRoutingDetails: (details: any) => void;
  status: AppStatus;
  invoiceData: InvoiceData | null;
  placeholder: string;
  conversationStage: 'idle' | 'awaiting_vendor_name' | 'awaiting_rsaf_confirmation' | 'awaiting_fsr_id' | 'awaiting_routing_details';
}

const INVOICE_COMMANDS = ['extract invoice details', 'post', 'ai agentic'];

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, onConfirmRsaf, onSaveRoutingDetails, status, invoiceData, placeholder, conversationStage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setShowJumpToBottom(false);
    }
  }, [messages, invoiceData]);

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

  // Conditional rendering for the input area
  const renderInputComponent = () => {
    switch(conversationStage) {
        case 'awaiting_rsaf_confirmation':
            return <ConfirmationButtons onConfirm={onConfirmRsaf} disabled={status === 'processing'} />;
        case 'awaiting_routing_details':
            return <div className="text-center text-sm text-slate-500 p-2 h-[54px] flex items-center justify-center">Please complete the airport selection above.</div>;
        default:
            return <ChatInput onSendMessage={onSendMessage} disabled={status === 'processing'} placeholder={placeholder} commands={INVOICE_COMMANDS} />;
    }
  }

  return (
    <div className="glass-card rounded-2xl flex flex-col h-full relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-grow min-h-0 p-6 space-y-6 overflow-y-auto custom-scrollbar overscroll-y-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {messages.map((msg, index) => {
          const shouldDisplayInvoice = !!(invoiceData && msg.showInvoice);
          const shouldDisplayAirportSelector = !!msg.showAirportSelector;
          return (
             <React.Fragment key={index}>
              <ChatBubble message={msg} />
              {shouldDisplayInvoice && (
                <div className="animate-fade-in">
                  <InvoiceDisplay data={invoiceData} />
                </div>
              )}
              {shouldDisplayAirportSelector && (
                <div className="animate-fade-in">
                    <AirportSelector onSave={onSaveRoutingDetails} />
                </div>
              )}
            </React.Fragment>
          );
        })}
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
      <div className="flex-shrink-0 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-white/30">
        {status === 'processing' && (
            <div className="flex items-center justify-center space-x-2 mb-3 animate-fade-in" aria-live="polite" aria-busy="true">
                <span className="text-sm text-slate-600">AI is thinking</span>
                <div className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-pulse"></div>
            </div>
        )}
        {renderInputComponent()}
      </div>
    </div>
  );
};
