import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Loader, EmptyState } from '../ui';
import { useToast } from '../../hooks/useToast';

function formatIndianCurrency(num) {
  if (!num || isNaN(num)) return '—';
  if (num >= 10000000) {
    return `₹ ${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (num >= 100000) {
    return `₹ ${(num / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  }
  return `₹ ${Number(num).toLocaleString('en-IN')}`;
}

export default function AdminExcelView() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [totalDbCount, setTotalDbCount] = useState(0);
  const PAGE_SIZE = 15;

  const loadListings = useCallback(async () => {
    try {
      const res = await api('/api/admin/excel-upload/flat-listings?limit=100');
      if (res && Array.isArray(res.listings)) {
        setParsedData(res.listings);
        setTotalDbCount(res.total || res.listings.length);
      }
    } catch {
      // silently fail if initial fetch not ready
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setStatus({ type: '', msg: '' });

    try {
      if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
        const form = new FormData();
        form.append('file', file);
        const res = await api('/api/admin/excel-upload/bulk-upload', { method: 'POST', body: form });

        const successCount = res.importedCount ?? (res.success ? res.success.length : 0);
        const failedCount = res.failed ? res.failed.length : 0;

        if (successCount > 0) {
          setStatus({
            type: 'success',
            msg: `✓ Successfully parsed & imported ${successCount} property listings into database!${failedCount > 0 ? ` (${failedCount} empty rows skipped)` : ''}`,
          });
          toast?.({ type: 'success', message: `Imported ${successCount} listings successfully!` });
          await loadListings();
        } else {
          setStatus({
            type: 'error',
            msg: `Upload completed but 0 rows imported. ${res.failed?.[0]?.error || 'Please check that your Excel file contains valid property data.'}`,
          });
        }
      } else {
        setStatus({ type: 'error', msg: 'Unsupported format. Please upload .xlsx, .xls, or .csv files.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Upload failed. Check server connection.' });
    } finally {
      setUploading(false);
    }
  }, [loadListings, toast]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const downloadSampleTemplate = () => {
    const csvContent =
      'S.NO,SIZE,FLOOR,PRICE,LOCATION,LIFT,PARKING,ADDRESS,CONTACT,NET PRICE,BY,ADDITIONAL CONTACT / NOTES\n' +
      '1,50GAJ,G-FS,20L,BHAGWATI GARDEN,NO,BIKE,SPRING MEDICAL,9560587733,,DHARMENDRA,Front side prime floor\n' +
      '2,50GAJ,T-BS,22L,MANSHARAM,YES,BIKE PARKING,,,TRIPATHI JI,Top floor with roof rights\n' +
      '3,40GAJ,2ND-BS,15.5L,JAIN ROAD,NO,BIKE,LAXMI ENCLAVE,8287143122,14.5L,ASHISH JI,Ready to move builder floor\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'baba_broker_sample_listings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEdit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingListing || !editingListing._id) return;
    setSavingEdit(true);

    try {
      const payload = {
        title: editingListing.title,
        location: editingListing.location,
        configuration: editingListing.configuration,
        sizeSqft: editingListing.sizeSqft,
        floor: editingListing.floor,
        lift: editingListing.lift,
        parking: editingListing.parking,
        salePrice: Number(editingListing.salePrice) || 0,
        monthlyRent: Number(editingListing.monthlyRent) || 0,
        netProfit: Number(editingListing.netProfit) || 0,
        ownerName: editingListing.ownerName,
        ownerContact: editingListing.ownerContact,
        completeAddress: editingListing.completeAddress,
        description: editingListing.description,
        specialInstructions: editingListing.specialInstructions,
        dealStatus: editingListing.dealStatus,
        listingType: editingListing.listingType,
      };

      const updated = await api(`/api/flat-listings/${editingListing._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      // Update state locally
      setParsedData((prev) =>
        prev.map((item) => (item._id === editingListing._id ? { ...item, ...updated } : item))
      );

      toast?.({ type: 'success', message: 'Row updated successfully in database!' });
      setEditingListing(null);
    } catch (err) {
      toast?.({ type: 'error', message: err.message || 'Failed to update listing.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteListing = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this listing'}"?`)) return;
    try {
      await api(`/api/flat-listings/${id}`, { method: 'DELETE' });
      setParsedData((prev) => prev.filter((item) => item._id !== id));
      setTotalDbCount((prev) => Math.max(0, prev - 1));
      toast?.({ type: 'success', message: 'Listing deleted from database.' });
    } catch (err) {
      toast?.({ type: 'error', message: err.message || 'Failed to delete listing.' });
    }
  };

  const filtered = useMemo(() => {
    return parsedData.filter((row) => {
      if (typeFilter !== 'all' && row.listingType !== typeFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(row.title || '').toLowerCase().includes(q) ||
        String(row.location || '').toLowerCase().includes(q) ||
        String(row.configuration || '').toLowerCase().includes(q) ||
        String(row.ownerName || '').toLowerCase().includes(q) ||
        String(row.ownerContact || '').includes(q) ||
        String(row.floor || '').toLowerCase().includes(q) ||
        String(row.sizeSqft || '').toLowerCase().includes(q) ||
        String(row.completeAddress || '').toLowerCase().includes(q)
      );
    });
  }, [parsedData, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = useMemo(() => {
    return filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [filtered, page]);

  // Aggregate KPI metrics
  const totalVolume = useMemo(() => {
    return parsedData.reduce((sum, r) => sum + (Number(r.salePrice) || Number(r.monthlyRent) || 0), 0);
  }, [parsedData]);

  const uniqueAgentsCount = useMemo(() => {
    const names = new Set(parsedData.map((r) => r.ownerName).filter(Boolean));
    return names.size;
  }, [parsedData]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 text-slate-800">
      {/* 1. Header & Summary Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                <i className="ri-file-excel-2-line text-lg" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  Excel & CSV Bulk Upload
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Smart auto-mapping with live row editing, Gaj/Lakh conversions & direct WhatsApp contact
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-orange-700 text-xs font-bold border border-orange-200/70 transition cursor-pointer"
            >
              <i className="ri-download-2-line text-sm" />
              <span>Sample CSV</span>
            </button>
            <button
              type="button"
              onClick={loadListings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold border border-slate-200/70 transition cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Compact KPI Mini Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-slate-100">
          <div className="flex items-center gap-2.5 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs">
              <i className="ri-building-line" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Inventory</span>
              <span className="text-xs font-black text-slate-900">{totalDbCount || parsedData.length} Listings</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
              <i className="ri-money-rupee-circle-line" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Value</span>
              <span className="text-xs font-black text-emerald-700">{formatIndianCurrency(totalVolume)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
              <i className="ri-user-star-line" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Agents / Sourced</span>
              <span className="text-xs font-black text-slate-900">{uniqueAgentsCount} Associates</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
              <i className="ri-edit-2-line" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Row Corrections</span>
              <span className="text-xs font-black text-purple-700">1-Click Edit</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Compact Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all duration-200 cursor-pointer text-center ${
          dragging
            ? 'border-orange-500 bg-orange-50/90 scale-[1.003]'
            : 'border-slate-300/80 bg-white hover:border-orange-400 hover:bg-orange-50/30 shadow-xs'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-2xl shrink-0">
              <i className="ri-upload-cloud-2-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {fileName ? `File Selected: ${fileName}` : 'Drop Property_Listings.xlsx or .CSV here'}
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700">
                  Click to Browse
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Automatically reads headers like SIZE, FLOOR, PRICE, LOCATION, CONTACT, BY, NET PRICE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
              .XLSX
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
              .XLS
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
              .CSV
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              Instant Import
            </span>
          </div>
        </div>
      </div>

      {/* Uploading Status */}
      {uploading && (
        <div className="flex items-center justify-center gap-2.5 py-3 bg-white rounded-2xl border border-orange-200 shadow-2xs">
          <i className="ri-loader-4-line text-lg text-orange-600 animate-spin" />
          <span className="text-xs text-slate-700 font-bold animate-pulse">Parsing & importing listings…</span>
        </div>
      )}

      {/* Alert Status Pill */}
      {status.msg && (
        <div
          className={`rounded-xl p-3 text-xs font-bold flex items-center justify-between gap-2 shadow-xs ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`${status.type === 'success' ? 'ri-checkbox-circle-fill text-emerald-600' : 'ri-error-warning-fill text-red-600'} text-base`} />
            <span>{status.msg}</span>
          </div>
          <button
            onClick={() => setStatus({ type: '', msg: '' })}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
          >
            <i className="ri-close-line text-sm" />
          </button>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search location, size, agent, floor, phone…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <i className="ri-close-circle-fill" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => { setTypeFilter('all'); setPage(0); }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${typeFilter === 'all' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All ({parsedData.length})
            </button>
            <button
              onClick={() => { setTypeFilter('buy'); setPage(0); }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${typeFilter === 'buy' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Buy / Sale
            </button>
            <button
              onClick={() => { setTypeFilter('rent'); setPage(0); }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${typeFilter === 'rent' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Rent
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-500 hidden md:inline">
            Showing <strong className="text-slate-900">{filtered.length}</strong> listings
          </span>
        </div>
      </div>

      {/* 4. Compact Data Table */}
      {parsedData.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Property & Size</th>
                  <th className="py-2.5 px-3">Location & Address</th>
                  <th className="py-2.5 px-3">Floor & Specs</th>
                  <th className="py-2.5 px-3">Demand Price</th>
                  <th className="py-2.5 px-3">Net Price</th>
                  <th className="py-2.5 px-3">Sourced By / Contact</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {pageData.map((row, idx) => {
                  const sNo = page * PAGE_SIZE + idx + 1;
                  const priceStr = row.listingType === 'rent'
                    ? `${formatIndianCurrency(row.monthlyRent)}/mo`
                    : formatIndianCurrency(row.salePrice);
                  const netPriceStr = row.netProfit > 0 ? formatIndianCurrency(row.netProfit) : '—';
                  const cleanPhone = String(row.ownerContact || '').replace(/[^\d]/g, '');

                  return (
                    <tr
                      key={row._id || `row-${idx}`}
                      className="hover:bg-orange-50/40 transition-colors group cursor-default"
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-bold text-[11px]">
                        {sNo}
                      </td>

                      {/* Property & Size */}
                      <td className="py-2 px-3 max-w-[240px]">
                        <div className="flex items-center gap-2.5">
                          <div
                            onClick={() => setSelectedListing(row)}
                            className="h-10 w-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-slate-200 shadow-2xs cursor-pointer hover:opacity-90 transition"
                            title="Click to view photo"
                          >
                            {row.coverImage ? (
                              <img src={row.coverImage} alt="" className="h-full w-full object-cover" />
                            ) : (row.images && row.images.length > 0) ? (
                              <img src={row.images[0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-black text-orange-600">{(row.configuration || '2B').slice(0, 2)}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wide">
                                {row.configuration || '2 BHK'}
                              </span>
                              <span
                                onClick={() => setSelectedListing(row)}
                                className="text-[11px] font-bold text-slate-900 truncate hover:text-orange-600 cursor-pointer"
                                title={row.title}
                              >
                                {row.sizeSqft || 'Builder Floor'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5" title={row.title}>
                              {row.title || `${row.configuration} in ${row.location}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location & Address */}
                      <td className="py-2 px-3 max-w-[200px]">
                        <div className="flex items-center gap-1 text-slate-900 font-bold text-xs">
                          <i className="ri-map-pin-2-fill text-orange-500 text-xs shrink-0" />
                          <span className="truncate" title={row.location}>{row.location || '—'}</span>
                        </div>
                        {row.completeAddress && row.completeAddress !== row.location && (
                          <span className="text-[10px] text-slate-400 block truncate" title={row.completeAddress}>
                            {row.completeAddress}
                          </span>
                        )}
                      </td>

                      {/* Floor & Specs */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {row.floor || 'Floor: —'}
                          </span>
                          {row.lift === 'YES' ? (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5" title="Lift Available">
                              <i className="ri-arrow-up-down-line" /> Lift
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold" title="No Lift">
                              No Lift
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-medium" title={row.parking}>
                            {row.parking?.toLowerCase().includes('car') ? '🚗' : '🏍️'}
                          </span>
                        </div>
                      </td>

                      {/* Demand Price */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="inline-block font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200/60">
                          {priceStr}
                        </span>
                      </td>

                      {/* Net Price */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`text-xs font-bold ${row.netProfit > 0 ? 'text-amber-700' : 'text-slate-300'}`}>
                          {netPriceStr}
                        </span>
                      </td>

                      {/* Sourced By & Contact */}
                      <td className="py-2 px-3 max-w-[180px]">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 block truncate" title={row.ownerName}>
                              {row.ownerName || 'Associate'}
                            </span>
                            {cleanPhone ? (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {cleanPhone}
                              </span>
                            ) : null}
                          </div>

                          {cleanPhone && (
                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hi, regarding ${row.title || row.configuration} at ${row.location} (Price: ${priceStr})`)}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp Chat"
                                className="h-6 w-6 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center text-xs"
                              >
                                <i className="ri-whatsapp-line" />
                              </a>
                              <a
                                href={`tel:${cleanPhone}`}
                                title="Call"
                                className="h-6 w-6 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center text-xs"
                              >
                                <i className="ri-phone-line" />
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions (Edit, View, Delete) */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingListing({ ...row })}
                            title="Edit / Correct Row"
                            className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 border border-orange-200"
                          >
                            <i className="ri-edit-line text-xs" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedListing(row)}
                            title="View Full Details"
                            className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 border border-blue-200"
                          >
                            <i className="ri-eye-line text-xs" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteListing(row._id, row.title)}
                            title="Delete Row"
                            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 border border-slate-200 hover:border-red-200"
                          >
                            <i className="ri-delete-bin-line text-xs" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty search fallback */}
          {filtered.length === 0 && (
            <div className="p-8 text-center">
              <i className="ri-search-line text-3xl text-slate-300 block mb-2" />
              <p className="text-xs font-bold text-slate-600">No properties match your filter</p>
              <p className="text-[11px] text-slate-400">Try clearing your search query</p>
            </div>
          )}

          {/* Compact Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 font-semibold">
                Page <strong className="text-slate-900">{page + 1}</strong> of <strong className="text-slate-900">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition"
                >
                  <i className="ri-arrow-left-s-line" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition"
                >
                  Next <i className="ri-arrow-right-s-line" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        !uploading && (
          <EmptyState
            icon="ri-file-excel-2-line"
            title="No Listings Found"
            description="Drag and drop your Property_Listings.xlsx file above to instantly import your real estate inventory."
          />
        )
      )}

      {/* 5. EDIT ROW MODAL */}
      {editingListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-base font-bold">
                  <i className="ri-edit-2-line" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">Edit Property Row</h3>
                  <p className="text-[11px] text-slate-400">Make instant corrections to this listing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Configuration / BHK</label>
                  <input
                    type="text"
                    value={editingListing.configuration || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, configuration: e.target.value })}
                    placeholder="e.g. 2 BHK, 1 RK"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Size (Gaj / Sq.Ft)</label>
                  <input
                    type="text"
                    value={editingListing.sizeSqft || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, sizeSqft: e.target.value })}
                    placeholder="e.g. 50 Gaj (450 sq.ft)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Listing Type</label>
                  <select
                    value={editingListing.listingType || 'buy'}
                    onChange={(e) => setEditingListing({ ...editingListing, listingType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                  >
                    <option value="buy">Buy / Sale</option>
                    <option value="rent">Rent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Location / Colony</label>
                  <input
                    type="text"
                    value={editingListing.location || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, location: e.target.value })}
                    placeholder="e.g. Bhagwati Garden, Sewak Park"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Complete Address / Landmark</label>
                  <input
                    type="text"
                    value={editingListing.completeAddress || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, completeAddress: e.target.value })}
                    placeholder="e.g. Near Spring Medical, Jain Road"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Floor</label>
                  <input
                    type="text"
                    value={editingListing.floor || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, floor: e.target.value })}
                    placeholder="e.g. Ground Floor (Front Side), 2ND-BS"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Lift Facility</label>
                  <select
                    value={editingListing.lift || 'NO'}
                    onChange={(e) => setEditingListing({ ...editingListing, lift: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                  >
                    <option value="YES">YES (Lift Available)</option>
                    <option value="NO">NO (No Lift)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Parking</label>
                  <input
                    type="text"
                    value={editingListing.parking || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, parking: e.target.value })}
                    placeholder="e.g. Bike Parking, Car + Bike"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Demand Price (₹) <span className="text-emerald-600 font-bold">({formatIndianCurrency(editingListing.salePrice || editingListing.monthlyRent)})</span>
                  </label>
                  <input
                    type="number"
                    value={editingListing.listingType === 'rent' ? (editingListing.monthlyRent || '') : (editingListing.salePrice || '')}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      if (editingListing.listingType === 'rent') {
                        setEditingListing({ ...editingListing, monthlyRent: val });
                      } else {
                        setEditingListing({ ...editingListing, salePrice: val });
                      }
                    }}
                    placeholder="e.g. 2000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Net Price (₹) <span className="text-amber-600 font-bold">({formatIndianCurrency(editingListing.netProfit)})</span>
                  </label>
                  <input
                    type="number"
                    value={editingListing.netProfit || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, netProfit: Number(e.target.value) || 0 })}
                    placeholder="e.g. 1900000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Deal Status</label>
                  <select
                    value={editingListing.dealStatus || 'available'}
                    onChange={(e) => setEditingListing({ ...editingListing, dealStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                  >
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Sourced By (Agent / Owner Name)</label>
                  <input
                    type="text"
                    value={editingListing.ownerName || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, ownerName: e.target.value })}
                    placeholder="e.g. DHARMENDRA, TRIPATHI JI"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Contact Phone Number <span className="text-slate-400 font-normal">(10 digits)</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={editingListing.ownerContact || ''}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEditingListing({ ...editingListing, ownerContact: onlyDigits });
                    }}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={editingListing.description || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, description: e.target.value })}
                  placeholder="Additional remarks, special instructions, connectivity details..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  {savingEdit ? (
                    <>
                      <i className="ri-loader-4-line text-sm animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line text-sm" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DETAILED PROPERTY INSPECTOR MODAL */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black uppercase">
                  {selectedListing.configuration || '2 BHK'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedListing.title || `${selectedListing.configuration} in ${selectedListing.location}`}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <i className="ri-map-pin-2-fill text-orange-500" />
                  {selectedListing.location}
                </p>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Photo Showcase & Gallery */}
            {(() => {
              const allPhotos = [
                selectedListing.coverImage,
                ...(Array.isArray(selectedListing.images) ? selectedListing.images : [])
              ].filter(Boolean);

              if (allPhotos.length === 0) return null;
              return (
                <div className="space-y-2">
                  <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner">
                    <img
                      src={allPhotos[0]}
                      alt="Property Preview"
                      className="h-full w-full object-contain sm:object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-[10px] font-bold backdrop-blur-xs">
                      {allPhotos.length} {allPhotos.length === 1 ? 'Photo' : 'Photos'} Attached
                    </span>
                  </div>
                  {allPhotos.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {allPhotos.map((img, idx) => (
                        <div key={idx} className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                          <img src={img} alt="" className="h-full w-full object-cover" />
                          <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-black/60 text-white text-[8px] font-bold">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Demand Price</span>
                <span className="text-sm font-black text-emerald-700">
                  {formatIndianCurrency(selectedListing.salePrice || selectedListing.monthlyRent)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Net Negotiable</span>
                <span className="text-sm font-black text-amber-700">
                  {selectedListing.netProfit > 0 ? formatIndianCurrency(selectedListing.netProfit) : 'Firm Demand'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Floor & Lift</span>
                <span className="font-bold text-slate-800">
                  {selectedListing.floor || 'Standard'} • {selectedListing.lift === 'YES' ? '🛗 Lift Yes' : 'No Lift'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Size & Parking</span>
                <span className="font-bold text-slate-800">
                  {selectedListing.sizeSqft || '450 sqft'} • {selectedListing.parking || 'Bike'}
                </span>
              </div>
            </div>

            {selectedListing.completeAddress && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Address Landmark</span>
                <span className="font-bold text-slate-700">{selectedListing.completeAddress}</span>
              </div>
            )}

            {selectedListing.description && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Description & Notes</span>
                <p className="text-slate-600 font-medium text-[11px] leading-relaxed mt-0.5">
                  {selectedListing.description}
                </p>
              </div>
            )}

            <div className="bg-orange-50/60 p-3 rounded-2xl border border-orange-200/60 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-orange-600 font-bold block uppercase">Sourced By Associate</span>
                <span className="text-xs font-black text-slate-900">{selectedListing.ownerName || 'Associate'}</span>
                {selectedListing.ownerContact && (
                  <span className="text-[11px] text-slate-600 font-mono block">{selectedListing.ownerContact}</span>
                )}
              </div>
              {selectedListing.ownerContact && (
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/91${String(selectedListing.ownerContact).replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition flex items-center gap-1"
                  >
                    <i className="ri-whatsapp-line" /> WhatsApp
                  </a>
                  <a
                    href={`tel:${String(selectedListing.ownerContact).replace(/[^\d]/g, '')}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition flex items-center gap-1"
                  >
                    <i className="ri-phone-line" /> Call
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = selectedListing;
                  setSelectedListing(null);
                  setEditingListing({ ...target });
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="ri-edit-line" /> Edit Listing
              </button>
              <button
                type="button"
                onClick={() => setSelectedListing(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
