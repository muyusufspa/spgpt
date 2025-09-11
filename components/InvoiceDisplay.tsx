import React from 'react';
import type { InvoiceData } from '../types';

interface InvoiceDisplayProps {
  data: InvoiceData;
}

export const InvoiceDisplay: React.FC<InvoiceDisplayProps> = ({ data }) => {
  const totalAmount = data.product_lines.reduce((acc, item) => acc + (item.quantity * item.unit_price * (1 - item.discount)), 0);

  const departureText = [data.departure_iata, data.departure_icao].filter(Boolean).join(' / ') || 'N/A';
  const arrivalText = [data.arrival_iata, data.arrival_icao].filter(Boolean).join(' / ') || 'N/A';

  return (
    <div className="bg-white/20 p-6 rounded-2xl border border-slate-300/70 my-4 backdrop-blur-sm">
      <div className="flex justify-between items-start pb-4 border-b border-slate-300/70">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Invoice Summary</h3>
          <p className="text-sm text-slate-600">Vendor: <span className="text-slate-800 font-medium">{data.vendor_name}</span></p>
        </div>
        <div className="text-right">
            <p className="font-mono text-xs text-slate-500">Reference #</p>
            <p className="font-semibold text-slate-800">{data.reference}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-300/70">
        <div>
            <p className="text-xs text-slate-600">Bill Date</p>
            <p className="text-sm font-medium text-slate-800">{data.bill_date.split(' ')[0]}</p>
        </div>
         <div>
            <p className="text-xs text-slate-600">Payment Terms</p>
            <p className="text-sm font-medium text-slate-800">{data.payment_terms}</p>
        </div>
         <div className="sm:text-right">
            <p className="text-xs text-slate-600">Currency</p>
            <p className="text-sm font-medium text-slate-800">{data.currency}</p>
        </div>
        <div className="sm:text-right">
            <p className="text-xs text-slate-600">Total Amount</p>
            <p className="text-lg font-bold text-blue-700">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
      
      {/* Classification & Details Section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-300/70">
         <div>
            <p className="text-xs text-slate-600">RSAF Bill</p>
            <p className="text-sm font-medium text-slate-800">{data.rsaf_bill ? 'Yes' : 'No'}</p>
        </div>
        <div>
            <p className="text-xs text-slate-600">FSR ID</p>
            <p className="text-sm font-medium text-slate-800">{data.fsr_id || 'N/A'}</p>
        </div>
        <div>
            <p className="text-xs text-slate-600">Service Type</p>
            <p className="text-sm font-medium text-slate-800 capitalize">{data.service_type || 'N/A'}</p>
        </div>
         <div>
            <p className="text-xs text-slate-600">Attachment</p>
            <p className="text-sm font-medium text-slate-800 truncate">{data.bill_attachments[0]?.filename || 'N/A'}</p>
        </div>
      </div>

      {/* Routing & Approvals Section */}
      {(data.departure_iata || data.arrival_iata || data.approver_level1 !== null || data.approver_level2 !== null || data.approver_level3 !== null) &&
        <div className="py-4 border-b border-slate-300/70">
          <h4 className="text-base font-semibold text-slate-900 mb-2">Routing & Approvals</h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-slate-600">Departure</p>
              <p className="text-sm font-medium text-slate-800">{departureText}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Arrival</p>
              <p className="text-sm font-medium text-slate-800">{arrivalText}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Approver L1</p>
              <p className="text-sm font-medium text-slate-800">{data.approver_level1 || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Approver L2</p>
              <p className="text-sm font-medium text-slate-800">{data.approver_level2 || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Approver L3</p>
              <p className="text-sm font-medium text-slate-800">{data.approver_level3 || 'N/A'}</p>
            </div>
          </div>
        </div>
      }

      <div className="mt-4 overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/20">
            <tr>
              <th className="p-3 font-semibold text-slate-700 rounded-l-lg">Product / Service</th>
              <th className="p-3 font-semibold text-slate-700 text-center">Qty</th>
              <th className="p-3 font-semibold text-slate-700 text-right">Unit Price</th>
              <th className="p-3 font-semibold text-slate-700 text-center">Discount</th>
              <th className="p-3 font-semibold text-slate-700 text-center">Tail #</th>
              <th className="p-3 font-semibold text-slate-700 text-center">Tax</th>
              <th className="p-3 font-semibold text-slate-700 text-right rounded-r-lg">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {data.product_lines.map((item, index) => (
              <tr key={index} className="border-b border-slate-300/50 last:border-b-0">
                <td className="p-3 text-slate-800">{item.product_name}</td>
                <td className="p-3 text-slate-600 text-center">{item.quantity}</td>
                <td className="p-3 text-slate-600 text-right font-mono">{item.unit_price.toFixed(2)}</td>
                <td className="p-3 text-slate-600 text-center font-mono">{item.discount > 0 ? `${(item.discount * 100).toFixed(0)}%` : '-'}</td>
                <td className="p-3 text-slate-600 text-center font-mono">{item.spa_aircraft_tail_number || '-'}</td>
                <td className="p-3 text-slate-600 text-center">{item.tax}</td>
                <td className="p-3 text-slate-800 font-medium text-right font-mono">{(item.quantity * item.unit_price * (1-item.discount)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};