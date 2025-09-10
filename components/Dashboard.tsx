
import React, { useMemo, useEffect, useRef, useState } from 'react';
import type { InvoiceHistoryEntry } from '../types';

// Chart.js and jsPDF are loaded from a CDN in index.html
declare var Chart: any;
declare var jspdf: any;

interface DashboardProps {
  history: InvoiceHistoryEntry[];
}

// --- SVG Icons for Stat Cards ---
const InvoiceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const SpendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const AverageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);
const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);


const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; description: string }> = ({ icon, title, value, description }) => (
    <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-blue-900">{title}</h3>
            <div className="bg-white/50 p-2 rounded-full">
                {icon}
            </div>
        </div>
        <p className="text-3xl font-bold text-slate-800 mt-4">{value}</p>
        <p className="text-xs text-slate-600 mt-1">{description}</p>
    </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ history }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const itemDate = new Date(item.processedDate);
            const start = startDate ? new Date(startDate + 'T00:00:00.000Z') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : null;

            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
        });
    }, [history, startDate, endDate]);

    const dashboardData = useMemo(() => {
        const postedInvoices = filteredHistory.filter(item => item.isPosted);
        const totalPostedValue = postedInvoices.reduce((acc, item) => acc + item.totalAmount, 0);
        const averageInvoiceValue = postedInvoices.length > 0 ? totalPostedValue / postedInvoices.length : 0;
        
        const spendByVendor = postedInvoices.reduce((acc, item) => {
            if (!acc[item.vendor_name]) {
                acc[item.vendor_name] = 0;
            }
            acc[item.vendor_name] += item.totalAmount;
            return acc;
        }, {} as Record<string, number>);

        const sortedVendors = Object.entries(spendByVendor)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        const monthlyTrend = postedInvoices.reduce((acc, item) => {
            const month = new Date(item.processedDate).toISOString().slice(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += item.totalAmount;
            return acc;
        }, {} as Record<string, number>);
        
        const sortedMonths = Object.keys(monthlyTrend).sort();
        const chartLabels = sortedMonths.map(month => new Date(month + '-02').toLocaleString('default', { month: 'short', year: '2-digit' }));
        const chartData = sortedMonths.map(month => monthlyTrend[month]);

        return {
            invoicesInPeriodCount: filteredHistory.length,
            pendingInvoicesCount: filteredHistory.filter(item => !item.isPosted).length,
            totalPostedValue,
            averageInvoiceValue,
            topVendors: sortedVendors,
            trend: {
                labels: chartLabels,
                data: chartData,
            }
        };
    }, [filteredHistory]);
    
    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');
    };
    
    const handleExportPDF = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        const pageTitle = "Invoice Analytics Report";
        const dateRange = (startDate || endDate) 
            ? `Period: ${startDate || 'Start'} to ${endDate || 'Today'}` 
            : 'Period: All Time';

        // --- Header ---
        doc.setFontSize(20);
        doc.text(pageTitle, 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(dateRange, 105, 27, { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 32, { align: 'center' });
        
        // --- Summary Statistics ---
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Summary", 14, 50);
        doc.setLineWidth(0.5);
        doc.line(14, 52, 196, 52);
        
        doc.setFontSize(11);
        const stats = [
            { title: "Invoices Processed:", value: dashboardData.invoicesInPeriodCount },
            { title: "Pending API Post:", value: dashboardData.pendingInvoicesCount },
            { title: "Total Spend (Posted):", value: `SAR ${dashboardData.totalPostedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
            { title: "Average Invoice Value:", value: `SAR ${dashboardData.averageInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }
        ];
        
        let startY = 60;
        stats.forEach((stat, index) => {
            doc.text(stat.title, 14, startY + (index * 8));
            doc.text(String(stat.value), 70, startY + (index * 8));
        });

        // --- Invoice Table ---
        const tableColumn = ["Date", "Vendor", "Reference", "Total Amount", "Status"];
        const tableRows: (string | number)[][] = [];

        filteredHistory.forEach(item => {
            const itemData = [
                new Date(item.processedDate).toLocaleDateString(),
                item.vendor_name,
                item.reference,
                `${item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${item.currency}`,
                item.isPosted ? 'Posted' : 'Pending'
            ];
            tableRows.push(itemData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY + (stats.length * 8) + 5,
            theme: 'striped',
            headStyles: { fillColor: [30, 144, 255] }, // A shade of blue
            didDrawPage: (data: any) => {
                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });
        
        doc.save('invoice-report.pdf');
    };

    useEffect(() => {
        if (!chartRef.current) return;

        const canvas = chartRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        if (!dashboardData.trend.labels.length) return;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); // blue-500
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0.05)'); // sky-500

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dashboardData.trend.labels,
                datasets: [{
                    label: 'Total Invoice Value',
                    data: dashboardData.trend.data,
                    fill: true,
                    backgroundColor: gradient,
                    borderColor: '#3b82f6', // blue-500
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#3b82f6',
                    pointHoverRadius: 7,
                    pointRadius: 5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#0f172a',
                        bodyColor: '#334155',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(100, 116, 139, 0.15)' },
                        ticks: { color: '#475569' } // slate-600
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#475569' } // slate-600
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [dashboardData.trend]);

    const hasDataForPeriod = filteredHistory.length > 0;

    return (
        <div className="space-y-6 animate-fade-in h-full overflow-y-auto custom-scrollbar">
             <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-800">Analytics Dashboard</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-white/60 border border-slate-300/80 text-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        aria-label="Start date"
                    />
                    <span className="text-slate-500">to</span>
                     <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="bg-white/60 border border-slate-300/80 text-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        aria-label="End date"
                    />
                    <button
                        onClick={handleResetFilter}
                        className="px-3 py-2 border border-slate-400/80 rounded-lg text-sm text-slate-600 hover:text-slate-800 hover:bg-white/50 transition-colors duration-200"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={!hasDataForPeriod}
                        className="flex items-center gap-2 px-3 py-2 border border-sky-600/80 bg-sky-600/10 rounded-lg text-sm text-sky-700 hover:text-white hover:bg-sky-600/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400"
                        title={hasDataForPeriod ? "Export data to PDF" : "No data to export"}
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>
            
            {!hasDataForPeriod ? (
                <div className="flex items-center justify-center h-[calc(100vh-300px)] glass-card rounded-2xl">
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold text-slate-800">No Invoice Data</h2>
                        <p className="text-slate-600 mt-2">
                            {history.length === 0 
                                ? "Process an invoice to see your analytics here." 
                                : "No invoices found for the selected period."}
                        </p>
                    </div>
                </div>
            ) : (
             <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        icon={<InvoiceIcon />}
                        title="Invoices Processed" 
                        value={dashboardData.invoicesInPeriodCount}
                        description="Total invoices in the selected period."
                    />
                    <StatCard 
                        icon={<ClockIcon />}
                        title="Pending API Post" 
                        value={dashboardData.pendingInvoicesCount}
                        description="Invoices extracted but not yet posted."
                    />
                    <StatCard 
                        icon={<SpendIcon />}
                        title="Total Spend (Posted)" 
                        value={`SAR ${dashboardData.totalPostedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        description="Total value of all posted invoices."
                    />
                    <StatCard 
                        icon={<AverageIcon />}
                        title="Average Invoice Value" 
                        value={`SAR ${dashboardData.averageInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        description="Average value of a posted invoice."
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 glass-card p-6 rounded-2xl">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Spend by Vendor</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {dashboardData.topVendors.length > 0 ? dashboardData.topVendors.map(([vendor, amount]) => (
                                <div key={vendor} className="flex justify-between items-center bg-white/40 p-3 rounded-lg">
                                    <span className="text-sm text-slate-700 truncate pr-2">{vendor}</span>
                                    <span className="text-sm font-bold text-blue-800 whitespace-nowrap">
                                        {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )) : <p className="text-sm text-slate-500 text-center py-4">No spending data available.</p>}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Spend Trend</h3>
                        <div className="h-96 relative">
                            {dashboardData.trend.data.length > 0 ? (
                                <canvas ref={chartRef}></canvas>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-slate-500">Not enough data to display trend.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
            )}
        </div>
    );
};