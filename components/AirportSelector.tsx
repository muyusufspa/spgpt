import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchAirports } from '../services/geminiService';
import type { Airport } from '../types';

// --- Props ---
interface AirportSelectorProps {
    onSave: (details: {
        service_type: string;
        departure_iata: string | null;
        departure_icao: string | null;
        arrival_iata: string | null;
        arrival_icao: string | null;
        selected_airports_count: number;
    }) => void;
}

// --- Local Hooks ---
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


// --- Icons ---
const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);
const PlaneTakeoffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
);
const PlaneLandingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364 6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" />
    </svg>
);


// --- Main Component ---
export const AirportSelector: React.FC<AirportSelectorProps> = ({ onSave }) => {
    const [serviceType, setServiceType] = useState('');
    const [airports, setAirports] = useState<Airport[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 250);
    
    const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
    const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
    const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;
    
    const tableContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!serviceType) return;
        
        const loadAirports = async () => {
            setLoading(true);
            setError(null);
            setAirports([]);
            setSelectedAirport(null);
            try {
                const data = await fetchAirports();
                setAirports(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };
        loadAirports();
    }, [serviceType]);
    
     useEffect(() => {
        setCurrentPage(1); // Reset page when search query changes
        setSelectedAirport(null);
        tableContainerRef.current?.scrollTo(0, 0);
    }, [debouncedSearchQuery]);

    const filteredAirports = useMemo(() => {
        if (!debouncedSearchQuery) return airports;
        const lowercasedQuery = debouncedSearchQuery.toLowerCase();
        return airports.filter(airport => 
            airport.name.toLowerCase().includes(lowercasedQuery) ||
            airport.city_en.toLowerCase().includes(lowercasedQuery) ||
            airport.country.toLowerCase().includes(lowercasedQuery) ||
            airport.iata.toLowerCase().includes(lowercasedQuery) ||
            airport.icao.toLowerCase().includes(lowercasedQuery)
        );
    }, [airports, debouncedSearchQuery]);

    const paginatedAirports = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAirports.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAirports, currentPage, itemsPerPage]);
    
    const totalPages = Math.ceil(filteredAirports.length / itemsPerPage);

    const handleSave = () => {
        let count = 0;
        if (departureAirport) count++;
        if (arrivalAirport) count++;
        
        onSave({
            service_type: serviceType,
            departure_iata: departureAirport?.iata || null,
            departure_icao: departureAirport?.icao || null,
            arrival_iata: arrivalAirport?.iata || null,
            arrival_icao: arrivalAirport?.icao || null,
            selected_airports_count: count
        });
    };
    
    const SelectionPanel = () => (
        <div className="flex flex-col gap-4 p-4 bg-white/30 rounded-2xl border border-slate-200/50">
            <div>
                <h4 className="text-xs text-slate-500 font-semibold mb-1">Departure</h4>
                {departureAirport ? (
                    <div className="text-sm">
                        <p className="font-bold text-slate-800">{departureAirport.iata} / {departureAirport.icao}</p>
                        <p className="text-slate-600 truncate">{departureAirport.name}</p>
                    </div>
                ) : <p className="text-sm text-slate-400 italic">Not set</p>}
            </div>
            <div>
                <h4 className="text-xs text-slate-500 font-semibold mb-1">Arrival</h4>
                {arrivalAirport ? (
                    <div className="text-sm">
                        <p className="font-bold text-slate-800">{arrivalAirport.iata} / {arrivalAirport.icao}</p>
                        <p className="text-slate-600 truncate">{arrivalAirport.name}</p>
                    </div>
                ) : <p className="text-sm text-slate-400 italic">Not set</p>}
            </div>
        </div>
    );
    
    return (
        <div className="bg-white/20 p-4 rounded-2xl border border-slate-300/70 my-4 space-y-4">
            <div>
                <label htmlFor="service-type" className="block text-sm font-medium text-slate-700 mb-2">1. Select Service Type</label>
                <select id="service-type" value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full bg-white/80 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none">
                    <option value="" disabled>-- Please choose an option --</option>
                    <option value="hotel">Hotel</option>
                    <option value="insurance">Insurance</option>
                    <option value="catering">Catering</option>
                    <option value="ground_service">Ground Service</option>
                </select>
            </div>
            
            {loading && (
                <div className="flex justify-center items-center h-48">
                    <div className="flex items-center space-x-2 text-slate-600"><div className="w-4 h-4 border-2 border-slate-400 border-t-sky-500 rounded-full animate-spin"></div><span>Loading airports...</span></div>
                </div>
            )}
            
            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg text-sm">{error}</div>
            )}
            
            {!loading && !error && serviceType && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left/Main Panel */}
                    <div className="lg:col-span-2 space-y-3">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"/>
                            <input type="text" placeholder="Search airports (name, city, code...)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/80 border border-slate-300 rounded-lg p-2 pl-10 text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"/>
                        </div>
                        <div ref={tableContainerRef} className="overflow-y-auto h-80 border border-slate-200/80 rounded-lg bg-white/30 custom-scrollbar">
                           <table className="w-full text-sm text-left">
                               <thead className="sticky top-0 bg-white/50 backdrop-blur-sm"><tr className="border-b border-slate-200/80"><th className="p-2 font-semibold text-slate-600">Airport</th><th className="p-2 font-semibold text-slate-600">City</th><th className="p-2 font-semibold text-slate-600">Country</th><th className="p-2 font-semibold text-slate-600">IATA/ICAO</th></tr></thead>
                               <tbody>
                                   {paginatedAirports.map(airport => (
                                       <tr key={airport.id} onClick={() => setSelectedAirport(airport)} className={`cursor-pointer hover:bg-sky-100/50 transition-colors ${selectedAirport?.id === airport.id ? 'bg-sky-200/60' : ''}`}>
                                           <td className="p-2 text-slate-700 font-medium truncate max-w-xs">{airport.name}</td><td className="p-2 text-slate-600">{airport.city_en} / {airport.city_ar}</td><td className="p-2 text-slate-600">{airport.country}</td><td className="p-2 text-slate-700 font-mono">{airport.iata}/{airport.icao}</td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                        </div>
                         {/* Pagination */}
                        <div className="flex justify-between items-center text-xs text-slate-600">
                            <p>Page {currentPage} of {totalPages}</p>
                            <div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 border rounded disabled:opacity-50">Next</button></div>
                        </div>
                    </div>
                    {/* Right/Selection Panel */}
                    <div className="space-y-3">
                        <SelectionPanel />
                        <div className="flex flex-col gap-2">
                             <button onClick={() => setDepartureAirport(selectedAirport)} disabled={!selectedAirport} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:bg-slate-400 transition-colors"><PlaneTakeoffIcon className="w-5 h-5"/> Set as Departure</button>
                             <button onClick={() => setArrivalAirport(selectedAirport)} disabled={!selectedAirport} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:bg-slate-400 transition-colors"><PlaneLandingIcon className="w-5 h-5"/> Set as Arrival</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Save Button */}
            <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                <button onClick={handleSave} disabled={!serviceType} className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 transition-all shadow">Save & Continue</button>
            </div>
        </div>
    );
};