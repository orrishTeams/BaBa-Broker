import React from 'react';
import { useEmployeeDashboard } from '../hooks/useEmployeeDashboard';

// Reusable Presentation Components
import PageHeader from '../components/common/PageHeader';
import DashboardTopNav from '../components/dashboard/DashboardTopNav';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardMetricsGrid from '../components/dashboard/DashboardMetricsGrid';
import CalculatorsPanel from '../components/dashboard/CalculatorsPanel';
import ComplianceChecklist from '../components/dashboard/ComplianceChecklist';
import AssignedLeadsPanel from '../components/AssignedLeadsPanel';
import AdminExcelView from '../components/admin/AdminExcelView';
import PropertyTable from '../components/properties/PropertyTable';
import PropertyGrid from '../components/properties/PropertyGrid';
import PropertyFormStudio from '../components/properties/PropertyFormStudio';
import PropertyDetailsDrawer from '../components/properties/PropertyDetailsDrawer';
import WhatsAppPitchModal from '../components/properties/WhatsAppPitchModal';
import { emptyFlatListing } from '../utils/propertyConstants';

export default function EmployeeDashboard() {
  const {
    employeeName,
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
    toggleVerification,
    cleanAllInventory,
    handleSharePortfolio,
  } = useEmployeeDashboard();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'ri-dashboard-3-line' },
    { id: 'list', label: 'Audited Catalog', icon: 'ri-building-line', badge: stats.total },
    { id: 'add', label: editingId ? 'Edit Property' : 'Audit & Onboard', icon: 'ri-add-circle-line' },
    { id: 'excel', label: 'Excel Import', icon: 'ri-file-excel-2-line' },
    { id: 'leads', label: 'Client Inquiries', icon: 'ri-user-star-line' },
    { id: 'verification', label: 'Compliance Docs', icon: 'ri-file-shield-line' },
    { id: 'calculator', label: 'Deal Calculators', icon: 'ri-calculator-line' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 font-['Inter',sans-serif] text-slate-800 antialiased overflow-hidden select-none">
      {/* Top Header Navigation */}
      <DashboardTopNav
        roleTitle="Operations Desk • Onboarding"
        roleBadge="Operations Desk"
        roleBadgeColor="bg-amber-50 text-amber-800 border-amber-200"
        userName={employeeName}
        dutyStatus={dutyStatus}
        onToggleDuty={() => setDutyStatus((d) => (d === 'online' ? 'offline' : 'online'))}
        onLogout={handleLogout}
        onToggleMobileSidebar={() => setMobileSidebarOpen((o) => !o)}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
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
                        Welcome back, <span className="text-orange-600">{employeeName}</span> 👋
                      </h1>
                      <span className="px-2 py-0.2 rounded-full bg-orange-50 text-orange-700 text-[9.5px] font-black uppercase tracking-wider border border-orange-200 shrink-0">
                        Operations Command
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Audit verified inventory, inspect documents &amp; compliance, and monitor live inquiries.
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
                      onClick={() => setView('leads')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="ri-user-star-line text-sm text-amber-600" /> Inquiries
                    </button>
                  </div>
                </div>

                {/* 4-Card Metrics Grid */}
                <DashboardMetricsGrid stats={stats} />

                {/* Recent Inventory Table */}
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5 w-full">
                  <PageHeader
                    icon="ri-time-line"
                    title="Audited Property Inventory"
                    badge={`${listings.length} Units`}
                    subtitle="Your latest audited and verified properties ready for client pitching"
                    rightContent={
                      <button
                        type="button"
                        onClick={() => setView('list')}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Full Inventory ({listings.length})</span>
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
                    onToggleVerification={toggleVerification}
                    isEmployee={true}
                  />
                </div>
              </div>
            )}

            {/* ─── TAB 1: AUDITED PROPERTY CATALOG ─── */}
            {view === 'list' && (
              <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 w-full">
                <PageHeader
                  icon="ri-building-line"
                  title="Property Inventory & Audit Catalog"
                  badge={`${filteredListings.length} Units`}
                  subtitle="Manage audited properties • Excel Import & Live Management"
                  rightContent={
                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => setView('excel')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                        title="Upload fresh Excel sheet to populate inventory"
                      >
                        <i className="ri-file-excel-2-fill text-sm" />
                        <span>Upload Fresh Excel</span>
                      </button>

                      <button
                        type="button"
                        onClick={cleanAllInventory}
                        className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                        title="Delete all listings to start with fresh Excel upload"
                      >
                        <i className="ri-delete-bin-2-line text-sm" />
                        <span>Clean Catalog</span>
                      </button>

                      <div className="relative flex-1 min-w-[180px] sm:w-56 md:flex-initial">
                        <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                          type="text"
                          value={searchVal}
                          onChange={(e) => { setSearchVal(e.target.value); setCurrentPage(1); }}
                          placeholder="Search flat, location, owner..."
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
                    </div>
                  }
                />

                {/* Filter Ribbon */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                    <i className="ri-folder-open-line text-4xl mb-2 block text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No audited properties found matching filters.</p>
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
                    onToggleVerification={toggleVerification}
                    isEmployee={true}
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

            {/* ─── TAB 2: AUDIT & ONBOARD FORM STUDIO ─── */}
            {view === 'add' && (
              <PropertyFormStudio
                form={form}
                setForm={setForm}
                editingId={editingId}
                setEditingId={setEditingId}
                onSave={handleSaveListing}
                onCancel={() => { setForm(emptyFlatListing()); setEditingId(null); setView('list'); }}
                saving={saving}
                roleBadge="Operations Audit"
              />
            )}

            {/* ─── TAB 3: EXCEL IMPORT & CSV SYNC ─── */}
            {view === 'excel' && (
              <div className="w-full space-y-3">
                <AdminExcelView />
              </div>
            )}

            {/* ─── TAB 4: CLIENT INQUIRIES ─── */}
            {view === 'leads' && (
              <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 w-full">
                <PageHeader
                  icon="ri-user-star-line"
                  title="Client & Buyer Inquiry Desk"
                  badge="Live Inquiries"
                  subtitle="Manage buyer requirements, investor inquiries, site visits, and instant WhatsApp connect"
                />
                <AssignedLeadsPanel />
              </div>
            )}

            {/* ─── TAB 5: RERA & COMPLIANCE CHECKLIST ─── */}
            {view === 'verification' && <ComplianceChecklist />}

            {/* ─── TAB 6: CALCULATORS ─── */}
            {view === 'calculator' && <CalculatorsPanel badge="Operations Tools" />}
          </main>

          {/* Footer */}
          <footer className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium bg-white">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Baba Broker Operations Desk · v2.4
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
        senderName={employeeName}
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
