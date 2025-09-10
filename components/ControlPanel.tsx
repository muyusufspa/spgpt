import React from 'react';
import type { AppStatus, InvoiceData } from '../types';
import { FileUploader } from './FileUploader';

interface ControlPanelProps {
  uploadedFile: File | null;
  onFileUpload: (file: File | null) => void;
  status: AppStatus;
  onClearSession: () => void;
  onViewHistory: () => void;
  onSendCommand: (command: string) => void;
  invoiceData: InvoiceData | null;
}

// --- Aviation-themed Icons ---
const RadarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.136 12.006a8.25 8.25 0 0 1 13.728 0M12 18.75l-.364.364a.75.75 0 0 1-1.06 0l-.364-.364m1.788 0a.75.75 0 0 0-1.06 0l-.364.364m3.536 0l-.364.364a.75.75 0 0 1-1.06 0l-.364-.364m0 0a.75.75 0 0 0-1.06 0l-.364.364M12 3c.069 0 .137.006.204.018l.016.004l.016.004l.015.003l.015.003l.015.002l.015.002l.015.002l.015.001l.015.001c.21.03.416.068.618.113l.02.005l.02.005a.75.75 0 0 1 .632 1.282l-7.07 7.07a.75.75 0 0 1-1.282-.632l.005-.02l.005-.02a12.005 12.005 0 0 1 .113-.618l.001-.015l.001-.015l.002-.015l.002-.015l.002-.015l.003-.015l.003-.015l.004-.016l.004-.016a11.954 11.954 0 0 1 .018-.204A12.002 12.002 0 0 1 12 3Z" />
  </svg>
);
const DatabaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m-3.75 9v6m0 0v-6m0 6h12m-12 0H4.5m12 0h.75m-8.25-9a3.375 3.375 0 0 0-3.375-3.375H8.25a3.375 3.375 0 0 0-3.375 3.375v3.75m11.25-9v3.75m0-3.75a3.375 3.375 0 0 1 3.375 3.375v1.5m-11.25 0a3.375 3.375 0 0 1 3.375 3.375v1.5m0 0a3.375 3.375 0 0 1-3.375 3.375m0 0A1.125 1.125 0 0 1 13.5 17.25v-1.5m0 0a3.375 3.375 0 0 0-3.375-3.375m0 0h-1.5m11.25 0h-1.5m-3.75 0h.008v.015h-.008v-.015Zm0 0h.008v.015h-.008v-.015Zm-3.75 0h.008v.015h-.008v-.015Z" />
    </svg>
);


export const ControlPanel: React.FC<ControlPanelProps> = ({ uploadedFile, onFileUpload, status, onClearSession, onViewHistory, onSendCommand, invoiceData }) => {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 h-full overflow-y-auto custom-scrollbar">
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-sky-800">1. Upload Invoice</h2>
        <FileUploader onFileSelect={onFileUpload} currentFile={uploadedFile} disabled={status === 'processing'} />
        <button
          onClick={onClearSession}
          disabled={status === 'processing'}
          className="w-full mt-2 px-4 py-2 border border-rose-400/80 rounded-lg text-sm text-rose-600 hover:text-white hover:bg-rose-500/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Session
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-sky-800">2. Quick Actions</h2>
        <div className="space-y-3">
          <p className="text-xs text-slate-500 italic text-center -mt-2">Click an action to send the command to the chat.</p>
          <button
            onClick={() => onSendCommand('extract invoice details')}
            disabled={status === 'processing' || !uploadedFile}
            title={!uploadedFile ? "Please upload a file first" : "Extract details from the uploaded file"}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:from-sky-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed flex justify-between items-center group"
          >
            <span>Extract Details</span>
            <span className="text-xs font-mono bg-white/20 group-hover:bg-white/30 text-white px-2 py-1 rounded-md transition-colors duration-200">extract</span>
          </button>
          <button
            onClick={() => onSendCommand('post')}
            disabled={status === 'processing' || !invoiceData}
            title={!invoiceData ? "Please extract invoice data first" : "Post the extracted data to Odoo"}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:from-sky-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed flex justify-between items-center group"
          >
            <span>Send to Odoo</span>
            <span className="text-xs font-mono bg-white/20 group-hover:bg-white/30 text-white px-2 py-1 rounded-md transition-colors duration-200">post</span>
          </button>
          <button
            onClick={() => onSendCommand('ai agentic')}
            disabled={status === 'processing'}
            title="Open the AI Agentic Portal in a new tab"
            className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:from-sky-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed flex justify-between items-center group"
          >
            <span>Open Portal</span>
            <span className="text-xs font-mono bg-white/20 group-hover:bg-white/30 text-white px-2 py-1 rounded-md transition-colors duration-200">agentic</span>
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-sky-800">3. Processed Invoices</h2>
        <button
          onClick={onViewHistory}
          disabled={status === 'processing'}
          className="w-full px-4 py-2.5 border border-sky-600/80 rounded-xl text-sm text-sky-700 hover:text-white hover:bg-sky-600/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          View History
        </button>
      </div>

       <div className="space-y-4">
        <h2 className="text-lg font-bold text-sky-800">4. System Status</h2>
        <div className="text-sm space-y-3 p-4 bg-white/30 rounded-xl border border-white/50">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-700">
                    <RadarIcon className="w-5 h-5" />
                    <p>Odoo API:</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <p className="font-semibold text-emerald-700">Online</p>
                </div>
            </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-700">
                    <DatabaseIcon className="w-5 h-5" />
                    <p>AI Model:</p>
                </div>
                <div className="flex items-center space-x-2">
                     <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <p className="font-semibold text-emerald-700">Connected</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
