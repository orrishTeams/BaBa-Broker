import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Sticky Top Navigation Bar for Sales & Employee Dashboards
 */
export default function DashboardTopNav({
  roleTitle = 'Sales Executive Desk',
  roleBadge = 'Sales Partner',
  roleBadgeColor = 'bg-orange-50 text-orange-700 border-orange-200',
  userName = 'Executive',
  dutyStatus = 'online',
  onToggleDuty,
  onLogout,
  onToggleMobileSidebar,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5">
        {/* Left Branding & Mobile Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            <i className="ri-menu-2-line text-lg" />
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-xs shadow-orange-500/20 group-hover:scale-105 transition">
              <i className="ri-building-2-fill" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight block leading-tight">
                Baba<span className="text-[#ea580c]">Broker</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                {roleTitle}
              </span>
            </div>
          </Link>
        </div>

        {/* Right User & Duty Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Duty Status Pill */}
          {onToggleDuty && (
            <button
              type="button"
              onClick={onToggleDuty}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                dutyStatus === 'online'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
              title="Toggle Duty Status"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  dutyStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{dutyStatus === 'online' ? 'On Duty' : 'Off Duty'}</span>
            </button>
          )}

          {/* User Profile Card */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="h-8 w-8 rounded-xl bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left min-w-0 max-w-[130px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 truncate block leading-tight">
                  {userName}
                </span>
                <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-full border shrink-0 ${roleBadgeColor}`}>
                  {roleBadge}
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 font-bold block leading-none mt-0.5 truncate">
                Direct Portal
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 border border-slate-200/90 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-bold transition shadow-2xs cursor-pointer group active:scale-95"
            title="Sign Out"
          >
            <i className="ri-logout-box-r-line text-sm text-slate-400 group-hover:text-red-500 transition-colors" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
