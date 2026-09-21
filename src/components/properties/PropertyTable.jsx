import React from 'react';
import { priceLabel, formatINR } from '../../utils/propertyConstants';

/**
 * Reusable Dense & Compact Property Inventory Table
 * Supports slide-drawer detail inspection, deal status switches, 4-icon action buttons, and verification badges.
 */
export default function PropertyTable({
  listings = [],
  currentPage = 1,
  pageSize = 15,
  onViewDetails,
  onPitch,
  onEdit,
  onDelete,
  onToggleDealStatus,
  onToggleVerification,
  isEmployee = false,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90 max-h-[62vh] overflow-y-auto bg-white shadow-2xs">
      <table className="w-full text-left text-xs border-collapse select-none">
        <thead className="sticky top-0 z-10 bg-slate-900 border-b border-orange-500 text-[10px] uppercase font-black tracking-wider text-amber-300 shadow-xs">
          <tr>
            <th className="py-2.5 px-2 text-white border-r border-slate-700/60 text-center w-10 shrink-0">#</th>
            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">SIZE / BHK</th>
            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">FLOOR</th>
            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">DEMAND PRICE</th>
            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">LOCATION</th>
            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">CONTACT</th>
            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">NET PRICE</th>
            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">BY</th>
            {isEmployee && (
              <th className="py-2.5 px-2 text-white border-r border-slate-700/60 text-center w-20">VERIFIED</th>
            )}
            <th className="py-2.5 px-2 text-center text-white border-r border-slate-700/60 w-28 shrink-0">ACTIONS</th>
            <th className="py-2.5 px-2.5 text-right text-white whitespace-nowrap w-28 shrink-0">DEAL SWITCH</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
          {listings.map((item, idx) => {
            const isSold = item.dealStatus === 'sold';
            const isRented = item.dealStatus === 'rented';
            const isClosed = isSold || isRented;
            const isForRent = item.listingType === 'rent';

            return (
              <tr
                key={item._id}
                onClick={() => onViewDetails(item)}
                className={`border-b border-slate-200/70 transition-colors duration-100 cursor-pointer ${
                  isClosed
                    ? 'bg-slate-100/60 text-slate-400'
                    : idx % 2 === 0
                    ? 'bg-white hover:bg-amber-50/50'
                    : 'bg-slate-50/40 hover:bg-amber-50/50'
                }`}
                title="Click row to inspect complete property details (Address, Lift, Parking, Video, Notes in View)"
              >
                {/* 1. S.NO */}
                <td className="py-2 px-2 text-center font-extrabold text-slate-400 font-mono text-[10px] border-r border-slate-200/70">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>

                {/* 2. SIZE / BHK */}
                <td className={`py-2 px-2.5 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    {item.configuration && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-black uppercase leading-none">
                        {item.configuration}
                      </span>
                    )}
                    <span className="font-extrabold text-slate-800 text-[11px]">
                      {item.sizeSqft || (item.configuration ? '' : '—')}
                    </span>
                  </div>
                </td>

                {/* 3. FLOOR */}
                <td className={`py-2 px-2.5 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                  <span className="font-semibold text-slate-700 text-[11px] block truncate max-w-[120px]" title={item.floor || '—'}>
                    {item.floor || '—'}
                  </span>
                </td>

                {/* 4. PRICE */}
                <td className={`py-2 px-2.5 font-bold border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-50/90 px-1.5 py-0.5 rounded border border-emerald-200/70">
                      {priceLabel(item)}
                    </span>
                    {item.listingType === 'rent' && (
                      <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-1 rounded">
                        Rent
                      </span>
                    )}
                  </div>
                </td>

                {/* 5. LOCATION */}
                <td className={`py-2 px-2.5 border-r border-slate-200/70 ${isClosed ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                    {item.location && <i className="ri-map-pin-2-fill text-orange-500 text-xs shrink-0" />}
                    <span className="truncate max-w-[140px]" title={item.location || '—'}>
                      {item.location || '—'}
                    </span>
                  </div>
                </td>

                {/* 6. CONTACT */}
                <td className={`py-2 px-2.5 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                  {item.ownerContact ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:${String(item.ownerContact).replace(/[^\d+]/g, '')}`}
                        className="text-[11px] font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                        title="Click to Call"
                      >
                        <i className="ri-phone-fill text-slate-400 text-xs" />
                        <span>{item.ownerContact}</span>
                      </a>
                      <a
                        href={`https://wa.me/91${String(item.ownerContact).replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700"
                        title="Open WhatsApp"
                      >
                        <i className="ri-whatsapp-fill text-xs" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[10px] font-mono">—</span>
                  )}
                </td>

                {/* 7. NET PRICE */}
                <td className={`py-2 px-2.5 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                  <span
                    className={`text-[11px] font-bold ${
                      item.netProfit > 0
                        ? 'text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.netProfit > 0 ? formatINR(item.netProfit) : '—'}
                  </span>
                </td>

                {/* 8. BY */}
                <td className={`py-2 px-2 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                  <span className="font-bold text-slate-700 text-[11px] block truncate max-w-[85px]" title={item.ownerName || '—'}>
                    {item.ownerName || '—'}
                  </span>
                </td>

                {/* 9. VERIFIED (ONLY FOR EMPLOYEE) */}
                {isEmployee && (
                  <td className="py-2 px-1.5 border-r border-slate-200/70 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleVerification(item._id, item.isVerified !== false)}
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border cursor-pointer ${
                        item.isVerified !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${item.isVerified !== false ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span>{item.isVerified !== false ? 'Verified' : 'Pending'}</span>
                    </button>
                  </td>
                )}

                {/* 10. ACTIONS (4 COMPACT ICONS) */}
                <td className="py-2 px-1 text-center border-r border-slate-200/70 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      type="button"
                      disabled={isClosed}
                      onClick={() => onPitch(item)}
                      className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 transition"
                      title="WhatsApp Pitch Flyer"
                    >
                      <i className="ri-whatsapp-fill" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewDetails(item)}
                      className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center cursor-pointer transition"
                      title="View Details (Address, Specs, Video Tour)"
                    >
                      <i className="ri-eye-line" />
                    </button>

                    <button
                      type="button"
                      disabled={isClosed}
                      onClick={() => onEdit(item)}
                      className="p-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 transition"
                      title="Edit Listing"
                    >
                      <i className="ri-edit-line" />
                    </button>

                    {onDelete && (
                      <button
                        type="button"
                        disabled={isClosed}
                        onClick={() => onDelete(item._id)}
                        className="p-1 rounded-md bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 transition"
                        title="Delete Listing"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    )}
                  </div>
                </td>

                {/* 11. DEAL STATUS SWITCH TOGGLE */}
                <td className="py-2 px-2 text-right pointer-events-auto whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onToggleDealStatus(item)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all duration-150 cursor-pointer shadow-2xs font-mono select-none ${
                        isClosed
                          ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      }`}
                      title={isClosed ? 'Click to unfreeze and mark Active' : `Click to mark ${isForRent ? 'Rented' : 'Sold'}`}
                    >
                      <div
                        className={`relative flex items-center h-3.5 w-6 shrink-0 rounded-full px-0.5 transition-colors duration-200 ${
                          isClosed ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                            isClosed ? 'translate-x-0' : 'translate-x-2.5'
                          }`}
                        />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider min-w-[36px] text-left">
                        {isClosed ? (isSold ? 'SOLD' : 'RENTED') : 'ACTIVE'}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
