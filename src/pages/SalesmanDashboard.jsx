import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getAuth, clearAuth } from '../store/auth';
import { useAppDispatch } from '../store';
import { logoutAction } from '../store/authSlice';
import AssignedLeadsPanel from '../components/AssignedLeadsPanel';

const QUICK_AMENITIES = [
  'Lift(s)',
  '24x7 Security',
  'Gated Community',
  'Car & Bike Parking',
  'Power Backup',
  '24hr Water Supply',
  'Modular Kitchen',
  'Private Balcony',
  'Park / Garden',
  'Gymnasium',
  'Near Metro Station',
  'CCTV Surveillance',
];

const emptyFlatListing = () => ({
  ownerName: '',
  ownerContact: '',
  propertyCategory: 'HK',
  furnishingStatus: 'Semi-Furnished',
  floor: 'Ground Floor (Front Side)',
  completeAddress: '',
  latitude: '',
  longitude: '',
  commission: 'YES',
  specialInstructions: '',
  netProfit: '',
  listingType: 'buy',
  title: '',
  location: '',
  configuration: '2 BHK',
  sizeSqft: '50 Gaj (450 sq.ft)',
  totalFloors: '4',
  lift: 'YES',
  parking: 'Car + Bike Parking',
  possessionStatus: 'Ready to Move',
  constructionYear: '2023',
  facing: 'East',
  reraId: 'RERA Not Applicable',
  amenities: '24x7 Security, Power Backup, Lift(s)',
  description: '',
  coverImage: '',
  images: [],
  videoUrl: '',
  monthlyRent: '',
  securityDeposit: '',
  maintenanceCharge: '',
  availableFrom: 'Immediate',
  salePrice: '',
  pricePerSqft: '',
  priceNegotiable: true,
  dealStatus: 'available',
});

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

const formatINR = (val) => {
  const num = Number(val);
  if (!num || isNaN(num)) return '—';
  if (num >= 10000000) {
    return `₹ ${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (num >= 100000) {
    return `₹ ${(num / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  }
  return `₹ ${num.toLocaleString('en-IN')}`;
};

const priceLabel = (listing) =>
  listing.listingType === 'rent' && listing.monthlyRent
    ? `${formatINR(listing.monthlyRent)}/mo`
    : formatINR(listing.salePrice);

export default function SalesmanDashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [view, setView] = useState('overview'); // 'overview' | 'list' | 'add' | 'leads' | 'calculator'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyFlatListing());
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewingProperty, setViewingProperty] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [pitchingProperty, setPitchingProperty] = useState(null);
  const [pitchClientName, setPitchClientName] = useState('');
  const [pitchClientPhone, setPitchClientPhone] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [dutyStatus, setDutyStatus] = useState('online');

  // Listing Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [priceSort, setPriceSort] = useState('none'); // 'none', 'asc' (Low to High), 'desc' (High to Low)
  const [layoutMode, setLayoutMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Calculator State
  const [calcPrice, setCalcPrice] = useState('2500000');
  const [calcBrokeragePct, setCalcBrokeragePct] = useState(1);
  const [calcLoanAmount, setCalcLoanAmount] = useState('2000000');
  const [calcInterestRate, setCalcInterestRate] = useState(8.5);
  const [calcTenureYears, setCalcTenureYears] = useState(20);
  const [calcGajInput, setCalcGajInput] = useState('50');

  const dispatch = useAppDispatch();
  const salesmanName = auth?.name || 'Authorized Salesman';

  const handleLogout = async () => {
    try {
      await dispatch(logoutAction());
    } catch {
      /* ignore */
    }
    clearAuth();
    navigate('/salesman/login');
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api('/api/flat-listings');
      setListings(Array.isArray(data) ? data : []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanAllInventory = async () => {
    const confirmClean = window.confirm(
      'Are you sure you want to clean/delete ALL your property listings? This will completely empty the inventory.'
    );
    if (!confirmClean) return;
    try {
      setLoading(true);
      await api('/api/flat-listings/clean/all', { method: 'DELETE' });
      setListings([]);
      setStatus('✓ Inventory cleaned successfully.');
    } catch (err) {
      alert(err.message || 'Failed to clean inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  // Auto-dismiss status toaster after 3 seconds
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => {
      setStatus('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'ri-dashboard-3-line', activeIcon: 'ri-dashboard-3-fill' },
    { id: 'add', label: 'Add Property', icon: 'ri-add-circle-line', activeIcon: 'ri-add-circle-fill' },
    { id: 'list', label: 'My Listings', icon: 'ri-building-line', activeIcon: 'ri-building-fill' },
    { id: 'leads', label: 'Client Leads', icon: 'ri-user-star-line', activeIcon: 'ri-user-star-fill' },
  ];

  const filteredListings = useMemo(() => {
    let result = listings.filter((item) => {
      if (filterCategory !== 'all' && item.propertyCategory !== filterCategory) return false;
      if (filterType !== 'all' && item.listingType !== filterType) return false;

      // Price Filter
      if (filterPrice !== 'all') {
        const p = item.listingType === 'rent' ? Number(item.monthlyRent) || 0 : Number(item.salePrice) || 0;
        if (item.listingType === 'rent') {
          if (filterPrice === 'u15' && p > 10000) return false;
          if (filterPrice === '15-25' && (p < 10000 || p > 20000)) return false;
          if (filterPrice === '25-40' && (p < 20000 || p > 35000)) return false;
          if (filterPrice === '40-60' && (p < 35000 || p > 50000)) return false;
          if (filterPrice === 'a60' && p < 50000) return false;
        } else {
          if (filterPrice === 'u15' && p >= 1500000) return false;
          if (filterPrice === '15-25' && (p < 1500000 || p > 2500000)) return false;
          if (filterPrice === '25-40' && (p < 2500000 || p > 4000000)) return false;
          if (filterPrice === '40-60' && (p < 4000000 || p > 6000000)) return false;
          if (filterPrice === 'a60' && p <= 6000000) return false;
        }
      }

      if (searchVal.trim()) {
        const q = searchVal.toLowerCase();
        const matches =
          String(item.location || '').toLowerCase().includes(q) ||
          String(item.configuration || '').toLowerCase().includes(q) ||
          String(item.title || '').toLowerCase().includes(q) ||
          String(item.ownerName || '').toLowerCase().includes(q) ||
          String(item.ownerContact || '').includes(q) ||
          String(item.floor || '').toLowerCase().includes(q) ||
          String(item.sizeSqft || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });

    if (priceSort === 'asc') {
      result.sort((a, b) => {
        const pa = a.listingType === 'rent' ? Number(a.monthlyRent) || 0 : Number(a.salePrice) || 0;
        const pb = b.listingType === 'rent' ? Number(b.monthlyRent) || 0 : Number(b.salePrice) || 0;
        return pa - pb;
      });
    } else if (priceSort === 'desc') {
      result.sort((a, b) => {
        const pa = a.listingType === 'rent' ? Number(a.monthlyRent) || 0 : Number(a.salePrice) || 0;
        const pb = b.listingType === 'rent' ? Number(b.monthlyRent) || 0 : Number(b.salePrice) || 0;
        return pb - pa;
      });
    }

    return result;
  }, [listings, filterCategory, filterType, filterPrice, priceSort, searchVal]);

  const stats = useMemo(() => {
    const total = listings.length;
    const available = listings.filter((l) => l.dealStatus === 'available' || !l.dealStatus).length;
    const soldOrRented = listings.filter((l) => l.dealStatus === 'sold' || l.dealStatus === 'rented').length;
    const buyCount = listings.filter((l) => l.listingType === 'buy' || !l.listingType).length;
    const rentCount = listings.filter((l) => l.listingType === 'rent').length;
    const availableBuy = listings.filter((l) => (l.listingType === 'buy' || !l.listingType) && (l.dealStatus === 'available' || !l.dealStatus)).length;
    const availableRent = listings.filter((l) => l.listingType === 'rent' && (l.dealStatus === 'available' || !l.dealStatus)).length;
    return { total, available, soldOrRented, buyCount, rentCount, availableBuy, availableRent };
  }, [listings]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredListings.slice(start, start + PAGE_SIZE);
  }, [filteredListings, currentPage]);

  const handleAmenityToggle = (amenity) => {
    const current = form.amenities ? form.amenities.split(',').map((a) => a.trim()).filter(Boolean) : [];
    const exists = current.includes(amenity);
    const updated = exists ? current.filter((a) => a !== amenity) : [...current, amenity];
    setForm((prev) => ({ ...prev, amenities: updated.join(', ') }));
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setForm((prev) => ({ ...prev, coverImage: b64 }));
      setStatus('✓ Cover photo uploaded successfully.');
    } catch {
      setStatus('Failed to upload cover image file.');
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const b64List = await Promise.all(files.map(fileToBase64));
      setForm((prev) => ({
        ...prev,
        images: [...(Array.isArray(prev.images) ? prev.images : []), ...b64List],
      }));
      setStatus(`✓ Added ${files.length} gallery photo(s).`);
    } catch {
      setStatus('Failed to upload gallery images.');
    }
  };

  const handleRemoveGalleryImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: (Array.isArray(prev.images) ? prev.images : []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveListing = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title?.trim() || `${form.configuration || '2 BHK'} at ${form.location || ''}`.trim(),
        description: form.description?.trim() || `${form.configuration || '2 BHK'} property at ${form.location || ''}`.trim(),
        salePrice: Number(form.salePrice) || 0,
        monthlyRent: Number(form.monthlyRent) || 0,
        netProfit: Number(form.netProfit) || 0,
      };

      if (editingId) {
        await api(`/api/flat-listings/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        setStatus('✓ Property listing updated successfully!');
      } else {
        await api('/api/flat-listings', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        setStatus('✓ New flat listing published successfully!');
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

  const handleSharePortfolioWhatsApp = () => {
    const availableItems = listings.filter((l) => l.dealStatus === 'available' || !l.dealStatus);
    const topPicks = availableItems.slice(0, 5).map((l, i) =>
      `${i + 1}️⃣ *${l.configuration || 'Flat'}* - ${l.location || 'Delhi NCR'}\n   💰 Demand: ${priceLabel(l)} | 🏢 ${l.floor || 'Standard'}`
    ).join('\n\n');

    const msg =
`🏢 *BABA BROKER - VERIFIED PROPERTY PORTFOLIO*
👤 *Executive:* ${salesmanName}

📊 *Inventory Overview:*
• Total Portfolio Value: *${formatINR(stats.totalVolume)}*
• Active Available Properties: *${stats.available}* / ${stats.total}

✨ *Top Featured Listings:*
${topPicks || '• Contact for latest available units'}

📲 *For Site Visits & Direct Inquiries:*
Contact *${salesmanName}* | Baba Broker Real Estate
📍 Rama Park Road, Mohan Garden, Uttam Nagar, New Delhi`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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

  const changeDealStatus = async (id, newStatus) => {
    try {
      await api(`/api/flat-listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ dealStatus: newStatus }),
        headers: { 'Content-Type': 'application/json' },
      });
      setListings((prev) =>
        prev.map((l) => (l._id === id ? { ...l, dealStatus: newStatus } : l))
      );
      setStatus(`✓ Listing marked as ${newStatus}.`);
    } catch (err) {
      setStatus(err.message || 'Failed to update deal status.');
    }
  };

  const buildPitchText = (listing, client = '') => {
    const greeting = client.trim() ? `Hi ${client.trim()},\n\n` : `Hello,\n\n`;
    const priceText = priceLabel(listing);
    const liftText = listing.lift === 'YES' ? '🛗 Lift Available' : 'No Lift';
    const parkText = listing.parking && listing.parking !== 'No Parking' ? `🚗 ${listing.parking}` : 'No Dedicated Parking';

    return (
      `${greeting}🏠 *Quick Property Alert from Baba Broker*\n\n` +
      `*${listing.title || listing.configuration}* at *${listing.location}*\n` +
      `💰 *Price*: ${priceText}\n` +
      `📐 *Size*: ${listing.sizeSqft || '50 Gaj'}\n` +
      `🏢 *Floor & Lift*: ${listing.floor || 'Standard'} | ${liftText}\n` +
      `🚗 *Parking*: ${parkText}\n\n` +
      `Let me know if you would like to visit today!\n` +
      `- *${salesmanName}*, Baba Broker`
    );
  };

  // Calculations for Commission & EMI Tab
  const calculatedCommission = useMemo(() => {
    const p = Number(calcPrice) || 0;
    const gross = (p * calcBrokeragePct) / 100;
    const gst = gross * 0.18;
    const net = gross - gst;
    const agentPayout = net * 0.40;
    return { gross, gst, net, agentPayout };
  }, [calcPrice, calcBrokeragePct]);

  const calculatedEMI = useMemo(() => {
    const p = Number(calcLoanAmount) || 0;
    const r = (calcInterestRate / 12) / 100;
    const n = calcTenureYears * 12;
    if (p <= 0 || r <= 0 || n <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0 };
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;
    return { emi: Math.round(emi), totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalInterest) };
  }, [calcLoanAmount, calcInterestRate, calcTenureYears]);

  const gajConversion = useMemo(() => {
    const g = Number(calcGajInput) || 0;
    const sqft = g * 9;
    const sqyd = g;
    const sqm = (sqft * 0.092903).toFixed(2);
    return { sqft, sqyd, sqm };
  }, [calcGajInput]);

  return (
    <div className="h-screen w-screen bg-[#070e1c] p-1.5 sm:p-3 font-['Inter',sans-serif] text-slate-800 antialiased flex flex-col justify-center overflow-hidden select-text">
      
      {/* Toast Alert */}
      {status && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-white text-emerald-800 shadow-xl px-4 py-3 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <i className="ri-checkbox-circle-fill text-emerald-600 text-base" />
          <span>{status}</span>
          <button type="button" onClick={() => setStatus('')} className="text-slate-400 hover:text-slate-600 ml-2">
            <i className="ri-close-line text-sm" />
          </button>
        </div>
      )}

      {/* Main Curved App Container */}
      <div className="w-full h-full rounded-2xl sm:rounded-[32px] md:rounded-[36px] shadow-2xl shadow-slate-950/80 overflow-hidden bg-white flex flex-col lg:flex-row border border-slate-800/30 relative">

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ─── LEFT SOLID ORANGE SIDEBAR ─── */}
        <aside
          className={`fixed lg:static top-0 left-0 h-full w-64 sm:w-72 lg:w-52 bg-[#ea580c] text-white flex flex-col justify-between pl-3.5 py-4 pr-0 select-none shrink-0 overflow-y-auto z-50 lg:z-20 shadow-2xl transition-transform duration-300 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-4">
            {/* Logo & Mobile Close */}
            <div className="pr-3.5 flex items-center justify-between">
              <Link to="/" onClick={() => setMobileSidebarOpen(false)} className="flex items-center px-1 group">
                <img
                  src="/assets/img/logo.svg"
                  alt="Baba Broker"
                  className="h-8 w-auto max-w-[155px] object-contain brightness-0 invert transition-transform group-hover:scale-105"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                title="Close Menu"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1.5 pt-2 pr-0">
              {navItems.map((item) => {
                const isActive = view === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setView(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full group relative flex items-center justify-between text-xs cursor-pointer text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-[#ea580c] font-black pl-3 py-2.5 pr-4 rounded-l-2xl rounded-r-none shadow-[-6px_4px_16px_rgba(0,0,0,0.12)] z-10 -mr-[1px]'
                        : 'text-white/90 hover:text-white hover:bg-white/20 px-3 py-2.5 rounded-xl mr-3.5 font-bold'
                    }`}
                  >
                    {isActive && (
                      <>
                        <svg className="hidden sm:block absolute -top-3 right-0 w-3 h-3 pointer-events-none fill-white" viewBox="0 0 16 16">
                          <path d="M0,16 Q16,16 16,0 L16,16 Z" />
                        </svg>
                        <svg className="hidden sm:block absolute -bottom-3 right-0 w-3 h-3 pointer-events-none fill-white" viewBox="0 0 16 16">
                          <path d="M0,0 Q16,0 16,16 L16,0 Z" />
                        </svg>
                      </>
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      {isActive ? (
                        <div className="h-6 w-6 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs shadow-xs shrink-0">
                          <i className={item.activeIcon} />
                        </div>
                      ) : (
                        <i className={`${item.icon} text-base shrink-0 text-white/90`} />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.id === 'list' && (
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${isActive ? 'bg-orange-100 text-orange-700' : 'bg-white/20 text-white'}`}>
                        {stats.total}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Clean Sidebar Footer */}
          <div className="pt-3 pr-3.5 mt-auto border-t border-white/20 text-center select-none">
            <p className="text-[10px] text-white/85 font-semibold">Baba Broker Sales Desk</p>
            <p className="text-[9px] text-white/70">v2.4 · Executive Edition</p>
          </div>
        </aside>

        {/* ─── RIGHT CANVAS: FULL WIDTH WORKSPACE ─── */}
        <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden bg-white">
          
          {/* Header */}
          <header className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/90 flex items-center justify-between gap-3 bg-white sticky top-0 z-30 shadow-xs font-['Inter',sans-serif]">
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen((prev) => !prev)}
                className="lg:hidden h-9 w-9 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 flex items-center justify-center cursor-pointer shrink-0 transition-all shadow-2xs"
                title="Toggle Menu"
              >
                <i className="ri-menu-2-line text-lg font-bold" />
              </button>

              <div className="relative w-full">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Quick search location, phone, size..."
                  className="w-full rounded-xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200/90 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition font-medium shadow-2xs"
                />
                {searchVal && (
                  <button type="button" onClick={() => setSearchVal('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <i className="ri-close-line text-xs" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Duty Toggle Pill */}
              <button
                type="button"
                onClick={() => setDutyStatus(dutyStatus === 'online' ? 'busy' : 'online')}
                className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
                  dutyStatus === 'online'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200/90 hover:bg-amber-100'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dutyStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{dutyStatus === 'online' ? 'Available' : 'Site Visit'}</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-50/80 px-2 sm:px-2.5 py-1 rounded-xl border border-slate-200/70">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center border border-orange-200">
                  {salesmanName.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">{salesmanName}</span>
                  <span className="text-[9.5px] text-slate-400 font-semibold">Field Associate</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-bold transition-all shadow-2xs cursor-pointer group active:scale-95"
                title="Sign Out"
              >
                <i className="ri-logout-box-r-line text-sm text-slate-400 group-hover:text-red-500 transition-colors" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

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
                        <span className="text-slate-400 text-[11px]">· {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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
                        onClick={() => { setForm(emptyFlatListing()); setEditingId(null); setView('add'); }}
                        className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Inventory</span>
                      <div className="h-6 w-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xs">
                        <i className="ri-building-line" />
                      </div>
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900">{stats.total} Units</div>
                    <span className="text-[10px] text-slate-400 font-medium">{stats.available} Available for Pitch</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Buy Deals</span>
                      <div className="h-6 w-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                        <i className="ri-price-tag-3-line" />
                      </div>
                    </div>
                    <div className="text-base sm:text-lg font-black text-blue-700">{stats.buyCount} Properties</div>
                    <span className="text-[10px] text-blue-600 font-bold">{stats.availableBuy} Active for Sale</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rental Units</span>
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                        <i className="ri-key-2-line" />
                      </div>
                    </div>
                    <div className="text-base sm:text-lg font-black text-emerald-700">{stats.rentCount} Rentals</div>
                    <span className="text-[10px] text-emerald-600 font-bold">{stats.availableRent} Active for Rent</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Deals Closed</span>
                      <div className="h-6 w-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs">
                        <i className="ri-checkbox-circle-line" />
                      </div>
                    </div>
                    <div className="text-base sm:text-lg font-black text-purple-700">{stats.soldOrRented} Converted</div>
                    <span className="text-[10px] text-purple-600 font-bold">Sold & Rented properties</span>
                  </div>
                </div>

                {/* 3. Recent Inventory Live Table */}
                <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 w-full">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Recent Property Inventory</h3>
                      <p className="text-[10px] text-slate-400">Your latest onboarded properties ready for client pitching</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({listings.length})</span>
                      <i className="ri-arrow-right-line" />
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse select-none">
                      <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-orange-500 text-[11px] font-black uppercase tracking-wider text-amber-300 shadow-md">
                        <tr>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Property</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Location</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Floor</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Price</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Associate</th>
                          <th className="py-3 px-3.5 text-right text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] last:border-r-0">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-700">
                        {listings.slice(0, 8).map((item) => {
                          const isSold = item.dealStatus === 'sold';
                          const isRented = item.dealStatus === 'rented';
                          const isClosed = isSold || isRented;

                          return (
                            <tr
                              key={item._id}
                              className={`border-b border-slate-200/90 transition-all duration-150 select-none ${
                                isClosed ? 'opacity-35 bg-slate-100/70 pointer-events-none' : 'hover:bg-amber-50/40'
                              }`}
                            >
                              <td className="py-2.5 px-3 max-w-[240px] border-r border-slate-200/80">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                    className="h-10 w-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-slate-200 shadow-2xs cursor-pointer hover:opacity-90 transition"
                                    title="Click to view photo"
                                  >
                                    {item.coverImage ? (
                                      <img src={item.coverImage} alt="" className="h-full w-full object-cover" />
                                    ) : (item.images && item.images.length > 0) ? (
                                      <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-[10px] font-black text-orange-600">{(item.configuration || '2B').slice(0, 2)}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-black uppercase">
                                        {item.configuration || '2 BHK'}
                                      </span>
                                      <span
                                        onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                        className="font-bold text-slate-900 truncate hover:text-orange-600 cursor-pointer"
                                      >
                                        {item.sizeSqft || 'Builder Floor'}
                                      </span>
                                      {isClosed && (
                                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-100 text-red-700 uppercase shrink-0">
                                          {isSold ? 'SOLD' : 'RENTED'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 font-medium border-r border-slate-200/80">
                                {item.location}
                              </td>
                              <td className="py-2.5 px-3 text-[10px] text-slate-500 border-r border-slate-200/80">
                                {item.floor || 'Standard'}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700 border-r border-slate-200/80">
                                {priceLabel(item)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200/80">
                                {item.ownerName || 'Associate'}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className={`inline-flex items-center gap-1.5 ${isClosed ? 'pointer-events-none opacity-30 cursor-not-allowed' : ''}`}>
                                  <button
                                    type="button"
                                    disabled={isClosed}
                                    onClick={() => { setPitchingProperty(item); setPitchClientName(''); }}
                                    className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 cursor-pointer inline-flex items-center gap-1 disabled:cursor-not-allowed transition"
                                  >
                                    <i className="ri-whatsapp-line text-xs" />
                                    <span>Pitch</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isClosed}
                                    onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                    className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition cursor-pointer inline-flex items-center gap-1 disabled:cursor-not-allowed"
                                    title="View Property & Photos"
                                  >
                                    <i className="ri-eye-line text-xs" />
                                    <span>View</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ─── TAB 1: MY LISTINGS (FULL WIDTH TABLE & CARDS) ─── */}
            {view === 'list' && (
              <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3.5 w-full">
                
                {/* 1. Page Heading Header with Live Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-black shrink-0">
                      <i className="ri-building-line" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-black text-slate-900">Property Inventory Catalog</h2>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {filteredListings.length} Units
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Manage your active inventory</p>
                    </div>
                  </div>

                  {/* Prominent Live Search Bar */}
                  <div className="relative w-full sm:w-80">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={searchVal}
                      onChange={(e) => { setSearchVal(e.target.value); setCurrentPage(1); }}
                      placeholder="Search flat, location, owner, size..."
                      className="w-full rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white pl-8 pr-7 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-orange-500 transition font-medium shadow-2xs"
                    />
                    {searchVal && (
                      <button
                        type="button"
                        onClick={() => setSearchVal('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <i className="ri-close-line text-xs" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Filter & View Bar with Highlighted Budget Selector on Right Corner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['all', 'HK', 'RK', 'Shop', 'Plot', 'Office'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setFilterCategory(cat); setCurrentPage(1); }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          filterCategory === cat
                            ? 'bg-[#ea580c] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'all' ? 'All Types' : cat}
                      </button>
                    ))}

                    <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {/* Low to High & High to Low Price Sort Switch */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setPriceSort(priceSort === 'asc' ? 'none' : 'asc'); setCurrentPage(1); }}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          priceSort === 'asc'
                            ? 'bg-[#ea580c] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Sort by Price: Low to High"
                      >
                        <i className="ri-arrow-up-line" /> Low to High
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPriceSort(priceSort === 'desc' ? 'none' : 'desc'); setCurrentPage(1); }}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          priceSort === 'desc'
                            ? 'bg-[#ea580c] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Sort by Price: High to Low"
                      >
                        <i className="ri-arrow-down-line" /> High to Low
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Highlighted Price Range Filter Dropdown */}
                    <div className="flex items-center gap-1.5 relative">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 shadow-xs ${
                        filterPrice !== 'all'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-orange-600 shadow-orange-500/20 shadow-md ring-2 ring-orange-400/40'
                          : 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-950 border-amber-300 ring-1 ring-amber-400/30'
                      }`}>
                        <i className={`ri-money-rupee-circle-fill text-sm ${filterPrice !== 'all' ? 'text-white' : 'text-amber-600'}`} />
                        <select
                          value={filterPrice}
                          onChange={(e) => { setFilterPrice(e.target.value); setCurrentPage(1); }}
                          className={`text-xs font-black bg-transparent outline-none cursor-pointer pr-1 ${
                            filterPrice !== 'all' ? 'text-white font-black' : 'text-amber-950 font-bold'
                          }`}
                        >
                          <option value="all" className="bg-white text-slate-800">💰 All Budgets</option>
                          <option value="u15" className="bg-white text-slate-800">Under ₹15 Lakh {filterType === 'rent' ? '(< ₹10k/mo)' : ''}</option>
                          <option value="15-25" className="bg-white text-slate-800">₹15 L – ₹25 Lakh {filterType === 'rent' ? '(₹10k-₹20k)' : ''}</option>
                          <option value="25-40" className="bg-white text-slate-800">₹25 L – ₹40 Lakh {filterType === 'rent' ? '(₹20k-₹35k)' : ''}</option>
                          <option value="40-60" className="bg-white text-slate-800">₹40 L – ₹60 Lakh {filterType === 'rent' ? '(₹35k-₹50k)' : ''}</option>
                          <option value="a60" className="bg-white text-slate-800">Above ₹60 Lakh {filterType === 'rent' ? '(> ₹50k/mo)' : ''}</option>
                        </select>
                      </div>

                      {filterPrice !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setFilterPrice('all')}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black cursor-pointer transition shadow-2xs"
                          title="Reset Budget Filter"
                        >
                          ✕ Reset
                        </button>
                      )}
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setLayoutMode('table')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          layoutMode === 'table' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <i className="ri-table-line text-xs" /> Table
                      </button>
                      <button
                        type="button"
                        onClick={() => setLayoutMode('grid')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          layoutMode === 'grid' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <i className="ri-grid-fill text-xs" /> Cards
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table View */}
                {layoutMode === 'table' ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 w-full bg-white shadow-xs">
                    <table className="w-full min-w-[1100px] text-left text-xs border-collapse select-none">
                      <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-orange-500 text-[11px] font-black uppercase tracking-wider text-amber-300 shadow-md">
                        <tr>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Property & Size</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Location</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Floor</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Demand Price</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Net Price</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Associate Contact</th>
                          <th className="py-3 px-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] border-r border-slate-700/60 last:border-r-0">Actions</th>
                          <th className="py-3 px-3.5 text-right text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)] last:border-r-0">Deal Status Switch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-700">
                        {pageData.map((item) => {
                          const cleanPhone = String(item.ownerContact || '').replace(/[^\d]/g, '');
                          const isSold = item.dealStatus === 'sold';
                          const isRented = item.dealStatus === 'rented';
                          const isClosed = isSold || isRented;
                          const isForRent = item.listingType === 'rent';

                          return (
                            <tr
                              key={item._id}
                              className={`border-b border-slate-200/90 transition-all duration-150 select-none ${
                                isClosed ? 'bg-slate-100/70' : 'hover:bg-amber-50/40'
                              }`}
                            >
                              <td className={`py-2.5 px-3 max-w-[260px] border-r border-slate-200/80 ${isClosed ? 'opacity-35 pointer-events-none' : ''}`}>
                                <div className="flex items-center gap-2.5">
                                  <div
                                    onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                    className="h-10 w-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-slate-200 shadow-2xs cursor-pointer hover:opacity-90 transition"
                                    title="Click to view photos"
                                  >
                                    {item.coverImage ? (
                                      <img src={item.coverImage} alt="" className="h-full w-full object-cover" />
                                    ) : (item.images && item.images.length > 0) ? (
                                      <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-[10px] font-black text-orange-600">{(item.configuration || '2B').slice(0, 2)}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-black uppercase">
                                        {item.configuration || '2 BHK'}
                                      </span>
                                      <span
                                        onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                        className="font-bold text-slate-900 truncate hover:text-orange-600 cursor-pointer"
                                        title={item.title}
                                      >
                                        {item.sizeSqft || 'Builder Floor'}
                                      </span>
                                      {isClosed && (
                                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-100 text-red-700 uppercase shrink-0">
                                          {isSold ? 'SOLD' : 'RENTED'}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block truncate mt-0.5" title={item.title}>
                                      {item.title || `${item.configuration} in ${item.location}`}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className={`py-2.5 px-3 max-w-[200px] border-r border-slate-200/80 ${isClosed ? 'opacity-35 pointer-events-none' : ''}`}>
                                <div className="flex items-center gap-1 font-bold text-slate-800">
                                  <i className="ri-map-pin-2-fill text-orange-500 text-xs shrink-0" />
                                  <span className="truncate">{item.location || '—'}</span>
                                </div>
                              </td>

                              <td className={`py-2.5 px-3 whitespace-nowrap border-r border-slate-200/80 ${isClosed ? 'opacity-35 pointer-events-none' : ''}`}>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                                  {item.floor || 'Standard'}
                                </span>
                              </td>

                              <td className={`py-2.5 px-3 whitespace-nowrap border-r border-slate-200/80 ${isClosed ? 'opacity-35 pointer-events-none' : ''}`}>
                                <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                  {priceLabel(item)}
                                </span>
                              </td>

                              <td className={`py-2.5 px-3 whitespace-nowrap border-r border-slate-200/80 ${isClosed ? 'opacity-35 pointer-events-none' : ''}`}>
                                <span className={`text-xs font-bold ${item.netProfit > 0 ? 'text-amber-700' : 'text-slate-300'}`}>
                                  {item.netProfit > 0 ? formatINR(item.netProfit) : '—'}
                                </span>
                              </td>

                              <td className={`py-2.5 px-3 whitespace-nowrap border-r border-slate-200/80 ${isClosed ? 'opacity-35 pointer-events-none' : ''}`}>
                                <span className="text-slate-800 font-bold block">{item.ownerName || 'Associate'}</span>
                                {cleanPhone && <span className="text-[10px] text-slate-400 font-mono block">{cleanPhone}</span>}
                              </td>

                              {/* Actions Buttons (Frozen if Closed) */}
                              <td className={`py-2.5 px-3 text-right whitespace-nowrap border-r border-slate-200/80 ${isClosed ? 'opacity-35 pointer-events-none' : ''}`}>
                                <div className={`inline-flex items-center gap-1.5 ${isClosed ? 'pointer-events-none opacity-30 cursor-not-allowed' : ''}`}>
                                  <button
                                    type="button"
                                    disabled={isClosed}
                                    onClick={() => { setPitchingProperty(item); setPitchClientName(''); }}
                                    title="WhatsApp Client Pitch Flyer"
                                    className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition inline-flex items-center gap-1 border border-emerald-200 cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    <i className="ri-whatsapp-line text-xs" />
                                    <span>Pitch</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isClosed}
                                    onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                    className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition inline-flex items-center gap-1 border border-blue-200 cursor-pointer disabled:cursor-not-allowed"
                                    title="View Property & Photos"
                                  >
                                    <i className="ri-eye-line text-xs" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isClosed}
                                    onClick={() => startEdit(item)}
                                    className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[11px] transition inline-flex items-center gap-1 border border-orange-200 cursor-pointer disabled:cursor-not-allowed"
                                    title="Edit"
                                  >
                                    <i className="ri-edit-line text-xs" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isClosed}
                                    onClick={() => deleteListing(item._id)}
                                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 font-bold text-[11px] transition inline-flex items-center gap-1 border border-slate-200 hover:border-red-200 cursor-pointer disabled:cursor-not-allowed"
                                    title="Delete"
                                  >
                                    <i className="ri-delete-bin-line text-xs" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>

                              {/* Deal Switch Column (Always interactive & 100% opacity so deal can be reopened) */}
                              <td className="py-2.5 px-3 text-right whitespace-nowrap pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => changeDealStatus(item._id, isClosed ? 'available' : (isForRent ? 'rented' : 'sold'))}
                                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all duration-150 cursor-pointer shadow-2xs font-mono select-none ${
                                      isClosed
                                        ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    }`}
                                    title={isClosed ? 'Deal is closed. Click to unfreeze & mark as Active (Available)' : `Click to close deal & mark as ${isForRent ? 'Rented' : 'Sold'}`}
                                  >
                                    <div className={`relative flex items-center h-4 w-7 shrink-0 rounded-full px-0.5 transition-colors duration-200 ${
                                      isClosed ? 'bg-rose-600' : 'bg-emerald-600'
                                    }`}>
                                      <span className={`inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                                        isClosed ? 'translate-x-0' : 'translate-x-3'
                                      }`} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider min-w-[44px] text-left">
                                      {isClosed ? (isSold ? 'SOLD' : 'RENTED') : 'ACTIVE'}
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
                    {pageData.map((item) => {
                      const isClosed = item.dealStatus === 'sold' || item.dealStatus === 'rented';

                      return (
                        <div
                          key={item._id}
                          className={`rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-md transition space-y-2.5 p-3 ${
                            isClosed ? 'opacity-40 hover:opacity-90 bg-slate-50/90' : ''
                          }`}
                        >
                        <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-100">
                          {item.coverImage ? (
                            <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                              <i className="ri-building-line text-4xl" />
                            </div>
                          )}
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold uppercase backdrop-blur-xs">
                            {item.propertyCategory}
                          </span>
                          <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-black uppercase shadow-xs">
                            {priceLabel(item)}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-900 line-clamp-1">{item.title || item.configuration}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 flex items-center gap-1 mt-0.5">
                            <i className="ri-map-pin-line text-[#ea580c]" /> {item.location}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 font-medium">
                          <span>{item.sizeSqft || '450 sqft'} • {item.floor || 'Standard'}</span>
                          <select
                            value={item.dealStatus || 'available'}
                            onChange={(e) => changeDealStatus(item._id, e.target.value)}
                            className="rounded-lg border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase bg-white outline-none cursor-pointer text-slate-700"
                          >
                            <option value="available">Available</option>
                            <option value="rented">Rented</option>
                            <option value="sold">Sold</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => { setPitchingProperty(item); setPitchClientName(''); }}
                            className="py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1 transition border border-emerald-200 cursor-pointer"
                          >
                            <i className="ri-whatsapp-line text-xs" />
                            <span>Pitch</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                            className="py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 transition border border-blue-200 cursor-pointer"
                          >
                            <i className="ri-eye-line text-xs" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center gap-1 transition border border-orange-200 cursor-pointer"
                          >
                            <i className="ri-edit-line text-xs" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteListing(item._id)}
                            className="py-1 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 font-bold text-xs flex items-center justify-center gap-1 transition border border-slate-200 hover:border-red-200 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-xs" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {filteredListings.length > 0 && (
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Showing {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredListings.length)} of {filteredListings.length}
                    </span>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold"
                        >
                          Prev
                        </button>
                        <span className="px-1.5 font-bold text-slate-800">{currentPage} / {totalPages}</span>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 2: ADD / EDIT PROPERTY FORM (EXECUTIVE STUDIO FULL WIDTH) ─── */}
            {view === 'add' && (
              <form onSubmit={handleSaveListing} className="space-y-3 w-full">
                
                {/* Header Sub-bar */}
                <div className="flex items-center justify-between pb-1 px-1">
                  <div className="flex items-center gap-2.5">
                    <span className="h-7 w-7 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs shadow-md shadow-orange-500/25">
                      <i className="ri-building-2-fill" />
                    </span>
                    <div>
                      <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                        {editingId ? 'Edit Property Listing' : 'Property Onboarding Studio'}
                      </h2>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Structured data entry • Auto-generates WhatsApp pitch flyer &amp; CRM sync
                      </p>
                    </div>
                  </div>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setForm(emptyFlatListing()); setEditingId(null); }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* ─── SECTION 1: CLASSIFICATION, DEAL TYPE & PLOT SIZE ─── */}
                <div className="rounded-2xl border border-orange-500/25 bg-gradient-to-b from-orange-50/20 via-white to-white p-3.5 sm:p-4 space-y-3 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

                  <div className="flex items-center justify-between pb-2 border-b border-orange-100/70">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-[10px] shadow-xs">
                        1
                      </span>
                      <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        Classification &amp; Deal Configuration
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                          Priority
                        </span>
                      </h3>
                    </div>
                    <span className="text-[10px] font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/70">
                      Step 1 of 3
                    </span>
                  </div>

                  {/* Deal Type & Layout Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
                    {/* Deal Type Switcher (5 Cols) */}
                    <div className="lg:col-span-5 p-2.5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <i className="ri-fire-fill text-orange-400 text-xs" />
                          Deal Type
                        </label>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Active: <strong className="text-white">{form.listingType === 'buy' ? 'Sale' : 'Rent'}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, listingType: 'buy' })}
                          className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            form.listingType === 'buy'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 border-white shadow-md font-black scale-[1.02]'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          <i className="ri-price-tag-3-fill text-xs" />
                          <span>For Sale / Buy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setForm({ ...form, listingType: 'rent' })}
                          className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            form.listingType === 'rent'
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-white shadow-md font-black scale-[1.02]'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          <i className="ri-key-2-fill text-xs" />
                          <span>For Rent / Lease</span>
                        </button>
                      </div>
                    </div>

                    {/* Configuration Layout (4 Cols) */}
                    <div className="lg:col-span-4 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        BHK Configuration <span className="text-orange-600 font-bold">({form.configuration})</span>
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                        {['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Jad se'].map((bhk) => (
                          <button
                            key={bhk}
                            type="button"
                            onClick={() => setForm({ ...form, configuration: bhk })}
                            className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer border truncate text-center ${
                              form.configuration === bhk
                                ? 'bg-orange-600 text-white border-orange-600 shadow-xs font-black'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {bhk}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Plot Size / Area (3 Cols) */}
                    <div className="lg:col-span-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">Plot Size / Area</label>
                        <span className="text-[9px] text-slate-400 font-medium">Gaj &amp; Sq.ft</span>
                      </div>
                      <input
                        type="text"
                        value={form.sizeSqft}
                        onChange={(e) => setForm({ ...form, sizeSqft: e.target.value })}
                        placeholder="e.g. 50 Gaj (450 sq.ft)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none text-xs font-medium"
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
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-orange-100 hover:text-orange-800 text-[9px] font-bold text-slate-600 border border-slate-200 transition cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
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

                  {/* 1. Floor Dropdown Selection & Custom Floor */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <i className="ri-building-line text-orange-600" />
                        Select Floor Position <span className="text-orange-600 font-bold">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Standard Delhi NCR Builder Floors</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Floor Dropdown */}
                      <div className="relative">
                        <select
                          value={form.floor}
                          onChange={(e) => setForm({ ...form, floor: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-400 outline-none text-xs font-bold text-slate-800 appearance-none cursor-pointer pr-8 shadow-2xs"
                        >
                          <option value="">-- Select Floor Position --</option>
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
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                          <i className="ri-arrow-down-s-line text-sm" />
                        </div>
                      </div>

                      {/* Custom Floor Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={form.floor}
                          onChange={(e) => setForm({ ...form, floor: e.target.value })}
                          placeholder="Or type custom floor (e.g. 4th Floor)..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-400 outline-none text-xs font-medium shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. OPTION 2 (SHIFTED): LOCATION / COLONY & ADDRESS LANDMARK */}
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

                  {/* 3. Lift & Parking Facilities (2 Compact Columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100 text-xs">
                    
                    {/* Lift Facility */}
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

                    {/* Parking Facility */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Vehicle Parking: <span className="text-orange-600 font-medium">{form.parking && form.parking !== 'No Parking' ? form.parking : 'No Parking'}</span>
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, parking: form.parking && form.parking !== 'No Parking' ? form.parking : 'Car + Bike Parking' })}
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

                      {/* When YES: 4 Compact Vehicle Radio Cards */}
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

                {/* ─── SECTION 3: COMMERCIALS, ASSOCIATE & AMENITIES ─── */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">
                        3
                      </span>
                      <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                        {form.listingType === 'rent' ? 'Pricing, Owner' : 'Pricing, Owner & Builder'}
                      </h3>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                      Step 3 of 3
                    </span>
                  </div>

                  {/* 1. Pricing Row */}
                  <div className="space-y-2">
                    <div className={`grid grid-cols-1 ${form.listingType === 'rent' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3 text-xs`}>
                      {/* Demand Price / Monthly Rent */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          {form.listingType === 'rent' ? 'Monthly Rent (₹)' : 'Demand Price (₹)'} <span className="text-orange-600">*</span>
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
                        {/* Quick Amount Chips */}
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

                      {/* Net Negotiable Price / Net Rent */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          {form.listingType === 'rent' ? 'Net Rent (₹)' : 'Net Price (₹)'} <span className="text-slate-400 font-normal">(Optional)</span>
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

                      {/* Commission / Brokerage (ONLY FOR RENT) */}
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

                  {/* 2. Sourced Associate & Media Hub Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    {/* Associate / Sourced By Column */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="ri-user-star-line text-orange-600 text-xs" /> {form.listingType === 'rent' ? 'Owner / Contact Person' : 'Owner / Builder / Partner'}
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

                    {/* Media Studio Column (Cover + Gallery) */}
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
                        {/* 1. Primary Cover Photo Card */}
                        <div>
                          <input
                            type="file"
                            id="coverPhotoUploadInput"
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
                                htmlFor="coverPhotoUploadInput"
                                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1 cursor-pointer"
                              >
                                <i className="ri-camera-switch-line" /> Change
                              </label>
                            </div>
                          ) : (
                            <label
                              htmlFor="coverPhotoUploadInput"
                              className="h-18 w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-orange-400 bg-slate-50/70 hover:bg-orange-50/40 transition flex flex-col items-center justify-center gap-0.5 cursor-pointer group select-none text-center p-1"
                            >
                              <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition flex items-center justify-center text-xs">
                                <i className="ri-image-add-line" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 group-hover:text-orange-950">Cover Photo</span>
                            </label>
                          )}
                        </div>

                        {/* 2. Gallery Photos Upload Card */}
                        <div>
                          <input
                            type="file"
                            id="galleryPhotosUploadInput"
                            multiple
                            accept="image/*"
                            onChange={handleGalleryUpload}
                            className="hidden"
                          />

                          <label
                            htmlFor="galleryPhotosUploadInput"
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

                      {/* Gallery Thumbnails Strip */}
                      {(form.images || []).length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {form.images.map((img, idx) => (
                            <div key={idx} className="relative group h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
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
                    </div>
                  </div>

                  {/* 3. Verified Amenities Multi-Select */}
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
                            <i className={isSelected ? 'ri-checkbox-circle-fill text-orange-600 text-xs' : 'ri-checkbox-blank-circle-line text-slate-300 text-xs'} />
                            <span className="truncate text-[11px]">{am}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ─── COMPACT ACTION BAR ─── */}
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
                  <button
                    type="button"
                    onClick={() => { setForm(emptyFlatListing()); setEditingId(null); setView('list'); }}
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
            )}

            {/* ─── TAB 3: CLIENT LEADS (FULL WIDTH) ─── */}
            {view === 'leads' && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 w-full">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Client & Buyer Inquiry Desk</h2>
                    <p className="text-[11px] text-slate-400">Assigned buyer leads and site visit scheduling</p>
                  </div>
                </div>
                <AssignedLeadsPanel />
              </div>
            )}

            {/* ─── TAB 4: COMMISSION & EMI CALCULATOR (FULL WIDTH) ─── */}
            {view === 'calculator' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full">
                
                {/* 1. Brokerage Calculator */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                      <i className="ri-money-rupee-circle-line" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">Brokerage Calculator</h3>
                      <p className="text-[10px] text-slate-400">Sales commission split</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Deal Sale Price (₹)</label>
                      <input
                        type="number"
                        value={calcPrice}
                        onChange={(e) => setCalcPrice(e.target.value)}
                        placeholder="2500000"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none"
                      />
                      <span className="text-[10px] text-orange-600 font-bold block mt-0.5">
                        {formatINR(calcPrice)}
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Brokerage %</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 1.5, 2].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setCalcBrokeragePct(pct)}
                            className={`py-1 rounded-lg font-bold text-xs transition ${
                              calcBrokeragePct === pct
                                ? 'bg-orange-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Gross Brokerage:</span>
                        <span className="font-bold text-slate-900">{formatINR(calculatedCommission.gross)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>GST (18%):</span>
                        <span className="font-bold text-slate-700">{formatINR(calculatedCommission.gst)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                        <span>Agent Payout (40%):</span>
                        <span className="font-black text-sm">{formatINR(calculatedCommission.agentPayout)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Client EMI Estimator */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                      <i className="ri-bank-line" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">Home Loan EMI Estimator</h3>
                      <p className="text-[10px] text-slate-400">Monthly repayment preview</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Loan Amount (₹)</label>
                      <input
                        type="number"
                        value={calcLoanAmount}
                        onChange={(e) => setCalcLoanAmount(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Rate (% p.a.)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={calcInterestRate}
                          onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Tenure (Years)</label>
                        <input
                          type="number"
                          value={calcTenureYears}
                          onChange={(e) => setCalcTenureYears(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200/70 space-y-1 text-xs text-blue-950">
                      <span className="text-[10px] font-black uppercase text-blue-700 block">Monthly Loan EMI</span>
                      <span className="text-base font-black text-blue-700 block">
                        ₹ {calculatedEMI.emi.toLocaleString('en-IN')} / month
                      </span>
                      <div className="flex justify-between text-[10px] pt-0.5 text-slate-600">
                        <span>Total Interest:</span>
                        <span className="font-bold">{formatINR(calculatedEMI.totalInterest)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Gaj / Land Unit Converter */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="h-6 w-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-black text-xs">
                      <i className="ri-ruler-2-line" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">Gaj & Land Unit Converter</h3>
                      <p className="text-[10px] text-slate-400">Delhi NCR land conversions</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Enter Area in Gaj (Gaz)</label>
                      <input
                        type="number"
                        value={calcGajInput}
                        onChange={(e) => setCalcGajInput(e.target.value)}
                        placeholder="50"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-black text-purple-700 text-sm outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-600">Square Feet (Sq.Ft):</span>
                        <span className="font-black text-xs text-slate-900">{gajConversion.sqft} sq.ft</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-600">Square Yards (Sq.Yd):</span>
                        <span className="font-black text-xs text-slate-900">{gajConversion.sqyd} sq.yd</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-600">Square Meters (Sq.M):</span>
                        <span className="font-black text-xs text-slate-900">{gajConversion.sqm} sq.m</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

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

      {/* ─── MODAL: ADVANCED WHATSAPP PITCH STUDIO (3 STYLES) ─── */}
      {pitchingProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-base">
                  <i className="ri-whatsapp-line" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">WhatsApp Client Pitch Studio</h3>
                  <p className="text-[10px] text-slate-400">Generate personalized property flyers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPitchingProperty(null)}
                className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <i className="ri-close-line text-base" />
              </button>
            </div>

            {/* Client Name & Client Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Client Name (Optional)</label>
                <input
                  type="text"
                  value={pitchClientName}
                  onChange={(e) => setPitchClientName(e.target.value)}
                  placeholder="e.g. Rahul Sharma, Amit Ji"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Client Phone Number (WhatsApp)</label>
                <div className="relative">
                  <i className="ri-phone-fill absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs" />
                  <input
                    type="text"
                    value={pitchClientPhone}
                    onChange={(e) => setPitchClientPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none text-xs font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>
            </div>

            {/* Generated WhatsApp Message Preview */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-[11px] font-mono whitespace-pre-line text-slate-800 max-h-56 overflow-y-auto leading-relaxed">
              {buildPitchText(pitchingProperty, pitchClientName)}
            </div>

            {/* Direct Send Action Button */}
            <div className="pt-1">
              <a
                href={(() => {
                  const clean = pitchClientPhone.replace(/\D/g, '');
                  const phoneParam = clean ? (clean.length === 10 ? `91${clean}` : clean) : '';
                  const textParam = encodeURIComponent(buildPitchText(pitchingProperty, pitchClientName));
                  return phoneParam
                    ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${textParam}`
                    : `https://api.whatsapp.com/send?text=${textParam}`;
                })()}
                target="_blank"
                rel="noreferrer"
                onClick={() => { setPitchingProperty(null); setPitchClientPhone(''); }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="ri-whatsapp-fill text-base" />
                <span>
                  {pitchClientPhone
                    ? `Send to WhatsApp (${pitchClientPhone.trim()})`
                    : 'Send on WhatsApp'}
                </span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── SLIDE DRAWER: PROPERTY COMPLETE DETAILS & INSPECTOR ─── */}
      {viewingProperty && (() => {
        const allPhotos = [
          viewingProperty.coverImage,
          ...(Array.isArray(viewingProperty.images) ? viewingProperty.images : [])
        ].filter(Boolean);

        const rawPrice = viewingProperty.listingType === 'rent'
          ? Number(viewingProperty.monthlyRent) || 0
          : Number(viewingProperty.salePrice) || 0;
        const netPrice = Number(viewingProperty.netProfit) || 0;
        const margin = (rawPrice > 0 && netPrice > 0 && rawPrice > netPrice) ? rawPrice - netPrice : 0;

        // Parse amenities into chips
        const amenitiesList = (viewingProperty.amenities || '')
          .split(/[,|\n]+/)
          .map((s) => s.trim())
          .filter(Boolean);

        return (
          <div
            className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end transition-opacity duration-300 animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setViewingProperty(null);
                setActivePhotoIdx(0);
              }
            }}
          >
            <div className="w-full max-w-xl sm:max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden transform transition-transform duration-300 ease-out animate-in slide-in-from-right font-['Inter',sans-serif]">
              {/* Top Drawer Header */}
              <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-start justify-between gap-4 sticky top-0 z-20 shadow-2xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-black uppercase tracking-wide shadow-2xs">
                      {viewingProperty.configuration || '2 BHK'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-100 text-[10px] font-bold uppercase">
                      {viewingProperty.propertyCategory || 'Flat'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        viewingProperty.listingType === 'rent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {viewingProperty.listingType === 'rent' ? 'For Rent' : 'For Sale'}
                    </span>
                    {viewingProperty.dealStatus && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          viewingProperty.dealStatus === 'available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {viewingProperty.dealStatus}
                      </span>
                    )}
                    {viewingProperty.isVerified !== false && (
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold flex items-center gap-1">
                        <i className="ri-verified-badge-fill text-sky-500 text-xs" /> Verified Listing
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug truncate">
                    {viewingProperty.title || `${viewingProperty.configuration} in ${viewingProperty.location || 'Delhi NCR'}`}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <i className="ri-map-pin-2-fill text-orange-500 text-sm" />
                    <span className="font-semibold text-slate-700 truncate">{viewingProperty.location || 'Location Not Specified'}</span>
                    {viewingProperty.sizeSqft && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="font-bold text-slate-600">{viewingProperty.sizeSqft}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => { setViewingProperty(null); setActivePhotoIdx(0); }}
                  className="h-9 w-9 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition cursor-pointer shrink-0 border border-slate-200 hover:border-red-200"
                  title="Close Drawer"
                >
                  <i className="ri-close-line text-xl" />
                </button>
              </div>

              {/* Scrollable Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/60">
                {/* 1. Photo Showcase & Carousel */}
                <div className="space-y-2.5">
                  {allPhotos.length > 0 ? (
                    <div className="space-y-2">
                      <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md group">
                        <img
                          src={allPhotos[activePhotoIdx] || allPhotos[0]}
                          alt="Property Showcase"
                          className="h-full w-full object-contain sm:object-cover transition duration-300"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-black/75 text-white font-mono text-[11px] font-bold backdrop-blur-md shadow-sm">
                            Photo {activePhotoIdx + 1} of {allPhotos.length}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-black shadow-lg">
                            {priceLabel(viewingProperty)}
                          </span>
                        </div>

                        {allPhotos.length > 1 && (
                          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
                              }}
                              className="pointer-events-auto h-8 w-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer shadow-md"
                            >
                              <i className="ri-arrow-left-s-line text-lg" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePhotoIdx((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
                              }}
                              className="pointer-events-auto h-8 w-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer shadow-md"
                            >
                              <i className="ri-arrow-right-s-line text-lg" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Thumbnail selector */}
                      {allPhotos.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                          {allPhotos.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActivePhotoIdx(idx)}
                              className={`relative h-14 w-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                                activePhotoIdx === idx
                                  ? 'border-orange-600 ring-2 ring-orange-300 scale-105'
                                  : 'border-slate-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={img} alt="" className="h-full w-full object-cover" />
                              <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-black/70 text-white text-[8px] font-bold">
                                #{idx + 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-36 w-full rounded-2xl bg-gradient-to-br from-white to-orange-50/50 border border-dashed border-orange-200 flex flex-col items-center justify-center text-slate-400 gap-2 shadow-2xs">
                      <div className="h-10 w-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl shadow-xs">
                        <i className="ri-image-add-line" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold text-slate-700 block">No Property Photos Attached</span>
                        <span className="text-[11px] text-slate-400 block">Edit listing to add verified high-res site photos</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Financial Overview Grid */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="ri-money-rupee-circle-line text-emerald-600 text-base" /> Pricing & Financial Terms
                    </h4>
                    {margin > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                        Direct Margin: {formatINR(margin)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Demand Price</span>
                      <span className="text-base font-black text-emerald-700 block mt-0.5">{priceLabel(viewingProperty)}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Net Deal / Bottom</span>
                      <span className="text-base font-black text-amber-700 block mt-0.5">
                        {netPrice > 0 ? formatINR(netPrice) : 'Firm Demand'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Commission / Brokerage</span>
                      <span className="text-xs font-bold text-slate-800 block mt-1">
                        {viewingProperty.commission || (viewingProperty.listingType === 'rent' ? '15 Days Rent' : '1% Deal')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Complete Specifications Grid */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-list-check-3 text-orange-600 text-base" /> Full Property Specifications
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Size & Super Area</span>
                      <span className="font-extrabold text-slate-800 block mt-0.5">{viewingProperty.sizeSqft || '50 Gaj (450 sq.ft)'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Floor & Position</span>
                      <span className="font-extrabold text-slate-800 block mt-0.5">{viewingProperty.floor || '1st Floor (Front Side)'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Lift Facility</span>
                      <span className={`font-extrabold block mt-0.5 ${viewingProperty.lift === 'YES' ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {viewingProperty.lift === 'YES' ? '🛗 Lift Installed' : 'No Lift'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Parking Space</span>
                      <span className="font-extrabold text-slate-800 block mt-0.5">{viewingProperty.parking || 'Car + Bike Parking'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Furnishing</span>
                      <span className="font-extrabold text-slate-800 block mt-0.5">{viewingProperty.furnishingStatus || 'Semi-Furnished'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Possession Status</span>
                      <span className="font-extrabold text-slate-800 block mt-0.5">{viewingProperty.possessionStatus || 'Ready to Move'}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Address & Landmark */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="ri-map-pin-range-line text-blue-600 text-base" /> Complete Address & Landmark
                    </h4>
                    {viewingProperty.completeAddress && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(viewingProperty.completeAddress);
                          setStatus?.('✓ Address copied to clipboard!');
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <i className="ri-file-copy-line" /> Copy Address
                      </button>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 leading-relaxed">
                    {viewingProperty.completeAddress || `${viewingProperty.location || 'Local area'}, Delhi NCR`}
                  </div>
                </div>

                {/* 5. Sourced Associate / Builder / Owner Contact */}
                <div className="bg-gradient-to-br from-orange-50/80 via-amber-50/40 to-white p-4 rounded-2xl border border-orange-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-orange-700 font-black uppercase tracking-wider flex items-center gap-1.5">
                      <i className="ri-user-shared-line text-base text-orange-600" /> Sourced Associate / Builder
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black uppercase">
                      {viewingProperty.sourcedBy || viewingProperty.source || 'Direct Source'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-orange-100">
                    <div>
                      <h5 className="text-sm font-black text-slate-900">
                        {viewingProperty.ownerName || 'Associate / Builder'}
                      </h5>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 font-bold">
                        {viewingProperty.ownerContact ? `+91 ${viewingProperty.ownerContact}` : 'Direct Office Inventory'}
                      </p>
                    </div>

                    {viewingProperty.ownerContact && (
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://wa.me/91${String(viewingProperty.ownerContact).replace(/[^\d]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <i className="ri-whatsapp-fill text-sm" /> WhatsApp
                        </a>
                        <a
                          href={`tel:${String(viewingProperty.ownerContact).replace(/[^\d]/g, '')}`}
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <i className="ri-phone-fill text-sm" /> Call
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Amenities & Features */}
                {amenitiesList.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="ri-sparkling-fill text-amber-500 text-base" /> Amenities & Colony Features
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {amenitiesList.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-bold flex items-center gap-1.5 border border-slate-200/60"
                        >
                          <i className="ri-checkbox-circle-fill text-emerald-600 text-xs" /> {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. Additional Notes / Descriptions */}
                {(viewingProperty.notes || viewingProperty.description) && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-1.5">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="ri-sticky-note-line text-slate-600 text-base" /> Internal Notes & Highlights
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {viewingProperty.notes || viewingProperty.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Sticky Footer Action Bar */}
              <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2.5 shadow-lg shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingProperty;
                    setViewingProperty(null);
                    setActivePhotoIdx(0);
                    startEdit(target);
                  }}
                  className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg"
                >
                  <i className="ri-edit-line text-base" />
                  <span>Edit Listing</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingProperty;
                    setViewingProperty(null);
                    setActivePhotoIdx(0);
                    setPitchingProperty(target);
                    setPitchClientName('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg"
                >
                  <i className="ri-whatsapp-fill text-base" />
                  <span>WhatsApp Pitch</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setViewingProperty(null); setActivePhotoIdx(0); }}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
