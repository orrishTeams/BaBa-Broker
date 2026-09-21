import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getAuth, clearAuth } from '../store/auth';
import { useAppDispatch } from '../store';
import AssignedLeadsPanel from '../components/AssignedLeadsPanel';
import AdminExcelView from '../components/admin/AdminExcelView';

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

const emptyFlatListing = () => ({
  ownerName: '',
  ownerContact: '',
  propertyCategory: 'HK',
  furnishingStatus: 'Semi-Furnished',
  floor: '1st Floor (Front Side)',
  lift: 'YES',
  parking: 'Car + Bike Parking',
  completeAddress: '',
  listingType: 'buy',
  title: '',
  location: '',
  configuration: '2 BHK',
  sizeSqft: '50 Gaj (450 sq.ft)',
  possessionStatus: 'Ready to Move',
  reraId: 'RERA-VERIFIED-2026',
  amenities: '24x7 Water, Modular Kitchen, Wardrobes, Gated Colony',
  coverImage: '',
  images: [],
  monthlyRent: '',
  salePrice: '',
  commission: '15 Days Rent',
  netProfit: '',
  dealStatus: 'available',
  isVerified: true,
});

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [view, setView] = useState('overview'); // 'overview' | 'add' | 'list' | 'leads' | 'verification' | 'calculator'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyFlatListing());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
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
  const employeeName = auth?.name || 'Operations Executive';

  const handleLogout = async () => {
    try {
      await dispatch(logoutAction());
    } catch {
      /* ignore */
    }
    clearAuth();
    navigate('/employee/login');
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

  const cleanAllInventory = async () => {
    const confirmClean = window.confirm(
      'Are you sure you want to clean/delete ALL property listings from the catalog? This will completely empty the inventory so you can upload a fresh Excel sheet.'
    );
    if (!confirmClean) return;
    try {
      setLoading(true);
      await api('/api/flat-listings/clean/all', { method: 'DELETE' });
      setListings([]);
      setStatus('✓ Catalog cleaned successfully! Ready for fresh Excel upload.');
    } catch (err) {
      alert(err.message || 'Failed to clean catalog.');
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

  // View mode for Inventory Catalog (table vs card grid)
  const [inventoryViewMode, setInventoryViewMode] = useState('table');

  // Excel Upload States
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelUploadStatus, setExcelUploadStatus] = useState(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);
  const excelFileRef = useRef(null);

  const downloadSampleTemplate = () => {
    const csvContent =
      'S.NO,SIZE,FLOOR,PRICE,LOCATION,LIFT,PARKING,ADDRESS,CONTACT,NET PRICE,BY,ADDITIONAL CONTACT / NOTES\n' +
      '1,50GAJ,G-FS,20L,BHAGWATI GARDEN,NO,BIKE,SPRING MEDOS PUBLIC SCHOOL K BACK SIDE,9560587733,,DHARMENDRA,Front side prime unit\n' +
      '2,50GAJ,T-BS,22L,MANSHARAM,YES,CAR+BIKE,NEAR METRO PILLAR 750,9811223344,20L,TRIPATHI JI,Top floor with private roof\n' +
      '3,40GAJ,2ND-BS,15.5L,JAIN ROAD,NO,BIKE,LAXMI ENCLAVE PLOT 12,8287143122,14.5L,ASHISH JI,Ready to move builder floor\n' +
      '4,60GAJ,1ST-FS,32L,SECTOR 15 DWARKA,YES,CAR,POCKET 4 MAIN ROAD,9319290979,30L,DIRECT OWNER,Brand new luxury finish\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Property_Inventory_Sample_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExcelUpload = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setExcelUploadStatus({ type: 'error', msg: 'Please select a valid .xlsx, .xls, or .csv file.' });
      return;
    }
    setExcelFileName(file.name);
    setUploadingExcel(true);
    setExcelUploadStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api('/api/excel/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const successCount = res.importedCount ?? (res.success ? res.success.length : 0);
      const failedCount = res.failed ? res.failed.length : 0;

      if (successCount > 0) {
        setExcelUploadStatus({
          type: 'success',
          msg: `✓ Successfully parsed & imported ${successCount} property listing(s) into database!${failedCount > 0 ? ` (${failedCount} empty/skipped rows)` : ''}`,
        });
        setStatus(`Successfully imported ${successCount} properties from Excel!`);
        await load();
      } else {
        setExcelUploadStatus({
          type: 'error',
          msg: `Upload completed but 0 rows imported. ${res.failed?.[0]?.error || 'Please check that your Excel file contains valid property data (SIZE, PRICE, LOCATION, etc.)'}`,
        });
      }
    } catch (err) {
      setExcelUploadStatus({
        type: 'error',
        msg: err.message || 'Excel upload failed. Check server connection.',
      });
    } finally {
      setUploadingExcel(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'ri-dashboard-3-line', activeIcon: 'ri-dashboard-3-fill' },
    { id: 'list', label: 'Audited Inventory', icon: 'ri-building-line', activeIcon: 'ri-building-fill' },
    { id: 'excel', label: 'Excel Manager', icon: 'ri-file-excel-2-line', activeIcon: 'ri-file-excel-2-fill' },
    { id: 'add', label: 'Add Property', icon: 'ri-add-circle-line', activeIcon: 'ri-add-circle-fill' },
    { id: 'leads', label: 'Client & Investment Inquiries', icon: 'ri-user-star-line', activeIcon: 'ri-user-star-fill' },
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
          String(item.floor || '').toLowerCase().includes(q);
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

  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredListings.slice(start, start + PAGE_SIZE);
  }, [filteredListings, currentPage]);

  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE) || 1;

  const stats = useMemo(() => {
    const total = listings.length;
    const available = listings.filter((l) => l.dealStatus === 'available' || !l.dealStatus).length;
    const verified = listings.filter((l) => l.isVerified !== false).length;
    const converted = listings.filter((l) => l.dealStatus === 'sold' || l.dealStatus === 'rented').length;
    const buyCount = listings.filter((l) => l.listingType === 'buy' || !l.listingType).length;
    const rentCount = listings.filter((l) => l.listingType === 'rent').length;
    const availableBuy = listings.filter((l) => (l.listingType === 'buy' || !l.listingType) && (l.dealStatus === 'available' || !l.dealStatus)).length;
    const availableRent = listings.filter((l) => l.listingType === 'rent' && (l.dealStatus === 'available' || !l.dealStatus)).length;
    return { total, available, verified, converted, buyCount, rentCount, availableBuy, availableRent };
  }, [listings]);

  // Image Upload Handlers
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Cover image size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, coverImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.slice(0, 8).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveGalleryImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveListing = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title?.trim() || `${form.configuration} in ${form.location || 'Delhi NCR'}`,
        description: form.description?.trim() || `${form.configuration} property located at ${form.location || 'Delhi NCR'}`,
        salePrice: Number(form.salePrice) || 0,
        monthlyRent: Number(form.monthlyRent) || 0,
        netProfit: Number(form.netProfit) || 0,
        isVerified: true,
      };

      if (editingId) {
        await api(`/api/flat-listings/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        setStatus('✓ Audited property updated successfully!');
      } else {
        await api('/api/flat-listings', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        setStatus('✓ New flat audited & published successfully!');
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
    let nextStatus = 'available';
    if (item.listingType === 'rent') {
      nextStatus = item.dealStatus === 'rented' ? 'available' : 'rented';
    } else {
      nextStatus = item.dealStatus === 'sold' ? 'available' : 'sold';
    }

    try {
      await api(`/api/flat-listings/${item._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ dealStatus: nextStatus }),
        headers: { 'Content-Type': 'application/json' },
      });
      setListings((prev) =>
        prev.map((l) => (l._id === item._id ? { ...l, dealStatus: nextStatus } : l))
      );
      const statusLabel =
        nextStatus === 'sold'
          ? 'Marked as Sold'
          : nextStatus === 'rented'
          ? 'Marked as Rented'
          : item.listingType === 'rent'
          ? 'Marked as Available (Unrented)'
          : 'Marked as Available (Unsold)';
      setStatus(`✓ Property ${statusLabel}.`);
    } catch (err) {
      setStatus(err.message || 'Failed to update deal status.');
    }
  };

  const toggleVerification = async (id, currentVal) => {
    try {
      await api(`/api/flat-listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isVerified: !currentVal }),
        headers: { 'Content-Type': 'application/json' },
      });
      setListings((prev) =>
        prev.map((l) => (l._id === id ? { ...l, isVerified: !currentVal } : l))
      );
      setStatus(`✓ Verification status updated.`);
    } catch (err) {
      setStatus(err.message || 'Failed to update verification status.');
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
      `- *${employeeName}*, Baba Broker Operations`
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
    const r = (Number(calcInterestRate) || 8.5) / 12 / 100;
    const n = (Number(calcTenureYears) || 20) * 12;
    if (p <= 0 || r <= 0 || n <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0 };
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;
    return { emi: Math.round(emi), totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalInterest) };
  }, [calcLoanAmount, calcInterestRate, calcTenureYears]);

  const gajConversion = useMemo(() => {
    const gaj = Number(calcGajInput) || 0;
    const sqft = gaj * 9;
    const sqmeter = (sqft * 0.092903).toFixed(2);
    const sqyard = gaj;
    return { sqft, sqmeter, sqyard };
  }, [calcGajInput]);

  return (
    <div className="h-screen w-screen bg-[#070e1c] p-1.5 sm:p-2.5 md:p-3 font-['Inter',sans-serif] text-slate-800 antialiased flex flex-col justify-center overflow-hidden select-text">
      
      {/* Toast Alert */}
      {status && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-white text-emerald-800 shadow-xl px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
          <i className="ri-checkbox-circle-fill text-emerald-600 text-base" />
          <span className="text-xs font-bold">{status}</span>
          <button type="button" onClick={() => setStatus('')} className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer">
            <i className="ri-close-line text-sm" />
          </button>
        </div>
      )}

      {/* Master Curved Card Container */}
      <div className="w-full h-full rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-950/70 overflow-hidden bg-white flex flex-col lg:flex-row border border-slate-800/30 relative">

        {/* Mobile Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 animate-fadeIn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ─── LEFT SOLID ORANGE SIDEBAR WITH SIGNATURE NOTCH TABS ─── */}
        <aside
          className={`fixed lg:static top-0 left-0 h-full w-72 sm:w-80 lg:w-56 bg-[#ea580c] text-white flex flex-col justify-between pl-3 py-3 pr-0 select-none shrink-0 overflow-y-auto font-['Inter',sans-serif] z-50 lg:z-20 shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-3.5">
            {/* Logo & Mobile Close */}
            <div className="pr-3.5 flex items-center justify-between">
              <Link to="/" onClick={() => setMobileSidebarOpen(false)} className="flex items-center px-1 py-1 group">
                <img
                  src="/assets/img/logo.svg"
                  alt="Baba Broker"
                  className="h-8 sm:h-9 w-auto max-w-[170px] object-contain brightness-0 invert transition-all duration-300 group-hover:scale-105"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Close Menu"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1.5 pt-1 pr-0">
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
                    className={`w-full group relative flex items-center justify-between text-xs cursor-pointer text-left transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-[#ea580c] font-black pl-3 py-2 pr-3.5 rounded-l-2xl rounded-r-none shadow-[-6px_4px_20px_rgba(0,0,0,0.12)] z-10 -mr-[1px]'
                        : 'text-white/85 hover:text-white hover:bg-white/20 hover:backdrop-blur-sm px-3 py-2 rounded-xl mr-3.5 hover:translate-x-1 font-semibold'
                    }`}
                  >
                    {/* Notch tabs */}
                    {isActive && (
                      <>
                        <svg className="hidden sm:block absolute -top-3.5 right-0 w-3.5 h-3.5 pointer-events-none fill-white" viewBox="0 0 16 16">
                          <path d="M0,16 Q16,16 16,0 L16,16 Z" />
                        </svg>
                        <svg className="hidden sm:block absolute -bottom-3.5 right-0 w-3.5 h-3.5 pointer-events-none fill-white" viewBox="0 0 16 16">
                          <path d="M0,0 Q16,0 16,16 L16,0 Z" />
                        </svg>
                      </>
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      {isActive ? (
                        <div className="h-7 w-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-sm shadow-xs shrink-0">
                          <i className={item.activeIcon} />
                        </div>
                      ) : (
                        <i className={`${item.icon} text-[20px] shrink-0 text-white/90`} />
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
            <p className="text-[10px] text-white/85 font-semibold">Baba Broker Operations</p>
            <p className="text-[9px] text-white/70">v2.4 · Executive Desk</p>
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
                  placeholder="Quick search flat, location, owner, size..."
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
                <span>{dutyStatus === 'online' ? 'Available' : 'Auditing Units'}</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-50/80 px-2 sm:px-2.5 py-1 rounded-xl border border-slate-200/70">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center border border-orange-200">
                  {employeeName.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">{employeeName}</span>
                  <span className="text-[9.5px] text-slate-400 font-semibold">Operations Desk</span>
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

          {/* Main Scrollable Canvas */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/40 space-y-3.5">

            {/* ─── TAB 1: OVERVIEW ─── */}
            {view === 'overview' && (
              <div className="space-y-3 w-full">
                
                {/* 1. Clean Executive Header Banner */}
                <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Operations Command Center · Unit Audits & Quality
                        </span>
                      </div>
                      <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 mt-1">
                        Welcome back, <span className="text-orange-600">{employeeName}</span> 👋
                      </h1>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Audit verified inventory, inspect documents & RERA compliance, and monitor live inquiries.
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
                        <i className="ri-user-star-line text-sm text-amber-600" /> Inquiries
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
                    <span className="text-[10px] text-slate-400 font-medium">{stats.available} Available Units</span>
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Deals Converted</span>
                      <div className="h-6 w-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs">
                        <i className="ri-medal-line" />
                      </div>
                    </div>
                    <div className="text-base sm:text-lg font-black text-purple-700">{stats.converted} Deals</div>
                    <span className="text-[10px] text-purple-600 font-bold">{stats.verified} Verified Units</span>
                  </div>
                </div>

                {/* 3. Recent Inventory Live Table */}
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5 w-full">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Audited Property Inventory</h3>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-extrabold font-mono">
                          {listings.length} Units
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setView('list')}
                        className="text-[11px] font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <span>View Full Inventory ({listings.length})</span>
                        <i className="ri-arrow-right-line" />
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200/90 max-h-[60vh] overflow-y-auto bg-white shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse select-none">
                        <thead className="sticky top-0 z-10 bg-slate-900 border-b border-orange-500 text-[10px] uppercase font-black tracking-wider text-amber-300 shadow-xs">
                          <tr>
                            <th className="py-2 px-2 text-white border-r border-slate-700/60 text-center w-10 shrink-0">#</th>
                            <th className="py-2 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">SIZE / BHK</th>
                            <th className="py-2 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">FLOOR</th>
                            <th className="py-2 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">DEMAND PRICE</th>
                            <th className="py-2 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">LOCATION</th>
                            <th className="py-2 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">CONTACT</th>
                            <th className="py-2 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">NET PRICE</th>
                            <th className="py-2 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap">BY</th>
                            <th className="py-2 px-2 text-white border-r border-slate-700/60 text-center w-16">STATUS</th>
                            <th className="py-2 px-2.5 text-right text-white w-24">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                          {listings.slice(0, 10).map((item, idx) => {
                            const isSold = item.dealStatus === 'sold';
                            const isRented = item.dealStatus === 'rented';
                            const isClosed = isSold || isRented;

                            return (
                              <tr
                                key={item._id}
                                onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                className={`border-b border-slate-200/70 transition-colors duration-100 cursor-pointer ${
                                  isClosed
                                    ? 'bg-slate-100/60 text-slate-400'
                                    : idx % 2 === 0
                                    ? 'bg-white hover:bg-amber-50/50'
                                    : 'bg-slate-50/40 hover:bg-amber-50/50'
                                }`}
                                title="Click row to inspect complete property details (Address, Lift, Parking, Notes in View)"
                              >
                                {/* 1. S.NO */}
                                <td className="py-1.5 px-2 text-center font-extrabold text-slate-400 font-mono text-[10px] border-r border-slate-200/70">
                                  {idx + 1}
                                </td>

                                {/* 2. SIZE */}
                                <td className="py-1.5 px-2.5 border-r border-slate-200/70 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-black uppercase leading-none">
                                      {item.configuration || '2 BHK'}
                                    </span>
                                    <span className="font-extrabold text-slate-800 text-[11px]">{item.sizeSqft || '50 Gaj'}</span>
                                  </div>
                                </td>

                                {/* 3. FLOOR */}
                                <td className="py-1.5 px-2.5 border-r border-slate-200/70 whitespace-nowrap">
                                  <span className="font-semibold text-slate-700 text-[11px] block truncate max-w-[130px]" title={item.floor}>
                                    {item.floor || 'Standard Floor'}
                                  </span>
                                </td>

                                {/* 4. PRICE */}
                                <td className="py-1.5 px-2.5 font-bold border-r border-slate-200/70 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-50/90 px-1.5 py-0.5 rounded border border-emerald-200/70">
                                      {priceLabel(item)}
                                    </span>
                                    {item.listingType === 'rent' && (
                                      <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-1 rounded">Rent</span>
                                    )}
                                  </div>
                                </td>

                                {/* 5. LOCATION */}
                                <td className="py-1.5 px-2.5 border-r border-slate-200/70 max-w-[150px]">
                                  <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                                    <i className="ri-map-pin-2-fill text-orange-500 text-xs shrink-0" />
                                    <span className="truncate" title={item.location}>{item.location}</span>
                                  </div>
                                </td>

                                {/* 6. CONTACT */}
                                <td className="py-1.5 px-2.5 border-r border-slate-200/70 whitespace-nowrap">
                                  {item.ownerContact ? (
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <a
                                        href={`tel:${String(item.ownerContact).replace(/[^\d+]/g, '')}`}
                                        className="text-[11px] font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                                        title="Click to Call"
                                      >
                                        <i className="ri-phone-fill text-slate-400 text-xs" />
                                        <span>{item.ownerContact}</span>
                                      </a>
                                      <a
                                        href={`https://wa.me/91${String(item.ownerContact).replace(/[^\d]/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700"
                                        title="Open WhatsApp"
                                      >
                                        <i className="ri-whatsapp-fill text-xs" />
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] font-mono">—</span>
                                  )}
                                </td>

                                {/* 7. NET PRICE */}
                                <td className="py-1.5 px-2.5 border-r border-slate-200/70 whitespace-nowrap">
                                  <span className={`text-[11px] font-bold ${item.netProfit > 0 ? 'text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70' : 'text-slate-400'}`}>
                                    {item.netProfit > 0 ? formatINR(item.netProfit) : '—'}
                                  </span>
                                </td>

                                {/* 8. BY */}
                                <td className="py-1.5 px-2 border-r border-slate-200/70 whitespace-nowrap">
                                  <span className="font-bold text-slate-700 text-[11px] block truncate max-w-[90px]" title={item.ownerName || 'Direct'}>
                                    {item.ownerName || 'Direct'}
                                  </span>
                                </td>

                                {/* 9. STATUS */}
                                <td className="py-1.5 px-2 border-r border-slate-200/70 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  {isClosed ? (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-700 uppercase">
                                      {isSold ? 'SOLD' : 'RENTED'}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleVerification(item._id, item.isVerified !== false)}
                                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border cursor-pointer ${
                                        item.isVerified !== false
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                      }`}
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full ${item.isVerified !== false ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                      <span>{item.isVerified !== false ? 'Verified' : 'Pending'}</span>
                                    </button>
                                  )}
                                </td>

                                {/* 10. ACTIONS */}
                                <td className="py-1.5 px-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      disabled={isClosed}
                                      onClick={() => { setPitchingProperty(item); setPitchClientName(''); setPitchClientPhone(''); }}
                                      className="px-1.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer disabled:opacity-40 transition"
                                      title="WhatsApp Pitch"
                                    >
                                      <i className="ri-whatsapp-fill text-xs" />
                                      <span>Pitch</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                      className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center justify-center cursor-pointer transition"
                                      title="Slide Drawer Details"
                                    >
                                      <i className="ri-eye-line text-xs" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => startEdit(item)}
                                      className="p-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[11px] font-bold flex items-center justify-center cursor-pointer transition"
                                      title="Edit Listing"
                                    >
                                      <i className="ri-edit-line text-xs" />
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

            {/* ─── TAB 2: ADD PROPERTY (PREMIUM ONBOARDING & AUDIT STUDIO) ─── */}
            {view === 'add' && (
              <form onSubmit={handleSaveListing} className="space-y-4 w-full pb-10">
                
                {/* 1. Header Banner */}
                <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center text-lg font-black shadow-md shadow-orange-500/20">
                      <i className={editingId ? "ri-edit-2-line" : "ri-building-line"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-black text-slate-900">
                          {editingId ? 'Edit Audited Property' : 'Onboard & Audit New Property'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase border border-orange-200">
                          {form.listingType === 'rent' ? 'Rental' : 'Sale Deal'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">Verify property specs, pricing metrics, and photo gallery</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setForm(emptyFlatListing()); setEditingId(null); setView('list'); }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-black shadow-md shadow-orange-600/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
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
                </div>

                {/* 2. Real-Time Live Audit Preview Card */}
                <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 p-4 rounded-3xl border border-orange-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-orange-200 text-orange-600 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-2xs">
                      {form.coverImage ? (
                        <img src={form.coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span>{form.configuration || '2B'}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">
                          {form.title || `${form.configuration || '2 BHK'} Builder Floor`}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-600 text-white shadow-2xs">
                          {form.listingType === 'rent' ? 'For Rent' : 'For Sale'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-bold text-orange-700">{form.location || 'Location Not Specified'}</span>
                        <span>·</span>
                        <span>{form.sizeSqft || '50 Gaj'}</span>
                        <span>·</span>
                        <span>{form.floor || '1st Floor'}</span>
                        <span>·</span>
                        <span className={form.lift === 'YES' ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {form.lift === 'YES' ? '🛗 Lift Available' : 'No Lift'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 bg-white/90 sm:bg-transparent px-3 py-1.5 rounded-xl border border-orange-200 sm:border-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Demand Price</span>
                    <span className="text-base font-black text-orange-700 block">
                      {form.listingType === 'rent'
                        ? (form.monthlyRent ? `${formatINR(form.monthlyRent)}/mo` : '₹ —/mo')
                        : (form.salePrice ? formatINR(form.salePrice) : '₹ —')}
                    </span>
                  </div>
                </div>

                {/* Section 1: Property Identity & Category */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                        1
                      </div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Property Identity & Category</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Step 1 of 4</span>
                  </div>

                  {/* 1. Category Fast Chips */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">Select Category Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { id: 'HK', label: 'Builder Floor / Flat', icon: '🏠', desc: 'Standard residential units' },
                        { id: 'RK', label: 'Studio / 1 RK Flat', icon: '🏢', desc: 'Compact bachelor units' },
                        { id: 'Plot', label: 'Freehold Land / Plot', icon: '📐', desc: 'Plots & raw land' },
                        { id: 'Shop', label: 'Commercial Shop', icon: '🏪', desc: 'Retail & business spaces' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setForm({ ...form, propertyCategory: cat.id })}
                          className={`p-2.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
                            form.propertyCategory === cat.id
                              ? 'bg-orange-50 border-orange-500 text-orange-950 font-black shadow-xs ring-1 ring-orange-400'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{cat.icon}</span>
                            <span className="text-xs font-bold">{cat.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">{cat.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Configuration & Listing Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">Unit Configuration</label>
                      <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
                        {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '1 RK', 'Jad se', 'Shop'].map((cfg) => (
                          <button
                            key={cfg}
                            type="button"
                            onClick={() => setForm({ ...form, configuration: cfg })}
                            className={`py-2 rounded-xl font-bold text-xs border transition cursor-pointer text-center ${
                              form.configuration === cfg
                                ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-black'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {cfg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">Deal Intent</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, listingType: 'buy' })}
                          className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                            form.listingType === 'buy'
                              ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🏷️ For Sale
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, listingType: 'rent' })}
                          className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                            form.listingType === 'rent'
                              ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🔑 For Rent
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Title & Location with Quick Tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Property Title / Marketing Heading</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. 2 BHK Brand New Builder Floor"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Location & Landmark Area</label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="e.g. Bhagwati Garden, Dwarka Mor"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition"
                      />
                      {/* Fast Location Quick Chips */}
                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">Fast select:</span>
                        {['Bhagwati Garden', 'Mohan Garden', 'Rama Park', 'Dwarka Mor', 'Uttam Nagar', 'Jain Road', 'Sewak Park'].map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setForm({ ...form, location: loc })}
                            className={`text-[10px] px-2 py-0.5 rounded-md transition font-medium cursor-pointer border ${
                              form.location === loc
                                ? 'bg-orange-100 text-orange-800 border-orange-300 font-bold'
                                : 'bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 border-slate-200'
                            }`}
                          >
                            + {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Floor Position, Parking & Specs */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                        2
                      </div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Floor Position, Parking & Specifications</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Step 2 of 4</span>
                  </div>

                  {/* Floor Position Grid */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Select Floor Position</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      {[
                        { code: 'G-FS', label: 'Ground Floor (Front Side)' },
                        { code: 'G-BS', label: 'Ground Floor (Back Side)' },
                        { code: 'UG-FS', label: 'Upper Ground (Front Side)' },
                        { code: '1ST-FS', label: '1st Floor (Front Side)' },
                        { code: '2ND-BS', label: '2nd Floor (Back Side)' },
                        { code: '3RD-FS', label: '3rd Floor (Front Side)' },
                        { code: 'T-BS', label: 'Top Floor with Roof' },
                        { code: 'BSMT', label: 'Basement Unit' },
                      ].map((fl) => (
                        <button
                          key={fl.code}
                          type="button"
                          onClick={() => setForm({ ...form, floor: fl.label })}
                          className={`p-2 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                            form.floor === fl.label
                              ? 'bg-orange-50 border-orange-500 text-orange-950 font-black shadow-2xs ring-1 ring-orange-400'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <span className="text-[9px] font-black text-orange-600">{fl.code}</span>
                          <span className="text-[11px] truncate leading-tight mt-0.5">{fl.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lift, Furnishing, Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Lift Facility</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['YES', 'NO'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setForm({ ...form, lift: val })}
                            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                              form.lift === val
                                ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-black'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {val === 'YES' ? '🛗 Lift Available' : 'No Lift'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Furnishing Status</label>
                      <select
                        value={form.furnishingStatus}
                        onChange={(e) => setForm({ ...form, furnishingStatus: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                      >
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Fully-Furnished">Fully-Furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Plot Size / Area</label>
                      <input
                        type="text"
                        value={form.sizeSqft}
                        onChange={(e) => setForm({ ...form, sizeSqft: e.target.value })}
                        placeholder="e.g. 50 Gaj (450 sq.ft)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition"
                      />
                      {/* Fast Size Chips */}
                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        {['35 Gaj', '40 Gaj', '50 Gaj', '60 Gaj', '75 Gaj', '100 Gaj'].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setForm({ ...form, sizeSqft: `${sz} (${Number(sz.split(' ')[0]) * 9} sq.ft)` })}
                            className="text-[10px] bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 px-1.5 py-0.5 rounded-md transition font-medium cursor-pointer"
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Parking Type */}
                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Select Vehicle Parking Type:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { id: 'Car + Bike Parking', icon: '🚗+🏍️', label: 'Car + Bike Parking' },
                        { id: 'Car Parking Only', icon: '🚗', label: 'Car Parking Only' },
                        { id: 'Bike Parking Only', icon: '🏍️', label: 'Bike Parking Only' },
                        { id: 'Covered Stilt Parking', icon: '🅿️', label: 'Covered Stilt Parking' },
                      ].map((pkg) => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setForm({ ...form, parking: pkg.id })}
                          className={`py-2.5 px-3 rounded-2xl border transition cursor-pointer text-center font-bold text-xs ${
                            form.parking === pkg.id
                              ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="block text-sm mb-0.5">{pkg.icon}</span>
                          <span>{pkg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Pricing & Owner / Associate */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                        3
                      </div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Pricing, Owner & Associate Info</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Step 3 of 4</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {form.listingType === 'rent' ? (
                      <>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Monthly Rent (₹)</label>
                          <input
                            type="number"
                            value={form.monthlyRent}
                            onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                            placeholder="e.g. 12000"
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-black text-orange-600 text-sm outline-none focus:border-orange-500 focus:bg-white transition"
                          />
                          {form.monthlyRent > 0 && (
                            <span className="text-[10px] text-orange-700 font-bold block mt-1">
                              ₹ {Number(form.monthlyRent).toLocaleString('en-IN')} / month
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Rental Commission Terms</label>
                          <input
                            type="text"
                            value={form.commission}
                            onChange={(e) => setForm({ ...form, commission: e.target.value })}
                            placeholder="e.g. 15 Days Rent"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Demand Sale Price (₹)</label>
                          <input
                            type="number"
                            value={form.salePrice}
                            onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                            placeholder="e.g. 2500000"
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-black text-orange-600 text-sm outline-none focus:border-orange-500 focus:bg-white transition"
                          />
                          {form.salePrice > 0 && (
                            <span className="text-[10px] text-orange-700 font-bold block mt-1">
                              {formatINR(form.salePrice)} (₹ {Number(form.salePrice).toLocaleString('en-IN')})
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Net Deal (₹)</label>
                          <input
                            type="number"
                            value={form.netProfit}
                            onChange={(e) => setForm({ ...form, netProfit: e.target.value })}
                            placeholder="e.g. 2350000"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                          />
                          {form.netProfit > 0 && (
                            <span className="text-[10px] text-slate-500 font-medium block mt-1">
                              Net: {formatINR(form.netProfit)}
                            </span>
                          )}
                        </div>
                      </>
                    )}

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Owner / Contact Person</label>
                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        placeholder="e.g. Mr. Rajesh Gupta"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Owner Contact Number</label>
                      <input
                        type="tel"
                        value={form.ownerContact}
                        onChange={(e) => setForm({ ...form, ownerContact: e.target.value })}
                        placeholder="e.g. 9891140379"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Key Amenities & USPs</label>
                      <input
                        type="text"
                        value={form.amenities}
                        onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                        placeholder="e.g. 24x7 Water, Modular Kitchen, Wardrobes"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-orange-500 focus:bg-white font-medium transition"
                      />
                    </div>
                  </div>

                  {/* 1-Click Interactive Amenities Cloud */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5">Tap to quick-add key features:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        '24x7 Water Supply',
                        'Modular Kitchen',
                        'Wardrobes in all Rooms',
                        'Branded Lift',
                        'Near Metro Station',
                        'Gated Society',
                        'Private Roof Rights',
                        '25ft Wide Road',
                        'Loan Available',
                        'RERA Verified',
                      ].map((item) => {
                        const isAdded = (form.amenities || '').includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              if (isAdded) {
                                const updated = form.amenities
                                  .split(', ')
                                  .filter((x) => x !== item)
                                  .join(', ');
                                setForm({ ...form, amenities: updated });
                              } else {
                                const current = form.amenities ? form.amenities.trim() : '';
                                setForm({
                                  ...form,
                                  amenities: current ? `${current}, ${item}` : item,
                                });
                              }
                            }}
                            className={`text-[10px] px-2 py-1 rounded-lg border transition font-bold cursor-pointer flex items-center gap-1 ${
                              isAdded
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{isAdded ? '✓' : '+'}</span>
                            <span>{item}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 4: Property Photos & Media Studio */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                        4
                      </div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Property Photos & Media Studio</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Step 4 of 4</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cover Dropzone */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">⭐ Main Cover Photo (Hero)</label>
                      {form.coverImage ? (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 group aspect-video shadow-2xs">
                          <img src={form.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black">
                            ⭐ Primary Cover
                          </div>
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <label className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold cursor-pointer hover:bg-slate-100 shadow-md">
                              Change Photo
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, coverImage: '' })}
                              className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer hover:bg-red-700 shadow-md"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-2xl cursor-pointer bg-slate-50/60 hover:bg-orange-50/30 transition aspect-video group">
                          <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition">
                            <i className="ri-image-add-line" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">Upload High-Res Cover Image</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP supported</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Gallery Dropzone */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          📸 Gallery Photos ({(form.images || []).length})
                        </label>
                        {(form.images || []).length > 0 && (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, images: [] })}
                            className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50/60 hover:bg-emerald-50/30 transition group">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg mb-1 group-hover:scale-110 transition">
                          <i className="ri-folder-image-line" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Add Room & Balcony Photos</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Select multiple images to attach</span>
                        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                      </label>

                      {/* Gallery preview thumbnails */}
                      {(form.images || []).length > 0 && (
                        <div className="grid grid-cols-4 gap-1.5 pt-1.5">
                          {form.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group shadow-2xs">
                              <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(idx)}
                                className="absolute top-1 right-1 h-5 w-5 rounded-md bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-xs"
                              >
                                <i className="ri-close-line" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Bottom Action Bar */}
                <div className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs">
                  <button
                    type="button"
                    onClick={() => { setForm(emptyFlatListing()); setEditingId(null); setView('list'); }}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Reset / Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-700 hover:via-orange-600 hover:to-amber-700 text-white text-xs font-black shadow-md shadow-orange-600/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {saving ? (
                      <>
                        <i className="ri-loader-4-line text-base font-black animate-spin" />
                        <span>{editingId ? 'Saving Audited Changes...' : 'Publishing to Catalog...'}</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-check-double-line text-base font-black" />
                        <span>{editingId ? 'Save Audited Changes' : 'Approve & Publish to Catalog'}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

            {/* ─── TAB 3: INVENTORY AUDIT / MY LISTINGS ─── */}
            {view === 'list' && (
              <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3.5 w-full">
                
                {/* 1. Page Heading Header with Live Search Bar & Action Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-black shrink-0 shadow-2xs">
                      <i className="ri-building-line" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Property Inventory & Audit Catalog</h2>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200/60">
                          {filteredListings.length} Units
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Manage audited properties • Excel Import & Live Management</p>
                    </div>
                  </div>

                  {/* Actions & Search */}
                  <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    {/* Upload Fresh Excel Button */}
                    <button
                      type="button"
                      onClick={() => setShowExcelModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                      title="Upload fresh Excel sheet to populate inventory"
                    >
                      <i className="ri-file-excel-2-fill text-sm" />
                      <span>Upload Fresh Excel</span>
                    </button>

                    {/* Prominent Live Search Bar */}
                    <div className="relative flex-1 min-w-[200px] sm:w-64 md:flex-initial">
                      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                      <input
                        type="text"
                        value={searchVal}
                        onChange={(e) => { setSearchVal(e.target.value); setCurrentPage(1); }}
                        placeholder="Search flat, location, owner..."
                        className="w-full rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-orange-500 transition font-medium shadow-2xs"
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
                </div>

                {/* 2. Filter Ribbon with Highlighted Budget Selector on Right Corner */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  {/* Left Side: Unit Types, Deal Types & Sort */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    {/* Unit Categories */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 flex-wrap">
                      {['all', 'HK', 'RK', 'Plot', 'Shop'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFilterCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                            filterCategory === cat
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {cat === 'all' ? 'All Units' : cat}
                        </button>
                      ))}
                    </div>

                    {/* Deal Types */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
                      {['all', 'buy', 'rent'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setFilterType(t); setFilterPrice('all'); }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                            filterType === t
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {t === 'all' ? 'All Deals' : t === 'buy' ? 'Sale' : 'Rent'}
                        </button>
                      ))}
                    </div>

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

                  {/* Right Side: Highlighted Budget Dropdown & View Mode Switcher */}
                  <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
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

                    {/* View Mode Toggle (Table / Card Grid) */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setInventoryViewMode('table')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          inventoryViewMode === 'table'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Dense Table View"
                      >
                        <i className="ri-table-line text-xs" />
                        <span>Table</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInventoryViewMode('grid')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          inventoryViewMode === 'grid'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Responsive Cards View"
                      >
                        <i className="ri-grid-fill text-xs" />
                        <span>Cards</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Empty State (Common for both Views) */}
                {paginatedListings.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 rounded-3xl border border-dashed border-slate-300">
                      <div className="h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl mb-3 shadow-2xs">
                        <i className="ri-folder-open-line" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800">Inventory is Clean & Empty</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                        No property listings match the current filters or database is empty. Upload your fresh Excel sheet to instantly populate the inventory with exact data.
                      </p>
                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={() => setShowExcelModal(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <i className="ri-file-excel-2-fill text-sm" />
                          <span>Upload Fresh Excel Sheet</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setView('add')}
                          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <i className="ri-add-line text-sm" />
                          <span>Add Listing Manually</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : inventoryViewMode === 'grid' ? (
                  /* ─── CARD GRID VIEW (100% RESPONSIVE) ─── */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
                    {paginatedListings.map((item, idx) => {
                      const isSold = item.dealStatus === 'sold';
                      const isRented = item.dealStatus === 'rented';
                      const isClosed = isSold || isRented;
                      const isForRent = item.listingType === 'rent';

                      return (
                        <div
                          key={item._id}
                          onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                          className={`rounded-2xl border transition-all duration-200 cursor-pointer p-3.5 flex flex-col justify-between relative group ${
                            isClosed
                              ? 'bg-slate-50/70 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-md'
                          }`}
                        >
                          {/* Card Header */}
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  #{(currentPage - 1) * PAGE_SIZE + idx + 1}
                                </span>
                                {item.configuration && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                                    {item.configuration}
                                  </span>
                                )}
                                {item.sizeSqft && (
                                  <span className="text-[11px] font-extrabold text-slate-700">
                                    {item.sizeSqft}
                                  </span>
                                )}
                              </div>

                              {/* Deal status switch */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => toggleDealStatus(item)}
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition ${
                                    isClosed
                                      ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  }`}
                                  title={isClosed ? 'Click to unfreeze & mark Active' : `Click to mark ${isForRent ? 'Rented' : 'Sold'}`}
                                >
                                  <span className={`h-2 w-2 rounded-full ${isClosed ? 'bg-rose-600' : 'bg-emerald-600 animate-pulse'}`} />
                                  <span>{isClosed ? (isSold ? 'SOLD' : 'RENTED') : 'ACTIVE'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Price & Listing Type */}
                            <div className="flex items-baseline justify-between gap-2 mt-1 mb-2">
                              <span className="text-base font-black text-emerald-700">
                                {priceLabel(item)}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                isForRent ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isForRent ? 'FOR RENT' : 'FOR SALE'}
                              </span>
                            </div>

                            {/* Location & Address */}
                            <div className="space-y-1 mb-2.5">
                              <div className="flex items-center gap-1 text-xs font-black text-slate-800">
                                <i className="ri-map-pin-2-fill text-orange-500 shrink-0 text-sm" />
                                <span className="truncate">{item.location || 'Location Not Specified'}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium line-clamp-2 pl-4">
                                {item.completeAddress || item.title || '—'}
                              </p>
                            </div>

                            {/* Badges / Specs row */}
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold mb-3">
                              {item.floor && (
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                  🏢 {item.floor}
                                </span>
                              )}
                              {item.lift && (
                                <span className={`px-2 py-0.5 rounded ${
                                  item.lift === 'YES' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  🛗 Lift: {item.lift}
                                </span>
                              )}
                              {item.parking && (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  🚗 {item.parking}
                                </span>
                              )}
                              {item.netProfit > 0 && (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                                  Net: {formatINR(item.netProfit)}
                                </span>
                              )}
                            </div>

                            {/* Owner Info & Contact Links */}
                            {item.ownerContact && (
                              <div
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="font-bold text-slate-700 truncate max-w-[120px]" title={item.ownerName || 'Owner'}>
                                  👤 {item.ownerName || 'Owner'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${String(item.ownerContact).replace(/[^\d+]/g, '')}`}
                                    className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center gap-1 transition"
                                  >
                                    <i className="ri-phone-fill text-xs" />
                                    <span>Call</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/91${String(item.ownerContact).replace(/[^\d]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1 transition"
                                  >
                                    <i className="ri-whatsapp-fill text-xs" />
                                    <span>WhatsApp</span>
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          <div
                            className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              disabled={isClosed}
                              onClick={() => { setPitchingProperty(item); setPitchClientName(''); setPitchClientPhone(''); }}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              <i className="ri-whatsapp-line" />
                              <span>Pitch</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                              title="Inspect Details"
                            >
                              <i className="ri-eye-line text-sm" />
                            </button>
                            <button
                              type="button"
                              disabled={isClosed}
                              onClick={() => startEdit(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition flex items-center justify-center cursor-pointer disabled:opacity-40"
                              title="Edit Property"
                            >
                              <i className="ri-edit-line text-sm" />
                            </button>
                            <button
                              type="button"
                              disabled={isClosed}
                              onClick={() => deleteListing(item._id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition flex items-center justify-center cursor-pointer disabled:opacity-40"
                              title="Delete Property"
                            >
                              <i className="ri-delete-bin-line text-sm" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ─── DENSE FULLY RESPONSIVE TABLE VIEW ─── */
                  <div className="w-full space-y-1">
                    {/* Mobile swipe helper */}
                    <div className="lg:hidden flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <i className="ri-drag-move-2-line text-orange-500 text-xs" />
                        Swipe horizontally to view all columns
                      </span>
                      <button
                        type="button"
                        onClick={() => setInventoryViewMode('grid')}
                        className="text-orange-600 font-bold hover:underline cursor-pointer"
                      >
                        Switch to Cards
                      </button>
                    </div>

                    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/90 max-h-[72vh] overflow-y-auto bg-white shadow-xs">
                      <table className="w-full text-left text-xs border-collapse select-none">
                        <thead className="sticky top-0 z-10 bg-slate-900 border-b-2 border-orange-500 text-[10px] uppercase font-black tracking-wider text-amber-300 shadow-xs">
                          <tr>
                            <th className="py-2.5 px-2 text-white border-r border-slate-700/60 text-center w-12 shrink-0">#</th>
                            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap w-28">SIZE / BHK</th>
                            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap w-28">FLOOR</th>
                            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap w-32">DEMAND PRICE</th>
                            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 min-w-[140px]">LOCATION</th>
                            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap w-36">CONTACT</th>
                            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap w-28">NET PRICE</th>
                            <th className="py-2.5 px-2.5 text-white border-r border-slate-700/60 whitespace-nowrap w-28">BY</th>
                            <th className="py-2.5 px-2.5 text-center text-white border-r border-slate-700/60 w-32 shrink-0">ACTIONS</th>
                            <th className="py-2.5 px-3 text-right text-white whitespace-nowrap w-36 shrink-0">DEAL SWITCH</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                          {paginatedListings.map((item, idx) => {
                            const isSold = item.dealStatus === 'sold';
                            const isRented = item.dealStatus === 'rented';
                            const isClosed = isSold || isRented;
                            const isForRent = item.listingType === 'rent';

                            return (
                              <tr
                                key={item._id}
                                onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                className={`border-b border-slate-200/70 transition-colors duration-100 cursor-pointer ${
                                  isClosed
                                    ? 'bg-slate-100/60 text-slate-400'
                                    : idx % 2 === 0
                                    ? 'bg-white hover:bg-amber-50/50'
                                    : 'bg-slate-50/40 hover:bg-amber-50/50'
                                }`}
                                title="Click row to inspect complete property details (Address, Lift, Parking, Notes in View)"
                              >
                                {/* 1. S.NO */}
                                <td className="py-2 px-2 text-center font-extrabold text-slate-400 font-mono text-[10px] border-r border-slate-200/70">
                                  {(currentPage - 1) * PAGE_SIZE + idx + 1}
                                </td>

                                {/* 2. SIZE */}
                                <td className={`py-2 px-2.5 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                                  <div className="flex items-center gap-1.5">
                                    {item.configuration && (
                                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-black uppercase leading-none">
                                        {item.configuration}
                                      </span>
                                    )}
                                    <span className="font-extrabold text-slate-800 text-[11px]">{item.sizeSqft || (item.configuration ? '' : '—')}</span>
                                  </div>
                                </td>

                                {/* 3. FLOOR */}
                                <td className={`py-2 px-2.5 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                                  <span className="font-semibold text-slate-700 text-[11px] block truncate max-w-[130px]" title={item.floor || '—'}>
                                    {item.floor || '—'}
                                  </span>
                                </td>

                                {/* 4. PRICE */}
                                <td className={`py-2 px-2.5 font-bold border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-50/90 px-1.5 py-0.5 rounded border border-emerald-200/70">
                                      {priceLabel(item)}
                                    </span>
                                    {item.listingType === 'rent' && (
                                      <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-1 rounded">Rent</span>
                                    )}
                                  </div>
                                </td>

                                {/* 5. LOCATION */}
                                <td className={`py-2 px-2.5 border-r border-slate-200/70 ${isClosed ? 'opacity-50' : ''}`}>
                                  <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                                    {item.location && <i className="ri-map-pin-2-fill text-orange-500 text-xs shrink-0" />}
                                    <span className="truncate max-w-[160px]" title={item.location || '—'}>{item.location || '—'}</span>
                                  </div>
                                </td>

                                {/* 6. CONTACT */}
                                <td className={`py-2 px-2.5 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                                  {item.ownerContact ? (
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <a
                                        href={`tel:${String(item.ownerContact).replace(/[^\d+]/g, '')}`}
                                        className="text-[11px] font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                                        title="Click to Call"
                                      >
                                        <i className="ri-phone-fill text-slate-400 text-xs" />
                                        <span>{item.ownerContact}</span>
                                      </a>
                                      <a
                                        href={`https://wa.me/91${String(item.ownerContact).replace(/[^\d]/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700"
                                        title="Open WhatsApp"
                                      >
                                        <i className="ri-whatsapp-fill text-xs" />
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] font-mono">—</span>
                                  )}
                                </td>

                                {/* 7. NET PRICE */}
                                <td className={`py-2 px-2.5 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                                  <span className={`text-[11px] font-bold ${item.netProfit > 0 ? 'text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70' : 'text-slate-400'}`}>
                                    {item.netProfit > 0 ? formatINR(item.netProfit) : '—'}
                                  </span>
                                </td>

                                {/* 8. BY */}
                                <td className={`py-2 px-2 border-r border-slate-200/70 whitespace-nowrap ${isClosed ? 'opacity-50' : ''}`}>
                                  <span className="font-bold text-slate-700 text-[11px] block truncate max-w-[90px]" title={item.ownerName || '—'}>
                                    {item.ownerName || '—'}
                                  </span>
                                </td>

                                {/* 9. ACTIONS */}
                                <td className="py-2 px-2 text-center border-r border-slate-200/70 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => { setViewingProperty(item); setActivePhotoIdx(0); }}
                                      className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center justify-center cursor-pointer transition"
                                      title="View Complete Details (Address, Specs, Lift, Parking, Notes)"
                                    >
                                      <i className="ri-eye-line text-xs" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isClosed}
                                      onClick={() => { setPitchingProperty(item); setPitchClientName(''); setPitchClientPhone(''); }}
                                      className="px-1.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer disabled:opacity-40 transition"
                                      title="WhatsApp Pitch"
                                    >
                                      <i className="ri-whatsapp-fill text-xs" />
                                      <span className="hidden xl:inline">Pitch</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isClosed}
                                      onClick={() => startEdit(item)}
                                      className="p-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[11px] font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 transition"
                                      title="Edit Listing"
                                    >
                                      <i className="ri-edit-line text-xs" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isClosed}
                                      onClick={() => deleteListing(item._id)}
                                      className="p-1 rounded-md bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 text-[11px] font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 transition"
                                      title="Delete Listing"
                                    >
                                      <i className="ri-delete-bin-line text-xs" />
                                    </button>
                                  </div>
                                </td>

                                {/* 10. DEAL STATUS SWITCH (Professional Toggle) */}
                                <td className="py-2 px-3 text-right pointer-events-auto whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end">
                                    <button
                                      type="button"
                                      onClick={() => toggleDealStatus(item)}
                                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all duration-150 cursor-pointer shadow-2xs font-mono select-none ${
                                        isClosed
                                          ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                      }`}
                                      title={isClosed ? 'Deal is closed. Click to unfreeze & mark as Active (Available)' : `Click to mark as ${isForRent ? 'Rented' : 'Sold'}`}
                                    >
                                      {/* Pixel-perfect toggle track */}
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
                  </div>
                )}

                {/* 4. Responsive Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 font-medium">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredListings.length)} of {filteredListings.length} units (Page {currentPage} of {totalPages})
                    </span>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer shadow-2xs transition"
                      >
                        <i className="ri-arrow-left-s-line" /> Prev
                      </button>
                      <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-black text-xs font-mono">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer shadow-2xs transition"
                      >
                        Next <i className="ri-arrow-right-s-line" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: EXCEL IMPORT & SYNC ─── */}
            {view === 'excel' && (
              <div className="w-full space-y-3">
                <AdminExcelView />
              </div>
            )}

            {/* ─── TAB 4: CLIENT INQUIRIES ─── */}
            {view === 'leads' && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 w-full">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Client, Buyer & Investment Inquiry Desk</h2>
                    <p className="text-[11px] text-slate-400">Manage buyer requirements, investor inquiries, site visits, and instant WhatsApp connect</p>
                  </div>
                </div>
                <AssignedLeadsPanel />
              </div>
            )}

            {/* ─── TAB 5: RERA & DOCS CHECKLIST ─── */}
            {view === 'verification' && (
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 w-full max-w-4xl mx-auto">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="h-8 w-8 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-base font-black">
                    <i className="ri-file-shield-line" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">RERA & Document Compliance Checklist</h2>
                    <p className="text-[11px] text-slate-400">Mandatory verification steps before clearing flats for client visits</p>
                  </div>
                </div>

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
            )}

            {/* ─── TAB 6: COMMISSION & EMI CALCULATOR ─── */}
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
                      <p className="text-[10px] text-slate-400">Commission breakdown</p>
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
                        <span className="font-bold text-slate-600">Square Meters (Sq.M):</span>
                        <span className="font-bold text-xs text-slate-900">{gajConversion.sqmeter} sq.m</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-600">Square Yards (Sq.Yd):</span>
                        <span className="font-bold text-xs text-slate-900">{gajConversion.sqyard} sq.yd</span>
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
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Baba Broker Operations Desk · v2.4
            </span>
            <span>Direct Support: <a href="mailto:support@bababroker.com" className="text-[#ea580c] hover:underline">support@bababroker.com</a></span>
            <span className="hidden sm:inline">© 2026 Baba Broker. All rights reserved.</span>
          </footer>

        </div>

      </div>

      {/* ─── MODAL: WHATSAPP PITCH STUDIO ─── */}
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
                          setStatus('✓ Address copied to clipboard!');
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

      {/* ─── MODAL: EXCEL UPLOAD DIALOG ─── */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 font-['Inter',sans-serif]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg shadow-2xs">
                  <i className="ri-file-excel-2-line" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Upload Property Inventory (.xlsx / .csv)</h3>
                  <p className="text-[11px] text-slate-400">Import bulk flat listings directly into database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowExcelModal(false); setExcelUploadStatus(null); }}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-950 block">Exact Excel Template Supported</span>
                <span className="text-[10.5px] text-emerald-700 block">
                  Columns: S.NO, SIZE, FLOOR, PRICE, LOCATION, LIFT, PARKING, ADDRESS, CONTACT, NET PRICE, BY, NOTES
                </span>
              </div>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold shrink-0 transition flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <i className="ri-download-2-line text-xs" />
                <span>Sample CSV</span>
              </button>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingExcel(true); }}
              onDragLeave={() => setIsDraggingExcel(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingExcel(false);
                const file = e.dataTransfer?.files?.[0];
                if (file) handleExcelUpload(file);
              }}
              onClick={() => excelFileRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                isDraggingExcel
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20'
              }`}
            >
              <input
                ref={excelFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleExcelUpload(file);
                }}
                className="hidden"
              />

              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-2.5 shadow-2xs">
                {uploadingExcel ? (
                  <i className="ri-loader-4-line animate-spin" />
                ) : (
                  <i className="ri-upload-cloud-2-line" />
                )}
              </div>

              <h4 className="text-xs font-black text-slate-800">
                {uploadingExcel ? 'Parsing & Uploading Excel...' : 'Click to Browse or Drag & Drop Excel file'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
              </p>
            </div>

            {/* Status Feedback Alert */}
            {excelUploadStatus && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2 ${
                  excelUploadStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <i
                  className={`text-base shrink-0 ${
                    excelUploadStatus.type === 'success' ? 'ri-checkbox-circle-fill text-emerald-600' : 'ri-error-warning-fill text-red-500'
                  }`}
                />
                <span className="leading-snug">{excelUploadStatus.msg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowExcelModal(false); setExcelUploadStatus(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {excelUploadStatus?.type === 'success' ? 'Done & Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
