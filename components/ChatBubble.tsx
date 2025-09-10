import React from 'react';
import type { ChatMessage, InvoiceData } from '../types';
import { Spinner } from './Spinner';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TypingIndicator } from './TypingIndicator';

// Declare the 'marked' library which is loaded from a CDN in index.html
declare var marked: { parse: (markdown: string) => string };

const CodeBracketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 15" />
    </svg>
);


interface ChatBubbleProps {
  message: ChatMessage;
}

const ApiResponse: React.FC<{ response: { success: boolean; body: any } }> = ({ response }) => {
    const { success, body } = response;
    return (
        <div className={`mt-4 p-4 border ${success ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-rose-500/50 bg-rose-500/10'} rounded-lg text-sm`}>
            <div className={`flex items-center font-bold ${success ? 'text-emerald-700' : 'text-rose-700'} mb-2`}>
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {success ? 'API Request Successful' : 'API Request Failed'}
            </div>
            <details className="text-xs mt-3">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-800">View Full Response</summary>
                <pre className={`${success ? 'bg-emerald-500/10' : 'bg-rose-500/10'} text-slate-600 p-2 rounded-md mt-1 max-h-40 overflow-auto custom-scrollbar`}>
                    {JSON.stringify(body, null, 2)}
                </pre>
            </details>
        </div>
    );
}

const ApiRequestPayload: React.FC<{ payload: any }> = ({ payload }) => {
    return (
        <div className="mt-4 p-4 border border-sky-500/50 bg-sky-500/10 rounded-lg text-sm">
            <div className="flex items-center font-bold text-sky-700 mb-2">
                <CodeBracketIcon className="w-5 h-5 mr-2" />
                API Request Payload
            </div>
            <details className="text-xs mt-3" open>
                <summary className="cursor-pointer text-slate-500 hover:text-slate-800">View/Hide Full Payload</summary>
                <pre className="bg-sky-500/10 text-slate-600 p-2 rounded-md mt-1 max-h-60 overflow-auto custom-scrollbar">
                    {JSON.stringify(payload, null, 2)}
                </pre>
            </details>
        </div>
    );
}


const sanitizedContent = (content: string) => {
    // Basic sanitization for user content to prevent XSS
    const escaped = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    return escaped.replace(/\n/g, '<br />');
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const alignmentClass = isUser ? 'justify-end' : 'justify-start';

  const bubbleClasses = isUser
    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-md'
    : 'bg-white/90 text-slate-800 rounded-xl shadow-md';
    
  const animationClass = isUser ? 'animate-slide-in-right' : 'animate-slide-in-left';

  const getRenderedContent = () => {
    if (isUser) {
        return sanitizedContent(message.content);
    }
    // For AI, parse markdown if the 'marked' library is available
    if (typeof marked !== 'undefined') {
        return marked.parse(message.content);
    }
    // Fallback for AI if marked is not loaded
    return sanitizedContent(message.content);
  }

  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${alignmentClass} ${animationClass}`}>
      <div className={`max-w-[90%] sm:max-w-[70%] px-4 py-3 ${bubbleClasses}`}>
        {message.isLoading ? (
          <TypingIndicator />
        ) : (
          <div
            className="ai-prose"
            dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
          />
        )}
        {message.showRequestPayload && <ApiRequestPayload payload={message.showRequestPayload} />}
        {message.apiResponse && <ApiResponse response={message.apiResponse} />}
        {message.isAgenticLink && (
            <a href="https://stagefin.spaero.sa/web#action=960" target="_blank" rel="noopener noreferrer" 
               className="mt-3 inline-block bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                Open AI Agentic Portal
            </a>
        )}
         <div className={`mt-2 text-right text-xs ${isUser ? 'text-blue-200/80' : 'text-slate-400/80'}`}>
            {timestamp}
        </div>
      </div>
    </div>
  );
};