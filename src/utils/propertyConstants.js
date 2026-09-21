/**
 * Shared Property Constants, Types, Helpers & Generators
 * Used across SalesmanDashboard, EmployeeDashboard, Property Cards, Tables & Drawers.
 */

export const QUICK_AMENITIES = [
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

export const STANDARD_FLOORS = [
  'Ground Floor (Front Side) [G-FS]',
  'Ground Floor (Back Side) [G-BS]',
  'Upper Ground (Front Side) [UG-FS]',
  '1st Floor (Front Side) [1ST-FS]',
  '2nd Floor (Back Side) [2ND-BS]',
  '3rd Floor (Front Side) [3RD-FS]',
  'Top Floor with Roof Rights [T-BS]',
  'Basement Floor [BSMT]',
  'Duplex Floor',
  'Independent House / Villa',
  'Ground Floor (Main Road Front)',
  'Ground Floor (Inside Market / Plaza)',
  'Upper Ground (Commercial)',
  '1st Floor (Commercial Front)',
  '2nd Floor (Office Suite)',
  '3rd Floor / Corporate Tower',
  'Basement (Commercial / Storage)',
  'Full Standalone Commercial Building',
];

export const emptyFlatListing = () => ({
  ownerName: '',
  ownerContact: '',
  propertyCategory: 'Flat',
  commercialSubType: 'Office',
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
  reraId: 'RERA-VERIFIED-2026',
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
  isVerified: true,
});

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

export const formatINR = (val) => {
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

export const priceLabel = (listing) => {
  if (!listing) return '—';
  return listing.listingType === 'rent' && listing.monthlyRent
    ? `${formatINR(listing.monthlyRent)}/mo`
    : formatINR(listing.salePrice);
};

export const buildWhatsAppPitch = (property, clientName = '', senderName = 'Baba Broker Advisory Team') => {
  if (!property) return '';
  const isRent = property.listingType === 'rent';
  const priceDisplay = isRent
    ? `${formatINR(property.monthlyRent)} / month`
    : `${formatINR(property.salePrice)} ${property.priceNegotiable ? '(Negotiable)' : ''}`;

  const greeting = clientName?.trim()
    ? `Namaste *${clientName.trim()}* Ji 🙏`
    : `Namaste Sir/Ma'am 🙏`;

  const videoText = property.videoUrl?.trim()
    ? `\n\n🎥 *Video Walkthrough (YouTube / Video Tour):*\n${property.videoUrl.trim()}`
    : '';

  return (
`${greeting},

Here are the verified details of the property you inquired about on Baba Broker:

🏡 *${property.title || `${property.configuration || 'Property'} in ${property.location || 'Delhi NCR'}`}*

📍 *Location:* ${property.location || 'Delhi NCR'}
📐 *Size / Area:* ${property.sizeSqft || 'Standard Area'}
🛏️ *Configuration:* ${property.configuration || '2 BHK'}
🏢 *Floor Position:* ${property.floor || 'Standard Floor'}
💰 *${isRent ? 'Expected Monthly Rent' : 'Demand Price'}:* *${priceDisplay}*
🛋️ *Furnishing:* ${property.furnishingStatus || 'Semi-Furnished'}
🛗 *Lift Availability:* ${property.lift || 'YES'}
🚗 *Parking:* ${property.parking || 'Car & Bike Parking'}
🔑 *Possession:* ${property.possessionStatus || 'Ready to Move'}

✨ *Key Amenities:*
${property.amenities || '24x7 Water Supply, Gated Society, Modular Kitchen'}${videoText}

📲 *Book a Free Guided Site Visit Today!*
Direct Executive: *${senderName}*
📞 Baba Broker Official Real Estate Desk
📍 Rama Park Road, Mohan Garden, Uttam Nagar, New Delhi`
  );
};
