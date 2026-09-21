import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import AdminPageHeader from './AdminPageHeader';

const emptyInvestorForm = {
  name: '',
  phone: '',
  email: '',
  city: '',
  address: '',
  occupation: '',
  panNumber: '',
  budgetRange: '',
  notes: '',
};

function AddInvestorPanel() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyInvestorForm);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      const data = await api('/api/investors');
      setInvestors(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.phone.replace(/\D/g, '').length < 10) {
      setStatus('A name and valid 10-digit phone number are required.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm(emptyInvestorForm);
      setStatus('Investor added successfully.');
      await load();
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeInvestor = async (investor) => {
    if (!window.confirm(`Remove investor "${investor.name}" from the directory?`)) return;
    try {
      await api(`/api/investors/${investor._id}`, { method: 'DELETE' });
      setInvestors((list) => list.filter((item) => item._id !== investor._id));
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className="space-y-3.5 font-['Inter',sans-serif]">
      {status && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-2.5 text-[11px] font-normal text-orange-800 flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-1.5"><i className="ri-information-line text-[#ea580c] text-xs"></i> {status}</span>
          <button onClick={() => setStatus('')} className="text-slate-400 hover:text-slate-600 cursor-pointer"><i className="ri-close-line text-xs"></i></button>
        </div>
      )}

      <div className="grid gap-3.5 lg:grid-cols-[320px_1fr]">
        {/* Add Investor Form */}
        <form onSubmit={submit} className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2.5 shadow-xs h-fit">
          <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <i className="ri-user-add-line text-[#ea580c]"></i> Add New Investor
          </h3>

          <label className="block text-[11px] font-medium text-slate-700">
            Full Name *
            <input
              name="name"
              value={form.name}
              onChange={change}
              placeholder="e.g. Rahul Sharma"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[11px] text-slate-800 outline-none focus:border-[#ea580c] focus:bg-white"
            />
          </label>

          <label className="block text-[11px] font-medium text-slate-700">
            Phone Number *
            <input
              name="phone"
              value={form.phone}
              onChange={change}
              placeholder="e.g. 9876543210"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[11px] text-slate-800 outline-none focus:border-[#ea580c] focus:bg-white"
            />
          </label>

          <label className="block text-[11px] font-medium text-slate-700">
            Email Address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              placeholder="e.g. rahul@email.com"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[11px] text-slate-800 outline-none focus:border-[#ea580c] focus:bg-white"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[11px] font-medium text-slate-700">
              City
              <input
                name="city"
                value={form.city}
                onChange={change}
                placeholder="e.g. Noida"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[11px] text-slate-800 outline-none focus:border-[#ea580c] focus:bg-white"
              />
            </label>
            <label className="block text-[11px] font-medium text-slate-700">
              Occupation
              <input
                name="occupation"
                value={form.occupation}
                onChange={change}
                placeholder="e.g. Business"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[11px] text-slate-800 outline-none focus:border-[#ea580c] focus:bg-white"
              />
            </label>
          </div>

          <label className="block text-[11px] font-medium text-slate-700">
            Budget Range
            <input
              name="budgetRange"
              value={form.budgetRange}
              onChange={change}
              placeholder="e.g. ₹25L - ₹50L"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[11px] text-slate-800 outline-none focus:border-[#ea580c] focus:bg-white"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-50 py-2 text-[11px] font-semibold uppercase tracking-wider text-white shadow-xs cursor-pointer transition-all"
          >
            {saving ? 'Adding...' : 'Add Investor'}
          </button>
        </form>

        {/* Investor Directory List */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden h-fit">
          <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 p-3">
            <i className="ri-contacts-book-line text-[#ea580c]"></i> Investor Directory ({investors.length})
          </h3>
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-[11px] font-normal">Loading investors...</div>
          ) : investors.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-[11px] font-normal">No investors added yet. Add one on the left.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {investors.map((investor) => (
                <div key={investor._id} className="flex items-center justify-between gap-2.5 p-2.5 hover:bg-slate-50 transition">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 flex items-center gap-1.5 flex-wrap">
                      {investor.name}
                      {investor.budgetRange && (
                        <span className="rounded-full px-2 py-0.5 text-[8px] font-semibold bg-orange-50 text-[#ea580c]">
                          {investor.budgetRange}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                      {investor.phone}
                      {investor.email ? ` · ${investor.email}` : ''}
                      {investor.city ? ` · ${investor.city}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => removeInvestor(investor)}
                    className="shrink-0 rounded-md bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-1 transition-colors cursor-pointer"
                    title="Remove Investor"
                  >
                    <i className="ri-delete-bin-line text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const formatCompactINR = (val) => {
  const num = Number(val);
  if (isNaN(num) || num <= 0) return '₹ 0';
  if (num >= 10000000) {
    return `₹ ${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹ ${(num / 100000).toFixed(2)} Lakh`;
  }
  return `₹ ${num.toLocaleString('en-IN')}`;
};

const formatCompactINRParts = (val) => {
  const num = Number(val);
  if (isNaN(num) || num <= 0) return { amount: '₹ 0', unit: '' };
  if (num >= 10000000) {
    return { amount: `₹ ${(num / 10000000).toFixed(2)}`, unit: 'Cr' };
  }
  if (num >= 100000) {
    return { amount: `₹ ${(num / 100000).toFixed(2)}`, unit: 'Lakh' };
  }
  return { amount: `₹ ${num.toLocaleString('en-IN')}`, unit: '' };
};

// Helper: Generate Smooth Monotone Cubic Bezier SVG Path from Array of Points
function generateSplinePath(points, width, height, padding = 20) {
  if (!points || points.length === 0) return { linePath: '', fillPath: '', coords: [] };
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const n = points.length;
  const stepX = innerW / (n - 1);

  const coords = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (p.height / 100) * innerH;
    return { x, y };
  });

  if (n === 1) {
    return { linePath: `M ${coords[0].x} ${coords[0].y}`, fillPath: '', coords };
  }

  // Monotone Cubic Hermite interpolation to avoid artificial peak loops
  const deltas = [];
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    deltas.push((coords[i + 1].y - coords[i].y) / (coords[i + 1].x - coords[i].x));
  }

  m[0] = deltas[0];
  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (deltas[i - 1] + deltas[i]) / 2;
    }
  }
  m[n - 1] = deltas[n - 2];

  let d = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (coords[i + 1].x - coords[i].x) / 3;
    const cp1x = coords[i].x + dx;
    const cp1y = coords[i].y + m[i] * dx;
    const cp2x = coords[i + 1].x - dx;
    const cp2y = coords[i + 1].y - m[i + 1] * dx;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${coords[i + 1].x.toFixed(2)} ${coords[i + 1].y.toFixed(2)}`;
  }

  const fillPath = `${d} L ${coords[n - 1].x.toFixed(2)} ${height - padding} L ${coords[0].x.toFixed(2)} ${height - padding} Z`;
  return { linePath: d, fillPath, coords };
}

// Mini Sparkline SVG Component for KPI Cards with Glowing Ripple Dot
function MiniSparkline({ data, color = '#ea580c', isFilled = true }) {
  const width = 92;
  const height = 32;
  const points = data || [30, 45, 35, 60, 50, 75, 70, 95];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const coords = points.map((val, idx) => ({
    x: idx * step,
    y: height - ((val - min) / range) * (height - 8) - 4,
  }));

  let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const xc = (coords[i].x + coords[i + 1].x) / 2;
    const yc = (coords[i].y + coords[i + 1].y) / 2;
    path += ` Q ${coords[i].x.toFixed(1)} ${coords[i].y.toFixed(1)}, ${xc.toFixed(1)} ${yc.toFixed(1)}`;
  }
  path += ` L ${coords[coords.length - 1].x.toFixed(1)} ${coords[coords.length - 1].y.toFixed(1)}`;
  const fill = `${path} L ${width} ${height} L 0 ${height} Z`;

  const gradId = `spark-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {isFilled && <path d={fill} fill={`url(#${gradId})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3.2" fill={color} className="drop-shadow-sm" />
    </svg>
  );
}

export default function AdminOverview({
  isContacts,
  view,
  metrics,
  properties = [],
  contacts = [],
  shareCount = 0,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  loading,
  filteredProperties,
  startEdit,
  deleteProperty,
  toggleFeaturedStatus,
  togglePortfolioStatus,
  openWhatsAppShare,
  openCreateFeaturedModal,
  openCreateProjectModal,
  setShowProjectModal,
  setActiveFormTab,
  setEditingId,
  setPropertyForm,
  emptyProperty,
  formatINR,
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('1 March – 14 March');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [chartMetric, setChartMetric] = useState('valuation'); // 'valuation' | 'inflow' | 'leads'
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
  const [hoveredPointIndex, setHoveredPointIndex] = useState(8); // Default highlight index 8 (Today)
  const [dealsViewMode, setDealsViewMode] = useState('grid'); // 'grid' | 'table'
  const [dealFilterCategory, setDealFilterCategory] = useState('all'); // 'all' | 'co_investment' | 'renovate_flip' | 'featured'
  const [dealSearch, setDealSearch] = useState('');
  const [copiedDealId, setCopiedDealId] = useState(null);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null);

  // Fallback calculations in case props are undefined
  const displayValuation = metrics?.totalValuationSum || 45500000;
  const displayFundedCapital = metrics?.totalFundedCapital || 18450000;
  const displayInvestors = metrics?.totalInvestorsCount || 24;
  const displayAvgRoi = metrics?.avgRoi || '14.8';
  const displayActiveDeals = metrics?.runningCount || properties.filter((p) => p.status === 'running').length || 8;
  const displayTotalDeals = metrics?.totalCount || properties.length || 12;
  const displayLeads = metrics?.totalLeadsCount || contacts.length || 38;
  const displayShares = metrics?.totalSharesCount || shareCount || 92;

  // Chart datasets with realistic smooth market progression
  const chartDatasets = {
    valuation: [
      { day: 1, height: 38, value: '₹ 5.80 Cr', label: '1 Mar', growth: '+2.1%' },
      { day: 2, height: 42, value: '₹ 6.05 Cr', label: '2 Mar', growth: '+3.4%' },
      { day: 3, height: 48, value: '₹ 6.30 Cr', label: '3 Mar', growth: '+5.2%' },
      { day: 4, height: 46, value: '₹ 6.25 Cr', label: '4 Mar', growth: '+4.8%' },
      { day: 5, height: 54, value: '₹ 6.55 Cr', label: '5 Mar', growth: '+7.0%' },
      { day: 6, height: 60, value: '₹ 6.75 Cr', label: '6 Mar', growth: '+8.6%' },
      { day: 7, height: 58, value: '₹ 6.70 Cr', label: '7 Mar', growth: '+8.1%' },
      { day: 8, height: 68, value: '₹ 7.05 Cr', label: '8 Mar', growth: '+11.5%' },
      { day: 9, height: 85, value: formatCompactINR(displayValuation), label: 'Today (9 Mar)', isToday: true, growth: '+14.8%' },
      { day: 10, height: 82, value: '₹ 7.20 Cr', label: '10 Mar (Est)', growth: '+15.2%' },
      { day: 11, height: 86, value: '₹ 7.45 Cr', label: '11 Mar (Est)', growth: '+16.8%' },
      { day: 12, height: 90, value: '₹ 7.70 Cr', label: '12 Mar (Est)', growth: '+18.5%' },
      { day: 13, height: 92, value: '₹ 7.90 Cr', label: '13 Mar (Est)', growth: '+20.0%' },
      { day: 14, height: 96, value: '₹ 8.15 Cr', label: '14 Mar (Est)', growth: '+22.5%' },
    ],
    inflow: [
      { day: 1, height: 26, value: '₹ 8.5 L', label: '1 Mar', growth: '+4.0%' },
      { day: 2, height: 34, value: '₹ 12.0 L', label: '2 Mar', growth: '+7.5%' },
      { day: 3, height: 46, value: '₹ 16.5 L', label: '3 Mar', growth: '+12.0%' },
      { day: 4, height: 42, value: '₹ 14.8 L', label: '4 Mar', growth: '+10.2%' },
      { day: 5, height: 56, value: '₹ 20.0 L', label: '5 Mar', growth: '+15.4%' },
      { day: 6, height: 64, value: '₹ 23.5 L', label: '6 Mar', growth: '+18.5%' },
      { day: 7, height: 58, value: '₹ 21.0 L', label: '7 Mar', growth: '+16.0%' },
      { day: 8, height: 72, value: '₹ 27.5 L', label: '8 Mar', growth: '+22.5%' },
      { day: 9, height: 88, value: '₹ 34.0 L', label: 'Today (9 Mar)', isToday: true, growth: '+28.5%' },
      { day: 10, height: 78, value: '₹ 29.5 L', label: '10 Mar (Est)', growth: '+24.2%' },
      { day: 11, height: 82, value: '₹ 31.8 L', label: '11 Mar (Est)', growth: '+26.5%' },
      { day: 12, height: 88, value: '₹ 34.5 L', label: '12 Mar (Est)', growth: '+29.0%' },
      { day: 13, height: 92, value: '₹ 37.0 L', label: '13 Mar (Est)', growth: '+31.5%' },
      { day: 14, height: 96, value: '₹ 40.0 L', label: '14 Mar (Est)', growth: '+34.0%' },
    ],
    leads: [
      { day: 1, height: 22, value: '4 Leads', label: '1 Mar', growth: '+1' },
      { day: 2, height: 30, value: '6 Leads', label: '2 Mar', growth: '+2' },
      { day: 3, height: 44, value: '9 Leads', label: '3 Mar', growth: '+4' },
      { day: 4, height: 40, value: '8 Leads', label: '4 Mar', growth: '+3' },
      { day: 5, height: 56, value: '12 Leads', label: '5 Mar', growth: '+6' },
      { day: 6, height: 65, value: '14 Leads', label: '6 Mar', growth: '+7' },
      { day: 7, height: 55, value: '11 Leads', label: '7 Mar', growth: '+5' },
      { day: 8, height: 74, value: '15 Leads', label: '8 Mar', growth: '+8' },
      { day: 9, height: 90, value: '18 Leads', label: 'Today (9 Mar)', isToday: true, growth: '+12' },
      { day: 10, height: 75, value: '14 Leads', label: '10 Mar (Est)', growth: '+8' },
      { day: 11, height: 80, value: '16 Leads', label: '11 Mar (Est)', growth: '+10' },
      { day: 12, height: 85, value: '17 Leads', label: '12 Mar (Est)', growth: '+11' },
      { day: 13, height: 90, value: '19 Leads', label: '13 Mar (Est)', growth: '+13' },
      { day: 14, height: 95, value: '21 Leads', label: '14 Mar (Est)', growth: '+15' },
    ],
  };

  const activeBars = chartDatasets[chartMetric] || chartDatasets.valuation;
  const activePoint = activeBars[hoveredPointIndex] || activeBars[8];

  // SVG Area Spline Calculations
  const svgWidth = 680;
  const svgHeight = 190;
  const splineData = generateSplinePath(activeBars, svgWidth, svgHeight, 18);

  // Active Deals sample / real list for dashboard showcase
  const rawProjects = properties.length > 0 ? properties : [
    {
      _id: 'sample-1',
      title: 'Skyline Heights Co-Investment Pool',
      location: 'Sector 62, Noida',
      propertyType: 'residential',
      investmentModel: 'co_investment',
      status: 'running',
      totalValuation: 8500000,
      fundedPercentage: 65,
      expectedRoi: 14.5,
      image: '/assets/img/hero-bg.png',
      isFeatured: true,
      minInvestment: 500000,
    },
    {
      _id: 'sample-2',
      title: 'Cyber Towers Commercial Plaza',
      location: 'Golf Course Road, Gurgaon',
      propertyType: 'commercial',
      investmentModel: 'co_investment',
      status: 'running',
      totalValuation: 12000000,
      fundedPercentage: 45,
      expectedRoi: 16.2,
      image: '/assets/img/hero-bg.png',
      isFeatured: true,
      minInvestment: 1000000,
    },
    {
      _id: 'sample-3',
      title: 'Green Valley Villa Flip',
      location: 'Chhatarpur, New Delhi',
      propertyType: 'residential',
      investmentModel: 'renovate_flip',
      status: 'upcoming',
      totalValuation: 25000000,
      fundedPercentage: 20,
      expectedRoi: 18.0,
      image: '/assets/img/hero-bg.png',
      isFeatured: false,
      minInvestment: 1500000,
    },
    {
      _id: 'sample-4',
      title: 'Yamuna Expressway Industrial Plot Land',
      location: 'Greater Noida West',
      propertyType: 'plot',
      investmentModel: 'co_investment',
      status: 'running',
      totalValuation: 5000000,
      fundedPercentage: 80,
      expectedRoi: 15.0,
      image: '/assets/img/hero-bg.png',
      isFeatured: false,
      minInvestment: 250000,
    }
  ];

  // Filtered live projects for dashboard
  const displayProjects = rawProjects.filter((p) => {
    if (dealFilterCategory === 'co_investment' && p.investmentModel !== 'co_investment') return false;
    if (dealFilterCategory === 'renovate_flip' && p.investmentModel !== 'renovate_flip') return false;
    if (dealFilterCategory === 'featured' && !p.isFeatured) return false;
    if (dealSearch.trim()) {
      const q = dealSearch.toLowerCase();
      return (p.title || '').toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopyPitch = (p) => {
    const pitch = `🏠 *${p.title}* (${p.location})\n💰 Valuation: ${formatINR(p.totalValuation) || p.price}\n📈 Target ROI: ${p.expectedRoi ? p.expectedRoi + '%' : '15% p.a.'}\n🚀 Deal Status: ${p.fundedPercentage || 50}% Funded\nInquire on Baba Broker Executive Portal!`;
    navigator.clipboard?.writeText(pitch);
    setCopiedDealId(p._id);
    setTimeout(() => setCopiedDealId(null), 2500);
  };

  // Asset Allocation Stats
  const resVal = metrics?.residentialValuation || 28500000;
  const comVal = metrics?.commercialValuation || 12000000;
  const plotVal = metrics?.plotValuation || 5000000;
  const sumVal = resVal + comVal + plotVal || 1;
  const resPct = Math.round((resVal / sumVal) * 100);
  const comPct = Math.round((comVal / sumVal) * 100);
  const plotPct = 100 - resPct - comPct;

  // Donut circumference (radius = 38, C = 2 * PI * 38 = 238.76)
  const donutC = 238.76;
  const resOffset = 0;
  const comOffset = (resPct / 100) * donutC;
  const plotOffset = ((resPct + comPct) / 100) * donutC;

  return (
    <div className="space-y-5 font-['Inter',sans-serif]">
      {/* OVERVIEW DASHBOARD VIEW */}
      {view === 'overview' ? (
        <>
          {/* Top Executive Header Bar & Global Action Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl text-slate-900 shadow-xs border border-slate-200/90 relative overflow-hidden">
            <div className="space-y-1 relative z-10 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-10 w-10 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/80 flex items-center justify-center text-xl shadow-2xs shrink-0">
                  <i className="ri-dashboard-3-line" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      Executive Command Center
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Live Sync
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl">
                    Real-time tracking of capital deployment, project yields, investor pools, and CRM leads.
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Switchers */}
            <div className="flex items-center bg-slate-100/90 rounded-2xl p-1 border border-slate-200/80 shadow-inner shrink-0 self-start sm:self-auto">
              {['7D', '14D', '30D', 'All Time'].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === period || (selectedPeriod.includes('14') && period === '14D')
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE FOUR CORE STAT CARDS GRID WITH SPARKLINE CHARTS & INTERACTIVE FILTERS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* CARD 1: Total Portfolio Valuation (AUM) */}
            {(() => {
              const valParts = formatCompactINRParts(displayValuation);
              const isActive = chartMetric === 'valuation';

              return (
                <div
                  onClick={() => setChartMetric('valuation')}
                  className={`relative rounded-2xl bg-white p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isActive
                      ? 'border-orange-500 ring-2 ring-orange-500/15 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                        Portfolio Valuation
                      </span>
                      <div className="flex items-baseline gap-1.5 flex-nowrap">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                          {valParts.amount}
                        </span>
                        {valParts.unit && (
                          <span className="text-sm font-black text-orange-600 uppercase tracking-tight">
                            {valParts.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/80 flex items-center justify-center text-lg shrink-0">
                      <i className="ri-funds-box-line" />
                    </div>
                  </div>

                  {/* Sparkline & Sub-Metrics */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10.5px] border border-emerald-200/60">
                        <i className="ri-arrow-up-line text-xs font-black" /> +14.8% MoM
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block truncate pt-0.5">Active Asset AUM</span>
                    </div>
                    <div className="shrink-0">
                      <MiniSparkline data={[35, 42, 38, 55, 60, 52, 70, 85, 95]} color="#ea580c" />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CARD 2: Active Deals & Projects Pipeline */}
            {(() => {
              const isActive = dealFilterCategory === 'all' && chartMetric === 'valuation';

              return (
                <div
                  onClick={() => {
                    setChartMetric('valuation');
                    setDealFilterCategory('all');
                  }}
                  className={`relative rounded-2xl bg-white p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isActive
                      ? 'border-emerald-500 ring-2 ring-emerald-500/15 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                        Active Projects
                      </span>
                      <div className="flex items-baseline gap-1.5 flex-nowrap">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                          {displayActiveDeals}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-400 whitespace-nowrap">
                          / {displayTotalDeals} Deals
                        </span>
                      </div>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center text-lg shrink-0">
                      <i className="ri-building-2-line" />
                    </div>
                  </div>

                  {/* Sparkline & Sub-Metrics */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10.5px] border border-emerald-200/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live Pipeline
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block truncate pt-0.5">
                        {metrics?.coInvestmentCount || 1} Pools · {metrics?.renovateFlipCount || 1} Flips
                      </span>
                    </div>
                    <div className="shrink-0">
                      <MiniSparkline data={[20, 30, 45, 40, 60, 65, 75, 80, 90]} color="#10b981" />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CARD 3: Investor Capital Pool & Yield */}
            {(() => {
              const capParts = formatCompactINRParts(displayFundedCapital);
              const isActive = chartMetric === 'inflow';

              return (
                <div
                  onClick={() => setChartMetric('inflow')}
                  className={`relative rounded-2xl bg-white p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isActive
                      ? 'border-indigo-500 ring-2 ring-indigo-500/15 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                        Funded Capital
                      </span>
                      <div className="flex items-baseline gap-1.5 flex-nowrap">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                          {capParts.amount}
                        </span>
                        {capParts.unit && (
                          <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">
                            {capParts.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center text-lg shrink-0">
                      <i className="ri-hand-coin-line" />
                    </div>
                  </div>

                  {/* Sparkline & Sub-Metrics */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10.5px] border border-indigo-200/60">
                        ⭐ {displayAvgRoi}% Avg ROI
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block truncate pt-0.5">
                        {displayInvestors} Active Investors
                      </span>
                    </div>
                    <div className="shrink-0">
                      <MiniSparkline data={[15, 25, 30, 50, 45, 68, 70, 85, 92]} color="#6366f1" />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CARD 4: Client Leads & WhatsApp Reach */}
            {(() => {
              const isActive = chartMetric === 'leads';

              return (
                <div
                  onClick={() => setChartMetric('leads')}
                  className={`relative rounded-2xl bg-white p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isActive
                      ? 'border-rose-500 ring-2 ring-rose-500/15 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                        Inquiries & Leads
                      </span>
                      <div className="flex items-baseline gap-1.5 flex-nowrap">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                          {displayLeads}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-400 whitespace-nowrap">
                          Verified Leads
                        </span>
                      </div>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center text-lg shrink-0">
                      <i className="ri-user-star-line" />
                    </div>
                  </div>

                  {/* Sparkline & Sub-Metrics */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10.5px] border border-rose-200/60">
                        🔥 High Demand
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block truncate pt-0.5">
                        {displayShares} WhatsApp Shares
                      </span>
                    </div>
                    <div className="shrink-0">
                      <MiniSparkline data={[20, 35, 40, 30, 55, 60, 75, 82, 94]} color="#f43f5e" />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ========================================================================= */}
          {/* INTERACTIVE DUAL-MODE CHARTS & ASSET ALLOCATION SECTION                   */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Interactive Trajectory Chart */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 sm:p-5 shadow-2xs space-y-4">
              {/* Chart Header & Multi-Mode Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                      <i className={`ri-${chartMetric === 'leads' ? 'user-star-line' : chartMetric === 'inflow' ? 'hand-coin-line' : 'line-chart-line'} text-[#ea580c]`}></i>
                      {chartMetric === 'leads' ? 'Client Inquiries & Acquisition' : chartMetric === 'inflow' ? 'Capital Inflow & Deployment' : 'Portfolio Valuation Trajectory'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-50 text-[#ea580c] border border-orange-200">
                      {activePoint.isToday ? 'Live Today' : activePoint.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Selected Peak: <strong className="text-slate-700 font-bold">{activePoint.value}</strong> ({activePoint.growth} Growth)
                  </p>
                </div>

                {/* Switchers Strip */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Metric Switcher Pills */}
                  <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
                    {[
                      { id: 'valuation', label: 'Valuation' },
                      { id: 'inflow', label: 'Inflow' },
                      { id: 'leads', label: 'Leads' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setChartMetric(m.id)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          chartMetric === m.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Chart Style Switcher (Area Curve vs Glass Bar) */}
                  <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setChartType('area')}
                      className={`p-1 px-2 rounded-lg transition-all cursor-pointer ${
                        chartType === 'area' ? 'bg-white text-[#ea580c] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Smooth Area Curve"
                    >
                      <i className="ri-pulse-line"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartType('bar')}
                      className={`p-1 px-2 rounded-lg transition-all cursor-pointer ${
                        chartType === 'bar' ? 'bg-white text-[#ea580c] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Modern Glass Bars"
                    >
                      <i className="ri-bar-chart-fill"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Canvas Area */}
              <div className="relative pt-2 pb-2">
                {/* MODE A: Interactive Spline Area Chart */}
                {chartType === 'area' ? (
                  <div className="w-full relative h-48 sm:h-52 select-none">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="areaGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ea580c" stopOpacity="0.4" />
                          <stop offset="60%" stopColor="#f97316" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#ea580c" floodOpacity="0.3" />
                        </filter>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="18" y1="30" x2={svgWidth - 18} y2="30" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="18" y1="80" x2={svgWidth - 18} y2="80" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="18" y1="130" x2={svgWidth - 18} y2="130" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="18" y1="170" x2={svgWidth - 18} y2="170" stroke="#e2e8f0" strokeWidth="1" />

                      {/* Filled Area Gradient */}
                      <path d={splineData.fillPath} fill="url(#areaGradientPrimary)" />

                      {/* Stroke Spline Line */}
                      <path
                        d={splineData.linePath}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glowEffect)"
                      />

                      {/* Vertical Indicator Guide at Hovered Point */}
                      {splineData.coords[hoveredPointIndex] && (
                        <g>
                          <line
                            x1={splineData.coords[hoveredPointIndex].x}
                            y1="10"
                            x2={splineData.coords[hoveredPointIndex].x}
                            y2="170"
                            stroke="#ea580c"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            opacity="0.75"
                          />
                          <circle
                            cx={splineData.coords[hoveredPointIndex].x}
                            cy={splineData.coords[hoveredPointIndex].y}
                            r="6"
                            fill="#ffffff"
                            stroke="#ea580c"
                            strokeWidth="3"
                            filter="url(#glowEffect)"
                          />
                        </g>
                      )}

                      {/* Interactive Invisible Hover Pillars for each point */}
                      {splineData.coords.map((c, idx) => (
                        <rect
                          key={idx}
                          x={c.x - (svgWidth / activeBars.length) / 2}
                          y="0"
                          width={svgWidth / activeBars.length}
                          height={svgHeight}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                        />
                      ))}
                    </svg>

                    {/* Active Floating Badge On Selected Coordinate */}
                    {splineData.coords[hoveredPointIndex] && (
                      <div
                        className="absolute -top-3 sm:-top-4 z-30 pointer-events-none transform -translate-x-1/2 transition-all duration-150"
                        style={{ left: `${(splineData.coords[hoveredPointIndex].x / svgWidth) * 100}%` }}
                      >
                        <div className="rounded-xl bg-slate-950 text-white px-2.5 py-1 shadow-xl text-center border border-slate-700 whitespace-nowrap">
                          <span className="text-[11px] font-black block text-orange-400">{activePoint.value}</span>
                          <span className="text-[8px] text-slate-400 block font-normal">{activePoint.label}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* MODE B: Interactive Modern Glass Bars */
                  <div className="relative pt-6 pb-2">
                    <div className="relative z-10 flex items-end justify-between gap-1 sm:gap-2.5 h-44 sm:h-48 pt-4 w-full">
                      {activeBars.map((bar, idx) => {
                        const isHovered = hoveredPointIndex === idx;
                        return (
                          <div
                            key={bar.day}
                            onMouseEnter={() => setHoveredPointIndex(idx)}
                            className="flex-1 max-w-[34px] group relative flex flex-col items-center justify-end h-full cursor-pointer"
                          >
                            {isHovered && (
                              <div className="absolute -top-12 z-30 flex flex-col items-center animate-fadeIn pointer-events-none">
                                <div className="rounded-xl bg-slate-950 text-white px-2.5 py-1 shadow-xl text-center whitespace-nowrap border border-slate-700">
                                  <span className="text-[11px] font-bold block text-orange-400">{bar.value}</span>
                                  <span className="text-[8px] text-slate-400 block font-normal">{bar.label}</span>
                                </div>
                                <div className="h-1.5 w-1.5 rotate-45 bg-slate-950 -mt-0.5"></div>
                              </div>
                            )}

                            <div
                              style={{ height: `${bar.height}%` }}
                              className={`w-full rounded-t-xl transition-all duration-300 ${
                                bar.isToday
                                  ? 'bg-gradient-to-t from-orange-500 to-amber-400 shadow-md shadow-orange-500/30 ring-2 ring-orange-200'
                                  : isHovered
                                  ? 'bg-slate-800'
                                  : 'bg-orange-100 hover:bg-orange-200'
                              }`}
                            ></div>

                            <span
                              className={`mt-1.5 text-[10px] ${
                                bar.isToday ? 'text-orange-600 font-bold' : isHovered ? 'text-slate-900 font-bold' : 'text-slate-400'
                              }`}
                            >
                              {bar.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Date Range Axis Labels */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-2 pt-1 border-t border-slate-100">
                <span>Day 1 (1 Mar)</span>
                <span>Day 5</span>
                <span className="text-orange-600 font-bold">● Today (9 Mar)</span>
                <span>Day 12</span>
                <span>Day 14 (14 Mar)</span>
              </div>
            </div>

            {/* Right 1 Col: Asset Allocation Ring Chart & Pipeline Funnel */}
            <div className="space-y-4">
              {/* Asset Allocation Donut Ring Chart Box */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                    <i className="ri-pie-chart-2-line text-[#ea580c]"></i>
                    Asset Allocation
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    By Sector
                  </span>
                </div>

                {/* SVG Donut Ring */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      {/* Background Ring */}
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />

                      {/* Residential Segment (Orange) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth="12"
                        strokeDasharray={`${(resPct / 100) * donutC} ${donutC}`}
                        strokeDashoffset="0"
                        className="cursor-pointer transition-all duration-300 hover:stroke-width-[14]"
                        onMouseEnter={() => setHoveredDonutSegment('residential')}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />

                      {/* Commercial Segment (Emerald) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${(comPct / 100) * donutC} ${donutC}`}
                        strokeDashoffset={`-${comOffset}`}
                        className="cursor-pointer transition-all duration-300 hover:stroke-width-[14]"
                        onMouseEnter={() => setHoveredDonutSegment('commercial')}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />

                      {/* Plot Segment (Indigo) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="12"
                        strokeDasharray={`${(plotPct / 100) * donutC} ${donutC}`}
                        strokeDashoffset={`-${plotOffset}`}
                        className="cursor-pointer transition-all duration-300 hover:stroke-width-[14]"
                        onMouseEnter={() => setHoveredDonutSegment('plot')}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />
                    </svg>

                    {/* Donut Center Readout */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-xs font-black text-slate-800">
                        {hoveredDonutSegment === 'commercial' ? `${comPct}%` : hoveredDonutSegment === 'plot' ? `${plotPct}%` : `${resPct}%`}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">
                        {hoveredDonutSegment === 'commercial' ? 'Commercial' : hoveredDonutSegment === 'plot' ? 'Plots' : 'Residential'}
                      </span>
                    </div>
                  </div>

                  {/* Legend Labels */}
                  <div className="space-y-2 text-xs flex-1 min-w-0">
                    <div
                      onMouseEnter={() => setHoveredDonutSegment('residential')}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                      className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-slate-700 text-[11px] truncate">
                        <span className="h-2 w-2 rounded-full bg-[#ea580c] shrink-0"></span> Residential
                      </span>
                      <span className="font-bold text-slate-900 text-[11px]">{resPct}%</span>
                    </div>

                    <div
                      onMouseEnter={() => setHoveredDonutSegment('commercial')}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                      className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-slate-700 text-[11px] truncate">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span> Commercial
                      </span>
                      <span className="font-bold text-slate-900 text-[11px]">{comPct}%</span>
                    </div>

                    <div
                      onMouseEnter={() => setHoveredDonutSegment('plot')}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                      className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-slate-700 text-[11px] truncate">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0"></span> Plots & Land
                      </span>
                      <span className="font-bold text-slate-900 text-[11px]">{plotPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acquisition Funnel Mini-Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <i className="ri-filter-3-line text-[#ea580c]"></i> Deal Conversion Funnel
                  </h4>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    94% Health
                  </span>
                </div>

                <div className="space-y-2 pt-0.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-medium text-slate-600">
                      <span>Total Inquiries</span>
                      <strong className="text-slate-900">{displayLeads} (100%)</strong>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-medium text-slate-600">
                      <span>Site Visits & Pitches</span>
                      <strong className="text-slate-900">22 (58%)</strong>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: '58%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-medium text-slate-600">
                      <span>Deals Closed / Funded</span>
                      <strong className="text-emerald-700 font-bold">12 (32%)</strong>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: '32%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LIVE DEALS PIPELINE: GRID & COMPACT TABLE WITH INSTANT SEARCH & FILTER    */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            {/* Header & Controls Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <i className="ri-shield-star-line text-[#ea580c]"></i>
                  Live Investment Deals & Pipeline
                  <span className="text-xs font-normal text-slate-400">({displayProjects.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-normal">
                  Direct management of active co-investment funding pools, flips, and client WhatsApp pitches.
                </p>
              </div>

              {/* Toolbar Right: Filter Chips + Search + View Switcher */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search in Pipeline */}
                <div className="relative">
                  <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={dealSearch}
                    onChange={(e) => setDealSearch(e.target.value)}
                    placeholder="Search deal title, location..."
                    className="w-36 sm:w-48 pl-7 pr-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white transition-all"
                  />
                  {dealSearch && (
                    <button
                      onClick={() => setDealSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>

                {/* Deal Category Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'co_investment', label: '🤝 Pools' },
                    { id: 'renovate_flip', label: '🔨 Flips' },
                    { id: 'featured', label: '⭐ Hot' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDealFilterCategory(cat.id)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        dealFilterCategory === cat.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Grid / Table View Switcher */}
                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setDealsViewMode('grid')}
                    className={`p-1 px-2 rounded-lg transition-all cursor-pointer ${
                      dealsViewMode === 'grid' ? 'bg-white text-[#ea580c] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Grid View"
                  >
                    <i className="ri-grid-fill"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDealsViewMode('table')}
                    className={`p-1 px-2 rounded-lg transition-all cursor-pointer ${
                      dealsViewMode === 'table' ? 'bg-white text-[#ea580c] shadow-xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Compact Table View"
                  >
                    <i className="ri-list-check"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Pipeline Content (Grid or Table) */}
            {displayProjects.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <i className="ri-inbox-line text-3xl mb-1 block text-slate-300"></i>
                No deals match your search/filter criteria.
              </div>
            ) : dealsViewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {displayProjects.map((p) => {
                  const fundedPct = p.fundedPercentage || 50;
                  const isCopied = copiedDealId === p._id;

                  return (
                    <div
                      key={p._id}
                      className="group rounded-2xl border border-slate-100 bg-white hover:border-orange-200 hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Property Image & Badges */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }
                              }}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : null}
                          <div className={`flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 ${p.image ? 'hidden' : 'flex'}`}>
                            <i className="ri-building-line text-2xl"></i>
                          </div>

                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                            <span className="rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#ea580c] text-white shadow-xs">
                              {p.status || 'Running'}
                            </span>

                            <span className="rounded-md px-2 py-0.5 text-[9px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs border border-slate-200 shadow-xs">
                              {p.investmentModel === 'co_investment' ? '🤝 Pool' : '🔨 Flip'}
                            </span>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-3.5 space-y-2.5">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#ea580c] transition-colors">
                              {p.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-normal mt-0.5">
                              <i className="ri-map-pin-line text-[#ea580c]"></i>
                              <span className="truncate">{p.location || 'Prime Location'}</span>
                            </p>
                          </div>

                          {/* Financials Row */}
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-normal">Total Valuation</span>
                              <span className="font-black text-slate-900 text-[11px]">
                                {formatINR(p.totalValuation) || p.price || '₹ 85.0 L'}
                              </span>
                            </div>
                            {p.expectedRoi && (
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 block font-normal">Target ROI</span>
                                <span className="font-black text-emerald-600 text-[11px]">
                                  {p.expectedRoi}% p.a.
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Funding Gauge Progress */}
                          <div className="space-y-1 pt-0.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>Funded: {fundedPct}%</span>
                              <span className={fundedPct >= 100 ? 'text-emerald-600 font-bold' : 'text-orange-600'}>
                                {fundedPct >= 100 ? 'Fully Subscribed' : 'Open Pool'}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  fundedPct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'
                                }`}
                                style={{ width: `${fundedPct}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Fast Actions */}
                      <div className="p-3 pt-0 flex items-center gap-1.5 border-t border-slate-100 mt-2">
                        <button
                          type="button"
                          onClick={() => openWhatsAppShare && openWhatsAppShare({ title: p.title, price: formatINR(p.totalValuation) || p.price })}
                          className="flex-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1.5 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Share on WhatsApp"
                        >
                          <i className="ri-whatsapp-line text-xs"></i>
                          <span>Share</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyPitch(p)}
                          className={`p-1.5 px-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                            isCopied ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Copy Deal Pitch to Clipboard"
                        >
                          {isCopied ? <i className="ri-check-line"></i> : <i className="ri-file-copy-line"></i>}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                          title="Edit Deal Properties"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* COMPACT TABLE VIEW */
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="p-3">Deal & Location</th>
                      <th className="p-3">Model</th>
                      <th className="p-3">Valuation</th>
                      <th className="p-3">ROI</th>
                      <th className="p-3">Funding Progress</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {displayProjects.map((p) => {
                      const fundedPct = p.fundedPercentage || 50;
                      const isCopied = copiedDealId === p._id;

                      return (
                        <tr key={p._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="p-3 font-medium">
                            <div className="flex items-center gap-2.5">
                              {p.image ? (
                                <img src={p.image} alt={p.title} loading="lazy" className="h-8 w-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                  <i className="ri-building-line text-sm"></i>
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 block truncate group-hover:text-[#ea580c] transition-colors">{p.title}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                                  <i className="ri-map-pin-line text-[#ea580c] text-[10px]"></i> {p.location}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-700">
                              {p.investmentModel === 'co_investment' ? '🤝 Fractional' : '🔨 Flip'}
                            </span>
                          </td>
                          <td className="p-3 font-black text-slate-900">
                            {formatINR(p.totalValuation) || p.price || '₹ 85.0 L'}
                          </td>
                          <td className="p-3 font-bold text-emerald-600">
                            {p.expectedRoi ? `${p.expectedRoi}% p.a.` : '15%'}
                          </td>
                          <td className="p-3 w-40">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-bold text-slate-500">
                                <span>{fundedPct}%</span>
                                <span>{fundedPct >= 100 ? 'Complete' : 'Open'}</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${fundedPct >= 100 ? 'bg-emerald-500' : 'bg-[#ea580c]'}`}
                                  style={{ width: `${fundedPct}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-orange-50 text-[#ea580c] border border-orange-200">
                              {p.status || 'Running'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openWhatsAppShare && openWhatsAppShare({ title: p.title, price: formatINR(p.totalValuation) || p.price })}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition cursor-pointer"
                                title="Share on WhatsApp"
                              >
                                <i className="ri-whatsapp-line"></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPitch(p)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                                title="Copy Pitch"
                              >
                                {isCopied ? <i className="ri-check-line text-emerald-600"></i> : <i className="ri-file-copy-line"></i>}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(p)}
                                className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* QUICK COMMAND CENTER SHORTCUTS                                            */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/admin/projects"
              className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-orange-300 hover:shadow-md transition flex items-center gap-3 group"
            >
              <div className="h-9 w-9 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center text-base group-hover:scale-110 group-hover:bg-[#ea580c] group-hover:text-white transition-all shadow-xs">
                <i className="ri-bar-chart-2-line"></i>
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-800 truncate">All Investment</h5>
                <p className="text-[10px] text-slate-400">Manage {displayTotalDeals} listings</p>
              </div>
            </Link>

            <Link
              to="/admin/flats"
              className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-md transition flex items-center gap-3 group"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                <i className="ri-community-line"></i>
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-800 truncate">Apartments</h5>
                <p className="text-[10px] text-slate-400">Audit flat units</p>
              </div>
            </Link>

            <Link
              to="/admin/investment-requests"
              className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-300 hover:shadow-md transition flex items-center gap-3 group"
            >
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                <i className="ri-price-tag-3-line"></i>
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-800 truncate">Pricing & Deals</h5>
                <p className="text-[10px] text-slate-400">Investor requests</p>
              </div>
            </Link>

            <Link
              to="/admin/staff"
              className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-violet-300 hover:shadow-md transition flex items-center gap-3 group"
            >
              <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-base group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-xs">
                <i className="ri-user-settings-line"></i>
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-800 truncate">Staff Access</h5>
                <p className="text-[10px] text-slate-400">Team permissions</p>
              </div>
            </Link>
          </div>
        </>
      ) : (
        /* OTHER SUB-VIEWS: FEATURED HOT SALES & ALL PROJECTS */
        <div className="space-y-4 font-['Inter',sans-serif] select-text">
          {/* COMPACT UNIFIED HEADER & TOOLBAR */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
            {/* Top Row: Title + Badge + Create CTA Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="h-8 w-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center font-bold text-sm border border-orange-200/60 shadow-2xs shrink-0">
                  <i className={view === 'featured' ? 'ri-star-smile-fill' : 'ri-building-2-line'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-black text-slate-900 leading-none">
                      {isContacts
                        ? 'Customer Leads & Proposals'
                        : view === 'featured'
                        ? 'Featured Projects'
                        : 'All Investment Projects'}
                    </h1>
                    <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
                      {filteredProperties?.length || 0} Units
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                    {view === 'featured'
                      ? 'Showcase properties featured and published on the public website homepage.'
                      : 'Fractional co-investment pools and flip opportunities.'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                {view === 'featured' ? (
                  <button
                    onClick={() => {
                      if (typeof openCreateFeaturedModal === 'function') {
                        openCreateFeaturedModal();
                      } else {
                        if (typeof setEditingId === 'function') setEditingId(null);
                        if (typeof setPropertyForm === 'function') setPropertyForm(emptyProperty(true));
                        if (typeof setActiveFormTab === 'function') setActiveFormTab('basic');
                        if (typeof setShowProjectModal === 'function') setShowProjectModal(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/20 transition cursor-pointer"
                  >
                    <i className="ri-add-circle-line text-xs" />
                    <span>Create Property</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Bottom Row: Status Filter Pills + Search Box + Type Dropdown */}
            {!isContacts && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
                {/* Status Tab Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0">
                  {[
                    { id: 'all', label: 'All Status' },
                    { id: 'running', label: '🚀 Running' },
                    { id: 'upcoming', label: '⏳ Upcoming' },
                    { id: 'delivered', label: '✅ Delivered' },
                    { id: 'featured', label: '🌐 Published on Web' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFilterStatus(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        filterStatus === st.id
                          ? 'bg-[#ea580c] text-white shadow-2xs font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Search & Category Select */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-52">
                    <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title, location..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#ea580c] focus:bg-white font-medium"
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
                  >
                    <option value="all">All Categories</option>
                    <option value="residential">🏢 Residential</option>
                    <option value="commercial">🏬 Commercial</option>
                    <option value="plot">🏞️ Plot / Land</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {isContacts && <AddInvestorPanel />}

          {!isContacts && (
            <div>
              {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2 bg-white rounded-3xl border border-slate-200/90 p-8">
                  <i className="ri-loader-4-line animate-spin text-2xl text-[#ea580c]" />
                  <span>Loading properties portfolio...</span>
                </div>
              ) : filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProperties.map((p) => (
                    <div
                      key={p._id}
                      className={`group relative flex flex-col justify-between rounded-3xl border bg-white overflow-hidden shadow-2xs transition-all duration-200 ${
                        p.isFeatured
                          ? 'border-emerald-300 ring-1 ring-emerald-400/30 hover:border-emerald-500 hover:shadow-md'
                          : 'border-slate-200/90 hover:border-orange-300 hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Cover Image & Badges */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
                              <i className="ri-building-line text-2xl mb-1 text-slate-300" />
                              <span className="text-[10px] font-bold">No Cover Photo</span>
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute left-2.5 top-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10">
                            <span className="rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                              {p.status || 'Running'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Publish on Website Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleFeaturedStatus(p)}
                                className={`rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                                  p.isFeatured
                                    ? 'bg-emerald-600 text-white ring-1 ring-emerald-400/80 shadow-emerald-500/20'
                                    : 'bg-white/95 text-slate-700 hover:text-slate-950 border border-slate-200/90 hover:bg-white'
                                }`}
                                title={p.isFeatured ? "Published on Website (Click to Unpublish)" : "Click to Publish on Website"}
                              >
                                <i className={p.isFeatured ? "ri-checkbox-circle-fill text-white" : "ri-upload-cloud-line text-emerald-600"} />
                                <span>{p.isFeatured ? 'Published' : 'Publish'}</span>
                              </button>

                              {/* Portfolio Toggle */}
                              <button
                                type="button"
                                onClick={() => togglePortfolioStatus(p)}
                                className={`rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                                  p.isPortfolio
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white ring-1 ring-orange-400/80 shadow-orange-500/20'
                                    : 'bg-white/95 text-slate-700 hover:text-slate-950 border border-slate-200/90 hover:bg-white'
                                }`}
                                title={p.isPortfolio ? "In Curated Portfolio (Click to remove)" : "Click to add to Portfolio"}
                              >
                                <i className={p.isPortfolio ? "ri-folder-shared-fill text-white" : "ri-folder-shared-line text-orange-500"} />
                                <span>{p.isPortfolio ? 'Portfolio' : 'Add Portfolio'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-4 space-y-2">
                          <div>
                            <span className="text-[10px] font-black uppercase text-[#ea580c] block tracking-wider">
                              {p.propertyType === 'commercial' ? '🏬 Commercial' : p.propertyType === 'plot' ? '🏞️ Plot / Land' : '🏢 Residential'}
                            </span>
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1 group-hover:text-[#ea580c] transition">
                              {p.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                              <i className="ri-map-pin-2-line text-[#ea580c]" />
                              <span className="truncate">{p.location}</span>
                            </p>
                          </div>

                          {/* Price & Equity Breakdown */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] uppercase font-extrabold text-slate-400 block">Valuation / Price</span>
                              <span className="text-sm font-black text-slate-900">
                                {formatINR(p.totalValuation) || p.price || '₹0'}
                              </span>
                            </div>

                            {p.expectedRoi && (
                              <div className="text-right">
                                <span className="text-[9px] uppercase font-extrabold text-slate-400 block">Target ROI</span>
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  {p.expectedRoi}% p.a.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="p-3 pt-0 flex items-center gap-2 border-t border-slate-100/80 mt-1">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <i className="ri-edit-line" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openWhatsAppShare(p)}
                          className="rounded-xl bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Share on WhatsApp"
                        >
                          <i className="ri-whatsapp-line text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProperty(p._id)}
                          className="rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                          title="Delete Property"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200/90 p-8 space-y-1">
                  <i className="ri-inbox-line text-3xl text-slate-300 block mb-1" />
                  <span className="font-bold text-slate-600 block">No properties found</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
