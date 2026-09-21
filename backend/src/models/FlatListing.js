import mongoose from 'mongoose';

const flatListingSchema = new mongoose.Schema(
  {
    listingType: { type: String, enum: ['rent', 'buy'], default: 'buy' },
    title: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    configuration: { type: String, trim: true, default: '' },
    sizeSqft: { type: String, trim: true, default: '' },
    floor: { type: String, trim: true, default: '' },
    totalFloors: { type: String, trim: true, default: '' },
    lift: { type: String, default: '' },
    parking: { type: String, trim: true, default: '' },
    possessionStatus: { type: String, trim: true, default: '' },
    constructionYear: { type: String, trim: true, default: '' },
    facing: { type: String, trim: true, default: '' },
    reraId: { type: String, trim: true, default: '' },
    amenities: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    coverImage: { type: String, default: '' },
    images: [{ type: String }],
    videoUrl: { type: String, default: '' },

    // Rent-specific
    monthlyRent: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    maintenanceCharge: { type: Number, default: 0 },
    availableFrom: { type: String, default: '' },

    // Buy-specific
    salePrice: { type: Number, default: 0 },
    pricePerSqft: { type: Number, default: 0 },
    priceNegotiable: { type: Boolean, default: false },

    ownerName: { type: String, trim: true, default: '' },
    ownerContact: { type: String, trim: true, default: '' },
    propertyCategory: { type: String, default: 'Flat' },
    commercialSubType: { type: String, default: '' },
    furnishingStatus: { type: String, default: '' },
    completeAddress: { type: String, trim: true, default: '' },
    latitude: { type: String, trim: true, default: '' },
    longitude: { type: String, trim: true, default: '' },
    commission: { type: String, trim: true, default: '' },
    specialInstructions: { type: String, trim: true, default: '' },
    netProfit: { type: Number, default: 0 },

    dealStatus: { type: String, enum: ['available', 'rented', 'sold'], default: 'available' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.FlatListing || mongoose.model('FlatListing', flatListingSchema);
