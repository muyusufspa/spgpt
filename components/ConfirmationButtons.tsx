import React from 'react';

interface ConfirmationButtonsProps {
  onConfirm: (confirmed: boolean) => void;
  disabled: boolean;
}

export const ConfirmationButtons: React.FC<ConfirmationButtonsProps> = ({ onConfirm, disabled }) => {
  return (
    <div className="flex items-center justify-center space-x-4 animate-fade-in">
      <button
        onClick={() => onConfirm(true)}
        disabled={disabled}
        className="px-8 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white/5"
      >
        Yes
      </button>
      <button
        onClick={() => onConfirm(false)}
        disabled={disabled}
        className="px-8 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-white/5"
      >
        No
      </button>
    </div>
  );
};