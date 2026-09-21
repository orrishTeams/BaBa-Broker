import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getAuth, clearAuth } from '../store/auth';
import { useAppDispatch } from '../store';
import { logoutAction } from '../store/authSlice';
import {
  emptyFlatListing,
  formatINR,
  priceLabel,
} from '../utils/propertyConstants';

/**
 * Custom Hook for Salesman Dashboard State & Business Logic
 */
export function useSalesmanDashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const dispatch = useAppDispatch();
  const salesmanName = auth?.name || 'Sales Executive';

  // Navigation & Duty State
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
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      const loc = form.location?.trim() || form.completeAddress?.trim() || 'Delhi NCR';
      const conf = form.configuration?.trim() || '2 BHK';
      const payload = {
        ...form,
        title: form.title?.trim() || `${conf} in ${loc}`.trim(),
        description: form.description?.trim() || `${conf} property located at ${loc}`.trim(),
        location: loc,
        configuration: conf,
        salePrice: Number(form.salePrice) || 0,
        monthlyRent: Number(form.monthlyRent) || 0,
        netProfit: Number(form.netProfit) || 0,
        securityDeposit: Number(form.securityDeposit) || 0,
        maintenanceCharge: Number(form.maintenanceCharge) || 0,
        isVerified: true,
        addedByName: salesmanName || auth?.user?.name || 'Sales Executive',
        addedByRole: 'salesman',
        addedByPhone: auth?.user?.phone || '',
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
      console.error('Failed to save listing:', err);
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

  const toggleDealStatus = async (itemOrId) => {
    let item = itemOrId;
    if (typeof itemOrId === 'string') {
      item = listings.find((l) => l._id === itemOrId);
    }
    if (!item || !item._id) return;
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

  return {
    salesmanName,
    view,
    setView,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    dutyStatus,
    setDutyStatus,
    listings,
    loading,
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
  };
}
