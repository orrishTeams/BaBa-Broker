import React from 'react';

/**
 * Reusable Sidebar Navigation for Sales & Operations Portals
 */
export default function DashboardSidebar({
  view,
  setView,
  navItems = [],
  onSharePortfolio,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  const content = (
    <div className="flex flex-col h-full justify-between p-3 sm:p-3.5 space-y-4">
      {/* Navigation Links */}
      <div className="space-y-1">
        <span className="px-3 text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
          Menu Navigation
        </span>
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-xs shadow-orange-600/20'
                  : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <i className={`${item.icon} text-base ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge !== null && (
                <span
                  className={`text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Direct Portfolio Share / Quick Action */}
      {onSharePortfolio && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={onSharePortfolio}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs shadow-emerald-600/20 cursor-pointer"
          >
            <i className="ri-whatsapp-fill text-base" />
            <span>Share Portfolio</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 bg-white border-r border-slate-200/90 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden flex"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="w-64 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Portal Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{content}</div>
          </div>
        </div>
      )}
    </>
  );
}
