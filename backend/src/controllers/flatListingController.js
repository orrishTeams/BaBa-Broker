import mongoose from 'mongoose';
import FlatListing from '../models/FlatListing.js';

const validListing = (input) => {
  if (!input) return false;
  const listingType = input.listingType || 'buy';
  return ['rent', 'buy'].includes(listingType);
};

const listingData = (input) => ({
  listingType: input.listingType || 'buy',
  title: input.title?.trim() || `${input.configuration || '2 BHK'} at ${input.location || 'Delhi NCR'}`.trim(),
  location: String(input.location || 'Delhi NCR').trim(),
  configuration: String(input.configuration || '2 BHK').trim(),
  sizeSqft: String(input.sizeSqft || '50 Gaj (450 sq.ft)').trim(),
  floor: String(input.floor || 'Ground Floor (Front Side)').trim(),
  totalFloors: String(input.totalFloors || '4').trim(),
  lift: String(input.lift || '').toUpperCase() === 'NO' ? 'NO' : 'YES',
  parking: String(input.parking || 'Car + Bike Parking').trim(),
  possessionStatus: String(input.possessionStatus || 'Ready to Move').trim(),
  constructionYear: String(input.constructionYear || '2023').trim(),
  facing: String(input.facing || 'East').trim(),
  reraId: String(input.reraId || 'RERA Not Applicable').trim(),
  amenities: String(input.amenities || '24x7 Security, Power Backup, Lift(s)').trim(),
  description: String(input.description || `${input.configuration || '2 BHK'} located at ${input.location || 'Delhi NCR'}`).trim(),
  coverImage: input.coverImage || '',
  images: Array.isArray(input.images) ? input.images : [],
  videoUrl: String(input.videoUrl || '').trim(),
  monthlyRent: Number(input.monthlyRent) || 0,
  securityDeposit: Number(input.securityDeposit) || 0,
  maintenanceCharge: Number(input.maintenanceCharge) || 0,
  availableFrom: String(input.availableFrom || 'Immediate').trim(),
  salePrice: Number(input.salePrice) || 0,
  pricePerSqft: Number(input.pricePerSqft) || 0,
  priceNegotiable: input.priceNegotiable !== false,

  ownerName: String(input.ownerName || '').trim(),
  ownerContact: String(input.ownerContact || '').trim(),
  propertyCategory: String(input.propertyCategory || 'Flat').trim(),
  commercialSubType: String(input.commercialSubType || '').trim(),
  furnishingStatus: String(input.furnishingStatus || 'Semi-Furnished').trim(),
  completeAddress: String(input.completeAddress || '').trim(),
  latitude: String(input.latitude || '').trim(),
  longitude: String(input.longitude || '').trim(),
  commission: String(input.commission || 'YES').trim(),
  specialInstructions: String(input.specialInstructions || '').trim(),
  netProfit: Number(input.netProfit) || 0,

  dealStatus: ['available', 'rented', 'sold'].includes(input.dealStatus) ? input.dealStatus : 'available',
});

// Salesman & Employee -> active inventory so they can pitch and manage
// Admin -> everything, for full audit trail
export const getFlatListings = async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { isActive: true };
  const listings = await FlatListing.find(filter)
    .populate('submittedBy', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json(listings);
};

export const createFlatListing = async (req, res) => {
  const input = req.body;
  if (!validListing(input)) {
    return res.status(400).json({ error: 'Valid listing type and price (sale price or monthly rent) are required.' });
  }
  const listing = await FlatListing.create({ ...listingData(input), submittedBy: req.user.id });
  res.status(201).json(listing);
};

export const updateFlatListing = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const existing = await FlatListing.findById(id);
  if (!existing) return res.status(404).json({ error: 'Listing not found.' });
  if (!['admin', 'employee'].includes(req.user.role) && !existing.submittedBy?.equals(req.user.id)) {
    return res.status(403).json({ error: 'You can only edit your own listings.' });
  }

  const input = req.body || {};
  const updates = {
    ...(input.title !== undefined && { title: String(input.title).trim() }),
    ...(input.location !== undefined && { location: String(input.location).trim() }),
    ...(input.configuration !== undefined && { configuration: String(input.configuration).trim() }),
    ...(input.sizeSqft !== undefined && { sizeSqft: String(input.sizeSqft).trim() }),
    ...(input.floor !== undefined && { floor: String(input.floor).trim() }),
    ...(input.lift !== undefined && { lift: String(input.lift).toUpperCase() === 'NO' ? 'NO' : 'YES' }),
    ...(input.parking !== undefined && { parking: String(input.parking).trim() }),
    ...(input.salePrice !== undefined && { salePrice: Number(input.salePrice) || 0 }),
    ...(input.monthlyRent !== undefined && { monthlyRent: Number(input.monthlyRent) || 0 }),
    ...(input.netProfit !== undefined && { netProfit: Number(input.netProfit) || 0 }),
    ...(input.ownerName !== undefined && { ownerName: String(input.ownerName).trim() }),
    ...(input.ownerContact !== undefined && { ownerContact: String(input.ownerContact).trim() }),
    ...(input.completeAddress !== undefined && { completeAddress: String(input.completeAddress).trim() }),
    ...(input.description !== undefined && { description: String(input.description).trim() }),
    ...(input.specialInstructions !== undefined && { specialInstructions: String(input.specialInstructions).trim() }),
    ...(input.dealStatus !== undefined && { dealStatus: input.dealStatus }),
    ...(input.listingType !== undefined && { listingType: input.listingType }),
    ...(input.isVerified !== undefined && { isVerified: Boolean(input.isVerified) }),
  };

  const listing = await FlatListing.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  res.status(200).json(listing);
};

export const deactivateFlatListing = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const existing = await FlatListing.findById(id);
  if (!existing) return res.status(404).json({ error: 'Listing not found.' });
  if (!['admin', 'employee'].includes(req.user.role) && !existing.submittedBy?.equals(req.user.id)) {
    return res.status(403).json({ error: 'You can only update your own listings.' });
  }

  const updates = {};
  if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
  if (req.body?.dealStatus !== undefined && ['available', 'rented', 'sold'].includes(req.body.dealStatus)) {
    updates.dealStatus = req.body.dealStatus;
  }
  if (req.body?.isVerified !== undefined) updates.isVerified = Boolean(req.body.isVerified);

  const listing = await FlatListing.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  res.status(200).json(listing);
};

export const deleteFlatListing = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const existing = await FlatListing.findById(id);
  if (!existing) return res.status(404).json({ error: 'Listing not found.' });
  if (!['admin', 'employee'].includes(req.user.role) && !existing.submittedBy?.equals(req.user.id)) {
    return res.status(403).json({ error: 'You can only delete your own listings.' });
  }

  await FlatListing.findByIdAndDelete(id);
  res.status(200).json({ message: 'Listing deleted successfully.' });
};

export const cleanAllFlatListings = async (req, res) => {
  const filter = req.user.role === 'salesman' ? { submittedBy: req.user.id } : {};
  const result = await FlatListing.deleteMany(filter);
  res.status(200).json({
    message: 'Property inventory cleaned successfully.',
    deletedCount: result.deletedCount,
  });
};

