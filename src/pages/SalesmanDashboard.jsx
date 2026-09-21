import React from 'react';
import { useSalesmanDashboard } from '../hooks/useSalesmanDashboard';

// Reusable Components
import DashboardTopNav from '../components/dashboard/DashboardTopNav';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardMetricsGrid from '../components/dashboard/DashboardMetricsGrid';
import AssignedLeadsPanel from '../components/AssignedLeadsPanel';
import PropertyTable from '../components/properties/PropertyTable';
import PropertyGrid from '../components/properties/PropertyGrid';
import PropertyFormStudio from '../components/properties/PropertyFormStudio';
import PropertyDetailsDrawer from '../components/properties/PropertyDetailsDrawer';
import WhatsAppPitchModal from '../components/properties/WhatsAppPitchModal';
import { emptyFlatListing } from '../utils/propertyConstants';

export default function SalesmanDashboard() {
  const {
    salesmanName,
    view,
    setView,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    dutyStatus,
    setDutyStatus,
    listings,
    form,
    setForm,
    editingId,
    setEditingId,
    status,
    setStatus,
    saving,
    viewingProperty,
    setViewingProperty,
    pitchingProperty,
    setPitchingProperty,
    searchVal,
    setSearchVal,
    filterCategory,
    setFilterCategory,
    filterType,
    setFilterType,
    filterPrice,
    setFilterPrice,
    inventoryViewMode,
    setInventoryViewMode,
    currentPage,
    setCurrentPage,
    PAGE_SIZE,
    totalPages,
    stats,
    filteredListings,
    paginatedListings,
    handleLogout,
    handleSaveListing,
    startEdit,
    deleteListing,
    toggleDealStatus,
    handleSharePortfolio,
  } = useSalesmanDashboard();

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: 'ri-dashboard-3-line', activeIcon: 'ri-dashboard-3-fill' },
    { id: 'list', label: 'Property Inventory', icon: 'ri-home-8-line', activeIcon: 'ri-home-8-fill' },
    { id: 'add', label: editingId ? 'Edit Property' : 'Add Property', icon: 'ri-add-circle-line', activeIcon: 'ri-add-circle-fill' },
    { id: 'leads', label: 'Assigned Leads', icon: 'ri-user-star-line', activeIcon: 'ri-user-star-fill' },
  ];

  return (
    <div className="h-screen w-screen bg-[#070e1c] p-1.5 sm:p-2.5 md:p-3 font-['Inter',sans-serif] text-slate-800 antialiased flex flex-col justify-center overflow-hidden select-text">
      {/* Toast Alert */}
      {status && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-white text-emerald-800 shadow-xl px-4 py-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <i className="ri-checkbox-circle-fill text-emerald-600 text-base" />
          <span>{status}</span>
          <button
            type="button"
            onClick={() => setStatus('')}
            className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer"
          >
            <i className="ri-close-line text-sm" />
          </button>
        </div>
      )}

      {/* Main Curved App Container */}
      <div className="w-full h-full rounded-2xl sm:rounded-3xl md:rounded-[36px] shadow-2xl shadow-slate-950/80 overflow-hidden bg-white flex flex-col lg:flex-row border border-slate-800/30 relative">
        {/* ─── LEFT SOLID ORANGE SIDEBAR ─── */}
        <DashboardSidebar
          view={view}
          setView={setView}
          navItems={navItems}
          totalCount={stats.total}
          portalTitle="Sales Desk"
          onSharePortfolio={handleSharePortfolio}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        {/* ─── RIGHT CANVAS: FULL WIDTH WORKSPACE ─── */}
        <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden bg-white">
          {/* Header */}
          <DashboardTopNav
            userName={salesmanName}
            roleBadge="Verified Sales Partner"
            roleBadgeColor="text-orange-600"
            roleSubText="Field Associate • Sales Desk"
            searchVal={searchVal}
            setSearchVal={setSearchVal}
            dutyStatus={dutyStatus}
            onToggleDuty={() => setDutyStatus((d) => (d === 'online' ? 'offline' : 'online'))}
            onLogout={handleLogout}
            onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          />

          {/* Main Content Workspace (Full Width Container) */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/60 space-y-3">
            {/* ─── TAB 0: EXECUTIVE OVERVIEW PAGE ─── */}
            {view === 'overview' && (
              <div className="space-y-3 w-full">
                {/* 1. Personalized Welcome Banner */}
                <div className="rounded-3xl bg-white text-slate-800 p-4 sm:p-5 shadow-2xs border border-slate-200/90 relative overflow-hidden w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-wider border border-orange-200 flex items-center gap-1">
                          <i className="ri-shield-star-line text-xs" /> Field Sales Desk Active
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          · {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                        Welcome back, <span className="text-orange-600">{salesmanName}</span> 👋
                      </h1>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Manage your property inventory, client WhatsApp pitches, and investor deal conversions.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setForm(emptyFlatListing());
                          setEditingId(null);
                          setView('add');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <i className="ri-add-line text-sm" /> Add Property
                      </button>
                      <button
                        type="button"
                        onClick={() => setView('leads')}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="ri-user-star-line text-sm text-amber-600" /> Client Leads
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Key Metrics Grid */}
                <DashboardMetricsGrid stats={stats} />

                {/* 3. Recent Property Inventory Table */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3 w-full">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                        <i className="ri-time-line" />
                      </div>
                      <div>
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Recent Property Inventory ({listings.length})
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Latest active properties ready for client pitching
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All</span>
                      <i className="ri-arrow-right-line text-xs" />
                    </button>
                  </div>

                  <PropertyTable
                    properties={listings.slice(0, 8)}
                    listings={listings.slice(0, 8)}
                    currentPage={1}
                    pageSize={8}
                    onView={(item) => setViewingProperty(item)}
                    onViewDetails={(item) => setViewingProperty(item)}
                    onPitch={(item) => setPitchingProperty(item)}
                    onEdit={(item) => startEdit(item)}
                    onDelete={(id) => deleteListing(id)}
                    onToggleDealStatus={(itemOrId, currentStatus) => toggleDealStatus(itemOrId, currentStatus)}
                  />
                </div>
              </div>
            )}

            {/* ─── TAB 1: FULL PROPERTY INVENTORY ─── */}
            {view === 'list' && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5 w-full">
                {/* Header & Controls Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Property Inventory Catalog ({filteredListings.length})
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Filter by deal type, category, or budget to find matching properties
                    </p>
                  </div>

                  {/* Filter Pills & View Mode */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Filter */}
                    <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
                      {['all', 'Flat', 'Commercial', 'Plot'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setFilterCategory(cat);
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg transition capitalize cursor-pointer text-xs ${
                            filterCategory === cat
                              ? 'bg-white text-orange-600 shadow-2xs font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Listing Type Filter */}
                    <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'buy', label: 'Buy/Sale' },
                        { id: 'rent', label: 'Rent' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setFilterType(t.id);
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                            filterType === t.id
                              ? 'bg-white text-orange-600 shadow-2xs font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Price Range */}
                    <select
                      value={filterPrice}
                      onChange={(e) => {
                        setFilterPrice(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="all">Any Price</option>
                      <option value="under20">Under ₹ 20 Lakh</option>
                      <option value="20to40">₹ 20L - ₹ 40 Lakh</option>
                      <option value="40to75">₹ 40L - ₹ 75 Lakh</option>
                      <option value="above75">Above ₹ 75 Lakh</option>
                    </select>

                    {/* Layout Switcher */}
                    <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setInventoryViewMode('table')}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          inventoryViewMode === 'table' ? 'bg-white text-orange-600 shadow-2xs font-black' : 'text-slate-400'
                        }`}
                        title="Table View"
                      >
                        <i className="ri-table-line text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInventoryViewMode('grid')}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          inventoryViewMode === 'grid' ? 'bg-white text-orange-600 shadow-2xs font-black' : 'text-slate-400'
                        }`}
                        title="Grid Cards View"
                      >
                        <i className="ri-grid-fill text-sm" />
                      </button>
                    </div>

                    {/* Add New Quick Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setForm(emptyFlatListing());
                        setEditingId(null);
                        setView('add');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer"
                    >
                      <i className="ri-add-line text-sm" /> Add New
                    </button>
                  </div>
                </div>

                {/* Properties Render */}
                {inventoryViewMode === 'table' ? (
                  <PropertyTable
                    properties={paginatedListings}
                    listings={paginatedListings}
                    currentPage={currentPage}
                    pageSize={PAGE_SIZE}
                    onView={(item) => setViewingProperty(item)}
                    onViewDetails={(item) => setViewingProperty(item)}
                    onPitch={(item) => setPitchingProperty(item)}
                    onEdit={(item) => startEdit(item)}
                    onDelete={(id) => deleteListing(id)}
                    onToggleDealStatus={(itemOrId, currentStatus) => toggleDealStatus(itemOrId, currentStatus)}
                  />
                ) : (
                  <PropertyGrid
                    properties={paginatedListings}
                    listings={paginatedListings}
                    onView={(item) => setViewingProperty(item)}
                    onViewDetails={(item) => setViewingProperty(item)}
                    onPitch={(item) => setPitchingProperty(item)}
                    onEdit={(item) => startEdit(item)}
                    onDelete={(id) => deleteListing(id)}
                    onToggleDealStatus={(itemOrId, currentStatus) => toggleDealStatus(itemOrId, currentStatus)}
                  />
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-400">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                      {Math.min(currentPage * PAGE_SIZE, filteredListings.length)} of {filteredListings.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCurrentPage(num)}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentPage === num
                              ? 'bg-orange-600 text-white font-black'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 2: PROPERTY ONBOARDING / EDIT STUDIO ─── */}
            {view === 'add' && (
              <PropertyFormStudio
                form={form}
                setForm={setForm}
                editingId={editingId}
                saving={saving}
                onSubmit={handleSaveListing}
                onCancel={() => {
                  setForm(emptyFlatListing());
                  setEditingId(null);
                  setView('list');
                }}
              />
            )}

            {/* ─── TAB 3: CLIENT INQUIRIES & LEADS ─── */}
            {view === 'leads' && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3 w-full">
                <AssignedLeadsPanel />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Slide-out Property Inspector Drawer */}
      {viewingProperty && (
        <PropertyDetailsDrawer
          property={viewingProperty}
          salesmanName={salesmanName}
          onClose={() => setViewingProperty(null)}
          onPitch={(prop) => {
            setViewingProperty(null);
            setPitchingProperty(prop);
          }}
          onEdit={(prop) => {
            setViewingProperty(null);
            startEdit(prop);
          }}
        />
      )}

      {/* WhatsApp Pitch Studio Modal */}
      {pitchingProperty && (
        <WhatsAppPitchModal
          property={pitchingProperty}
          salesmanName={salesmanName}
          onClose={() => setPitchingProperty(null)}
        />
      )}
    </div>
  );
}
