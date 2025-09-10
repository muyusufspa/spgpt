import React, { useState, useMemo, useEffect } from 'react';
import type { MockDbUser, ActivityEntry } from '../types';

// --- Component Props ---
interface AdminPanelProps {
    allUsers: MockDbUser[];
    activityLog: ActivityEntry[];
    currentUserEmail: string;
    onCreateUser: (newUser: { username: string; password: string; isAdmin: boolean, isActive: boolean }) => Promise<{ success: boolean; message: string }>;
    onToggleUserStatus: (userId: number) => void;
    onToggleAdminStatus: (userId: number) => void;
    onDeleteUser: (userId: number) => Promise<{ success: boolean; message: string }>;
    onResetPassword: (userId: number) => void;
}

// --- Icons (co-located for simplicity) ---
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.253 9.5 9.5 0 0 0-1.025-5.172 9.337 9.337 0 0 0-2.253-4.121m-6.375 9.375a9.375 9.375 0 0 1-4.121-2.253 9.5 9.5 0 0 1-5.172-1.025 9.337 9.337 0 0 1-2.253-4.121m11.625 6.375a9.375 9.375 0 0 0-4.121-2.253 9.5 9.5 0 0 0-5.172-1.025 9.337 9.337 0 0 0-4.121 2.253m11.625 6.375 2.25-2.25m0 0a9.375 9.375 0 0 1 2.253-4.121 9.5 9.5 0 0 1 1.025-5.172 9.337 9.337 0 0 1-2.253-4.121m-6.375-9.375a9.375 9.375 0 0 0-4.121 2.253 9.5 9.5 0 0 0-5.172 1.025 9.337 9.337 0 0 0-2.253 4.121m11.625-6.375-2.25 2.25m0 0a9.375 9.375 0 0 0-2.253 4.121 9.5 9.5 0 0 0-1.025 5.172 9.337 9.337 0 0 0 2.253 4.121" />
    </svg>
);
const ActivityLogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);
const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM4.5 1.5L4.5 12h3v6m-3-6h3m-3 0h-3m3 0v6m6-6v6m6-6v6m-6-6h3v6m-3-6h-3" />
    </svg>
);
const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
);
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);
const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


// --- Helper Functions ---
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

interface ParsedActivity { module: string; action: string; subject: string; }
const moduleNameMap: { [key: string]: string } = {
    'invoice': 'Invoice Processor', 'qa': 'Q&A Assistant', 'document qa': 'Document Q&A',
    'dashboard': 'Dashboard', 'admin': 'Admin Panel',
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

// --- Main Component ---
export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    allUsers, activityLog, currentUserEmail, onCreateUser, 
    onToggleUserStatus, onToggleAdminStatus, onDeleteUser, onResetPassword
}) => {
    const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');
    const [userToDelete, setUserToDelete] = useState<MockDbUser | null>(null);

    // --- Activity Log State & Memos ---
    const [activityUserFilter, setActivityUserFilter] = useState<string>('all');
    const [activityModuleFilter, setActivityModuleFilter] = useState<string>('all');
    const [activityStartDate, setActivityStartDate] = useState('');
    const [activityEndDate, setActivityEndDate] = useState('');
    const [activityPage, setActivityPage] = useState(1);
    const ACTIVITY_PAGE_SIZE = 25;
    const parsedActivities = useMemo(() => activityLog.map(log => ({ ...log, ...parseActivityAction(log) })), [activityLog]);
    const allModules = useMemo(() => [...new Set(parsedActivities.map(log => log.module))].sort(), [parsedActivities]);
    const filteredAllActivity = useMemo(() => {
        return parsedActivities.filter(log => {
            if (activityUserFilter !== 'all' && log.user !== activityUserFilter) return false;
            if (activityModuleFilter !== 'all' && log.module !== activityModuleFilter) return false;
            const logDate = new Date(log.timestamp);
            if (activityStartDate && logDate < new Date(activityStartDate + 'T00:00:00')) return false;
            if (activityEndDate && logDate > new Date(activityEndDate + 'T23:59:59')) return false;
            return true;
        });
    }, [parsedActivities, activityUserFilter, activityModuleFilter, activityStartDate, activityEndDate]);
    const paginatedAllActivity = useMemo(() => {
        const startIndex = (activityPage - 1) * ACTIVITY_PAGE_SIZE;
        return filteredAllActivity.slice(startIndex, startIndex + ACTIVITY_PAGE_SIZE);
    }, [filteredAllActivity, activityPage]);

    // --- User Management State & Memos ---
    const [userManagementSubTab, setUserManagementSubTab] = useState<'manage' | 'create'>('manage');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    type SortableKey = keyof MockDbUser | 'role' | 'status';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'asc' });
    const [userManagementPage, setUserManagementPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isNewUserAdmin, setIsNewUserAdmin] = useState(false);
    const [isNewUserActive, setIsNewUserActive] = useState(true);
    const [userCreationMessage, setUserCreationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const isUsernameTaken = useMemo(() => {
        if (!newUsername) return false;
        return allUsers.some(user => user.username.toLowerCase() === newUsername.toLowerCase());
    }, [newUsername, allUsers]);

    const sortedFilteredUsers = useMemo(() => {
        let filtered = [...allUsers];
        if (roleFilter !== 'all') { filtered = filtered.filter(u => (roleFilter === 'admin' ? u.is_admin === 1 : u.is_admin === 0)); }
        if (statusFilter !== 'all') { filtered = filtered.filter(u => (statusFilter === 'active' ? u.is_active === 1 : u.is_active === 0)); }
        if (searchQuery) { filtered = filtered.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())); }
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if (sortConfig.key === 'role') { aValue = a.is_admin; bValue = b.is_admin; } 
                else if (sortConfig.key === 'status') { aValue = a.is_active; bValue = b.is_active; } 
                else { aValue = a[sortConfig.key as keyof MockDbUser]; bValue = b[sortConfig.key as keyof MockDbUser]; }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [allUsers, roleFilter, statusFilter, searchQuery, sortConfig]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (userManagementPage - 1) * itemsPerPage;
        return sortedFilteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedFilteredUsers, userManagementPage, itemsPerPage]);

    // --- Handlers ---
    const handleSort = (key: SortableKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') { direction = 'desc'; }
        setSortConfig({ key, direction });
    };

    const handleCreateUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserCreationMessage(null);
        if (newPassword.length < 8) { setUserCreationMessage({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
        if (isUsernameTaken) { setUserCreationMessage({ type: 'error', text: 'Username is already taken.' }); return; }
        const result = await onCreateUser({ username: newUsername, password: newPassword, isAdmin: isNewUserAdmin, isActive: isNewUserActive });
        setUserCreationMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) {
            setNewUsername(''); setNewPassword(''); setIsNewUserAdmin(false); setIsNewUserActive(true);
            setTimeout(() => { setUserCreationMessage(null); setUserManagementSubTab('manage'); }, 1500);
        }
    };
    
    const renderSortArrow = (key: SortableKey) => {
        if (sortConfig?.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1" /> : <ChevronDownIcon className="w-3 h-3 ml-1" />;
    };

    const tabs = [
        { id: 'users', name: 'User Management', icon: UsersIcon },
        { id: 'activity', name: 'Activity Log', icon: ActivityLogIcon },
    ];
    
    return (
        <div className="h-full flex flex-col glass-card rounded-2xl p-4 sm:p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Admin Panel</h2>

            <div className="flex-shrink-0 border-b border-slate-300/60">
                <div className="flex items-center space-x-2">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${activeTab === tab.id ? 'border-b-2 border-sky-500 text-sky-700' : 'text-slate-600 hover:bg-sky-100/70'}`}
                        >
                        <tab.icon className="w-5 h-5" />
                        {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar pt-6">
                {activeTab === 'users' && (
                    <div>
                        <div className="flex border-b border-slate-300 text-sm font-medium text-center text-slate-500">
                            <button onClick={() => setUserManagementSubTab('manage')} className={`flex-shrink-0 p-3 border-b-2 ${userManagementSubTab === 'manage' ? 'text-sky-600 border-sky-600' : 'border-transparent hover:text-slate-700 hover:border-slate-300 transition-colors'}`}>Manage Users</button>
                            <button onClick={() => setUserManagementSubTab('create')} className={`flex-shrink-0 p-3 border-b-2 ${userManagementSubTab === 'create' ? 'text-sky-600 border-sky-600' : 'border-transparent hover:text-slate-700 hover:border-slate-300 transition-colors'}`}>Create New User</button>
                        </div>

                        {userManagementSubTab === 'manage' && (
                            <div className="pt-6">
                                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                    <input type="text" placeholder="Search by username..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setUserManagementPage(1); }} className="flex-grow bg-white/80 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"/>
                                    <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value as any); setUserManagementPage(1); }} className="bg-white/80 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"><option value="all">All Roles</option><option value="admin">Admins</option><option value="user">Users</option></select>
                                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setUserManagementPage(1); }} className="bg-white/80 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"><option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-slate-700">
                                        <thead className="text-xs text-slate-800 uppercase bg-white/40">
                                            <tr>{[{label: 'ID', key: 'id'}, {label: 'Username', key: 'username'}, {label: 'Role', key: 'role'}, {label: 'Status', key: 'status'}, {label: 'Last Login', key: 'last_login_at'}, {label: 'Created', key: 'created_at'}, {label: 'Actions', key: null}].map(h => (<th key={h.key || 'actions'} scope="col" className="p-3">{h.key ? <button onClick={() => handleSort(h.key as SortableKey)} className="flex items-center hover:text-sky-600">{h.label}{renderSortArrow(h.key as SortableKey)}</button> : h.label}</th>))}</tr>
                                        </thead>
                                        <tbody>
                                            {paginatedUsers.map(user => (
                                                <tr key={user.id} className="bg-white/20 border-b border-slate-300/50 hover:bg-white/50">
                                                    <td className="p-3 font-medium text-slate-900">{user.id}</td>
                                                    <td className="p-3">{user.username}</td>
                                                    <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.is_admin ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'}`}>{user.is_admin ? 'Admin' : 'User'}</span></td>
                                                    <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                                                    <td className="p-3" title={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}>{timeAgo(user.last_login_at)}</td>
                                                    <td className="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
                                                    <td className="p-3">
                                                        <div className="flex space-x-2">
                                                            <button onClick={() => onResetPassword(user.id)} title="Reset Password" className="text-slate-500 hover:text-amber-600"><KeyIcon className="w-5 h-5" /></button>
                                                            <button onClick={() => onToggleUserStatus(user.id)} disabled={user.username === currentUserEmail} title={user.is_active ? 'Disable User' : 'Enable User'} className={`text-slate-500 hover:text-sky-600 disabled:opacity-30 disabled:cursor-not-allowed ${user.is_active ? 'text-emerald-500' : 'text-rose-500'}`}><EyeIcon className="w-5 h-5" /></button>
                                                            <button onClick={() => onToggleAdminStatus(user.id)} disabled={user.username === currentUserEmail} title={user.is_admin ? 'Remove Admin' : 'Make Admin'} className={`text-slate-500 hover:text-sky-600 disabled:opacity-30 disabled:cursor-not-allowed ${user.is_admin ? 'text-sky-500' : 'text-slate-400'}`}><ShieldCheckIcon className="w-5 h-5" /></button>
                                                            <button onClick={() => setUserToDelete(user)} disabled={user.username === currentUserEmail} title="Delete User" className="text-slate-500 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"><TrashIcon className="w-5 h-5" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-between items-center mt-4 text-sm">
                                   <p className="text-slate-600">Showing {Math.min(paginatedUsers.length, itemsPerPage)} of {sortedFilteredUsers.length} users</p>
                                   <div className="flex items-center space-x-2"><button onClick={() => setUserManagementPage(p => Math.max(1, p - 1))} disabled={userManagementPage === 1} className="p-1 rounded-md hover:bg-white/50 disabled:opacity-50">Prev</button><span className="px-2">{userManagementPage}</span><button onClick={() => setUserManagementPage(p => Math.min(Math.ceil(sortedFilteredUsers.length / itemsPerPage), p + 1))} disabled={userManagementPage * itemsPerPage >= sortedFilteredUsers.length} className="p-1 rounded-md hover:bg-white/50 disabled:opacity-50">Next</button></div>
                                </div>
                            </div>
                        )}
                        {userManagementSubTab === 'create' && (
                             <div className="pt-6 max-w-md mx-auto">
                                <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                                    <div><label htmlFor="new-username" className="block text-sm font-medium text-slate-600 mb-1">Username</label><input id="new-username" type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} required className="w-full bg-white/80 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none" />{newUsername && isUsernameTaken && <p className="text-xs text-red-600 mt-1">Username is already taken.</p>}{newUsername && !isUsernameTaken && <p className="text-xs text-emerald-600 mt-1">Username is available.</p>}</div>
                                    <div><label htmlFor="new-password"className="block text-sm font-medium text-slate-600 mb-1">Password</label><input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="w-full bg-white/80 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none" /><p className="text-xs text-slate-500 mt-1">Minimum 8 characters.</p></div>
                                    <div className="flex items-center justify-between pt-2"><div className="flex items-center"><input id="is-admin" type="checkbox" checked={isNewUserAdmin} onChange={e => setIsNewUserAdmin(e.target.checked)} className="h-4 w-4 rounded border-slate-400 text-sky-600 focus:ring-sky-500"/><label htmlFor="is-admin" className="ms-2 block text-sm text-slate-700">Administrator Role</label></div><div className="flex items-center"><input id="is-active" type="checkbox" checked={isNewUserActive} onChange={e => setIsNewUserActive(e.target.checked)} className="h-4 w-4 rounded border-slate-400 text-sky-600 focus:ring-sky-500"/><label htmlFor="is-active" className="ms-2 block text-sm text-slate-700">Active</label></div></div>
                                    <button type="submit" className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-200">Create User</button>
                                    {userCreationMessage && (<div className={`text-sm text-center p-2 rounded-lg ${userCreationMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{userCreationMessage.text}</div>)}
                                </form>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'activity' && (
                     <div className="pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <select value={activityUserFilter} onChange={e => {setActivityUserFilter(e.target.value); setActivityPage(1);}} className="bg-white/80 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"><option value="all">All Users</option>{allUsers.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}</select>
                            <select value={activityModuleFilter} onChange={e => {setActivityModuleFilter(e.target.value); setActivityPage(1);}} className="bg-white/80 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"><option value="all">All Modules</option>{allModules.map(m => <option key={m} value={m}>{m}</option>)}</select>
                            <input type="date" value={activityStartDate} onChange={e => {setActivityStartDate(e.target.value); setActivityPage(1);}} className="bg-white/80 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none" />
                            <input type="date" value={activityEndDate} onChange={e => {setActivityEndDate(e.target.value); setActivityPage(1);}} className="bg-white/80 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none" />
                        </div>
                         {paginatedAllActivity.length > 0 ? ( <>
                             <table className="w-full text-sm text-left text-slate-700">
                                <thead className="text-xs text-slate-800 uppercase bg-white/40"><tr><th className="p-3">Time</th><th className="p-3">User</th><th className="p-3">Module</th><th className="p-3">Action</th><th className="p-3">Subject</th></tr></thead>
                                <tbody>{paginatedAllActivity.map(log => (<tr key={log.id} className="bg-white/20 border-b border-slate-300/50 hover:bg-white/50"><td className="p-3 whitespace-nowrap">{timeAgo(log.timestamp)}</td><td className="p-3">{log.user}</td><td className="p-3">{log.module}</td><td className="p-3">{log.action}</td><td className="p-3 truncate max-w-[200px]">{log.subject}</td></tr>))}</tbody>
                             </table>
                             <div className="flex justify-between items-center mt-4 text-sm">
                                <p className="text-slate-600">Showing {paginatedAllActivity.length} of {filteredAllActivity.length} logs</p>
                                <div className="flex items-center space-x-2"><button onClick={() => setActivityPage(p => Math.max(1, p - 1))} disabled={activityPage === 1} className="p-1 rounded-md hover:bg-white/50 disabled:opacity-50">Prev</button><span className="px-2">{activityPage}</span><button onClick={() => setActivityPage(p => Math.min(Math.ceil(filteredAllActivity.length / ACTIVITY_PAGE_SIZE), p + 1))} disabled={activityPage * ACTIVITY_PAGE_SIZE >= filteredAllActivity.length} className="p-1 rounded-md hover:bg-white/50 disabled:opacity-50">Next</button></div>
                            </div></>
                        ) : (<p className="text-center py-8 text-slate-500">No activity found for the selected filters.</p>)}
                    </div>
                )}
            </div>

            {userToDelete && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setUserToDelete(null)}>
                    <div className="glass-card bg-white/90 p-6 rounded-2xl shadow-lg max-w-sm w-full animate-fade-in" onClick={e => e.stopPropagation()}>
                        <h4 className="text-lg font-bold text-slate-800">Confirm Deletion</h4>
                        <p className="text-slate-600 mt-2 text-sm">Are you sure you want to delete user <strong className="text-slate-900">{userToDelete.username}</strong>? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setUserToDelete(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100/80 transition-colors">Cancel</button>
                            <button onClick={async () => { const result = await onDeleteUser(userToDelete.id); if (!result.success) { alert(`Error: ${result.message}`); } setUserToDelete(null); }} className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors">Delete User</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};