import React from 'react';

/**
 * Signature Header for White Dashboard Workspace Canvas
 */
export default function DashboardTopNav({
  userName = 'Executive',
  roleBadge = 'Sales Partner',
  roleBadgeColor = 'text-orange-600',
  roleSubText = 'Field Associate • Sales Desk',
  searchVal = '',
  setSearchVal,
  dutyStatus = 'online',
  onToggleDuty,
  onLogout,
  onToggleMobileSidebar,
}) {
  const initials = (userName || 'EX').slice(0, 2).toUpperCase();

  return (
    <header className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/90 flex items-center justify-between gap-3 bg-white sticky top-0 z-30 shadow-2xs font-['Inter',sans-serif]">
      {/* Search & Mobile Menu */}
      <div className="flex items-center gap-2.5 flex-1 max-w-md">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden h-9 w-9 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 flex items-center justify-center cursor-pointer shrink-0 transition-all shadow-2xs"
          title="Toggle Menu"
        >
          <i className="ri-menu-2-line text-lg font-bold" />
        </button>

        {setSearchVal !== undefined && (
          <div className="relative w-full">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Quick search location, phone, size..."
              className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200/90 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition font-medium shadow-2xs"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <i className="ri-close-line text-xs" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Duty Status, Luxury Executive Pill, Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Duty Status Button */}
        {onToggleDuty && (
          <button
            type="button"
            onClick={onToggleDuty}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition flex items-center gap-1.5 cursor-pointer select-none ${
              dutyStatus === 'online'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                dutyStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{dutyStatus === 'online' ? 'ON DUTY' : 'OFF DUTY'}</span>
          </button>
        )}

        {/* Luxury Executive Profile Pill */}
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-slate-50 via-white to-orange-50/30 pl-1.5 pr-3 py-1 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-orange-200 transition group select-none">
          <div className="relative">
            <div className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-orange-400/20 group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Active Executive"
            />
          </div>
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-slate-900 leading-tight group-hover:text-orange-950 transition-colors">
                {userName}
              </span>
              <i
                className={`ri-verified-badge-fill text-[11px] ${roleBadgeColor}`}
                title={roleBadge}
              />
            </div>
            <span className="text-[9.5px] text-slate-400 font-bold block leading-none mt-0.5">
              {roleSubText}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-red-50 border border-slate-200/90 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-bold transition-all shadow-2xs cursor-pointer group active:scale-95"
            title="Sign Out"
          >
            <i className="ri-logout-box-r-line text-sm text-slate-400 group-hover:text-red-500 transition-colors" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
