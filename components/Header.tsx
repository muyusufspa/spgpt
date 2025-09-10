import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../types';

type AppMode = 'dashboard' | 'invoice' | 'qa' | 'document_qa' | 'admin';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  userProfile: UserProfile;
  onLogout: () => void;
  onOpenProfile: () => void;
}

// --- Icons ---
const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

const SpaLogo: React.FC = () => (
    <div className="flex items-center space-x-2">
        <img src="/components/icons/saudia-private-aviation.png" alt="Saudia Private Aviation Logo" className="h-8 w-auto object-contain" />
        <h1 className="sr-only">
            SPA GPT Assistant
        </h1>
    </div>
);


export const Header: React.FC<HeaderProps> = ({ mode, onModeChange, userProfile, onLogout, onOpenProfile }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getButtonClasses = (buttonMode: AppMode) => {
    const baseClasses = "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white";
    if (mode === buttonMode) {
      return `${baseClasses} bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow`;
    }
    return `${baseClasses} text-slate-600 hover:text-slate-900 hover:bg-white/50`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/70 backdrop-blur-lg border-b border-white/30 sticky top-0 z-20 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <SpaLogo />
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden sm:flex items-center space-x-1 bg-black/5 p-1 rounded-xl">
                <button onClick={() => onModeChange('dashboard')} className={getButtonClasses('dashboard')}>
                Dashboard
                </button>
                <button onClick={() => onModeChange('invoice')} className={getButtonClasses('invoice')}>
                Invoice Processor
                </button>
                <button onClick={() => onModeChange('qa')} className={getButtonClasses('qa')}>
                Q&A Assistant
                </button>
                <button onClick={() => onModeChange('document_qa')} className={getButtonClasses('document_qa')}>
                Documents Q&A
                </button>
                {userProfile.is_admin && (
                  <button onClick={() => onModeChange('admin')} className={getButtonClasses('admin')}>
                    Admin Panel
                  </button>
                )}
            </nav>
             <div className="flex items-center pl-3 border-l border-slate-300">
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className="flex items-center space-x-2 text-sm text-slate-600 rounded-full hover:bg-white/50 p-1 pr-3 transition-colors duration-200"
                  >
                    <UserCircleIcon className="w-7 h-7" />
                    <span className="capitalize hidden md:block">{userProfile.name}</span>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-xl py-1 z-30 animate-fade-in">
                      <button 
                        onClick={() => { onOpenProfile(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-white/50 hover:text-slate-900 transition-colors duration-200"
                      >
                        Profile & Settings
                      </button>
                      <button 
                        onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100/80 transition-colors duration-200"
                        aria-label="Logout"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};