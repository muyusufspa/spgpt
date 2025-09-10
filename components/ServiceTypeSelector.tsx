import React, { useState } from 'react';
import { SendIcon } from './icons/SendIcon';

const SERVICE_TYPES = ["Hotel", "Insurance", "Catering", "Ground Service"];

interface ServiceTypeSelectorProps {
  onSelectServiceType: (serviceType: string) => void;
  disabled: boolean;
}

export const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({ onSelectServiceType, disabled }) => {
  const [selectedValue, setSelectedValue] = useState(SERVICE_TYPES[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedValue && !disabled) {
      onSelectServiceType(selectedValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <div className="relative flex-grow">
        <select
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
          disabled={disabled}
          className="w-full bg-white/50 border border-slate-300 rounded-lg py-2.5 px-4 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all duration-200 appearance-none"
        >
          {SERVICE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-600">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg p-2.5 hover:from-sky-500 hover:to-blue-600 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white/5"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
};