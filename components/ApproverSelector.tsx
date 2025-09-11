import React, { useState, useEffect } from 'react';
import { fetchApprovers } from '../services/geminiService';
import type { Approver } from '../types';

interface ApproverSelectorProps {
    onSave: (details: {
        approver_level1: number | null;
        approver_level2: number | null;
        approver_level3: number | null;
    }) => void;
}

export const ApproverSelector: React.FC<ApproverSelectorProps> = ({ onSave }) => {
    const [approversL1, setApproversL1] = useState<Approver[]>([]);
    const [approversL2, setApproversL2] = useState<Approver[]>([]);
    const [approversL3, setApproversL3] = useState<Approver[]>([]);
    
    const [selectedL1, setSelectedL1] = useState<string>('');
    const [selectedL2, setSelectedL2] = useState<string>('');
    const [selectedL3, setSelectedL3] = useState<string>('');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadApprovers = async () => {
            try {
                setLoading(true);
                setError(null);
                const [l1, l2, l3] = await Promise.all([
                    fetchApprovers(1),
                    fetchApprovers(2),
                    fetchApprovers(3)
                ]);
                setApproversL1(l1);
                setApproversL2(l2);
                setApproversL3(l3);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load approvers.');
            } finally {
                setLoading(false);
            }
        };
        loadApprovers();
    }, []);

    const handleSave = () => {
        onSave({
            approver_level1: selectedL1 ? parseInt(selectedL1, 10) : null,
            approver_level2: selectedL2 ? parseInt(selectedL2, 10) : null,
            approver_level3: selectedL3 ? parseInt(selectedL3, 10) : null,
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48 bg-white/20 p-4 rounded-2xl border border-slate-300/70 my-4">
                <div className="flex items-center space-x-2 text-slate-600">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-sky-500 rounded-full animate-spin"></div>
                    <span>Loading approvers...</span>
                </div>
            </div>
        );
    }
    
    if (error) {
        return <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg text-sm my-4">{error}</div>;
    }

    const renderDropdown = (level: number, approvers: Approver[], value: string, setter: (val: string) => void) => (
        <div>
            <label htmlFor={`approver-l${level}`} className="block text-sm font-medium text-slate-700 mb-2">Approver Level {level}</label>
            <select 
                id={`approver-l${level}`} 
                value={value} 
                onChange={e => setter(e.target.value)} 
                className="w-full bg-white/80 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"
            >
                <option value="">-- Optional --</option>
                {approvers.map(approver => (
                    <option key={approver.id} value={approver.id}>{approver.user_name} (ID: {approver.id})</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="bg-white/20 p-4 rounded-2xl border border-slate-300/70 my-4 space-y-4">
            <h3 className="text-base font-semibold text-slate-800">Assign Approvers</h3>
            {renderDropdown(1, approversL1, selectedL1, setSelectedL1)}
            {renderDropdown(2, approversL2, selectedL2, setSelectedL2)}
            {renderDropdown(3, approversL3, selectedL3, setSelectedL3)}
            <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                <button onClick={handleSave} className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all shadow">Save Approvers</button>
            </div>
        </div>
    );
};