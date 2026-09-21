import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getAuth, clearAuth } from '../store/auth';
import { useAppDispatch } from '../store';
import { logoutAction } from '../store/authSlice';

// Reusable Components & Utilities
import PageHeader from '../components/common/PageHeader';
import DashboardTopNav from '../components/dashboard/DashboardTopNav';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardMetricsGrid from '../components/dashboard/DashboardMetricsGrid';
import CalculatorsPanel from '../components/dashboard/CalculatorsPanel';
import AssignedLeadsPanel from '../components/AssignedLeadsPanel';
import PropertyTable from '../components/properties/PropertyTable';
import PropertyGrid from '../components/properties/PropertyGrid';
import PropertyFormStudio from '../components/properties/PropertyFormStudio';
import PropertyDetailsDrawer from '../components/properties/PropertyDetailsDrawer';
import WhatsAppPitchModal from '../components/properties/WhatsAppPitchModal';

import {
  emptyFlatListing,
  formatINR,
  priceLabel,
} from '../utils/propertyConstants';

export default function SalesmanDashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const dispatch = useAppDispatch();
  const salesmanName = auth?.name || 'Sales Executive';

  // Navigation State
  const [view, setView] = useState('overview'); // 'overview' | 'list' | 'add' | 'leads' | 'calculator'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dutyStatus, setDutyStatus] = useState('online');

  // Listings & Form State
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyFlatListing());
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  // Modals & Drawers
  const [viewingProperty, setViewingProperty] = useState(null);
  const [pitchingProperty, setPitchingProperty] = useState(null);

  // Filters & Pagination
  const [searchVal, setSearchVal] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [inventoryViewMode, setInventoryViewMode] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const handleLogout = async () => {
    try {
      await dispatch(logoutAction());
    } catch {
      /* ignore */
    }
    clearAuth();
    navigate('/sales/login');
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api('/api/flat-listings');
      setListings(Array.isArray(res) ? res : []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Overall KPI Metrics
  const stats = useMemo(() => {
    const total = listings.length;
    const available = listings.filter((l) => l.dealStatus === 'available' || !l.dealStatus).length;
    const buyCount = listings.filter((l) => l.listingType === 'buy').length;
    const rentCount = listings.filter((l) => l.listingType === 'rent').length;
    const soldOrRented = listings.filter((l) => l.dealStatus === 'sold' || l.dealStatus === 'rented').length;
    const availableBuy = listings.filter((l) => l.listingType === 'buy' && (l.dealStatus === 'available' || !l.dealStatus)).length;
    const availableRent = listings.filter((l) => l.listingType === 'rent' && (l.dealStatus === 'available' || !l.dealStatus)).length;

    const totalVolume = listings.reduce((sum, l) => {
      const price = l.listingType === 'rent' ? Number(l.monthlyRent) || 0 : Number(l.salePrice) || 0;
      return sum + price;
    }, 0);

    return { total, available, buyCount, rentCount, soldOrRented, availableBuy, availableRent, totalVolume };
  }, [listings]);

  // Filtered & Paginated Listings
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (filterType !== 'all' && item.listingType !== filterType) return false;

      if (filterCategory !== 'all') {
        const cat = item.propertyCategory || 'Flat';
        if (filterCategory === 'Flat' && !['Flat', 'HK', 'RK'].includes(cat) && cat === 'Commercial') return false;
        if (filterCategory === 'Commercial' && !['Commercial', 'Office', 'Shop'].includes(cat) && !item.commercialSubType) return false;
        if (filterCategory === 'Office' && item.commercialSubType !== 'Office' && cat !== 'Office') return false;
        if (filterCategory === 'Shop' && item.commercialSubType !== 'Shop' && cat !== 'Shop') return false;
        if (filterCategory === 'Plot' && cat !== 'Plot' && cat !== 'Land') return false;
      }

      if (filterPrice !== 'all') {
        const price = item.listingType === 'rent' ? Number(item.monthlyRent) || 0 : Number(item.salePrice) || 0;
        if (item.listingType === 'rent') {
          if (filterPrice === 'u15' && price >= 10000) return false;
          if (filterPrice === '15-25' && (price < 10000 || price > 20000)) return false;
          if (filterPrice === '25-40' && (price < 20000 || price > 35000)) return false;
          if (filterPrice === '40-60' && (price < 35000 || price > 50000)) return false;
          if (filterPrice === 'a60' && price <= 50000) return false;
        } else {
          if (filterPrice === 'u15' && price >= 1500000) return false;
          if (filterPrice === '15-25' && (price < 1500000 || price > 2500000)) return false;
          if (filterPrice === '25-40' && (price < 2500000 || price > 4000000)) return false;
          if (filterPrice === '40-60' && (price < 4000000 || price > 6000000)) return false;
          if (filterPrice === 'a60' && price <= 6000000) return false;
        }
      }

      if (searchVal.trim()) {
        const q = searchVal.toLowerCase();
        const text = `${item.title} ${item.location} ${item.configuration} ${item.ownerName} ${item.floor} ${item.commercialSubType}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [listings, filterType, filterCategory, filterPrice, searchVal]);

  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE) || 1;
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredListings.slice(start, start + PAGE_SIZE);
  }, [filteredListings, currentPage]);

  // Actions
  const handleSaveListing = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      const payload = {
        ...form,
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
        netProfit: form.netProfit ? Number(form.netProfit) : undefined,
        isVerified: true,
      };

      if (editingId) {
        await api(`/api/flat-listings/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        setStatus('✓ Property updated successfully!');
      } else {
        await api('/api/flat-listings', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        setStatus('✓ New property listing published successfully!');
      }

      await load();
      setForm(emptyFlatListing());
      setEditingId(null);
      setView('list');
    } catch (err) {
      setStatus(err.message || 'Failed to save listing.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (listing) => {
    setForm({ ...listing });
    setEditingId(listing._id);
    setView('add');
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Delete this listing from inventory?')) return;
    try {
      await api(`/api/flat-listings/${id}`, { method: 'DELETE' });
      setListings((prev) => prev.filter((l) => l._id !== id));
      setStatus('Listing removed from inventory.');
    } catch (err) {
      setStatus(err.message || 'Failed to delete listing.');
    }
  };

  const toggleDealStatus = async (item) => {
    const isClosed = item.dealStatus === 'sold' || item.dealStatus === 'rented';
    const newStatus = isClosed ? 'available' : item.listingType === 'rent' ? 'rented' : 'sold';
    try {
      await api(`/api/flat-listings/${item._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ dealStatus: newStatus }),
        headers: { 'Content-Type': 'application/json' },
      });
      setListings((prev) =>
        prev.map((l) => (l._id === item._id ? { ...l, dealStatus: newStatus } : l))
      );
      setStatus(`✓ Deal status changed to ${newStatus}.`);
    } catch (err) {
      setStatus(err.message || 'Failed to update deal status.');
    }
  };

  const handleSharePortfolio = () => {
    const availableItems = listings.filter((l) => l.dealStatus === 'available' || !l.dealStatus);
    const topPicks = availableItems.slice(0, 5).map((l, i) =>
      `${i + 1}️⃣ *${l.configuration || 'Property'}* - ${l.location || 'Delhi NCR'}\n   💰 Demand: ${priceLabel(l)} | 🏢 ${l.floor || 'Standard'}`
    ).join('\n\n');

    const msg =
`🏢 *BABA BROKER - VERIFIED PROPERTY PORTFOLIO*
👤 *Executive:* ${salesmanName}

📊 *Inventory Overview:*
• Total Portfolio Value: *${formatINR(stats.totalVolume)}*
• Active Available Units: *${stats.available}* / ${stats.total}

✨ *Top Featured Listings:*
${topPicks || '• Contact for latest available units'}

📲 *For Site Visits & Direct Inquiries:*
Contact *${salesmanName}* | Baba Broker Real Estate
📍 Rama Park Road, Mohan Garden, Uttam Nagar, New Delhi`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'ri-dashboard-3-line' },
    { id: 'list', label: 'Property Catalog', icon: 'ri-building-line', badge: stats.total },
    { id: 'add', label: editingId ? 'Edit Property' : 'Onboard Property', icon: 'ri-add-circle-line' },
    { id: 'leads', label: 'Client Inquiries', icon: 'ri-user-star-line' },
    { id: 'calculator', label: 'Deal Calculators', icon: 'ri-calculator-line' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 font-['Inter',sans-serif] text-slate-800 antialiased overflow-hidden select-none">
      {/* 1. Reusable Top Navigation */}
      <DashboardTopNav
        roleTitle="Sales Executive Desk"
        roleBadge="Sales Associate"
        userName={salesmanName}
        dutyStatus={dutyStatus}
        onToggleDuty={() => setDutyStatus((d) => (d === 'online' ? 'offline' : 'online'))}
        onLogout={handleLogout}
        onToggleMobileSidebar={() => setMobileSidebarOpen((o) => !o)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Reusable Sidebar */}
        <DashboardSidebar
          view={view}
          setView={setView}
          navItems={navItems}
          onSharePortfolio={handleSharePortfolio}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        {/* Dynamic Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
            {/* Notification Banner */}
            {status && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-900 flex items-center justify-between shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <i className="ri-information-line text-orange-600 text-sm" /> {status}
                </span>
                <button
                  type="button"
                  onClick={() => setStatus('')}
                  className="text-orange-400 hover:text-orange-900 cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ─── TAB 0: OVERVIEW ─── */}
            {view === 'overview' && (
              <div className="space-y-3 w-full">
                {/* Executive Welcome Banner */}
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
                        Welcome back, <span className="text-orange-600">{salesmanName}</span> 👋
                      </h1>
                      <span className="px-2 py-0.2 rounded-full bg-orange-50 text-orange-700 text-[9.5px] font-black uppercase tracking-wider border border-orange-200 shrink-0">
                        Sales Desk
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Pitch active properties, schedule customer visits, and calculate brokerage commissions.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => { setForm(emptyFlatListing()); setEditingId(null); setView('add'); }}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="ri-add-line text-sm" /> Add Property
                    </button>
                    <button
                      type="button"
                      onClick={handleSharePortfolio}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="ri-whatsapp-fill text-sm" /> Share Portfolio
                    </button>
                  </div>
                </div>

                {/* 4-Card Metrics Grid */}
                <DashboardMetricsGrid stats={stats} />

                {/* Recent Inventory Table */}
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5 w-full">
                  <PageHeader
                    icon="ri-time-line"
                    title="Recent Property Inventory"
                    badge={`${listings.length} Active`}
                    subtitle="Your latest onboarded properties ready for client pitching"
                    rightContent={
                      <button
                        type="button"
                        onClick={() => setView('list')}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All ({listings.length})</span>
                        <i className="ri-arrow-right-line" />
                      </button>
                    }
                  />

                  <PropertyTable
                    listings={listings.slice(0, 10)}
                    onViewDetails={(item) => setViewingProperty(item)}
                    onPitch={(item) => setPitchingProperty(item)}
                    onEdit={startEdit}
                    onToggleDealStatus={toggleDealStatus}
                  />
                </div>
              </div>
            )}

            {/* ─── TAB 1: PROPERTY INVENTORY CATALOG ─── */}
            {view === 'list' && (
              <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 w-full">
                <PageHeader
                  icon="ri-building-line"
                  title="Property Inventory Catalog"
                  badge={`${filteredListings.length} Units`}
                  subtitle="Manage your active inventory, pricing & deal statuses"
                  rightContent={
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative w-48 sm:w-56">
                        <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                          type="text"
                          value={searchVal}
                          onChange={(e) => { setSearchVal(e.target.value); setCurrentPage(1); }}
                          placeholder="Search flat, location, size..."
                          className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white pl-7 pr-6 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-orange-500 transition font-medium shadow-2xs"
                        />
                        {searchVal && (
                          <button
                            type="button"
                            onClick={() => setSearchVal('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => { setForm(emptyFlatListing()); setEditingId(null); setView('add'); }}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                      >
                        <i className="ri-add-line text-sm" />
                        <span className="hidden sm:inline">Add Property</span>
                      </button>
                    </div>
                  }
                />

                {/* Filter Ribbon */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Categories */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
                      {[
                        { id: 'all', label: 'All Units' },
                        { id: 'Flat', label: '🏠 Flat' },
                        { id: 'Commercial', label: '🏢 Commercial' },
                        { id: 'Office', label: '💼 Office' },
                        { id: 'Shop', label: '🏪 Shop' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setFilterCategory(cat.id); setCurrentPage(1); }}
                          className={`px-2 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                            filterCategory === cat.id
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Deal Types */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
                      {['all', 'buy', 'rent'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setFilterType(t); setFilterPrice('all'); setCurrentPage(1); }}
                          className={`px-2 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                            filterType === t
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {t === 'all' ? 'All Deals' : t === 'buy' ? '🏷️ Buy/Sale' : '🔑 Rent'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget Selector & View Switch */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-xl">
                      <select
                        value={filterPrice}
                        onChange={(e) => { setFilterPrice(e.target.value); setCurrentPage(1); }}
                        className="text-xs font-bold text-amber-950 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="all">💰 All Budgets</option>
                        <option value="u15">Under ₹15 Lakh</option>
                        <option value="15-25">₹15 L – ₹25 Lakh</option>
                        <option value="25-40">₹25 L – ₹40 Lakh</option>
                        <option value="40-60">₹40 L – ₹60 Lakh</option>
                        <option value="a60">Above ₹60 Lakh</option>
                      </select>
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setInventoryViewMode('table')}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          inventoryViewMode === 'table' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        <i className="ri-table-line" /> Table
                      </button>
                      <button
                        type="button"
                        onClick={() => setInventoryViewMode('grid')}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          inventoryViewMode === 'grid' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        <i className="ri-grid-fill" /> Cards
                      </button>
                    </div>
                  </div>
                </div>

                {/* List Body */}
                {paginatedListings.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <i className="ri-building-line text-4xl mb-2 block text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No properties found matching filters.</p>
                  </div>
                ) : inventoryViewMode === 'grid' ? (
                  <PropertyGrid
                    listings={paginatedListings}
                    onViewDetails={(item) => setViewingProperty(item)}
                    onPitch={(item) => setPitchingProperty(item)}
                    onEdit={startEdit}
                    onDelete={deleteListing}
                    onToggleDealStatus={toggleDealStatus}
                  />
                ) : (
                  <PropertyTable
                    listings={paginatedListings}
                    currentPage={currentPage}
                    pageSize={PAGE_SIZE}
                    onViewDetails={(item) => setViewingProperty(item)}
                    onPitch={(item) => setPitchingProperty(item)}
                    onEdit={startEdit}
                    onDelete={deleteListing}
                    onToggleDealStatus={toggleDealStatus}
                  />
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 font-medium">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredListings.length)} of {filteredListings.length} units
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        Prev
                      </button>
                      <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 font-black font-mono">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 2: ADD / EDIT PROPERTY ONBOARDING STUDIO ─── */}
            {view === 'add' && (
              <PropertyFormStudio
                form={form}
                setForm={setForm}
                editingId={editingId}
                setEditingId={setEditingId}
                onSave={handleSaveListing}
                onCancel={() => { setForm(emptyFlatListing()); setEditingId(null); setView('list'); }}
                saving={saving}
                roleBadge="Sales Listing"
              />
            )}

            {/* ─── TAB 3: CLIENT INQUIRY DESK ─── */}
            {view === 'leads' && (
              <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 w-full">
                <PageHeader
                  icon="ri-user-star-line"
                  title="Client & Buyer Inquiry Desk"
                  subtitle="Assigned buyer leads and site visit scheduling"
                  badge="Live Inquiries"
                />
                <AssignedLeadsPanel />
              </div>
            )}

            {/* ─── TAB 4: CALCULATORS ─── */}
            {view === 'calculator' && <CalculatorsPanel badge="Sales Tools" />}
          </main>

          {/* Footer */}
          <footer className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium bg-white">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Baba Broker Sales Desk · v2.4
            </span>
            <span>Direct Support: <a href="mailto:support@bababroker.com" className="text-[#ea580c] hover:underline">support@bababroker.com</a></span>
            <span className="hidden sm:inline">© 2026 Baba Broker. All rights reserved.</span>
          </footer>
        </div>
      </div>

      {/* Reusable Modals & Drawers */}
      <WhatsAppPitchModal
        property={pitchingProperty}
        onClose={() => setPitchingProperty(null)}
        senderName={salesmanName}
      />

      <PropertyDetailsDrawer
        property={viewingProperty}
        onClose={() => setViewingProperty(null)}
        onPitch={(item) => { setViewingProperty(null); setPitchingProperty(item); }}
        onEdit={startEdit}
        onToggleDealStatus={toggleDealStatus}
      />
    </div>
  );
}
