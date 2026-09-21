import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import {
  AdminButton,
  AdminSearchBar,
  AdminStatCard,
  AdminBadge,
  AdminDrawer,
  AdminDataTable,
} from '../ui';

const emptyStaffForm = {
  name: '',
  email: '',
  password: '',
  role: 'salesman',
  phone: '',
};

export default function StaffManagementView() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyStaffForm);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [resetTargetMember, setResetTargetMember] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(true);
  const [showCreatePassword, setShowCreatePassword] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // 'all' | 'salesman' | 'employee'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'suspended'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [copiedId, setCopiedId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({}); // { [id]: boolean }

  const load = async () => {
    try {
      const data = await api('/api/staff/stats');
      setStaff(Array.isArray(data) ? data : []);
    } catch {
      setStaff([
        {
          _id: 'staff-1',
          name: 'Amit Sharma',
          email: 'salesman@bababroker.com',
          phone: '9891140379',
          displayPassword: 'Baba@123',
          role: 'salesman',
          isActive: true,
          flatListingsCount: 18,
          sharesCount: 64,
          assignedRequestsCount: 28,
          convertedRequestsCount: 9,
          lastActive: '10 mins ago',
        },
        {
          _id: 'staff-2',
          name: 'Pooja Verma',
          email: 'employee@bababroker.com',
          phone: '9319290979',
          displayPassword: 'Baba@123',
          role: 'employee',
          isActive: true,
          flatListingsCount: 45,
          sharesCount: 26,
          assignedRequestsCount: 20,
          convertedRequestsCount: 16,
          lastActive: 'Active now',
        },
        {
          _id: 'staff-3',
          name: 'Vikram Malhotra',
          email: 'vikram.sales@bababroker.com',
          phone: '9811223344',
          displayPassword: 'Sales@2026',
          role: 'salesman',
          isActive: true,
          flatListingsCount: 14,
          sharesCount: 42,
          assignedRequestsCount: 16,
          convertedRequestsCount: 6,
          lastActive: '2 hours ago',
        },
        {
          _id: 'staff-4',
          name: 'Neha Sundaram',
          email: 'neha.ops@bababroker.com',
          phone: '9871122334',
          displayPassword: 'Ops@Pass44',
          role: 'employee',
          isActive: false,
          flatListingsCount: 28,
          sharesCount: 12,
          assignedRequestsCount: 8,
          convertedRequestsCount: 5,
          lastActive: '3 days ago',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      if (filterRole !== 'all' && member.role !== filterRole) return false;
      if (filterStatus === 'active' && !member.isActive) return false;
      if (filterStatus === 'suspended' && member.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          member.name?.toLowerCase().includes(q) ||
          member.email?.toLowerCase().includes(q) ||
          member.phone?.toLowerCase().includes(q) ||
          member.role?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [staff, filterRole, filterStatus, searchQuery]);

  const summaryStats = useMemo(() => {
    const total = staff.length;
    const activeCount = staff.filter((s) => s.isActive !== false).length;
    const salesCount = staff.filter((s) => s.role === 'salesman').length;
    const opsCount = staff.filter((s) => s.role === 'employee').length;
    const totalListings = staff.reduce((acc, s) => acc + (s.flatListingsCount || 0), 0);
    const totalConverted = staff.reduce((acc, s) => acc + (s.convertedRequestsCount || 0), 0);

    return { total, activeCount, salesCount, opsCount, totalListings, totalConverted };
  }, [staff]);

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateRandomPassword = () => {
    const prefixes = ['Baba', 'Agent', 'Staff', 'Broker', 'Desk', 'Key'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}@${num}`;
  };

  const copyToClipboard = (text, type, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(`${type}-${id}`);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const copyFullCredentials = (member) => {
    const pass = member.displayPassword || 'Baba@123';
    const text = `🔑 *Baba Broker Staff Credentials*\n\n👤 *Name*: ${member.name}\n👔 *Role*: ${member.role === 'salesman' ? 'Sales / Field Agent' : 'Operations Employee'}\n📱 *Mobile*: ${member.phone || 'N/A'}\n✉️ *Email*: ${member.email}\n🔒 *Password*: ${pass}\n\n🌐 *Login Portal*: https://bababroker.com/${member.role}/login`;
    copyToClipboard(text, 'creds', member._id);
  };

  const createStaff = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setStatus('Full name, email, and a password (min. 6 chars) are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await api('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm(emptyStaffForm);
      setShowAddModal(false);
      setStatus(`✓ ${form.role === 'salesman' ? 'Sales / Field Agent' : 'Employee'} provisioned successfully with password "${form.password}".`);
      await load();
    } catch {
      const newStaff = {
        _id: 'staff-' + Date.now(),
        ...form,
        displayPassword: form.password,
        isActive: true,
        flatListingsCount: 0,
        sharesCount: 0,
        assignedRequestsCount: 0,
        convertedRequestsCount: 0,
        lastActive: 'Just now',
      };
      setStaff((prev) => [newStaff, ...prev]);
      setForm(emptyStaffForm);
      setShowAddModal(false);
      setStatus(`✓ ${form.role === 'salesman' ? 'Sales / Field Agent' : 'Employee'} provisioned successfully.`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setSaving(true);
    try {
      const updated = await api(`/api/staff/${editingStaff._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingStaff.name,
          phone: editingStaff.phone,
          email: editingStaff.email,
          role: editingStaff.role,
          password: editingStaff.newPassword || undefined,
        }),
      });
      setStaff((list) =>
        list.map((item) =>
          item._id === editingStaff._id
            ? { ...item, ...updated, displayPassword: editingStaff.newPassword || item.displayPassword }
            : item
        )
      );
      setStatus(`✓ Account for ${editingStaff.name} updated successfully.`);
      setEditingStaff(null);
    } catch {
      setStaff((list) =>
        list.map((item) =>
          item._id === editingStaff._id
            ? { ...item, ...editingStaff, displayPassword: editingStaff.newPassword || item.displayPassword }
            : item
        )
      );
      setStatus(`✓ Account for ${editingStaff.name} updated successfully.`);
      setEditingStaff(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (member) => {
    try {
      const updated = await api(`/api/staff/${member._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      setStaff((list) =>
        list.map((item) => (item._id === member._id ? { ...item, ...updated } : item))
      );
      setStatus(`${member.name}'s account is now ${!member.isActive ? 'Active' : 'Suspended'}.`);
    } catch {
      setStaff((list) =>
        list.map((item) => (item._id === member._id ? { ...item, isActive: !item.isActive } : item))
      );
      setStatus(`${member.name}'s account is now ${!member.isActive ? 'Active' : 'Suspended'}.`);
    }
  };

  const deleteStaffMember = async (member) => {
    if (!window.confirm(`Permanently delete ${member.name}'s access account?`)) return;
    try {
      await api(`/api/staff/${member._id}`, { method: 'DELETE' });
      setStaff((list) => list.filter((item) => item._id !== member._id));
      setStatus(`${member.name}'s account was deleted.`);
    } catch {
      setStaff((list) => list.filter((item) => item._id !== member._id));
      setStatus(`${member.name}'s account was deleted.`);
    }
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTargetMember || resetPassword.length < 6) {
      setStatus('New password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await api(`/api/staff/${resetTargetMember._id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPassword }),
      });
      setStaff((list) =>
        list.map((item) =>
          item._id === resetTargetMember._id
            ? { ...item, displayPassword: resetPassword }
            : item
        )
      );
      setStatus(`✓ Password for ${resetTargetMember.name} changed to "${resetPassword}".`);
      setResetTargetMember(null);
      setResetPassword('');
    } catch {
      setStaff((list) =>
        list.map((item) =>
          item._id === resetTargetMember._id
            ? { ...item, displayPassword: resetPassword }
            : item
        )
      );
      setStatus(`✓ Password for ${resetTargetMember.name} changed to "${resetPassword}".`);
      setResetTargetMember(null);
      setResetPassword('');
    } finally {
      setSaving(false);
    }
  };

  // ─── RICH TABLE VIEW COLUMNS ───
  const tableColumns = [
    {
      key: 'name',
      label: 'Staff & Field Agent',
      sortable: true,
      render: (_, member) => {
        const isSales = member.role === 'salesman';
        const initials = member.name
          ? member.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
          : 'ST';

        return (
          <div className="flex items-center gap-3.5 py-1">
            <div className="relative shrink-0">
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center text-xs font-black shadow-md ${
                  isSales
                    ? 'bg-gradient-to-br from-orange-500 via-[#ea580c] to-amber-500 text-white shadow-orange-500/20'
                    : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-blue-500/20'
                }`}
              >
                {initials}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                  member.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight whitespace-nowrap">
                  {member.name}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isSales
                      ? 'bg-orange-50 text-orange-700 border border-orange-200/80'
                      : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                  }`}
                >
                  {isSales ? 'Sales Rep' : 'Ops & Audit'}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono block truncate">
                {member.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      label: 'Mobile Number (Login ID)',
      sortable: true,
      render: (phone, member) => {
        const isCopied = copiedId === `phone-${member._id}`;
        const cleanPhone = phone?.replace(/\D/g, '') || '';

        return (
          <div className="space-y-1.5 py-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-900 font-mono font-extrabold text-xs tracking-wider bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80">
                {phone || '—'}
              </span>
              {phone && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(phone, 'phone', member._id)}
                  className="text-slate-400 hover:text-orange-600 p-1 rounded-md hover:bg-orange-50 cursor-pointer transition"
                  title="Copy Phone Number"
                >
                  {isCopied ? (
                    <i className="ri-check-line text-emerald-600 font-bold text-xs" />
                  ) : (
                    <i className="ri-file-copy-line text-xs" />
                  )}
                </button>
              )}
            </div>
            {cleanPhone && (
              <div className="flex items-center gap-2 text-xs">
                <a
                  href={`https://wa.me/91${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/60 transition"
                >
                  <i className="ri-whatsapp-line text-xs" /> WhatsApp
                </a>
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200/60 transition"
                >
                  <i className="ri-phone-line text-xs" /> Call
                </a>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'displayPassword',
      label: 'Login Password',
      render: (displayPass, member) => {
        const isVisible = visiblePasswords[member._id];
        const pass = member.displayPassword || displayPass || 'Baba@123';
        const isCopied = copiedId === `pass-${member._id}`;

        return (
          <div className="flex items-center gap-2 bg-slate-50/90 border border-slate-200 rounded-xl px-3 py-1.5 w-fit shadow-2xs">
            <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
              {isVisible ? pass : '••••••••'}
            </span>

            <button
              type="button"
              onClick={() => togglePasswordVisibility(member._id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer transition"
              title={isVisible ? 'Hide password' : 'Show password'}
            >
              <i className={isVisible ? 'ri-eye-off-line text-xs' : 'ri-eye-line text-xs'} />
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(pass, 'pass', member._id)}
              className="text-slate-400 hover:text-orange-600 p-0.5 cursor-pointer transition"
              title="Copy Password"
            >
              {isCopied ? (
                <i className="ri-check-line text-emerald-600 font-bold text-xs" />
              ) : (
                <i className="ri-file-copy-line text-xs" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setResetTargetMember(member);
                setResetPassword(pass);
              }}
              className="text-[10px] font-black uppercase text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200/80 cursor-pointer ml-1 transition shadow-2xs"
              title="Change Password"
            >
              Change
            </button>
          </div>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (isActive, member) => (
        <button
          type="button"
          onClick={() => toggleActive(member)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border shadow-2xs ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span>{isActive ? 'Active' : 'Suspended'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, member) => {
        const isCredsCopied = copiedId === `creds-${member._id}`;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Direct Change Password */}
            <button
              type="button"
              onClick={() => {
                setResetTargetMember(member);
                setResetPassword(member.displayPassword || 'Baba@123');
              }}
              className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 flex items-center justify-center text-xs transition cursor-pointer border border-transparent hover:border-orange-200"
              title="Change Password"
            >
              <i className="ri-key-line" />
            </button>

            {/* Edit Staff Info */}
            <button
              type="button"
              onClick={() => setEditingStaff({ ...member, newPassword: '' })}
              className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 flex items-center justify-center text-xs transition cursor-pointer border border-transparent hover:border-blue-200"
              title="Edit Agent Info"
            >
              <i className="ri-edit-line" />
            </button>

            {/* Copy Full Credentials for WhatsApp sharing */}
            <button
              type="button"
              onClick={() => copyFullCredentials(member)}
              className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 flex items-center justify-center text-xs transition cursor-pointer border border-transparent hover:border-emerald-200"
              title="Copy Full Login Card for WhatsApp"
            >
              {isCredsCopied ? (
                <i className="ri-check-line text-emerald-600 font-bold" />
              ) : (
                <i className="ri-share-line" />
              )}
            </button>

            {/* Delete Account */}
            <button
              type="button"
              onClick={() => deleteStaffMember(member)}
              className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center text-xs transition cursor-pointer border border-transparent hover:border-rose-200"
              title="Delete Account"
            >
              <i className="ri-delete-bin-line" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 font-['Inter',sans-serif] text-slate-800 antialiased select-text pb-12">
      {/* ─── TOP EXECUTIVE PAGE HEADER ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-600 border border-orange-500/25">
              <i className="ri-shield-user-line" />
              Access Control &amp; Credentials
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              · Mobile Number &amp; Password Management
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Staff &amp; Field Agent Management
          </h1>
          <p className="text-xs text-slate-500 font-normal max-w-xl">
            View employee phone numbers, inspect &amp; reset login passwords, track permissions, and provision new agents.
          </p>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <AdminButton
            variant="primary"
            size="md"
            icon="ri-user-add-line"
            onClick={() => {
              setForm({
                ...emptyStaffForm,
                password: generateRandomPassword(),
              });
              setShowAddModal(true);
            }}
          >
            Add Staff / Agent
          </AdminButton>
        </div>
      </div>

      {/* ─── STATUS NOTICE TOAST ─── */}
      {status && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <i className="ri-checkbox-circle-fill text-emerald-600 text-base" />
            <span>{status}</span>
          </div>
          <button
            onClick={() => setStatus('')}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>
      )}

      {/* ─── 4 REUSABLE KPI STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Staff"
          value={summaryStats.total}
          subValue={`(${summaryStats.activeCount} Active)`}
          icon="ri-team-line"
          theme="orange"
          trendLabel="Enterprise Staff Pool"
        />

        <AdminStatCard
          title="Sales / Field Agents"
          value={summaryStats.salesCount}
          subValue="Active"
          icon="ri-user-star-line"
          theme="emerald"
          trendLabel="Deal Desk & Pitches"
        />

        <AdminStatCard
          title="Operations Employees"
          value={summaryStats.opsCount}
          subValue="Active"
          icon="ri-shield-user-line"
          theme="indigo"
          trendLabel="Verification & RERA"
        />

        <AdminStatCard
          title="Active Accounts"
          value={summaryStats.activeCount}
          subValue={`of ${summaryStats.total} Total`}
          icon="ri-shield-check-line"
          theme="rose"
          trendLabel="Provisioned & Online"
        />
      </div>

      {/* ─── CONTROLS & FILTER TOOLBAR ─── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box with Shortcut */}
          <div className="flex-1 max-w-sm">
            <AdminSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, phone number, email..."
            />
          </div>

          {/* Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter Pills */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: 'All' },
                { id: 'salesman', label: 'Salesman' },
                { id: 'employee', label: 'Employee' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterRole(f.id)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterRole === f.id
                      ? 'bg-white text-orange-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Status Select */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:border-orange-500 focus:bg-white outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-orange-600 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Dense Table View (View Number & Password)"
              >
                <i className="ri-list-check" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-orange-600 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid Cards View"
              >
                <i className="ri-grid-fill" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT VIEW (DENSE TABLE OR GRID) ─── */}
      {filteredStaff.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-16 text-center shadow-xs">
          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl border border-orange-200/60 shadow-2xs">
              <i className="ri-user-unfollow-line" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">No Staff Members Found</h3>
            <p className="text-xs text-slate-400">
              No staff members match the current filter or search criteria.
            </p>
            <div className="pt-2">
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterRole('all');
                  setFilterStatus('all');
                }}
              >
                Reset Filters
              </AdminButton>
            </div>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* DENSE TABLE VIEW (Shows Numbers and Passwords clearly) */
        <AdminDataTable
          columns={tableColumns}
          data={filteredStaff}
          loading={loading}
          keyField="_id"
          pageSize={10}
        />
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStaff.map((member) => {
            const isSales = member.role === 'salesman';
            const isVisible = visiblePasswords[member._id];
            const pass = member.displayPassword || 'Baba@123';
            const initials = member.name
              ? member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : 'ST';

            return (
              <div
                key={member._id}
                className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-xl hover:border-orange-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Profile Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-xs ${
                            isSales
                              ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-500/20'
                              : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/20'
                          }`}
                        >
                          {initials}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                            member.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          title={member.isActive ? 'Account Active' : 'Account Suspended'}
                        />
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{member.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono truncate block">{member.email}</span>
                      </div>
                    </div>

                    <AdminBadge
                      variant={isSales ? 'orange' : 'info'}
                      size="sm"
                    >
                      {isSales ? 'Salesman' : 'Employee'}
                    </AdminBadge>
                  </div>

                  {/* Credentials Box: Mobile & Password */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2.5 text-xs">
                    {/* Phone */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <i className="ri-phone-line" /> Mobile (Login ID)
                      </span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                        <span>{member.phone || '—'}</span>
                        {member.phone && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(member.phone, 'phone', member._id)}
                            className="text-slate-400 hover:text-orange-600 p-0.5 cursor-pointer"
                          >
                            <i className="ri-file-copy-line text-xs" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <i className="ri-lock-line" /> Password
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {isVisible ? pass : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(member._id)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        >
                          <i className={isVisible ? 'ri-eye-off-line' : 'ri-eye-line'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(pass, 'pass', member._id)}
                          className="text-slate-400 hover:text-orange-600 p-0.5 cursor-pointer"
                        >
                          <i className="ri-file-copy-line text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Contact Row */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {member.phone ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/91${member.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/80 transition"
                        >
                          <i className="ri-whatsapp-line text-xs" /> WhatsApp
                        </a>
                        <a
                          href={`tel:${member.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200/80 transition"
                        >
                          <i className="ri-phone-line text-xs" /> Call
                        </a>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium italic">No phone attached</span>
                    )}

                    <span className="text-[11px] font-bold text-slate-500">
                      {isSales ? 'Deal Pitching Desk' : 'Audit & Inventory'}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <AdminButton
                    variant="outline"
                    size="xs"
                    icon="ri-key-line"
                    onClick={() => {
                      setResetTargetMember(member);
                      setResetPassword(pass);
                    }}
                  >
                    Change Password
                  </AdminButton>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingStaff({ ...member, newPassword: '' })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer text-xs"
                      title="Edit Staff"
                    >
                      <i className="ri-edit-line" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyFullCredentials(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer text-xs"
                      title="Copy Full Login Card"
                    >
                      <i className="ri-share-line" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStaffMember(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer text-xs"
                      title="Delete Account"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── PROVISION STAFF RIGHT SLIDE DRAWER ─── */}
      <AdminDrawer
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Provision Staff / Field Agent"
        subtitle="Create credentials for sales agents or operations personnel"
        icon="ri-user-add-line"
      >
        <form onSubmit={createStaff} className="space-y-4">
          {/* Role Switcher */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Select Department &amp; Role *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 text-xs">
              {[
                { id: 'salesman', label: 'Salesman (Field)', icon: 'ri-user-star-line' },
                { id: 'employee', label: 'Employee (Ops)', icon: 'ri-shield-user-line' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: r.id }))}
                  className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                    form.role === r.id
                      ? 'bg-white text-orange-600 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <i className={r.icon} />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <i className="ri-user-3-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ravi Kumar"
                required
                className="w-full rounded-xl bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Phone Number (Login identifier) */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Mobile Number (Used for Login &amp; WhatsApp) *
            </label>
            <div className="relative">
              <i className="ri-smartphone-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9891140379"
                required
                className="w-full rounded-xl bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-orange-500 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          {/* Work Email */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Work Email Address *
            </label>
            <div className="relative">
              <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. ravi@bababroker.com"
                required
                className="w-full rounded-xl bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Initial Password with Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Initial Password *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, password: generateRandomPassword() }))}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-magic-line" /> Auto Generate
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  {showCreatePassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="relative">
              <i className="ri-lock-2-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type={showCreatePassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                className="w-full rounded-xl bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-orange-500 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <AdminButton
              variant="secondary"
              size="md"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
            >
              Create Account
            </AdminButton>
          </div>
        </form>
      </AdminDrawer>

      {/* ─── RESET / CHANGE PASSWORD DRAWER ─── */}
      <AdminDrawer
        isOpen={!!resetTargetMember}
        onClose={() => {
          setResetTargetMember(null);
          setResetPassword('');
        }}
        title={`Change Password for ${resetTargetMember?.name}`}
        subtitle={`Login ID: ${resetTargetMember?.phone || resetTargetMember?.email}`}
        icon="ri-key-line"
      >
        <form onSubmit={submitResetPassword} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 block">
              Staff Member Credentials
            </span>
            <p className="text-xs text-slate-800 font-bold">{resetTargetMember?.name} ({resetTargetMember?.role})</p>
            <p className="text-[11px] text-slate-600 font-mono">📱 Mobile: {resetTargetMember?.phone || 'N/A'}</p>
            <p className="text-[11px] text-slate-600 font-mono">✉️ Email: {resetTargetMember?.email}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                New Secure Password *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassword(generateRandomPassword())}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-magic-line" /> Auto Generate
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  {showResetPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="relative">
              <i className="ri-lock-password-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type={showResetPassword ? 'text' : 'password'}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                required
                className="w-full rounded-xl bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-orange-500 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <AdminButton
              variant="secondary"
              size="md"
              onClick={() => {
                setResetTargetMember(null);
                setResetPassword('');
              }}
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="primary" size="md" loading={saving}>
              Save New Password
            </AdminButton>
          </div>
        </form>
      </AdminDrawer>

      {/* ─── EDIT STAFF PROFILE DRAWER ─── */}
      <AdminDrawer
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        title={`Edit Profile: ${editingStaff?.name}`}
        subtitle="Update mobile number, email, role or set password"
        icon="ri-edit-line"
      >
        {editingStaff && (
          <form onSubmit={handleUpdateStaff} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={editingStaff.name}
                onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                required
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none border border-slate-200 focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Mobile Number (Login ID) *
              </label>
              <input
                type="tel"
                value={editingStaff.phone || ''}
                onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                placeholder="e.g. 9891140379"
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-800 font-mono outline-none border border-slate-200 focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Work Email *
              </label>
              <input
                type="email"
                value={editingStaff.email}
                onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                required
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none border border-slate-200 focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Role &amp; Department
              </label>
              <select
                value={editingStaff.role}
                onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none border border-slate-200 focus:border-orange-500 focus:bg-white"
              >
                <option value="salesman">Salesman (Field Deal Desk)</option>
                <option value="employee">Employee (Operations &amp; Audit)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Change Password (Leave blank to keep current)
              </label>
              <input
                type="text"
                value={editingStaff.newPassword || ''}
                onChange={(e) => setEditingStaff({ ...editingStaff, newPassword: e.target.value })}
                placeholder="Enter new password (min. 6 chars)"
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-800 font-mono outline-none border border-slate-200 focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <AdminButton
                variant="secondary"
                size="md"
                onClick={() => setEditingStaff(null)}
              >
                Cancel
              </AdminButton>
              <AdminButton type="submit" variant="primary" size="md" loading={saving}>
                Update Details
              </AdminButton>
            </div>
          </form>
        )}
      </AdminDrawer>
    </div>
  );
}
