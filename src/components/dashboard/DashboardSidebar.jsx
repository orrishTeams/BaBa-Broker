import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Signature Left Solid Orange Sidebar with Notch Tabs
 */
export default function DashboardSidebar({
  view,
  setView,
  navItems = [],
  totalCount = 0,
  portalTitle = 'Sales Desk',
  onSharePortfolio,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── LEFT SOLID ORANGE SIDEBAR WITH SIGNATURE NOTCH TABS ─── */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 sm:w-72 lg:w-52 bg-[#ea580c] text-white flex flex-col justify-between pl-3.5 py-4 pr-0 select-none shrink-0 overflow-y-auto z-50 lg:z-20 shadow-2xl transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-4">
          {/* Logo & Mobile Close */}
          <div className="pr-3.5 flex items-center justify-between">
            <Link to="/" onClick={() => setMobileSidebarOpen(false)} className="flex items-center px-1 group">
              <img
                src="/assets/img/logo.svg"
                alt="Baba Broker"
                className="h-8 w-auto max-w-[155px] object-contain brightness-0 invert transition-transform group-hover:scale-105"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
              title="Close Menu"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* Navigation Notch Tabs */}
          <nav className="space-y-1.5 pt-2 pr-0">
            {navItems.map((item) => {
              const isActive = view === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setView(item.id);
                    if (setMobileSidebarOpen) setMobileSidebarOpen(false);
                  }}
                  className={`w-full group relative flex items-center justify-between text-xs cursor-pointer text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#ea580c] font-black pl-3.5 py-2.5 pr-4 rounded-l-2xl rounded-r-none shadow-[-6px_4px_16px_rgba(0,0,0,0.12)] z-10 -mr-[1px]'
                      : 'text-white/90 hover:text-white hover:bg-white/20 px-3.5 py-2.5 rounded-xl mr-3.5 font-bold'
                  }`}
                >
                  {/* Notch Inverted Curve Corners */}
                  {isActive && (
                    <>
                      <svg
                        className="hidden sm:block absolute -top-3 right-0 w-3 h-3 pointer-events-none fill-white"
                        viewBox="0 0 16 16"
                      >
                        <path d="M0,16 Q16,16 16,0 L16,16 Z" />
                      </svg>
                      <svg
                        className="hidden sm:block absolute -bottom-3 right-0 w-3 h-3 pointer-events-none fill-white"
                        viewBox="0 0 16 16"
                      >
                        <path d="M0,0 Q16,0 16,16 L16,0 Z" />
                      </svg>
                    </>
                  )}

                  <div className="flex items-center gap-2.5 min-w-0">
                    {isActive ? (
                      <div className="h-6 w-6 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs shadow-xs shrink-0">
                        <i className={item.activeIcon || item.icon} />
                      </div>
                    ) : (
                      <i className={`${item.icon} text-base shrink-0 text-white/90`} />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.id === 'list' && totalCount !== undefined && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-orange-100 text-orange-700' : 'bg-white/20 text-white'
                      }`}
                    >
                      {totalCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Portfolio Share Button */}
        {onSharePortfolio && (
          <div className="pr-3.5 space-y-2 mt-4">
            <button
              type="button"
              onClick={onSharePortfolio}
              className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95"
            >
              <i className="ri-whatsapp-fill text-sm" />
              <span>Share Portfolio</span>
            </button>
          </div>
        )}

        {/* Clean Sidebar Footer */}
        <div className="pt-3 pr-3.5 mt-auto border-t border-white/20 text-center select-none">
          <p className="text-[10px] text-white/85 font-semibold">Baba Broker {portalTitle}</p>
          <p className="text-[9px] text-white/70">v2.4 · Executive Edition</p>
        </div>
      </aside>
    </>
  );
}
