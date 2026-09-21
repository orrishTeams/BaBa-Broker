import React from 'react';

/**
 * Reusable 4-Card Executive Metrics Grid for Overview Tabs
 */
export default function DashboardMetricsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 w-full">
      {/* 1. Total Inventory */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Total Portfolio</span>
          <div className="h-5.5 w-5.5 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xs">
            <i className="ri-building-line" />
          </div>
        </div>
        <div className="text-sm sm:text-base font-black text-slate-900">{stats.total} Units</div>
        <span className="text-[9.5px] text-slate-400 font-medium">{stats.available} Active Listings</span>
      </div>

      {/* 2. For Sale Deals */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Sale Deals</span>
          <div className="h-5.5 w-5.5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
            <i className="ri-price-tag-3-line" />
          </div>
        </div>
        <div className="text-sm sm:text-base font-black text-blue-700">{stats.buyCount} Properties</div>
        <span className="text-[9.5px] text-blue-600 font-bold">{stats.availableBuy} For Resale</span>
      </div>

      {/* 3. Rental Units */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Rental Units</span>
          <div className="h-5.5 w-5.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
            <i className="ri-key-2-line" />
          </div>
        </div>
        <div className="text-sm sm:text-base font-black text-emerald-700">{stats.rentCount} Units</div>
        <span className="text-[9.5px] text-emerald-600 font-bold">{stats.availableRent} For Rent</span>
      </div>

      {/* 4. Converted / Verified */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Converted</span>
          <div className="h-5.5 w-5.5 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs">
            <i className="ri-medal-line" />
          </div>
        </div>
        <div className="text-sm sm:text-base font-black text-purple-700">{stats.soldOrRented || stats.converted || 0} Deals</div>
        <span className="text-[9.5px] text-purple-600 font-bold">Sold & Rented</span>
      </div>
    </div>
  );
}
