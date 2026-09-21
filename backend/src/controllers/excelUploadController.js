import XLSX from 'xlsx';
import FlatListing from '../models/FlatListing.js';

// Clean string and normalize keys for fuzzy header mapping
function normalizeKey(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Clean number parser (handles "20L", "15.5L", "1.5 Cr", "₹ 45,00,000", "45 Lakhs", "35k", etc.)
function parseCleanNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim().toLowerCase();
  if (!str) return 0;

  // Handle Cr / Crore
  const crMatch = str.match(/([\d.]+)\s*(cr|crore|crores)/);
  if (crMatch) return Math.round(parseFloat(crMatch[1]) * 10000000);

  // Handle Lakh / Lac / L (e.g. "20L", "15.5L", "18.5 L", "22L", "20 lac")
  const lakhMatch = str.match(/([\d.]+)\s*(lakh|lakhs|lac|lacs|l\b)/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  // Handle K / Thousand
  const kMatch = str.match(/([\d.]+)\s*(k|thousand)/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  // Clean pure digits with decimal points
  const cleanStr = str.replace(/[^\d.]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
}

// Common header alias mappings
const HEADER_ALIASES = {
  sno: ['sno', 'srno', 's.no', 'sr.no', 'serialno', 'serialnumber', 'id', 'no', 'seq', 'index'],
  listingType: ['listingtype', 'type', 'propertytype', 'listing', 'for', 'purpose', 'category', 'status', 'adtype', 'dealtype'],
  title: ['title', 'propertytitle', 'propertyname', 'projectname', 'project', 'name', 'heading', 'property', 'flatname'],
  location: ['location', 'colony', 'locality', 'area', 'city', 'place', 'landmark', 'sector', 'society'],
  configuration: ['configuration', 'bhk', 'config', 'bedrooms', 'bedroom', 'room', 'rooms', 'flatsize', 'units', 'unittype'],
  sizeSqft: ['size', 'gaj', 'sqgaj', 'sizesqft', 'area', 'sqft', 'squarefeet', 'superarea', 'carpetarea', 'builtuparea', 'areasqft', 'sqfeet', 'plotsize', 'plot', 'dimension'],
  floor: ['floor', 'floorno', 'propertyfloor', 'flatfloor', 'floornumber', 'floorposition', 'flr'],
  totalFloors: ['totalfloors', 'totalfloor', 'floors', 'buildingfloors', 'maxfloors', 'numberoffloors'],
  lift: ['lift', 'elevator', 'liftavailable', 'is_lift'],
  parking: ['parking', 'carparking', 'bikeparking', 'parkingtype', 'parkingspace'],
  possessionStatus: ['possessionstatus', 'possession', 'readytomove', 'availability', 'possessiondate'],
  constructionYear: ['constructionyear', 'yearbuilt', 'built', 'age', 'ageofproperty', 'constructionage'],
  facing: ['facing', 'direction', 'entryfacing', 'unitfacing'],
  reraId: ['reraid', 'rera', 'reranumber', 'rerano'],
  amenities: ['amenities', 'features', 'facilities', 'highlights', 'societyamenities'],
  description: ['description', 'desc', 'details', 'about', 'overview', 'remarks', 'notes', 'propertydescription', 'summary'],
  coverImage: ['coverimage', 'image', 'photo', 'picture', 'coverphoto', 'mainimage', 'thumbnail', 'imgurl', 'imageurl'],
  images: ['images', 'gallery', 'photos', 'pictures', 'moreimages', 'galleryimages'],
  videoUrl: ['videourl', 'video', 'youtube', 'tourvideo'],
  monthlyRent: ['monthlyrent', 'rent', 'rentprice', 'rentamount', 'permonthrent', 'lease', 'expectedrent'],
  securityDeposit: ['securitydeposit', 'deposit', 'advance', 'securityamount'],
  maintenanceCharge: ['maintenancecharge', 'maintenance', 'maintenancecharges', 'maint'],
  availableFrom: ['availablefrom', 'availabledate', 'moveindate', 'fromdate'],
  salePrice: ['price', 'saleprice', 'amount', 'cost', 'expectedprice', 'totalprice', 'rate', 'value', 'demandprice', 'demand', 'demand_price'],
  pricePerSqft: ['pricepersqft', 'persqft', 'ratepersqft', 'sqftrate'],
  priceNegotiable: ['pricenegotiable', 'negotiable', 'isnegotiable', 'neg'],
  ownerName: ['by', 'agent', 'submittedby', 'listedby', 'staff', 'owner', 'ownername', 'contactperson', 'clientname', 'seller', 'landlord', 'agentname', 'sourcedby', 'broker', 'associate', 'sourcedassociate'],
  ownerContact: ['contact', 'contactno', 'phone', 'mobile', 'cell', 'ownermobile', 'contactnumber', 'ownerphone', 'phone_number', 'ownercontact', 'mob', 'phoneno', 'mobile_no'],
  propertyCategory: ['propertycategory', 'category', 'proptype'],
  furnishingStatus: ['furnishingstatus', 'furnishing', 'furnished'],
  completeAddress: ['address', 'completeaddress', 'fulladdress', 'full_address', 'addressdetails', 'landmark', 'addresslandmark', 'colonyaddress'],
  dealStatus: ['dealstatus', 'deal_status', 'availability_status'],
  commission: ['commission', 'brokerage'],
  specialInstructions: ['additionalcontactnotes', 'additionalcontact', 'notes', 'remarks', 'specialinstructions', 'instructions', 'additionalnotes', 'othernotes', 'note', 'additionalcontact/notes', 'additional_contact_notes'],
  netProfit: ['netprice', 'net_price', 'finalprice', 'lastprice', 'minimumprice', 'netprofit', 'profit', 'netamount', 'netrent', 'net'],
};

function getRowValue(rowObj, canonicalField) {
  const aliases = HEADER_ALIASES[canonicalField] || [canonicalField.toLowerCase()];
  for (const key of Object.keys(rowObj)) {
    const norm = normalizeKey(key);
    if (aliases.includes(norm)) {
      const val = rowObj[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }
  return '';
}

function expandFloorName(rawFloor) {
  const f = String(rawFloor || '').trim().toUpperCase();
  if (!f) return '';
  if (f === 'G-FS' || f === 'GFS' || f === 'G FS' || f === 'G (FS)') return 'Ground Floor (Front Side)';
  if (f === 'G-BS' || f === 'GBS' || f === 'G BS' || f === 'G (BS)') return 'Ground Floor (Back Side)';
  if (f === 'UG-FS' || f === 'UG FS' || f === 'UGFS' || f === 'UG (FS)') return 'Upper Ground (Front Side)';
  if (f === 'UG-BS' || f === 'UG BS' || f === 'UGBS' || f === 'UG (BS)') return 'Upper Ground (Back Side)';
  if (f === '1ST-FS' || f === '1ST FS' || f === '1STFS' || f === '1-FS' || f === '1FS') return '1st Floor (Front Side)';
  if (f === '1ST-BS' || f === '1ST BS' || f === '1STBS' || f === '1-BS' || f === '1BS') return '1st Floor (Back Side)';
  if (f === '2ND-FS' || f === '2ND FS' || f === '2NDFS' || f === '2-FS' || f === '2FS') return '2nd Floor (Front Side)';
  if (f === '2ND-BS' || f === '2ND BS' || f === '2NDBS' || f === '2-BS' || f === '2BS') return '2nd Floor (Back Side)';
  if (f === '3RD-FS' || f === '3RD FS' || f === '3RDF' || f === '3-FS' || f === '3FS') return '3rd Floor (Front Side)';
  if (f === '3RD-BS' || f === '3RD BS' || f === '3RDBS' || f === '3-BS' || f === '3BS') return '3rd Floor (Back Side)';
  if (f === '4TH-FS' || f === '4TH FS' || f === '4THFS' || f === '4-FS' || f === '4FS') return '4th Floor (Front Side)';
  if (f === '4TH-BS' || f === '4TH BS' || f === '4THBS' || f === '4-BS' || f === '4BS') return '4th Floor (Back Side)';
  if (f === 'T-FS' || f === 'TFS' || f === 'TOP-FS' || f === 'TOP FS') return 'Top Floor (Front Side)';
  if (f === 'T-BS' || f === 'TBS' || f === 'TOP-BS' || f === 'TOP BS') return 'Top Floor (Back Side)';
  if (f === 'G' || f === 'GROUND') return 'Ground Floor';
  if (f === 'UG' || f === 'UPPER GROUND') return 'Upper Ground';
  if (f === '1ST' || f === '1' || f === 'FIRST') return '1st Floor';
  if (f === '2ND' || f === '2' || f === 'SECOND') return '2nd Floor';
  if (f === '3RD' || f === '3' || f === 'THIRD') return '3rd Floor';
  if (f === '4TH' || f === '4' || f === 'FOURTH') return '4th Floor';
  if (f === 'TOP' || f === 'T') return 'Top Floor';
  if (f === 'JAD SE' || f === 'JADSE' || f === 'JAD-SE' || f === 'JAD') return 'Jad se (Independent Building)';
  return String(rawFloor).trim();
}

function processRowToFlatListing(rowObj, rowIndex, userId) {
  // Check if row is completely empty (or only S.NO)
  const nonEmpties = Object.keys(rowObj).filter((k) => {
    const norm = normalizeKey(k);
    if (norm === 'sno' || norm === 'srno' || norm === 'id') return false;
    const v = rowObj[k];
    return v !== undefined && v !== null && String(v).trim() !== '';
  });
  if (nonEmpties.length === 0) return null; // Skip empty row

  const rawType = String(getRowValue(rowObj, 'listingType') || '').trim().toLowerCase();
  const rawSalePrice = parseCleanNumber(getRowValue(rowObj, 'salePrice'));
  const rawRent = parseCleanNumber(getRowValue(rowObj, 'monthlyRent'));
  const rawNetPrice = parseCleanNumber(getRowValue(rowObj, 'netProfit'));

  // Detect listing type
  let listingType = 'buy';
  if (rawType.includes('rent') || rawType.includes('lease')) {
    listingType = 'rent';
  } else if (rawType.includes('buy') || rawType.includes('sale') || rawType.includes('sell')) {
    listingType = 'buy';
  } else if (rawRent > 0 && rawSalePrice <= 0) {
    listingType = 'rent';
  }

  // Location & Address resolution
  const location = String(getRowValue(rowObj, 'location') || '').trim();
  const completeAddress = String(getRowValue(rowObj, 'completeAddress') || location).trim();

  // Size & Configuration resolution
  const rawSize = String(getRowValue(rowObj, 'sizeSqft') || '').trim();
  let sizeSqft = rawSize;
  let configuration = String(getRowValue(rowObj, 'configuration') || '').trim();
  const rawTitle = String(getRowValue(rowObj, 'title') || '').trim();
  const rawDesc = String(getRowValue(rowObj, 'description') || '').trim();

  // If size contains GAJ (e.g. 50GAJ, 40GAJ, 1RK 30GAJ)
  if (rawSize) {
    const rkMatch = rawSize.match(/\b([1-9]\s*rk)\b/i);
    const bhkMatch = rawSize.match(/\b([1-9]\s*bhk)\b/i);
    const gajMatch = rawSize.match(/(\d+)\s*(gaj|sqgaj|sqyd)/i);

    if (rkMatch && !configuration) {
      configuration = rkMatch[1].toUpperCase();
    } else if (bhkMatch && !configuration) {
      configuration = bhkMatch[1].toUpperCase();
    }

    if (gajMatch) {
      const gajNum = parseInt(gajMatch[1], 10);
      const sqftCalc = gajNum * 9;
      sizeSqft = `${gajNum} Gaj (${sqftCalc} sq.ft)`;
      if (!configuration) {
        if (gajNum <= 35) configuration = '1 RK';
        else if (gajNum <= 45) configuration = '1 BHK';
        else if (gajNum <= 65) configuration = '2 BHK';
        else if (gajNum <= 90) configuration = '3 BHK';
        else configuration = '4 BHK';
      }
    }
  }

  if (!configuration) {
    const combined = `${rawTitle} ${rawDesc} ${rawSize}`;
    const match = combined.match(/\b([1-9]\s*bhk|[1-9]\s*rk|studio|commercial|office|shop|plot|jad\s*se)\b/i);
    if (match) {
      configuration = match[1].toUpperCase();
    }
  }

  // Floor resolution
  const rawFloor = getRowValue(rowObj, 'floor');
  const floor = rawFloor ? expandFloorName(rawFloor) : '';

  // Title resolution
  const title = rawTitle || [configuration, sizeSqft ? `(${sizeSqft})` : '', location ? `at ${location}` : ''].filter(Boolean).join(' ').trim();

  // Agent / Owner details
  const ownerName = String(getRowValue(rowObj, 'ownerName') || '').trim();
  const ownerContact = String(getRowValue(rowObj, 'ownerContact') || '').replace(/[^\d+]/g, '');
  const notes = String(getRowValue(rowObj, 'specialInstructions') || '').trim();

  // Description resolution (no fake data)
  const description =
    rawDesc ||
    [configuration, sizeSqft, floor, location, notes ? `Notes: ${notes}` : ''].filter(Boolean).join(' | ');

  // Price resolution
  let salePrice = rawSalePrice || rawNetPrice || 0;
  let monthlyRent = rawRent;
  if (listingType === 'rent' && monthlyRent <= 0 && salePrice > 0) {
    monthlyRent = salePrice;
  }
  if (listingType === 'buy' && salePrice <= 0 && monthlyRent > 0) {
    salePrice = monthlyRent;
  }

  // Lift resolution
  const rawLift = String(getRowValue(rowObj, 'lift') || '').trim().toUpperCase();
  let lift = '';
  if (rawLift === 'YES' || rawLift === 'Y' || rawLift === 'TRUE' || rawLift === '1') {
    lift = 'YES';
  } else if (rawLift === 'NO' || rawLift === 'N' || rawLift === 'FALSE' || rawLift === '0') {
    lift = 'NO';
  } else if (rawLift) {
    lift = rawLift;
  }

  // Parking resolution
  const rawParking = String(getRowValue(rowObj, 'parking') || '').trim();
  let parking = rawParking;
  if (rawParking.toUpperCase().includes('CAR') && rawParking.toUpperCase().includes('BIKE')) {
    parking = 'Car + Bike Parking';
  } else if (rawParking.toUpperCase().includes('CAR')) {
    parking = 'Car Parking';
  } else if (rawParking.toUpperCase().includes('BIKE')) {
    parking = 'Bike Parking';
  }

  const rawCategory = String(getRowValue(rowObj, 'propertyCategory') || '').trim();
  const propertyCategory = ['RK', 'HK', 'Office', 'Shop', 'Plot'].includes(rawCategory) ? rawCategory : configuration.includes('RK') ? 'RK' : 'HK';

  const rawDeal = String(getRowValue(rowObj, 'dealStatus') || '').trim().toLowerCase();
  const dealStatus = ['available', 'rented', 'sold'].includes(rawDeal) ? rawDeal : 'available';

  return {
    listingType,
    title,
    location,
    configuration,
    sizeSqft,
    floor,
    totalFloors: String(getRowValue(rowObj, 'totalFloors') || '').trim(),
    lift,
    parking,
    possessionStatus: String(getRowValue(rowObj, 'possessionStatus') || '').trim(),
    constructionYear: String(getRowValue(rowObj, 'constructionYear') || '').trim(),
    facing: String(getRowValue(rowObj, 'facing') || '').trim(),
    reraId: String(getRowValue(rowObj, 'reraId') || '').trim(),
    amenities: String(getRowValue(rowObj, 'amenities') || '').trim(),
    description,
    coverImage: String(getRowValue(rowObj, 'coverImage') || '').trim(),
    images: [],
    videoUrl: String(getRowValue(rowObj, 'videoUrl') || '').trim(),
    monthlyRent,
    securityDeposit: parseCleanNumber(getRowValue(rowObj, 'securityDeposit')),
    maintenanceCharge: parseCleanNumber(getRowValue(rowObj, 'maintenanceCharge')),
    availableFrom: String(getRowValue(rowObj, 'availableFrom') || '').trim(),
    salePrice,
    pricePerSqft: parseCleanNumber(getRowValue(rowObj, 'pricePerSqft')),
    priceNegotiable: rawNetPrice > 0 ? true : Boolean(getRowValue(rowObj, 'priceNegotiable')),
    ownerName,
    ownerContact,
    propertyCategory,
    furnishingStatus: String(getRowValue(rowObj, 'furnishingStatus') || '').trim(),
    completeAddress,
    latitude: String(getRowValue(rowObj, 'latitude') || '').trim(),
    longitude: String(getRowValue(rowObj, 'longitude') || '').trim(),
    commission: String(getRowValue(rowObj, 'commission') || '').trim(),
    specialInstructions: notes,
    netProfit: rawNetPrice || 0,
    dealStatus,
    submittedBy: userId,
    isActive: true,
  };
}

export const uploadExcelFlatListings = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'No Excel or CSV file uploaded.' });
  }

  let rows = [];
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({ error: 'Uploaded file has no sheets.' });
    const worksheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
  } catch (err) {
    return res.status(400).json({ error: `Failed to parse file: ${err.message}` });
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'File contains no data rows.' });
  }

  // If replaceExisting query or body flag is set (or clean=true), clear out existing inventory first
  const shouldReplace = req.query.replaceExisting === 'true' || req.query.clean === 'true' || req.body?.replaceExisting === 'true' || req.body?.replaceExisting === true;
  if (shouldReplace) {
    const filter = req.user.role === 'salesman' ? { submittedBy: req.user.id } : {};
    await FlatListing.deleteMany(filter);
  }

  const results = { success: [], failed: [], total: rows.length, importedCount: 0 };

  for (let i = 0; i < rows.length; i++) {
    const rowObj = rows[i];
    const listingData = processRowToFlatListing(rowObj, i + 2, req.user?.id || req.user?._id);

    if (!listingData) {
      // Empty row skipped
      continue;
    }

    try {
      const saved = await FlatListing.create(listingData);
      results.success.push({
        row: i + 2,
        _id: saved._id,
        title: saved.title || saved.configuration,
        location: saved.location,
        price: saved.listingType === 'rent' ? `₹ ${saved.monthlyRent}/mo` : `₹ ${saved.salePrice.toLocaleString('en-IN')}`,
      });
      results.importedCount += 1;
    } catch (err) {
      results.failed.push({ row: i + 2, error: err.message });
    }
  }

  res.status(201).json(results);
};

export const getExcelUploadHistory = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const listings = await FlatListing.find({ isActive: true })
    .populate('submittedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();
  const total = await FlatListing.countDocuments({ isActive: true });
  res.status(200).json({ listings, total, page: Number(page), totalPages: Math.ceil(total / limit) });
};

export const pushFlatListingData = async (req, res) => {
  const { data, model } = req.body || {};
  if (model !== 'flat-listing') {
    return res.status(400).json({ error: `Unsupported model: ${model}` });
  }
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: 'No data rows provided.' });
  }

  const results = { success: [], failed: [], total: data.length, importedCount: 0 };

  for (let i = 0; i < data.length; i++) {
    const rowObj = data[i] || {};
    const listingData = processRowToFlatListing(rowObj, i + 1, req.user?.id || req.user?._id);

    if (!listingData) continue;

    try {
      const saved = await FlatListing.create(listingData);
      results.success.push({ row: i + 1, _id: saved._id, title: saved.title || saved.configuration });
      results.importedCount += 1;
    } catch (err) {
      results.failed.push({ row: i + 1, error: err.message });
    }
  }

  res.status(201).json(results);
};
