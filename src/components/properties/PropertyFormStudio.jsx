import React, { useState } from 'react';
import PageHeader from '../common/PageHeader';
import {
  QUICK_AMENITIES,
  emptyFlatListing,
  fileToBase64,
  formatINR,
} from '../../utils/propertyConstants';

/**
 * Reusable Unified Property Onboarding & Audit Studio Form
 * Shared identically by SalesmanDashboard and EmployeeDashboard.
 */
export default function PropertyFormStudio({
  form,
  setForm,
  editingId,
  setEditingId,
  onSave,
  onCancel,
  saving = false,
  roleBadge = 'New Listing',
}) {
  const [isCustomFloor, setIsCustomFloor] = useState(
    () =>
      Boolean(form.floor) &&
      ![
        'Ground Floor (Front Side) [G-FS]',
        'Ground Floor (Back Side) [G-BS]',
        'Upper Ground (Front Side) [UG-FS]',
        '1st Floor (Front Side) [1ST-FS]',
        '2nd Floor (Back Side) [2ND-BS]',
        '3rd Floor (Front Side) [3RD-FS]',
        'Top Floor with Roof Rights [T-BS]',
        'Basement Floor [BSMT]',
        'Duplex Floor',
        'Independent House / Villa',
        'Ground Floor (Main Road Front)',
        'Ground Floor (Inside Market / Plaza)',
        'Upper Ground (Commercial)',
        '1st Floor (Commercial Front)',
        '2nd Floor (Office Suite)',
        '3rd Floor / Corporate Tower',
        'Basement (Commercial / Storage)',
        'Full Standalone Commercial Building',
      ].includes(form.floor)
  );

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setForm((prev) => ({ ...prev, coverImage: b64 }));
    } catch {
      /* ignore */
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const b64List = await Promise.all(files.map(fileToBase64));
      setForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...b64List],
      }));
    } catch {
      /* ignore */
    }
  };

  const handleRemoveGalleryImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx),
    }));
  };

  const handleAmenityToggle = (amenity) => {
    const currentList = (form.amenities || '')
      .split(/[,|\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    let updatedList;
    if (currentList.includes(amenity)) {
      updatedList = currentList.filter((a) => a !== amenity);
    } else {
      updatedList = [...currentList, amenity];
    }
    setForm((prev) => ({ ...prev, amenities: updatedList.join(', ') }));
  };

  return (
    <form onSubmit={onSave} className="space-y-3 w-full pb-6">
      {/* 1. Header Banner */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <PageHeader
          icon={editingId ? 'ri-edit-2-line' : 'ri-building-2-fill'}
          title={editingId ? 'Edit Property Listing' : 'Property Onboarding Studio'}
          badge={editingId ? 'Editing Mode' : roleBadge}
          subtitle="Structured data entry • Auto-generates WhatsApp pitch flyer & CRM sync"
          className="pb-0 border-b-0"
          rightContent={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-black shadow-md shadow-orange-600/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line text-sm font-black animate-spin" />
                    <span>{editingId ? 'Saving...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <>
                    <i className="ri-check-line text-sm font-black" />
                    <span>{editingId ? 'Save Changes' : 'Publish Property'}</span>
                  </>
                )}
              </button>
            </div>
          }
        />
      </div>

      {/* ─── SECTION 1: CLASSIFICATION, DEAL TYPE & PROPERTY CATEGORY ─── */}
      <div className="rounded-2xl border border-orange-500/25 bg-gradient-to-b from-orange-50/30 via-white to-white p-3.5 sm:p-4 space-y-3 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500" />

        {/* Step Header */}
        <div className="flex items-center justify-between pb-2 border-b border-orange-100/70">
          <div className="flex items-center gap-2">
            <span className="h-5.5 w-5.5 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-[11px] shadow-xs">
              1
            </span>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              Classification &amp; Deal Configuration
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                Required
              </span>
            </h3>
          </div>
          <span className="text-[10px] font-black text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/70">
            Step 1 of 3
          </span>
        </div>

        {/* Primary Row: Deal Intent + Category Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
          {/* Deal Type Switcher */}
          <div className="lg:col-span-5 p-3 rounded-2xl bg-gradient-to-br from-orange-50/90 via-amber-50/50 to-orange-100/50 border border-orange-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-fire-fill text-orange-600 text-xs" />
                Deal Intent
              </label>
              <span
                className={`text-[9.5px] font-black px-2 py-0.5 rounded-md border uppercase shadow-2xs ${
                  form.listingType === 'buy'
                    ? 'bg-orange-100 text-orange-900 border-orange-300'
                    : 'bg-cyan-100 text-cyan-900 border-cyan-300'
                }`}
              >
                Active: {form.listingType === 'buy' ? 'For Sale' : 'For Rent'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    listingType: 'buy',
                    propertyCategory: 'Flat',
                    configuration:
                      form.configuration?.includes('BHK') ||
                      form.configuration === '1 RK' ||
                      form.configuration === 'Jad se'
                        ? form.configuration
                        : '2 BHK',
                    sizeSqft: form.sizeSqft?.includes('Gaj')
                      ? form.sizeSqft
                      : '50 Gaj (450 sq.ft)',
                  });
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  form.listingType === 'buy'
                    ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white border-orange-600 shadow-md shadow-orange-500/30 font-black scale-[1.02] ring-2 ring-orange-400/40'
                    : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white hover:text-orange-950 shadow-2xs'
                }`}
              >
                <i className="ri-price-tag-3-fill text-xs" />
                <span>For Sale / Buy</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, listingType: 'rent' })}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  form.listingType === 'rent'
                    ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white border-blue-500 shadow-md shadow-blue-500/30 font-black scale-[1.02] ring-2 ring-blue-400/40'
                    : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white hover:text-blue-950 shadow-2xs'
                }`}
              >
                <i className="ri-key-2-fill text-xs" />
                <span>For Rent / Lease</span>
              </button>
            </div>
          </div>

          {/* Category Selection */}
          <div className="lg:col-span-7 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-layout-grid-fill text-orange-600 text-xs" />
                {form.listingType === 'rent' ? 'Rental Property Category' : 'Sale Property Category'}
              </label>
              <span className="text-[9.5px] font-bold text-slate-400">
                {form.listingType === 'rent' ? '2 Options Available' : 'Flat Inventory'}
              </span>
            </div>

            {form.listingType === 'rent' ? (
              <div className="grid grid-cols-2 gap-2">
                {/* 1. FLAT */}
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      propertyCategory: 'Flat',
                      configuration:
                        form.configuration?.includes('BHK') ||
                        form.configuration === '1 RK' ||
                        form.configuration === 'Jad se'
                          ? form.configuration
                          : '2 BHK',
                      sizeSqft: form.sizeSqft?.includes('Gaj')
                        ? form.sizeSqft
                        : '50 Gaj (450 sq.ft)',
                    });
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    form.propertyCategory === 'Flat' ||
                    form.propertyCategory === 'HK' ||
                    form.propertyCategory === 'RK' ||
                    (!form.propertyCategory && form.propertyCategory !== 'Commercial')
                      ? 'bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-orange-50 border-orange-500 text-orange-950 font-black shadow-xs ring-2 ring-orange-500/30'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-base shrink-0 font-bold">
                      🏠
                    </span>
                    <div>
                      <span className="block text-xs font-black">Residential Flat</span>
                      <span className="text-[9.5px] text-slate-500 font-medium">Builder Floors &amp; Units</span>
                    </div>
                  </div>
                  {(form.propertyCategory === 'Flat' ||
                    form.propertyCategory === 'HK' ||
                    form.propertyCategory === 'RK' ||
                    (!form.propertyCategory && form.propertyCategory !== 'Commercial')) && (
                    <i className="ri-checkbox-circle-fill text-orange-600 text-base" />
                  )}
                </button>

                {/* 2. COMMERCIAL */}
                <button
                  type="button"
                  onClick={() => {
                    const sub = form.commercialSubType || 'Office';
                    setForm({
                      ...form,
                      propertyCategory: 'Commercial',
                      commercialSubType: sub,
                      configuration: sub === 'Office' ? 'Furnished Office' : 'Main Road Shop',
                      sizeSqft: form.sizeSqft?.includes('sq.ft') ? form.sizeSqft : '500 sq.ft',
                    });
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    form.propertyCategory === 'Commercial' ||
                    form.propertyCategory === 'Office' ||
                    form.propertyCategory === 'Shop'
                      ? 'bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-blue-50 border-blue-600 text-blue-950 font-black shadow-xs ring-2 ring-blue-500/30'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-base shrink-0 font-bold">
                      🏢
                    </span>
                    <div>
                      <span className="block text-xs font-black text-blue-950">Commercial</span>
                      <span className="text-[9.5px] text-blue-700 font-medium">Office &amp; Retail Shop</span>
                    </div>
                  </div>
                  {(form.propertyCategory === 'Commercial' ||
                    form.propertyCategory === 'Office' ||
                    form.propertyCategory === 'Shop') && (
                    <i className="ri-checkbox-circle-fill text-blue-600 text-base" />
                  )}
                </button>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-base shrink-0 font-bold shadow-xs">
                    🏠
                  </span>
                  <div>
                    <span className="block text-xs font-black text-orange-950">
                      Residential Builder Floor &amp; Flat
                    </span>
                    <span className="text-[10px] text-orange-800 font-medium">
                      Commercial spaces &amp; plots are listed under Rent / Lease.
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider shrink-0">
                  Sale Active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Commercial Sub-Configuration */}
        {form.listingType === 'rent' &&
          (form.propertyCategory === 'Commercial' ||
            form.propertyCategory === 'Office' ||
            form.propertyCategory === 'Shop') && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/90 space-y-3 animate-in fade-in duration-150 shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-store-2-fill text-blue-600 text-xs" />
                    Commercial Unit Type (Select Office or Shop)
                  </label>
                  <span className="text-[9px] font-bold text-blue-800 bg-blue-100/90 px-2 py-0.2 rounded border border-blue-200">
                    Active: <strong>{form.commercialSubType === 'Shop' ? 'Retail Shop' : 'Commercial Office'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Office */}
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        propertyCategory: 'Commercial',
                        commercialSubType: 'Office',
                        configuration: 'Furnished Office',
                        sizeSqft: form.sizeSqft?.includes('sq.ft') ? form.sizeSqft : '500 sq.ft',
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      form.commercialSubType === 'Office' ||
                      (!form.commercialSubType && form.propertyCategory !== 'Shop')
                        ? 'bg-white border-blue-600 text-blue-950 shadow-sm ring-2 ring-blue-500/40 font-black'
                        : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-lg shrink-0">
                        💼
                      </span>
                      <div>
                        <span className="block font-black text-xs text-blue-950">Commercial Office</span>
                        <span className="text-[9px] text-slate-500 font-medium">IT, Corporate Suites &amp; Cabins</span>
                      </div>
                    </div>
                    {(form.commercialSubType === 'Office' ||
                      (!form.commercialSubType && form.propertyCategory !== 'Shop')) && (
                      <i className="ri-checkbox-circle-fill text-blue-600 text-base" />
                    )}
                  </button>

                  {/* Shop */}
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        propertyCategory: 'Commercial',
                        commercialSubType: 'Shop',
                        configuration: 'Main Road Shop',
                        sizeSqft: form.sizeSqft?.includes('sq.ft') ? form.sizeSqft : '200 sq.ft',
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      form.commercialSubType === 'Shop'
                        ? 'bg-white border-indigo-600 text-indigo-950 shadow-sm ring-2 ring-indigo-500/40 font-black'
                        : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg shrink-0">
                        🏪
                      </span>
                      <div>
                        <span className="block font-black text-xs text-indigo-950">Retail Shop / Showroom</span>
                        <span className="text-[9px] text-slate-500 font-medium">Market Fronts, Booths &amp; Retail</span>
                      </div>
                    </div>
                    {form.commercialSubType === 'Shop' && (
                      <i className="ri-checkbox-circle-fill text-indigo-600 text-base" />
                    )}
                  </button>
                </div>
              </div>

              {/* Commercial Specs: Layout Chips + Area Presets */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs pt-1 border-t border-blue-100">
                <div className="md:col-span-7 space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    {form.commercialSubType === 'Shop' ? 'Shop Spec / Location' : 'Office Layout / Furnishing'}
                    <span className="text-blue-600 font-bold ml-1">({form.configuration})</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {(form.commercialSubType === 'Shop'
                      ? ['Main Road Shop', 'Corner Shop', 'Ground Retail', 'Basement Godown', 'Showroom', 'Market Booth']
                      : ['Furnished Office', 'Bare Shell', 'Semi-Furnished', 'Co-Working Hub', 'Cabin Suite', 'Full Floor']
                    ).map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => setForm({ ...form, configuration: spec })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer border truncate text-center ${
                          form.configuration === spec
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-black'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-900'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-700">Carpet / Super Area</label>
                    <span className="text-[9px] text-slate-400 font-medium">Sq.ft / Gaj</span>
                  </div>
                  <input
                    type="text"
                    value={form.sizeSqft}
                    onChange={(e) => setForm({ ...form, sizeSqft: e.target.value })}
                    placeholder={form.commercialSubType === 'Shop' ? 'e.g. 200 sq.ft (22 Gaj)' : 'e.g. 500 sq.ft (55 Gaj)'}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 outline-none text-xs font-bold text-slate-900 shadow-2xs"
                  />
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {(form.commercialSubType === 'Shop'
                      ? [
                          { label: '100 sq.ft', val: '100 sq.ft (11 Gaj)' },
                          { label: '200 sq.ft', val: '200 sq.ft (22 Gaj)' },
                          { label: '350 sq.ft', val: '350 sq.ft (39 Gaj)' },
                          { label: '500 sq.ft', val: '500 sq.ft (55 Gaj)' },
                        ]
                      : [
                          { label: '150 sq.ft', val: '150 sq.ft (16 Gaj)' },
                          { label: '300 sq.ft', val: '300 sq.ft (33 Gaj)' },
                          { label: '500 sq.ft', val: '500 sq.ft (55 Gaj)' },
                          { label: '1000 sq.ft', val: '1000 sq.ft (111 Gaj)' },
                        ]
                    ).map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setForm({ ...form, sizeSqft: preset.val })}
                        className="px-1.5 py-0.5 rounded bg-white hover:bg-blue-100 hover:text-blue-900 text-[9px] font-bold text-slate-600 border border-slate-200 transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Residential Flat Configuration */}
        {(form.propertyCategory === 'Flat' ||
          form.propertyCategory === 'HK' ||
          form.propertyCategory === 'RK' ||
          form.listingType === 'buy' ||
          (!form.propertyCategory && form.propertyCategory !== 'Commercial')) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs p-3.5 rounded-2xl bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-orange-50/30 border border-orange-200/80 shadow-2xs">
            <div className="md:col-span-7 space-y-1">
              <label className="text-[10.5px] font-bold text-slate-800 block">
                BHK Configuration <span className="text-orange-600 font-bold">({form.configuration})</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Jad se'].map((bhk) => (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => setForm({ ...form, configuration: bhk })}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border truncate text-center ${
                      form.configuration === bhk
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs font-black scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50 hover:text-orange-950'
                    }`}
                  >
                    {bhk}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-bold text-slate-800">Plot Size / Carpet Area</label>
                <span className="text-[9px] text-slate-400 font-medium">Gaj &amp; Sq.ft</span>
              </div>
              <input
                type="text"
                value={form.sizeSqft}
                onChange={(e) => setForm({ ...form, sizeSqft: e.target.value })}
                placeholder="e.g. 50 Gaj (450 sq.ft)"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-orange-500 outline-none text-xs font-bold text-slate-900 shadow-2xs"
              />
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                {[
                  { label: '30G', val: '30 Gaj (270 sq.ft)' },
                  { label: '40G', val: '40 Gaj (360 sq.ft)' },
                  { label: '50G', val: '50 Gaj (450 sq.ft)' },
                  { label: '60G', val: '60 Gaj (540 sq.ft)' },
                  { label: '100G', val: '100 Gaj (900 sq.ft)' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setForm({ ...form, sizeSqft: preset.val })}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-orange-100 hover:text-orange-800 text-[9px] font-bold text-slate-600 border border-slate-200 transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── SECTION 2: FLOOR & BUILDING FACILITIES (LIFT, PARKING, LOCATION) ─── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-[10px]">
              2
            </span>
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
              Floor Position, Location &amp; Parking Infrastructure
            </h3>
          </div>
          <span className="text-[10px] font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/70">
            Step 2 of 3
          </span>
        </div>

        {/* Floor Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <i className="ri-building-line text-orange-600" />
              Select Floor Position <span className="text-orange-600 font-bold">*</span>
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Standard Delhi NCR Builder Floors</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="relative">
              <select
                value={isCustomFloor ? 'Other' : form.floor}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    setIsCustomFloor(true);
                    setForm({ ...form, floor: '' });
                  } else {
                    setIsCustomFloor(false);
                    setForm({ ...form, floor: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-400 outline-none text-xs font-bold text-slate-800 appearance-none cursor-pointer pr-8 shadow-2xs"
              >
                <option value="">-- Select Floor Position --</option>
                {form.propertyCategory === 'Commercial' ||
                form.propertyCategory === 'Office' ||
                form.propertyCategory === 'Shop' ? (
                  <>
                    <option value="Ground Floor (Main Road Front)">Ground Floor (Main Road Front)</option>
                    <option value="Ground Floor (Inside Market / Plaza)">Ground Floor (Inside Market / Plaza)</option>
                    <option value="Upper Ground (Commercial)">Upper Ground (Commercial)</option>
                    <option value="1st Floor (Commercial Front)">1st Floor (Commercial Front)</option>
                    <option value="2nd Floor (Office Suite)">2nd Floor (Office Suite)</option>
                    <option value="3rd Floor / Corporate Tower">3rd Floor / Corporate Tower</option>
                    <option value="Basement (Commercial / Storage)">Basement (Commercial / Storage)</option>
                    <option value="Full Standalone Commercial Building">Full Standalone Commercial Building</option>
                  </>
                ) : (
                  <>
                    <option value="Ground Floor (Front Side)">Ground Floor (Front Side) [G-FS]</option>
                    <option value="Ground Floor (Back Side)">Ground Floor (Back Side) [G-BS]</option>
                    <option value="Upper Ground (Front Side)">Upper Ground (Front Side) [UG-FS]</option>
                    <option value="1st Floor (Front Side)">1st Floor (Front Side) [1ST-FS]</option>
                    <option value="2nd Floor (Back Side)">2nd Floor (Back Side) [2ND-BS]</option>
                    <option value="3rd Floor (Front Side)">3rd Floor (Front Side) [3RD-FS]</option>
                    <option value="Top Floor with Roof Rights">Top Floor with Roof Rights [T-BS]</option>
                    <option value="Basement Floor">Basement / Lower Ground [BSMT]</option>
                    <option value="Duplex">Duplex Floor</option>
                    <option value="Independent House / Villa">Independent House / Villa</option>
                  </>
                )}
                <option value="Other" className="font-bold text-orange-600">
                  ✍️ Other (Custom Floor)...
                </option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                <i className="ri-arrow-down-s-line text-sm" />
              </div>
            </div>

            {/* Custom Floor Input */}
            <div className="relative">
              {isCustomFloor ? (
                <div className="relative">
                  <i className="ri-edit-2-fill absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 text-xs" />
                  <input
                    type="text"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="Type custom floor (e.g. 4th Floor Front, Penthouse)..."
                    required={isCustomFloor}
                    autoFocus
                    className="w-full pl-8 pr-3 py-2 rounded-xl border-2 border-orange-500 bg-white focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 outline-none text-xs font-bold text-slate-900 shadow-sm animate-in fade-in duration-150"
                  />
                </div>
              ) : (
                <div
                  className="relative"
                  title="Select 'Other (Custom Floor)...' in dropdown to type custom floor"
                >
                  <i className="ri-lock-2-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={form.floor ? `Selected: ${form.floor}` : 'Standard Floor (Select "Other" to customize)'}
                    disabled
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-100/90 text-slate-500 outline-none text-xs font-medium cursor-not-allowed select-none opacity-85"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location & Landmark */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50/40 via-slate-50 to-amber-50/40 border border-orange-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <i className="ri-map-pin-2-fill text-orange-600 text-xs" />
              Location / Colony &amp; Address Landmark
            </label>
            <span className="text-[9px] font-bold text-orange-700 bg-orange-100/80 px-2 py-0.2 rounded border border-orange-200">
              Site Location
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Location / Colony <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <i className="ri-map-pin-line absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-500 text-xs" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Bhagwati Garden, Dwarka Mor"
                  required
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-400 outline-none font-medium text-xs shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Address Landmark</label>
              <div className="relative">
                <i className="ri-building-2-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={form.completeAddress}
                  onChange={(e) => setForm({ ...form, completeAddress: e.target.value })}
                  placeholder="e.g. Near Spring Medical, Pillar 750"
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-400 outline-none font-medium text-xs shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lift & Parking Facilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100 text-xs">
          {/* Lift */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">Elevator / Lift Facility</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, lift: 'YES' })}
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  form.lift === 'YES'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-2xs ring-1 ring-emerald-400 font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🛗</span>
                <div className="text-left">
                  <span className="block font-bold text-[11px]">Lift Available</span>
                  <span className="text-[9px] text-emerald-700 font-medium">Automatic</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, lift: 'NO' })}
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  form.lift === 'NO'
                    ? 'bg-slate-100 text-slate-900 border-slate-400 shadow-2xs font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🚫</span>
                <div className="text-left">
                  <span className="block font-bold text-[11px]">No Lift</span>
                  <span className="text-[9px] text-slate-500 font-medium">Stairs</span>
                </div>
              </button>
            </div>
          </div>

          {/* Parking */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">
              Vehicle Parking:{' '}
              <span className="text-orange-600 font-medium">
                {form.parking && form.parking !== 'No Parking' ? form.parking : 'No Parking'}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    parking:
                      form.parking && form.parking !== 'No Parking'
                        ? form.parking
                        : 'Car + Bike Parking',
                  })
                }
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  form.parking && form.parking !== 'No Parking'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-2xs ring-1 ring-emerald-400 font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🚗</span>
                <div className="text-left">
                  <span className="block font-bold text-[11px]">Parking (YES)</span>
                  <span className="text-[9px] text-emerald-700 font-medium">Dedicated</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, parking: 'No Parking' })}
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  form.parking === 'No Parking'
                    ? 'bg-slate-100 text-slate-900 border-slate-400 shadow-2xs font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🚫</span>
                <div className="text-left">
                  <span className="block font-bold text-[11px]">No Parking</span>
                  <span className="text-[9px] text-slate-500 font-medium">Street</span>
                </div>
              </button>
            </div>

            {form.parking && form.parking !== 'No Parking' && (
              <div className="p-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200/80 space-y-1 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs">
                  {[
                    { label: 'Car + Bike', icon: '🚗🏍️', val: 'Car + Bike Parking' },
                    { label: 'Car Only', icon: '🚗', val: 'Car Parking Only' },
                    { label: 'Bike Only', icon: '🏍️', val: 'Bike Parking Only' },
                    { label: 'Covered Stilt', icon: '🅿️', val: 'Covered Stilt Parking' },
                  ].map((pOpt) => {
                    const isSelected = form.parking === pOpt.val;
                    return (
                      <div
                        key={pOpt.val}
                        onClick={() => setForm({ ...form, parking: pOpt.val })}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${
                          isSelected
                            ? 'bg-white border-orange-500 text-orange-950 shadow-xs ring-1 ring-orange-400 font-black'
                            : 'bg-white/70 text-slate-700 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <span className="text-xs shrink-0">{pOpt.icon}</span>
                        <span className="font-bold truncate text-[10px]">{pOpt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: COMMERCIALS, MEDIA STUDIO & AMENITIES ─── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">
              3
            </span>
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
              {form.listingType === 'rent' ? 'Pricing, Owner & Media' : 'Pricing, Owner & Media'}
            </h3>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
            Step 3 of 3
          </span>
        </div>

        {/* Pricing Row */}
        <div className="space-y-2">
          <div
            className={`grid grid-cols-1 ${
              form.listingType === 'rent' ? 'md:grid-cols-3' : 'md:grid-cols-2'
            } gap-3 text-xs`}
          >
            {/* Demand Price */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {form.listingType === 'rent' ? 'Monthly Rent (₹)' : 'Demand Price (₹)'}{' '}
                <span className="text-orange-600">*</span>
              </label>
              <input
                type="number"
                value={form.listingType === 'rent' ? form.monthlyRent : form.salePrice}
                onChange={(e) =>
                  setForm(
                    form.listingType === 'rent'
                      ? { ...form, monthlyRent: e.target.value }
                      : { ...form, salePrice: e.target.value }
                  )
                }
                placeholder={form.listingType === 'rent' ? 'e.g. 15000' : 'e.g. 2000000'}
                required
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-black text-emerald-700 text-xs"
              />
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {(form.listingType === 'rent'
                  ? [
                      { label: '8k', val: 8000 },
                      { label: '10k', val: 10000 },
                      { label: '12k', val: 12000 },
                      { label: '15k', val: 15000 },
                      { label: '20k', val: 20000 },
                      { label: '25k', val: 25000 },
                    ]
                  : [
                      { label: '15L', val: 1500000 },
                      { label: '20L', val: 2000000 },
                      { label: '25L', val: 2500000 },
                      { label: '30L', val: 3000000 },
                      { label: '45L', val: 4500000 },
                      { label: '1 Cr', val: 10000000 },
                    ]
                ).map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      if (form.listingType === 'rent') {
                        setForm({ ...form, monthlyRent: chip.val });
                      } else {
                        setForm({ ...form, salePrice: chip.val });
                      }
                    }}
                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-[10px] font-bold text-slate-600 border border-slate-200 transition cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Net Price */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {form.listingType === 'rent' ? 'Net Rent (₹)' : 'Net Price (₹)'}{' '}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                value={form.netProfit}
                onChange={(e) => setForm({ ...form, netProfit: e.target.value })}
                placeholder={form.listingType === 'rent' ? 'e.g. 13500' : 'e.g. 1900000'}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-bold text-amber-700 text-xs"
              />
              {form.netProfit > 0 && (
                <div className="mt-1 text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70 inline-block">
                  Net: {formatINR(form.netProfit)}
                </div>
              )}
            </div>

            {/* Rental Brokerage */}
            {form.listingType === 'rent' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Rental Brokerage <span className="text-orange-600 font-normal">(Term)</span>
                </label>
                <input
                  type="text"
                  value={form.commission}
                  onChange={(e) => setForm({ ...form, commission: e.target.value })}
                  placeholder="e.g. 15 Days Rent, 1 Month"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-bold text-orange-700 text-xs"
                />
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {[
                    { label: '15 Days', val: '15 Days Rent' },
                    { label: '1 Month', val: '1 Month Rent' },
                    { label: '50%', val: '50% Brokerage' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm({ ...form, commission: preset.val })}
                      className="px-1.5 py-0.5 rounded bg-orange-50 hover:bg-orange-100 hover:text-orange-900 text-[10px] font-bold text-orange-700 border border-orange-200 transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Owner & Media Studio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Owner Info */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-user-star-line text-orange-600 text-xs" />{' '}
              {form.listingType === 'rent' ? 'Owner / Contact Person' : 'Owner / Builder / Partner'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                  {form.listingType === 'rent' ? 'Owner Name' : 'Owner / Builder Name'}
                </label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder={form.listingType === 'rent' ? 'e.g. Ramesh Kumar' : 'e.g. Dharmendra, Tripathi Ji'}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Contact Phone</label>
                <input
                  type="text"
                  value={form.ownerContact}
                  onChange={(e) => setForm({ ...form, ownerContact: e.target.value })}
                  placeholder="e.g. 9560587733"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Media Studio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-image-2-line text-orange-600 text-xs" /> Media Studio
              </h4>
              {(form.images || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, images: [] })}
                  className="text-[10px] text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer"
                >
                  Clear Gallery ({(form.images || []).length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Cover Photo */}
              <div>
                <input
                  type="file"
                  id="coverPhotoUploadInputStudio"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />

                {form.coverImage ? (
                  <div className="relative h-18 w-full rounded-xl overflow-hidden border border-orange-300 bg-slate-100 group shadow-2xs">
                    <img src={form.coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-orange-600/90 text-white font-bold text-[8px]">
                      Cover
                    </span>
                    <label
                      htmlFor="coverPhotoUploadInputStudio"
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1 cursor-pointer"
                    >
                      <i className="ri-camera-switch-line" /> Change
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="coverPhotoUploadInputStudio"
                    className="h-18 w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-orange-400 bg-slate-50/70 hover:bg-orange-50/40 transition flex flex-col items-center justify-center gap-0.5 cursor-pointer group select-none text-center p-1"
                  >
                    <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition flex items-center justify-center text-xs">
                      <i className="ri-image-add-line" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 group-hover:text-orange-950">Cover Photo</span>
                  </label>
                )}
              </div>

              {/* Gallery Photos */}
              <div>
                <input
                  type="file"
                  id="galleryPhotosUploadInputStudio"
                  multiple
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  className="hidden"
                />

                <label
                  htmlFor="galleryPhotosUploadInputStudio"
                  className="h-18 w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/40 transition flex flex-col items-center justify-center gap-0.5 cursor-pointer group select-none text-center p-1"
                >
                  <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition flex items-center justify-center text-xs">
                    <i className="ri-folder-image-line" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 group-hover:text-blue-950">Add Photos</span>
                  <span className="text-[9px] text-blue-600 font-semibold">{(form.images || []).length} added</span>
                </label>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {(form.images || []).length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {form.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] opacity-90 hover:opacity-100 transition cursor-pointer"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* YouTube Walkthrough Video Link */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                  <i className="ri-youtube-fill text-red-600 text-xs" />
                  YouTube / Walkthrough Video URL
                </label>
                {form.videoUrl && (
                  <a
                    href={form.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9.5px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-0.5"
                  >
                    <i className="ri-external-link-line" /> Test Video Link
                  </a>
                )}
              </div>
              <div className="relative">
                <i className="ri-play-circle-line absolute left-2.5 top-1/2 -translate-y-1/2 text-red-500 text-xs" />
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="e.g. https://youtu.be/... or YouTube video link"
                  className="w-full pl-7 pr-7 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 outline-none text-xs font-medium text-slate-900 shadow-2xs"
                />
                {form.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, videoUrl: '' })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    title="Clear video URL"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="text-[9px] text-slate-400 block">
                🎥 Video walkthrough link is automatically included in WhatsApp customer pitch flyers!
              </span>
            </div>
          </div>
        </div>

        {/* Verified Amenities Multi-Select */}
        <div className="pt-2 border-t border-slate-100 text-xs">
          <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Verified Amenities &amp; Features</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {QUICK_AMENITIES.map((am) => {
              const isSelected = form.amenities && form.amenities.includes(am);
              return (
                <button
                  key={am}
                  type="button"
                  onClick={() => handleAmenityToggle(am)}
                  className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-orange-50 border-orange-500 text-orange-800 font-black shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <i
                    className={
                      isSelected
                        ? 'ri-checkbox-circle-fill text-orange-600 text-xs'
                        : 'ri-checkbox-blank-circle-line text-slate-300 text-xs'
                    }
                  />
                  <span className="truncate text-[11px]">{am}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── COMPACT BOTTOM ACTION BAR ─── */}
      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
        >
          Reset / Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-700 hover:via-orange-600 hover:to-amber-700 text-white text-xs font-black shadow-md shadow-orange-500/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 hover:shadow-lg active:scale-95"
        >
          {saving ? (
            <>
              <i className="ri-loader-4-line text-sm font-black animate-spin" />
              <span>{editingId ? 'Saving Changes...' : 'Publishing Property...'}</span>
            </>
          ) : (
            <>
              <i className="ri-check-line text-sm font-black" />
              <span>{editingId ? 'Save Changes' : 'Publish Property Listing'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
