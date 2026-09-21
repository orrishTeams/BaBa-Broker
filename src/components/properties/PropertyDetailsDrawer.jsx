import React, { useState } from 'react';
import { formatINR, priceLabel } from '../../utils/propertyConstants';

/**
 * Reusable Property Details Slide-Out Drawer
 * Shows photo carousel, video walkthrough banner & link, detailed specifications, pricing margin, owner contacts & actions.
 */
export default function PropertyDetailsDrawer({
  property,
  onClose,
  onPitch,
  onEdit,
  onToggleDealStatus,
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!property) return null;

  const allPhotos = [
    property.coverImage,
    ...(Array.isArray(property.images) ? property.images : []),
  ].filter(Boolean);

  const rawPrice =
    property.listingType === 'rent'
      ? Number(property.monthlyRent) || 0
      : Number(property.salePrice) || 0;
  const netPrice = Number(property.netProfit) || 0;
  const margin =
    rawPrice > 0 && netPrice > 0 && rawPrice > netPrice ? rawPrice - netPrice : 0;

  const amenitiesList = (property.amenities || '')
    .split(/[,|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isSold = property.dealStatus === 'sold';
  const isRented = property.dealStatus === 'rented';
  const isClosed = isSold || isRented;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl sm:max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden transform transition-transform duration-300 ease-out animate-in slide-in-from-right font-['Inter',sans-serif]">
        {/* Top Drawer Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-start justify-between gap-4 sticky top-0 z-20 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-black uppercase tracking-wide shadow-2xs">
                {property.configuration || '2 BHK'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-100 text-[10px] font-bold uppercase">
                {property.propertyCategory || 'Flat'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  property.listingType === 'rent'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
              {property.dealStatus && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    property.dealStatus === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {property.dealStatus}
                </span>
              )}
              {property.isVerified !== false && (
                <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold flex items-center gap-1">
                  <i className="ri-verified-badge-fill text-sky-500 text-xs" /> Verified Listing
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug truncate">
              {property.title || `${property.configuration} in ${property.location || 'Delhi NCR'}`}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <i className="ri-map-pin-2-fill text-orange-500 text-sm" />
              <span className="font-semibold text-slate-700 truncate">
                {property.location || 'Location Not Specified'}
              </span>
              {property.sizeSqft && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-bold text-slate-600">{property.sizeSqft}</span>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
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
                    <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white font-mono text-xs font-bold shadow-xs">
                      📷 {activePhotoIdx + 1} / {allPhotos.length}
                    </span>
                  </div>
                  {allPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIdx((prev) =>
                            prev === 0 ? allPhotos.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer transition"
                      >
                        <i className="ri-arrow-left-s-line text-xl" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIdx((prev) =>
                            prev === allPhotos.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer transition"
                      >
                        <i className="ri-arrow-right-s-line text-xl" />
                      </button>
                    </>
                  )}
                </div>

                {allPhotos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {allPhotos.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setActivePhotoIdx(pIdx)}
                        className={`h-14 w-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          activePhotoIdx === pIdx
                            ? 'border-orange-500 scale-105 shadow-md'
                            : 'border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-40 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                <i className="ri-image-line text-3xl mb-1 text-slate-300" />
                <span>No Property Photos Uploaded</span>
              </div>
            )}
          </div>

          {/* 2. Video Walkthrough Tour (YouTube / Web) */}
          {property.videoUrl && (
            <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs shadow-red-600/20">
                  <i className="ri-youtube-fill" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">
                    Video Walkthrough Available
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs mt-0.5">
                    {property.videoUrl}
                  </p>
                </div>
              </div>
              <a
                href={property.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
              >
                <i className="ri-play-fill text-sm" />
                <span>Watch Video</span>
              </a>
            </div>
          )}

          {/* 3. Pricing & Margin Overview Strip */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Commercial Pricing & Net Terms
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Client Demand</span>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  {priceLabel(property)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Owner Net Demand</span>
                <span className="text-sm sm:text-base font-black text-amber-700">
                  {netPrice > 0 ? formatINR(netPrice) : 'Direct'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-800 font-bold block uppercase">Est. Gross Margin</span>
                <span className="text-sm sm:text-base font-black text-emerald-700">
                  {margin > 0 ? formatINR(margin) : 'Standard Brokerage'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Complete Specifications Grid */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Property Specifications & Infrastructure
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Floor Level</span>
                <span className="font-extrabold text-slate-800">{property.floor || 'Standard'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Lift Facility</span>
                <span className="font-extrabold text-slate-800">{property.lift || 'NO'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Parking Facility</span>
                <span className="font-extrabold text-slate-800">{property.parking || 'Standard'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Furnishing State</span>
                <span className="font-extrabold text-slate-800">{property.furnishingStatus || 'Unfurnished'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Possession</span>
                <span className="font-extrabold text-slate-800">{property.possessionStatus || 'Ready to Move'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Facing Direction</span>
                <span className="font-extrabold text-slate-800">{property.facing || 'East'}</span>
              </div>
            </div>
          </div>

          {/* 5. Amenities Chips */}
          {amenitiesList.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Society & Location Amenities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {amenitiesList.map((a, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-xl bg-orange-50 text-orange-800 border border-orange-200/70 text-xs font-bold"
                  >
                    ✓ {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 6. Owner & Direct Contact Action */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Owner / Associate Contact Information
            </h4>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-sm font-black text-slate-900 block">{property.ownerName || 'Direct Owner'}</span>
                <span className="text-xs font-mono font-bold text-slate-500">{property.ownerContact || '—'}</span>
              </div>
              {property.ownerContact && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${String(property.ownerContact).replace(/[^\d+]/g, '')}`}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <i className="ri-phone-fill text-sm" /> Call
                  </a>
                  <a
                    href={`https://wa.me/91${String(property.ownerContact).replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <i className="ri-whatsapp-fill text-sm" /> WhatsApp
                  </a>
                </div>
              )}
            </div>
            {property.completeAddress && (
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-0.5">Physical Address:</span>
                <p className="leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">{property.completeAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onPitch(property)}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="ri-whatsapp-fill text-base" />
            <span>Generate Pitch Flyer</span>
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(property)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Edit Listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
