


import React, { useState, useEffect, useMemo } from 'react';

import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { ChatWindow } from './components/ChatWindow';
import { Dashboard } from './components/Dashboard';
import { QAChatWindow } from './components/QAChatWindow';
import { DocumentQAChatWindow } from './components/DocumentQAChatWindow';
import { HistoryModal } from './components/HistoryModal';
import { AdminPanel } from './components/AdminPanel';

import type { AppStatus, ChatMessage, InvoiceData, InvoiceHistoryEntry, ProductLine, UserProfile, UserSettings, ActivityEntry, MockDbUser } from './types';
import { extractInvoiceDetails, getQAResponse, getDocQAResponse } from './services/geminiService';
import { initDatabase, getAllUsers, findUserByUsername, updateUserLoginTime, createUser, toggleUserStatus, toggleAdminStatus, deleteUser, addActivityLog, getActivityLog } from './services/dbService';


// --- Start of co-located components & services ---

// --- Cookie Service Helpers ---
const setCookie = (name: string, value: string) => {
    const maxAge = 86400; // 24 hours in seconds
    // In a real app, the server would set HttpOnly and Secure flags.
    // This is a client-side simulation.
    document.cookie = `${name}=${value || ""}; path=/; SameSite=Lax; Max-Age=${maxAge}`;
};

const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

const deleteCookie = (name: string) => {   
    document.cookie = name+'=; Max-Age=-99999999; path=/;';  
};

// --- Mock Auth Service ---
// This simulates a server-side session store using localStorage to persist across reloads.
const serverSessionStore = {
  getSessions: (): Record<string, { userId: number; username: string; is_admin: 1 | 0, expiresAt: number }> => {
    try {
      const sessions = localStorage.getItem('spa_server_sessions');
      return sessions ? JSON.parse(sessions) : {};
    } catch {
      return {};
    }
  },
  saveSessions: (sessions: any) => {
    localStorage.setItem('spa_server_sessions', JSON.stringify(sessions));
  },
  createSession: (user: MockDbUser) => {
    const token = `mock_token_${Date.now()}_${Math.random()}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
    const sessions = serverSessionStore.getSessions();
    sessions[token] = { userId: user.id, username: user.username, is_admin: user.is_admin, expiresAt };
    serverSessionStore.saveSessions(sessions);
    return token;
  },
  verifySession: (token: string): { status: 200, user: UserProfile } | { status: 401, user: null } => {
    const sessions = serverSessionStore.getSessions();
    const session = sessions[token];
    if (session && session.expiresAt > Date.now()) {
      return { status: 200, user: { name: `${session.username.charAt(0).toUpperCase() + session.username.slice(1)} User`, email: session.username, is_admin: session.is_admin === 1 } };
    }
    // Clean up expired/invalid session if found
    if (session) {
        delete sessions[token];
        serverSessionStore.saveSessions(sessions);
    }
    return { status: 401, user: null };
  },
  deleteSession: (token: string) => {
      const sessions = serverSessionStore.getSessions();
      if(sessions[token]) {
          delete sessions[token];
          serverSessionStore.saveSessions(sessions);
      }
  }
};


// --- Icons for UserProfileModal ---
const IdentificationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
    </svg>
);
const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.405 1.05c.412-1.363 2.182-1.363 2.594 0l.09.301a1.5 1.5 0 0 0 1.85.975l.3-.09c1.362-.412 2.68 1.31 1.278 2.593l-.24.24a1.5 1.5 0 0 0 0 2.122l.24.24c1.402 1.282.116 3.005-1.278 2.593l-.3-.09a1.5 1.5 0 0 0-1.85.975l-.09.301c-.412 1.363-2.182 1.363-2.594 0l-.09-.301a1.5 1.5 0 0 0-1.85-.975l-.3.09c-1.362.412-2.68-1.31-1.278-2.593l.24-.24a1.5 1.5 0 0 0 0 2.122l-.24-.24C.835 4.38.148 2.657 1.55 1.375l.3.09a1.5 1.5 0 0 0 1.85-.975l.09-.301Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const ActivityLogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

// --- New Icons for Modal Redesign ---
const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
);
const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM4.5 1.5L4.5 12h3v6m-3-6h3m-3 0h-3m3 0v6m6-6v6m6-6v6m-6-6h3v6m-3-6h-3" />
    </svg>
);
const ArrowRightOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
);

const timeAgo = (timestamp: number | string | null): string => {
    if (!timestamp) return 'Never';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    const now = Date.now();
    const seconds = Math.floor((now - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

// --- UserProfileModal Component ---
interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  userSettings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  activityLog: ActivityEntry[];
  allUsers: MockDbUser[]; // Keep for current user details lookup
}

interface ParsedActivity {
    module: string;
    action: string;
    subject: string;
}

const moduleNameMap: { [key: string]: string } = {
    'invoice': 'Invoice Processor',
    'qa': 'Q&A Assistant',
    'document qa': 'Document Q&A',
    'dashboard': 'Dashboard',
    'admin': 'Admin Panel',
};

const parseActivityAction = (log: ActivityEntry): ParsedActivity => {
    const actionStr = log.action;
    let match;

    match = actionStr.match(/^Switched to (.+) view\.$/);
    if (match) return { module: 'Navigation', action: 'Switch View', subject: moduleNameMap[match[1].toLowerCase()] || match[1] };

    match = actionStr.match(/^Changed theme to (.+)\.$/);
    if (match) return { module: 'Settings', action: 'Update Theme', subject: `Theme: ${match[1]}` };

    if (actionStr === 'Updated user profile.') return { module: 'Profile', action: 'Update', subject: 'Profile' };

    match = actionStr.match(/^Created new user: (.+)$/);
    if (match) return { module: 'User Management', action: 'Create', subject: `User: ${match[1]}` };
    
    match = actionStr.match(/^Triggered password reset for user: (.+)$/);
    if (match) return { module: 'User Management', action: 'Reset Password', subject: `User: ${match[1]}` };

    match = actionStr.match(/^(Enabled|Disabled) user: (.+)$/);
    if (match) return { module: 'User Management', action: 'Update Status', subject: `User: ${match[2]}` };

    match = actionStr.match(/^(Made admin|Removed admin from): (.+)$/);
    if (match) return { module: 'User Management', action: 'Update Role', subject: `User: ${match[2]}` };

    match = actionStr.match(/^Deleted user: (.+)$/);
    if (match) return { module: 'User Management', action: 'Delete', subject: `User: ${match[1]}` };

    if (actionStr === 'Cleared invoice session.') return { module: 'Invoice Processor', action: 'Clear', subject: 'Session' };

    if (actionStr === 'Cleared all invoice history.') return { module: 'Invoice Processor', action: 'Clear History', subject: 'All Invoices' };
    
    match = actionStr.match(/^Uploaded invoice: "(.+)"$/);
    if (match) return { module: 'Invoice Processor', action: 'Upload', subject: `File: ${match[1]}` };
    
    match = actionStr.match(/^Uploaded document for Q&A: "(.+)"$/);
    if (match) return { module: 'Document Q&A', action: 'Upload', subject: `File: ${match[1]}` };

    match = actionStr.match(/^Attempting to post invoice: "(.+)"$/);
    if (match) return { module: 'Invoice Processor', action: 'Post Attempt', subject: `Invoice: ${match[1]}` };

    match = actionStr.match(/^Successfully posted invoice: "(.+)"$/);
    if (match) return { module: 'Invoice Processor', action: 'Post Success', subject: `Invoice: ${match[1]}` };

    match = actionStr.match(/^Sent message in (.+?): "(.+)"/);
    if (match) return { module: moduleNameMap[match[1].toLowerCase()] || match[1], action: 'Send Message', subject: `"${match[2]}..."` };

    match = actionStr.match(/^Error in (.+?): (.+)$/);
    if (match) return { module: moduleNameMap[match[1].toLowerCase()] || match[1], action: 'Error', subject: match[2] };

    if (actionStr === 'Logged in to the application.') return { module: 'System', action: 'Login', subject: 'Application' };
    if (actionStr === 'Logged out from the application.') return { module: 'System', action: 'Logout', subject: 'Application' };

    return { module: 'General', action: 'Unknown', subject: actionStr };
};


const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
    isOpen, onClose, userProfile, onUpdateProfile, userSettings, onUpdateSettings, activityLog, allUsers
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'activity'>('profile');
  
  // --- Profile State ---
  const [name, setName] = useState(userProfile.name);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const currentUserDetails = useMemo(() => allUsers.find(u => u.username === userProfile.email), [allUsers, userProfile.email]);

  // --- Settings State ---
  const [currentSettings, setCurrentSettings] = useState(userSettings);

  // --- Activity Log State ---
  const parsedActivities = useMemo(() => activityLog.map(log => ({ ...log, ...parseActivityAction(log) })), [activityLog]);
  const myActivity = useMemo(() => parsedActivities.filter(log => log.user === userProfile.email).slice(0, 50), [parsedActivities, userProfile.email]);
  
  useEffect(() => {
    setName(userProfile.name);
    setCurrentSettings(userSettings);
  }, [userProfile, userSettings]);
  
  if (!isOpen) return null;

  const handleSaveChanges = () => {
    onUpdateProfile({ ...userProfile, name });
    onUpdateSettings(currentSettings);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: IdentificationIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon },
    { id: 'activity', name: 'Activity Log', icon: ActivityLogIcon },
  ];
  
  const TitledCard: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
      <div>
        <h4 className="text-sm font-semibold text-slate-500 mb-3">{title}</h4>
        {children}
      </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      {showSuccessToast && (
          <div className="absolute top-5 right-5 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in z-[60]">
              Changes saved successfully!
          </div>
      )}
      <div 
        className="glass-card bg-white/70 w-full max-w-5xl h-[90vh] max-h-[800px] rounded-[24px] shadow-2xl flex flex-col overflow-hidden" 
        onClick={e => e.stopPropagation()}
        dir={currentSettings.language === 'ar' ? 'rtl' : 'ltr'}
      >
        <header className="relative flex-shrink-0 flex items-center justify-between p-6 bg-gradient-to-b from-sky-100 to-white/50 border-b border-white/50 overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-50">
                 <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-white/80 rounded-full filter blur-3xl"></div>
                 <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-white/80 rounded-full filter blur-3xl"></div>
                 <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 opacity-40">
                    <path d="M-100 80 Q 150 40 400 60 T 900 30" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="2" fill="none" strokeDasharray="5 10" />
                 </svg>
            </div>
            <div className="flex items-center gap-3 z-10">
                <img src="/components/icons/saudia-private-aviation.png" alt="SPA Logo" className="h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 z-10">{userProfile.name}'s Profile & Settings</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors z-10" aria-label="Close modal"><XIcon className="w-7 h-7" /></button>
        </header>

        <div className="flex-shrink-0 px-4 pt-4 border-b border-slate-300/60">
            <div className="flex items-center space-x-2">
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${activeTab === tab.id ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20' : 'text-slate-600 hover:bg-sky-100/70'}`}
                    >
                    <tab.icon className="w-5 h-5" />
                    {tab.name}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                <div className="md:col-span-1 flex flex-col items-center text-center space-y-4 p-6 bg-white/30 rounded-2xl border border-slate-200/50">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sky-200 to-indigo-200 flex items-center justify-center">
                           <span className="text-5xl font-bold text-slate-600">{userProfile.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                           <CameraIcon className="w-8 h-8"/>
                        </button>
                    </div>
                    <div>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="text-xl font-bold text-slate-800 bg-transparent text-center w-full focus:ring-1 focus:ring-sky-500 rounded-lg p-1 transition" />
                        <p className="text-sm text-slate-500">{userProfile.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${userProfile.is_admin ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'}`}> {userProfile.is_admin ? 'Admin' : 'User'} </span>
                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${currentUserDetails?.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}> {currentUserDetails?.is_active ? 'Active' : 'Inactive'} </span>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/30 p-4 rounded-2xl border border-slate-200/50">
                            <p className="text-xs text-slate-500">Last Login</p>
                            <p className="text-base font-semibold text-slate-700">{currentUserDetails?.last_login_at ? new Date(currentUserDetails.last_login_at).toLocaleString() : 'Never'}</p>
                        </div>
                         <div className="bg-white/30 p-4 rounded-2xl border border-slate-200/50">
                            <p className="text-xs text-slate-500">Member Since</p>
                            <p className="text-base font-semibold text-slate-700">{currentUserDetails?.created_at ? new Date(currentUserDetails.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                     <div className="bg-white/30 p-6 rounded-2xl border border-slate-200/50 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-500">Account Actions</h4>
                        <button className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-sky-600 transition-colors"><KeyIcon className="w-5 h-5"/> Change Password</button>
                        <button className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-rose-600 transition-colors"><ArrowRightOnRectangleIcon className="w-5 h-5"/> Logout all other sessions</button>
                    </div>
                </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                <TitledCard title="Localization">
                    <div className="bg-white/30 p-4 rounded-2xl border border-slate-200/50 divide-y divide-slate-200/70">
                        {/* Language */}
                        <div className="flex items-center justify-between py-3">
                            <div><h5 className="font-medium text-slate-700">Language</h5><p className="text-xs text-slate-500">Interface language</p></div>
                            <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
                                <button onClick={() => setCurrentSettings(s => ({...s, language: 'en'}))} className={`px-3 py-1 text-sm rounded-md ${currentSettings.language === 'en' ? 'bg-white shadow-sm' : ''}`}>English</button>
                                <button onClick={() => setCurrentSettings(s => ({...s, language: 'ar'}))} className={`px-3 py-1 text-sm rounded-md ${currentSettings.language === 'ar' ? 'bg-white shadow-sm' : ''}`}>العربية</button>
                            </div>
                        </div>
                        {/* Timezone */}
                        <div className="flex items-center justify-between py-3">
                            <div><h5 className="font-medium text-slate-700">Timezone</h5><p className="text-xs text-slate-500">For accurate timestamps</p></div>
                             <select value={currentSettings.timezone} onChange={e => setCurrentSettings(s => ({...s, timezone: e.target.value}))} className="bg-white/80 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none w-48">
                                <option>Asia/Riyadh</option><option>UTC</option>
                            </select>
                        </div>
                        {/* Date Format */}
                        <div className="flex items-center justify-between py-3">
                            <div><h5 className="font-medium text-slate-700">Date Format</h5></div>
                            <select value={currentSettings.dateFormat} onChange={e => setCurrentSettings(s => ({...s, dateFormat: e.target.value as any}))} className="bg-white/80 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none w-48">
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>
                    </div>
                </TitledCard>
                <TitledCard title="Notifications & Appearance">
                    <div className="bg-white/30 p-4 rounded-2xl border border-slate-200/50 divide-y divide-slate-200/70">
                         {/* Theme is a global setting in this app, but showing it here */}
                        <div className="flex items-center justify-between py-3">
                            <div><h5 className="font-medium text-slate-700">Interface Theme</h5></div>
                            <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
                                <button onClick={() => onUpdateSettings({...currentSettings, theme: 'sky'})} className={`px-3 py-1 text-sm rounded-md capitalize ${currentSettings.theme === 'sky' ? 'bg-white shadow-sm' : ''}`}>Sky</button>
                                <button onClick={() => onUpdateSettings({...currentSettings, theme: 'midnight'})} className={`px-3 py-1 text-sm rounded-md capitalize ${currentSettings.theme === 'midnight' ? 'bg-white shadow-sm' : ''}`}>Midnight</button>
                            </div>
                        </div>
                         <div className="flex items-center justify-between py-3">
                            <div><h5 className="font-medium text-slate-700">Email Notifications</h5></div>
                            <input type="checkbox" className="h-5 w-5 rounded-md border-slate-400 text-sky-600 focus:ring-sky-500" checked={currentSettings.notifications?.email} onChange={e => setCurrentSettings(s => ({...s, notifications: {...s.notifications!, email: e.target.checked}}))}/>
                        </div>
                         <div className="flex items-center justify-between py-3">
                            <div><h5 className="font-medium text-slate-700">In-App Toasts</h5></div>
                            <input type="checkbox" className="h-5 w-5 rounded-md border-slate-400 text-sky-600 focus:ring-sky-500" checked={currentSettings.notifications?.toast} onChange={e => setCurrentSettings(s => ({...s, notifications: {...s.notifications!, toast: e.target.checked}}))}/>
                        </div>
                    </div>
                </TitledCard>
                 <TitledCard title="Accessibility">
                    <div className="bg-white/30 p-4 rounded-2xl border border-slate-200/50 divide-y divide-slate-200/70">
                         <div className="flex items-center justify-between py-3">
                            <div><h5 className="font-medium text-slate-700">Reduced Motion</h5><p className="text-xs text-slate-500">Disable non-essential animations</p></div>
                            <input type="checkbox" className="h-5 w-5 rounded-md border-slate-400 text-sky-600 focus:ring-sky-500" checked={currentSettings.accessibility?.reducedMotion} onChange={e => setCurrentSettings(s => ({...s, accessibility: {...s.accessibility!, reducedMotion: e.target.checked}}))}/>
                        </div>
                         <div className="flex items-center justify-between py-3">
                            <div><h5 className="font-medium text-slate-700">High Contrast Mode</h5><p className="text-xs text-slate-500">Improve text readability</p></div>
                            <input type="checkbox" className="h-5 w-5 rounded-md border-slate-400 text-sky-600 focus:ring-sky-500" checked={currentSettings.accessibility?.highContrast} onChange={e => setCurrentSettings(s => ({...s, accessibility: {...s.accessibility!, highContrast: e.target.checked}}))}/>
                        </div>
                    </div>
                </TitledCard>
            </div>
          )}
          {activeTab === 'activity' && (
             <div className="animate-fade-in pt-6">
                <p className="text-sm text-slate-600 mb-4">Showing your last 50 actions, newest first.</p>
                {myActivity.length > 0 ? (
                        <table className="w-full text-sm text-left text-slate-700">
                        <thead className="text-xs text-slate-800 uppercase bg-white/40"><tr><th className="p-3">Time</th><th className="p-3">Module</th><th className="p-3">Action</th><th className="p-3">Subject</th></tr></thead>
                        <tbody>{myActivity.map(log => (<tr key={log.id} className="bg-white/20 border-b border-slate-300/50 hover:bg-white/50"><td className="p-3 whitespace-nowrap">{timeAgo(log.timestamp)}</td><td className="p-3">{log.module}</td><td className="p-3">{log.action}</td><td className="p-3 truncate max-w-xs">{log.subject}</td></tr>))}</tbody>
                        </table>
                ) : (<p className="text-center py-8 text-slate-500">No activity yet.</p>)}
            </div>
          )}
        </div>
        
        <footer className="flex-shrink-0 flex items-center justify-end gap-4 p-4 bg-black/5 rounded-b-[24px] border-t border-slate-200/50">
            <button onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100/80 transition-colors duration-150">Cancel</button>
            <button onClick={handleSaveChanges} className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-md shadow-sky-500/20">Save Changes</button>
        </footer>
      </div>
    </div>
  );
};

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

// --- SVG Icons for Login Page ---
const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25-2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await onLogin(username, password);

    if (!success) {
      // Use a timeout to give a feeling of processing and prevent revealing password validity too quickly
      setTimeout(() => {
        setError('Invalid credentials. Please try again.');
        setPassword('');
        setIsLoading(false);
      }, 500);
    } 
    // If successful, this component unmounts, so no need for a corresponding setIsLoading(false)
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Left Panel (Welcome Message & Branding) */}
        <div className="p-8 md:p-12 bg-gradient-to-br from-sky-400 to-sky-600 text-white relative flex flex-col justify-between order-2 lg:order-1 min-h-[300px] lg:min-h-0">
            {/* Background Decor: Clouds and Flight Paths */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl opacity-80"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl opacity-80"></div>
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 opacity-20">
                    <path d="M-100 150 Q 150 100 400 200 T 700 100" stroke="white" strokeWidth="2" fill="none" strokeDasharray="5 8" />
                    <path d="M-50 350 Q 200 400 450 300 T 800 350" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="5 8" />
                </svg>
            </div>
            
            <div className="relative z-10">
                <img
                  src="/components/icons/saudia-private-aviation.png"
                  alt="Saudia Private Aviation Logo"
                  className="h-12 w-auto"
                />
            </div>

            <div className="relative z-10">
                <h2 className="text-4xl font-bold">Welcome Back!</h2>
                <p className="mt-4 max-w-md text-white/80">
                    Stay connected with Saudi Private Aviation by logging in with your personal details.
                </p>
            </div>
            
            <div className="relative z-10">
                 <p className="text-sm text-white/60">
                    &copy; {new Date().getFullYear()} Saudi Private Aviation. Aligned with Vision 2030.
                </p>
            </div>
        </div>

        {/* Right Panel (Login Form) */}
        <div className="p-8 md:p-12 bg-white flex flex-col justify-center order-1 lg:order-2">
            <h1 className="text-3xl font-bold text-slate-800">Welcome</h1>
            <p className="text-slate-500 mt-2">Login to your account to continue</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg p-3 text-center" role="alert">
                    {error}
                </div>
                )}

                <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="Enter Username"
                        className="w-full bg-slate-100 border border-slate-300 rounded-lg py-2.5 pl-11 pr-4 text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                        autoComplete="username"
                    />
                </div>
                <div className="relative">
                    <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter Password"
                        className="w-full bg-slate-100 border border-slate-300 rounded-lg py-2.5 pl-11 pr-4 text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                        autoComplete="current-password"
                    />
                </div>
                
                <div className="text-right -mt-2">
                    <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Forgot Password?</a>
                </div>

                <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-sky-500 to-violet-600 text-white font-semibold rounded-lg py-3 px-4 hover:from-sky-600 hover:to-violet-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 flex items-center justify-center shadow-lg shadow-sky-500/20"
                >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : 'Log In'}
                </button>
            </form>
        </div>

      </div>
    </div>
  );
};
// --- End of co-located components ---

type AppMode = 'dashboard' | 'invoice' | 'qa' | 'document_qa' | 'admin';
type ConversationStage = 'idle' | 'awaiting_vendor_name' | 'awaiting_rsaf_confirmation' | 'awaiting_fsr_id' | 'awaiting_routing_details' | 'awaiting_approver_selection';
type AuthStatus = 'pending' | 'authenticated' | 'unauthenticated';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the prefix e.g. 'data:application/pdf;base64,'
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  // Auth State
  const [authStatus, setAuthStatus] = useState<AuthStatus>('pending');
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', email: '', is_admin: false });
  const [userSettings, setUserSettings] = useState<UserSettings>({ 
      theme: 'sky',
      language: 'en',
      timezone: 'Asia/Riyadh',
      dateFormat: 'DD/MM/YYYY',
      notifications: { email: true, toast: true },
      accessibility: { reducedMotion: false, highContrast: false }
  });
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [allUsers, setAllUsers] = useState<MockDbUser[]>([]);

  // App State
  const [mode, setMode] = useState<AppMode>('invoice');
  const [status, setStatus] = useState<AppStatus>('idle');
  const [history, setHistory] = useState<InvoiceHistoryEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Invoice Mode State
  const [invoiceMessages, setInvoiceMessages] = useState<ChatMessage[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [conversationStage, setConversationStage] = useState<ConversationStage>('idle');
  
  // Q&A Mode State
  const [qaMessages, setQaMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: "I am a general purpose AI assistant. How can I help you today?", timestamp: Date.now() }
  ]);

  // Document Q&A Mode State
  const [docQAMessages, setDocQAMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: "Please upload a document, and I'll answer your questions based on its content.", timestamp: Date.now() }
  ]);
  const [docQAFile, setDocQAFile] = useState<File | null>(null);

  const logActivity = (action: string, userOverride?: string) => {
    const user = userOverride || userProfile.email;
    if (!user) return; // Don't log if no user context
    addActivityLog(user, action);
    // Re-fetch from DB to keep state in sync
    const updatedLogs = getActivityLog();
    setActivityLog(updatedLogs);
  };
  
  // App Initialization Effect
  useEffect(() => {
    const initializeApp = async () => {
        // 1. Initialize DB and load users & activity log
        await initDatabase().then(() => {
            setAllUsers(getAllUsers());
            setActivityLog(getActivityLog());
            console.log("Database initialized and data loaded.");
        }).catch(error => {
            console.error("Failed to initialize app database:", error);
        });

        // 2. Load non-auth, non-db data from local storage
        try {
            const storedHistory = localStorage.getItem('invoiceHistory');
            if (storedHistory) setHistory(JSON.parse(storedHistory));
            const storedSettings = localStorage.getItem('userSettings');
            if (storedSettings) setUserSettings(JSON.parse(storedSettings));
        } catch (error) {
            console.error("Failed to load data from local storage:", error);
        }

        // 3. Verify user session
        const token = getCookie('spa_session');
        if (token) {
            const { status, user } = serverSessionStore.verifySession(token);
            if (status === 200 && user) {
                setUserProfile(user);
                setAuthStatus('authenticated');
                logActivity('Session restored.', user.email);
            } else {
                deleteCookie('spa_session');
                setAuthStatus('unauthenticated');
            }
        } else {
            setAuthStatus('unauthenticated');
        }
    };
    initializeApp();
  }, []);

  // Effect for setting initial invoice message
  useEffect(() => {
    if (uploadedFile) {
        setInvoiceMessages([{ role: 'ai', content: `File **${uploadedFile.name}** is uploaded. What would you like to do next? You can ask to extract details, or type 'help' for commands.`, timestamp: Date.now() }]);
    } else {
        setInvoiceMessages([{ role: 'ai', content: 'Welcome to the Invoice Processor. Please upload a document to begin.', timestamp: Date.now() }]);
    }
  }, [uploadedFile]);

  // Save data to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('invoiceHistory', JSON.stringify(history));
      localStorage.setItem('userSettings', JSON.stringify(userSettings));
    } catch (error)      {
      console.error("Failed to save data to local storage:", error);
    }
  }, [history, userSettings]);

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.remove('theme-sky', 'theme-midnight');
    document.body.classList.add(`theme-${userSettings.theme}`);
  }, [userSettings.theme]);

  // Apply a class to the body for page-specific styling
  useEffect(() => {
    const themeClass = `theme-${userSettings.theme}`;
    document.body.classList.remove('login-page-background', 'app-background');
    
    if (authStatus !== 'authenticated') {
      document.body.classList.add('login-page-background');
    } else {
      document.body.classList.add('app-background');
    }
    
    return () => {
      document.body.classList.remove('login-page-background', 'app-background');
      document.body.classList.add(themeClass); // ensure theme class persists
    };
  }, [authStatus, userSettings.theme]);

  const handleSendCommand = (command: string) => {
      if(mode === 'invoice') {
          handleSendMessage(command);
      }
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        let inputToFocus: HTMLElement | null = null;
        if (mode === 'invoice' && conversationStage === 'idle') { inputToFocus = document.getElementById('chat-input'); } 
        else if (mode === 'qa' || mode === 'document_qa') { inputToFocus = document.getElementById('qa-chat-input'); }
        inputToFocus?.focus();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        let uploadButton: HTMLElement | null = null;
        if (mode === 'invoice') { uploadButton = document.getElementById('file-upload-button'); } 
        else if (mode === 'document_qa') { uploadButton = document.getElementById('doc-qa-file-upload-button'); }
        uploadButton?.click();
        return;
      }
      
      if (isTyping) return;
      
      if (mode === 'invoice') {
        switch (e.key.toLowerCase()) {
          case 'e': if (uploadedFile && status !== 'processing') { e.preventDefault(); handleSendCommand('extract invoice details'); } break;
          case 'p': if (invoiceData && status !== 'processing') { e.preventDefault(); handleSendCommand('post'); } break;
          default: break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [mode, status, uploadedFile, invoiceData, conversationStage]);

  // Auth Handlers
  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const user = findUserByUsername(username);
      if (user && user.password_hash === password && user.is_active === 1) {
        updateUserLoginTime(user.id);
        const updatedUsers = getAllUsers();
        setAllUsers(updatedUsers);
        
        const token = serverSessionStore.createSession(user);
        setCookie('spa_session', token);

        const profile: UserProfile = { name: `${user.username.charAt(0).toUpperCase() + user.username.slice(1)} User`, email: user.username, is_admin: user.is_admin === 1 };
        setUserProfile(profile);
        logActivity('Logged in to the application.', user.username);
        setMode('dashboard');
        setAuthStatus('authenticated');
        return true;
      }
      return false;
    } catch (error) {
      console.error("An error occurred during login:", error);
      return false;
    }
  };

  const handleLogout = () => {
    logActivity('Logged out from the application.');
    
    const token = getCookie('spa_session');
    if (token) {
        serverSessionStore.deleteSession(token);
        deleteCookie('spa_session');
    }

    setUserProfile({ name: '', email: '', is_admin: false });
    setAuthStatus('unauthenticated');
  };

  const handleCreateUser = async (newUser: { username: string; password: string; isAdmin: boolean; isActive: boolean }): Promise<{ success: boolean; message: string }> => {
    if (!userProfile.is_admin) { return { success: false, message: "Forbidden: Only admins can create users." }; }
    try {
      if (findUserByUsername(newUser.username)) { return { success: false, message: "Username already exists." }; }
      createUser({ username: newUser.username, password_hash: newUser.password, isActive: newUser.isActive, isAdmin: newUser.isAdmin });
      const updatedUsers = getAllUsers();
      setAllUsers(updatedUsers);
      logActivity(`Created new user: ${newUser.username}`);
      return { success: true, message: `User "${newUser.username}" created successfully.` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      return { success: false, message: `Failed to create user: ${errorMessage}` };
    }
};

const handleToggleUserStatus = (userId: number) => {
    try {
        const updatedUser = toggleUserStatus(userId);
        setAllUsers(allUsers.map(u => u.id === userId ? updatedUser : u));
        if (updatedUser) { logActivity(`${updatedUser.is_active ? 'Enabled' : 'Disabled'} user: ${updatedUser.username}`); }
    } catch (error) { console.error("Failed to toggle user status:", error); }
};

const handleToggleAdminStatus = (userId: number) => {
    try {
        const updatedUser = toggleAdminStatus(userId);
        setAllUsers(allUsers.map(u => u.id === userId ? updatedUser : u));
        if (updatedUser) { logActivity(`${updatedUser.is_admin ? 'Made admin' : 'Removed admin from'}: ${updatedUser.username}`); }
    } catch (error) { console.error("Failed to toggle admin status:", error); }
};

const handleDeleteUser = async (userId: number): Promise<{ success: boolean; message: string }> => {
    try {
        const userToDelete = allUsers.find(u => u.id === userId);
        if (userToDelete?.username === userProfile.email) { return { success: false, message: "You cannot delete your own account." }; }
        if (!userToDelete) { return { success: false, message: "User not found." }; }
        deleteUser(userId);
        const updatedUsers = getAllUsers();
        setAllUsers(updatedUsers);
        logActivity(`Deleted user: ${userToDelete.username}`);
        return { success: true, message: "User deleted successfully." };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: errorMessage };
    }
};

const handleResetPassword = (userId: number) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        // In a real app, this would trigger a password reset flow (e.g., email).
        alert(`Password reset action triggered for user: ${user.username}.`);
        logActivity(`Triggered password reset for user: ${user.username}`);
    }
};

const handleModeChange = (newMode: AppMode) => {
    if (newMode === 'admin' && !userProfile.is_admin) {
        console.warn("Unauthorized: Admin access denied.");
        return; // Prevents non-admins from switching to admin view
    }
    logActivity(`Switched to ${newMode.replace(/_/g, ' ')} view.`);
    setMode(newMode);
};

  const addMessage = (text: string, role: 'user' | 'ai', currentMode: AppMode, options: Partial<ChatMessage> = {}) => {
      const message: ChatMessage = { role, content: text, timestamp: Date.now(), ...options };
      const updater = (setter: React.Dispatch<React.SetStateAction<ChatMessage[]>>) => { setter(prev => [...prev.filter(m => !m.isLoading), message]); };
      switch(currentMode) {
          case 'invoice': updater(setInvoiceMessages); break;
          case 'qa': updater(setQaMessages); break;
          case 'document_qa': updater(setDocQAMessages); break;
      }
  };

  const handleClearSession = () => {
    setUploadedFile(null); setInvoiceData(null); logActivity('Cleared invoice session.'); setConversationStage('idle');
    setInvoiceMessages([{ role: 'ai', content: 'Session cleared. Please upload a new document to begin.', timestamp: Date.now() }]);
  };

  const handleFileUpload = (file: File | null, target: 'invoice' | 'doc_qa') => {
      if (target === 'invoice') {
        setUploadedFile(file); setInvoiceData(null); setConversationStage('idle');
        if (file) { logActivity(`Uploaded invoice: "${file.name}"`); setInvoiceMessages([{ role: 'ai', content: `File **${file.name}** is uploaded. You can "extract details".`, timestamp: Date.now() }]); } 
        else { setInvoiceMessages([{ role: 'ai', content: 'File removed. Please upload a document to begin.', timestamp: Date.now() }]); }
      } else {
          setDocQAFile(file);
          if (file) { logActivity(`Uploaded document for Q&A: "${file.name}"`); setDocQAMessages([{ role: 'ai', content: `Ready to answer questions about **${file.name}**.` , timestamp: Date.now()}]); } 
          else { setDocQAMessages([{ role: 'ai', content: 'File removed. Please upload a new document.', timestamp: Date.now()}]); }
      }
  };

  const executePost = async (dataToPost: InvoiceData) => {
    logActivity(`Attempting to post invoice: "${dataToPost.reference}"`);
    if (!uploadedFile) {
        addMessage("Error: Cannot post without a file.", 'ai', 'invoice');
        setStatus('error');
        return;
    }

    const payload: InvoiceData = JSON.parse(JSON.stringify(dataToPost));

    try {
        const base64Data = await fileToBase64(uploadedFile);
        if (payload.bill_attachments && payload.bill_attachments.length > 0) {
            payload.bill_attachments[0].data = base64Data;
        } else {
            payload.bill_attachments = [{ filename: uploadedFile.name, mimetype: uploadedFile.type, data: base64Data }];
        }

        // Display the payload being sent in a new chat message. This replaces the "Thinking..." message.
        addMessage(
            "Here is the JSON payload being sent to the API.",
            'ai',
            'invoice',
            { showRequestPayload: payload }
        );

        // Add a new loading message for the API call itself, which will be replaced by the result.
        addMessage("Posting to API...", 'ai', 'invoice', { isLoading: true });

        const CORS_PROXY = "https://corsproxy.io/?";
        const API_ENDPOINT = "https://stagefin.spaero.sa/get_bill/spa_gpt_webhook";
        const API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55Ijoic3BhIiwicHVycG9zZSI6ImhlbH";

        const response = await fetch(`${CORS_PROXY}${API_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_TOKEN,
            },
            body: JSON.stringify(payload),
        });

        let responseBody;
        try {
            responseBody = await response.json();
        } catch (e) {
            responseBody = { error: 'Invalid JSON response from server', content: await response.text() };
        }

        if (!response.ok) {
             addMessage(`Failed to post data. Server responded with status ${response.status}.`, 'ai', 'invoice', { apiResponse: { success: false, body: responseBody } });
             setStatus('error');
             return;
        }

        // Success
        const newHistoryEntry: InvoiceHistoryEntry = { reference: payload.reference, vendor_name: payload.vendor_name!, processedDate: new Date().toISOString(), totalAmount: payload.product_lines.reduce((acc: number, item: ProductLine) => acc + item.quantity * item.unit_price * (1 - item.discount), 0), currency: payload.currency, isPosted: true };
        setHistory(prev => [...prev, newHistoryEntry]);
        addMessage("Data posted successfully.", 'ai', 'invoice', { apiResponse: { success: true, body: responseBody } });
        logActivity(`Successfully posted invoice: "${payload.reference}"`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown network or script error occurred.";
        addMessage('An error occurred during the post process.', 'ai', 'invoice', { apiResponse: { success: false, body: { error: errorMessage } } });
        setStatus('error');
    }
  };

  const handleSendMessage = async (message: string) => {
    setStatus('processing'); addMessage(message, 'user', mode); addMessage('Thinking...', 'ai', mode, { isLoading: true });
    logActivity(`Sent message in ${mode.replace('_', ' ')}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    try {
      if (mode === 'qa') { const response = await getQAResponse(message); addMessage(response, 'ai', 'qa'); } 
      else if (mode === 'document_qa') {
        if (!docQAFile) { addMessage("Please upload a document before asking questions.", 'ai', 'document_qa'); return; }
        const response = await getDocQAResponse(message, docQAFile); addMessage(response, 'ai', 'document_qa');
      } else if (mode === 'invoice') { await handleInvoiceCommands(message); }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addMessage(`**Error:** ${errorMessage}`, 'ai', mode); logActivity(`Error in ${mode.replace('_', ' ')}: ${errorMessage}`);
    } finally { setStatus('idle'); }
  };

  const handleInvoiceCommands = async (message: string) => {
    if (conversationStage === 'awaiting_vendor_name') {
        if (invoiceData) {
            const updatedData = { ...invoiceData, vendor_name: message.trim() };
            setInvoiceData(updatedData);
            addMessage(`Vendor name set to **${message.trim()}**.`, 'ai', 'invoice');
            addMessage("Here is the updated data. Review it.", 'ai', 'invoice', { showInvoice: true });

            // Always ask the RSAF question next.
            setConversationStage('awaiting_rsaf_confirmation');
            addMessage("Is this an RSAF bill?", 'ai', 'invoice');
        }
        return;
    }

    if (conversationStage === 'awaiting_fsr_id') {
      if (invoiceData) {
        const updatedData = { ...invoiceData, fsr_id: message.trim() }; setInvoiceData(updatedData);
        addMessage(`FSR ID set to **${message.trim()}**. You can now add routing details.`, 'ai', 'invoice', { showAirportSelector: true });
        setConversationStage('awaiting_routing_details');
      } return; 
    }
    
    const command = message.toLowerCase().trim();
    if (command.includes('extract')) {
      if (!uploadedFile) { addMessage("Please upload an invoice file first.", 'ai', 'invoice'); return; }
      addMessage('AI is analyzing and extracting the invoice...', 'ai', 'invoice');
      try {
        const data = await extractInvoiceDetails(uploadedFile);
        // Ensure approvers are cleared to enforce manual selection
        const cleanedData = { ...data, approver_level1: null, approver_level2: null, approver_level3: null };
        setInvoiceData(cleanedData);
        addMessage("I've extracted the following details. Please review them.", 'ai', 'invoice', { showInvoice: true });

        if (!cleanedData.vendor_name) {
          addMessage("I couldn't find a vendor name. Please enter it below.", 'ai', 'invoice');
          setConversationStage('awaiting_vendor_name');
        } else {
          // Always ask the RSAF question if vendor name is present.
          addMessage("Is this an RSAF bill?", 'ai', 'invoice');
          setConversationStage('awaiting_rsaf_confirmation');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during extraction.";
        addMessage(`**Error during extraction:** ${errorMessage}`, 'ai', 'invoice');
      }
    } else if (command.includes('post')) {
      if (!invoiceData) { addMessage("Please extract invoice details first.", 'ai', 'invoice'); return; }
      if (conversationStage !== 'idle') { addMessage("Please complete the current conversation step before posting.", 'ai', 'invoice'); return; }
      await executePost(invoiceData);
    } else if (command.includes('ai agentic')) {
      addMessage("Opening the AI Agentic Portal in a new tab.", 'ai', 'invoice', { isAgenticLink: true });
    } else {
      addMessage("Unknown command. Available commands: 'extract invoice details', 'post'.", 'ai', 'invoice');
    }
  };

  const handleConfirmRsaf = (confirmed: boolean) => {
    if (!invoiceData) return;
    const updatedData = { ...invoiceData, rsaf_bill: confirmed };
    setInvoiceData(updatedData);
    addMessage(`You selected: **${confirmed ? 'Yes' : 'No'}**`, 'user', 'invoice');

    if (confirmed) {
      addMessage("Please enter the FSR ID.", 'ai', 'invoice');
      setConversationStage('awaiting_fsr_id');
    } else {
      // For non-RSAF bills, we still need a service type identifier to satisfy the API.
      // Show the service details selector.
      addMessage("Please specify the service details for this invoice.", 'ai', 'invoice', { showAirportSelector: true });
      setConversationStage('awaiting_routing_details');
    }
  };

  const handleSaveRoutingDetails = (details: { service_type: string; departure_iata: string | null; departure_icao: string | null; arrival_iata: string | null; arrival_icao: string | null; }) => {
    if (!invoiceData) return;
    
    // Base updates
    let updatedData: InvoiceData = {
        ...invoiceData,
        service_type: details.service_type,
        departure_iata: details.departure_iata,
        departure_icao: details.departure_icao,
        arrival_iata: details.arrival_iata,
        arrival_icao: details.arrival_icao,
        // Reset all service-specific IDs
        ht_id: null,
        ir_id: null,
        cr_id: null,
        gs_id: null,
    };

    // Set the specific ID based on service type
    switch (details.service_type) {
        case 'hotel':
            updatedData.ht_id = 21; // Set fixed ht_id for hotel
            break;
        case 'insurance':
            updatedData.ir_id = true;
            break;
        case 'catering':
            updatedData.cr_id = true;
            break;
        case 'ground_service':
            updatedData.gs_id = true;
            break;
        default:
            break;
    }

    setInvoiceData(updatedData);
    setInvoiceMessages(prev => prev.filter(m => !m.showAirportSelector));
    addMessage('Routing details saved. Please select the approvers.', 'ai', 'invoice', { showApproverSelector: true });
    setConversationStage('awaiting_approver_selection');
  };

  const handleSaveApprovers = (details: { approver_level1: number | null; approver_level2: number | null; approver_level3: number | null; }) => {
      if (!invoiceData) return;
      setInvoiceData({ ...invoiceData, ...details });
      setInvoiceMessages(prev => prev.filter(m => !m.showApproverSelector));
      addMessage('Approvers have been selected. You can now post the invoice.', 'ai', 'invoice');
      setConversationStage('idle');
  };
  
  if (authStatus === 'pending') {
    return <div className="h-screen w-screen bg-slate-100 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-300 border-t-sky-500 rounded-full animate-spin"></div></div>;
  }
  
  if (authStatus !== 'authenticated') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        mode={mode} 
        onModeChange={handleModeChange} 
        userProfile={userProfile} 
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfileModal(true)}
      />
      {showProfileModal && (
        <UserProfileModal 
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            userProfile={userProfile}
            onUpdateProfile={(p) => setUserProfile(p)}
            userSettings={userSettings}
            onUpdateSettings={(s) => { 
                setUserSettings(s);
                if (s.theme !== userSettings.theme) {
                    logActivity(`Changed theme to ${s.theme}.`);
                }
            }}
            activityLog={activityLog}
            allUsers={allUsers}
        />
      )}
      <main className="flex-grow min-h-0">
        {mode === 'invoice' && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              <div className="lg:col-span-1 h-full min-h-0">
                <ControlPanel
                  uploadedFile={uploadedFile}
                  onFileUpload={(file) => handleFileUpload(file, 'invoice')}
                  status={status}
                  onClearSession={handleClearSession}
                  onViewHistory={() => setShowHistoryModal(true)}
                  onSendCommand={handleSendCommand}
                  invoiceData={invoiceData}
                />
              </div>
              <div className="lg:col-span-2 h-full min-h-0">
                <ChatWindow
                  messages={invoiceMessages}
                  onSendMessage={handleSendMessage}
                  onConfirmRsaf={handleConfirmRsaf}
                  onSaveRoutingDetails={handleSaveRoutingDetails}
                  onSaveApprovers={handleSaveApprovers}
                  status={status}
                  invoiceData={invoiceData}
                  placeholder={
                    conversationStage === 'awaiting_vendor_name' ? 'Enter vendor name...' :
                    conversationStage === 'awaiting_fsr_id' ? 'Enter FSR ID...' :
                    'Type a command or message...'
                  }
                  conversationStage={conversationStage}
                />
              </div>
            </div>
            {showHistoryModal && <HistoryModal history={history} onClose={() => setShowHistoryModal(false)} onClearHistory={() => { setHistory([]); logActivity('Cleared all invoice history.'); }} />}
          </div>
        )}
        {mode === 'dashboard' && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full py-6">
              <Dashboard history={history} />
          </div>
        )}
        {mode === 'qa' && (
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl h-full py-6">
               <QAChatWindow messages={qaMessages} onSendMessage={handleSendMessage} status={status} />
           </div>
        )}
        {mode === 'document_qa' && (
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl h-full py-6">
                 <DocumentQAChatWindow 
                    messages={docQAMessages} 
                    onSendMessage={handleSendMessage} 
                    status={status}
                    docQAFile={docQAFile}
                    onDocFileUpload={(file) => handleFileUpload(file, 'doc_qa')}
                 />
             </div>
        )}
        {mode === 'admin' && userProfile.is_admin && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full py-6">
            <AdminPanel 
                allUsers={allUsers}
                activityLog={activityLog}
                currentUserEmail={userProfile.email}
                onCreateUser={handleCreateUser}
                onToggleUserStatus={handleToggleUserStatus}
                onToggleAdminStatus={handleToggleAdminStatus}
                onDeleteUser={handleDeleteUser}
                onResetPassword={handleResetPassword}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;