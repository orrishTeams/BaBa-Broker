import React from 'react';

/**
 * Reusable Unified Page/Panel Header for all Dashboards, Panels & Pages
 * Standardizes icon container, title, badge pill, subtitle, and right-side actions.
 */
export default function PageHeader({
  icon = 'ri-building-line',
  iconColor = 'bg-orange-100 text-orange-600',
  title,
  subtitle,
  badge,
  badgeColor = 'bg-orange-100 text-orange-800 border-orange-200',
  rightContent,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`h-9 w-9 rounded-2xl ${iconColor} flex items-center justify-center text-lg font-black shrink-0 shadow-2xs`}>
          <i className={icon} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
              {title}
            </h2>
            {badge !== undefined && badge !== null && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium leading-normal mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightContent && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}
