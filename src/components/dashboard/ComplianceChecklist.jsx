import React from 'react';
import PageHeader from '../common/PageHeader';

/**
 * Reusable RERA & Document Compliance Checklist Panel
 */
export default function ComplianceChecklist() {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 w-full max-w-4xl mx-auto">
      <PageHeader
        icon="ri-file-shield-line"
        iconColor="bg-emerald-100 text-emerald-700"
        title="RERA & Document Compliance Checklist"
        badge="Compliance"
        badgeColor="bg-emerald-100 text-emerald-800 border-emerald-200"
        subtitle="Mandatory verification steps before clearing flats for client visits"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-900 font-black">
            <i className="ri-checkbox-circle-fill text-emerald-600" />
            <span>Title Deed & Ownership Registry</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Cross-verify ownership deeds with municipal land records to ensure clear, encumbrance-free title.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-900 font-black">
            <i className="ri-checkbox-circle-fill text-emerald-600" />
            <span>RERA Registration Validation</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Confirm active RERA certificate and project approval on state portal (UPRERA / HRERA / MahaRERA).
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-900 font-black">
            <i className="ri-checkbox-circle-fill text-emerald-600" />
            <span>On-Site Physical Inspection</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Upload verified high-resolution photographs of living area, kitchen, balcony, and floor corridor.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-900 font-black">
            <i className="ri-checkbox-circle-fill text-emerald-600" />
            <span>RWA NOC & Parking Allocation</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Validate maintenance dues clearance, lift operating certificates, and dedicated stilt parking allotment.
          </p>
        </div>
      </div>
    </div>
  );
}
