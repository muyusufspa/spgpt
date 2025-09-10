import React, { useState, useMemo } from 'react';
import type { InvoiceHistoryEntry } from '../types';

interface HistoryModalProps {
  history: InvoiceHistoryEntry[];
  onClose: () => void;
  onClearHistory: () => void;
}

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onClearHistory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // Default sort option

  const filteredAndSortedHistory = useMemo(() => {
    let result = [...history];

    // 1. Filter by search query (vendor or reference)
    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter(entry =>
        entry.vendor_name.toLowerCase().includes(lowercasedQuery) ||
        entry.reference.toLowerCase().includes(lowercasedQuery)
      );
    }

    // 2. Sort the result
    switch (sortBy) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.processedDate).getTime() - new Date(b.processedDate).getTime());
        break;
      case 'vendor-asc':
        result.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));
        break;
      case 'amount-desc':
        result.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      case 'date-desc':
      default:
        result.sort((a, b) => new Date(b.processedDate).getTime() - new Date(a.processedDate).getTime());
        break;
    }

    return result;
  }, [history, searchQuery, sortBy]);


  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-card bg-white/80 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 m-4 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Invoice History</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Close history"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Search and Sort Controls */}
        <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-slate-200 bg-white/50">
          <input
            type="text"
            placeholder="Search by vendor or reference..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-grow bg-slate-100 border border-slate-300 rounded-lg py-2 px-3 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all duration-200"
            aria-label="Search invoices"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-slate-100 border border-slate-300 rounded-lg py-2 px-3 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all duration-200"
            aria-label="Sort invoices"
          >
            <option value="date-desc">Most Recent</option>
            <option value="date-asc">Oldest First</option>
            <option value="vendor-asc">Vendor Name (A-Z)</option>
            <option value="amount-desc">Amount (High-Low)</option>
            <option value="amount-asc">Amount (Low-High)</option>
          </select>
        </div>


        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {history.length > 0 ? (
            filteredAndSortedHistory.length > 0 ? (
                <div className="space-y-3">
                {filteredAndSortedHistory.map((entry, index) => (
                    <div key={index} className="bg-white/50 p-4 rounded-lg flex justify-between items-center border border-slate-200/80">
                    <div className="flex items-center space-x-3">
                        <span
                        className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${entry.isPosted ? 'bg-green-500' : 'bg-yellow-500'}`}
                        title={entry.isPosted ? 'Posted' : 'Pending'}
                        ></span>
                        <div>
                        <p className="font-semibold text-slate-800">{entry.vendor_name}</p>
                        <p className="text-sm text-slate-500">Ref: {entry.reference}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-slate-800">{entry.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {entry.currency}</p>
                        <p className="text-xs text-slate-500">{new Date(entry.processedDate).toLocaleString()}</p>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                 <p className="text-slate-500 text-center py-8">No invoices found matching your search.</p>
            )
          ) : (
            <p className="text-slate-500 text-center py-8">No invoices have been processed yet.</p>
          )}
        </div>
        <footer className="p-4 border-t border-slate-200 flex justify-end bg-white/50 rounded-b-2xl">
            <button
                onClick={onClearHistory}
                disabled={history.length === 0}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-500 hover:text-red-500 hover:border-red-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Clear History
            </button>
        </footer>
      </div>
    </div>
  );
};