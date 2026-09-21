import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

const FOLLOW_UP_OPTIONS = [
  { id: 'unassigned', label: 'New Lead', icon: 'ri-time-line', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'contacted', label: 'Contacted', icon: 'ri-chat-check-line', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'site_visit_scheduled', label: 'Site Visit', icon: 'ri-calendar-event-line', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'negotiating', label: 'Negotiating', icon: 'ri-hand-coin-line', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'converted', label: 'Converted', icon: 'ri-checkbox-circle-line', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'lost', label: 'Lost', icon: 'ri-close-circle-line', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const formatINR = (val) => {
  const num = Number(val);
  if (!num || isNaN(num)) return '—';
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  return `₹ ${num.toLocaleString('en-IN')}`;
};

function CompactLeadCard({ lead, onUpdate, updating }) {
  const [followUpStatus, setFollowUpStatus] = useState(
    lead.followUpStatus === 'unassigned' ? 'contacted' : lead.followUpStatus
  );
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const statusMeta = FOLLOW_UP_OPTIONS.find((opt) => opt.id === lead.followUpStatus) || FOLLOW_UP_OPTIONS[0];

  const submit = () => {
    onUpdate(lead._id, followUpStatus, note);
    setNote('');
    setShowNoteInput(false);
  };

  const cleanPhone = String(lead.investorPhone || '').replace(/\D/g, '');
  const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waMsg = encodeURIComponent(
    `Hello ${lead.investorName || 'Sir/Ma\'am'},\n\nI am contacting you from *Baba Broker* regarding *${lead.propertyTitle || 'Builder Floor'}* (${lead.propertyLocation || 'Delhi NCR'}).\n\nWhen would be a good time for a quick call or site visit today?\n- Baba Broker Desk`
  );

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-xs transition space-y-2.5 flex flex-col justify-between">
      
      {/* Header: Name, Budget & Status */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-black text-[11px] shrink-0">
              {(lead.investorName || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-900 truncate">
                {lead.investorName || 'Anonymous Buyer'}
              </h3>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase border shrink-0 ${statusMeta.color}`}>
            <i className={statusMeta.icon} />
            <span>{statusMeta.label}</span>
          </span>
        </div>

        {/* Property & Budget Pill */}
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <span className="font-bold text-slate-900 block truncate text-[11px]">
              {lead.propertyTitle || 'General Property Inquiry'}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
              <i className="ri-map-pin-2-fill text-orange-500 text-[10px]" />
              {lead.propertyLocation || 'Delhi NCR'}
            </span>
          </div>

          {lead.requestedAmount > 0 && (
            <div className="text-right shrink-0 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/70">
              <span className="text-[10px] font-black text-emerald-800">
                {formatINR(lead.requestedAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Message preview */}
        {lead.message && (
          <p className="text-[10px] text-slate-500 bg-amber-50/50 px-2 py-1 rounded-lg border border-amber-200/50 italic line-clamp-2">
            "{lead.message}"
          </p>
        )}
      </div>

      {/* Footer: Instant Contact & Status Update */}
      <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
        <div className="flex items-center justify-between gap-1.5">
          {/* Quick Dial & WhatsApp */}
          <div className="flex items-center gap-1">
            {lead.investorPhone ? (
              <>
                <a
                  href={`https://api.whatsapp.com/send?phone=${phoneParam}&text=${waMsg}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-7 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="WhatsApp Client"
                >
                  <i className="ri-whatsapp-fill" />
                  <span className="text-[10px]">Chat</span>
                </a>

                <a
                  href={`tel:${cleanPhone}`}
                  className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center border border-slate-200 cursor-pointer"
                  title={`Call ${lead.investorPhone}`}
                >
                  <i className="ri-phone-fill text-blue-600 text-xs" />
                </a>
              </>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">No Phone</span>
            )}
          </div>

          {/* Inline Status Dropdown */}
          <div className="flex items-center gap-1 flex-1 justify-end">
            <select
              value={followUpStatus}
              onChange={(e) => {
                const nextStatus = e.target.value;
                setFollowUpStatus(nextStatus);
                onUpdate(lead._id, nextStatus, '');
              }}
              className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-bold text-slate-700 outline-none focus:border-orange-500 cursor-pointer max-w-[130px]"
            >
              {FOLLOW_UP_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-700 transition flex items-center justify-center border border-slate-200 cursor-pointer shrink-0"
              title="Add follow-up note"
            >
              <i className="ri-edit-line text-xs" />
            </button>
          </div>
        </div>

        {/* Collapsible Note Input */}
        {showNoteInput && (
          <div className="flex items-center gap-1 pt-1 animate-in fade-in duration-100">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (e.g. Visit Saturday)..."
              className="flex-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-800 outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={submit}
              disabled={updating}
              className="px-2 py-1 rounded-lg bg-orange-600 text-white font-bold text-[10px] transition disabled:opacity-50 cursor-pointer"
            >
              Save
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

export default function AssignedLeadsPanel({
  title = 'Client & Buyer Inquiry Desk',
  subtitle = 'Assigned buyer leads and site visit scheduling',
}) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchLead, setSearchLead] = useState('');
  const [status, setStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadLeads = async () => {
    setLoading(true);
    try {
      let data;
      try {
        data = await api('/api/investment-requests/mine');
      } catch (e) {
        if (e?.status === 403 || e?.status === 404) {
          data = await api('/api/investment-requests');
        } else {
          throw e;
        }
      }
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const updateLead = async (id, followUpStatus, note) => {
    setUpdatingId(id);
    try {
      const updated = await api(`/api/investment-requests/${id}/follow-up`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpStatus, note }),
      });
      setLeads((list) => list.map((l) => (l._id === id ? updated : l)));
      setStatus('✓ Lead updated.');
    } catch (err) {
      setStatus(err.message || 'Failed to update lead.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics
  const leadStats = useMemo(() => {
    const total = leads.length;
    const siteVisits = leads.filter((l) => l.followUpStatus === 'site_visit_scheduled').length;
    const negotiating = leads.filter((l) => l.followUpStatus === 'negotiating').length;
    const converted = leads.filter((l) => l.followUpStatus === 'converted').length;
    const newLeads = leads.filter((l) => l.followUpStatus === 'unassigned' || !l.followUpStatus).length;
    return { total, siteVisits, negotiating, converted, newLeads };
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filterStatus !== 'all' && (l.followUpStatus || 'unassigned') !== filterStatus) return false;
      if (searchLead.trim()) {
        const q = searchLead.toLowerCase();
        const matches =
          String(l.investorName || '').toLowerCase().includes(q) ||
          String(l.investorPhone || '').includes(q) ||
          String(l.propertyTitle || '').toLowerCase().includes(q) ||
          String(l.propertyLocation || '').toLowerCase().includes(q) ||
          String(l.message || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [leads, filterStatus, searchLead]);

  return (
    <div className="space-y-3 w-full">
      {status && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-900 flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-1.5">
            <i className="ri-information-line text-orange-600" /> {status}
          </span>
          <button type="button" onClick={() => setStatus('')} className="text-orange-400 hover:text-orange-900 cursor-pointer">
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      {/* 1. Unified Header Bar: Title + Search + Filter Options Next To It */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        {/* Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs shrink-0">
            <i className="ri-user-star-fill" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              {title}
              <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-black bg-orange-50 text-orange-700 border border-orange-200">
                {filteredLeads.length}
              </span>
            </h2>
            <p className="text-[10.5px] text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Right Side: Search Bar + Filter Options Next To Each Other */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={searchLead}
              onChange={(e) => setSearchLead(e.target.value)}
              placeholder="Search lead name, phone, area..."
              className="w-full pl-7 pr-7 py-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none text-xs font-medium shadow-2xs"
            />
            {searchLead && (
              <button
                type="button"
                onClick={() => setSearchLead('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <i className="ri-close-line text-xs" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {[
              { id: 'all', label: `All (${leads.length})` },
              { id: 'unassigned', label: `New (${leadStats.newLeads})` },
              { id: 'site_visit_scheduled', label: `Visits (${leadStats.siteVisits})` },
              { id: 'negotiating', label: `Negotiating (${leadStats.negotiating})` },
              { id: 'converted', label: `Converted (${leadStats.converted})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition cursor-pointer select-none ${
                  filterStatus === tab.id
                    ? 'bg-[#ea580c] text-white shadow-2xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Compact KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 block leading-tight">Total Leads</span>
            <span className="text-sm font-black text-slate-900">{leadStats.total}</span>
          </div>
          <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200/70">
            {leadStats.newLeads} New
          </span>
        </div>

        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-purple-700 block leading-tight">Site Visits</span>
            <span className="text-sm font-black text-purple-700">{leadStats.siteVisits}</span>
          </div>
          <i className="ri-calendar-check-line text-purple-500 text-base" />
        </div>

        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-amber-700 block leading-tight">In Talks</span>
            <span className="text-sm font-black text-amber-700">{leadStats.negotiating}</span>
          </div>
          <i className="ri-hand-coin-line text-amber-500 text-base" />
        </div>

        <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-emerald-700 block leading-tight">Converted</span>
            <span className="text-sm font-black text-emerald-700">{leadStats.converted}</span>
          </div>
          <i className="ri-checkbox-circle-fill text-emerald-500 text-base" />
        </div>
      </div>

      {/* 3. Compact Leads Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-1.5">
          <i className="ri-loader-4-line text-xl text-orange-600 animate-spin block mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading inquiry desk...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-1.5 rounded-2xl border border-dashed border-slate-200 bg-white p-6 max-w-md mx-auto">
          <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg mx-auto">
            <i className="ri-user-search-line" />
          </div>
          <h3 className="text-xs font-black text-slate-900">No Inquiries Found</h3>
          <p className="text-[11px] text-slate-500">
            {searchLead || filterStatus !== 'all'
              ? 'Try adjusting your search query or filter.'
              : 'Assigned customer inquiries will appear here for fast WhatsApp follow-up.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
          {filteredLeads.map((lead) => (
            <CompactLeadCard
              key={lead._id}
              lead={lead}
              onUpdate={updateLead}
              updating={updatingId === lead._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
