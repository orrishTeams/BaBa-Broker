import React, { useState } from 'react';
import { priceLabel, formatINR } from '../../utils/propertyConstants';

/**
 * Reusable Property Card component with photo slider, price chip, specs, and action buttons.
 */
export function PropertyCard({
  property,
  onViewDetails,
  onPitch,
  onEdit,
  onDelete,
  onToggleDealStatus,
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const allPhotos = [
    property.coverImage,
    ...(Array.isArray(property.images) ? property.images : []),
  ].filter(Boolean);

  const isSold = property.dealStatus === 'sold';
  const isRented = property.dealStatus === 'rented';
  const isClosed = isSold || isRented;

  return (
    <div
      onClick={() => onViewDetails(property)}
      className={`group rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-2xs hover:shadow-md flex flex-col justify-between cursor-pointer ${
        isClosed ? 'border-slate-200 opacity-75' : 'border-slate-200/90 hover:border-orange-300'
      }`}
    >
      {/* Top Media & Tags */}
      <div>
        <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
          {allPhotos.length > 0 ? (
            <img
              src={allPhotos[activePhotoIdx] || allPhotos[0]}
              alt=""
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
              <i className="ri-building-line text-3xl mb-1 text-slate-300" />
              <span className="text-[10px] font-bold uppercase text-slate-400">No Photo</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white font-black text-[10px] uppercase shadow-xs">
              {property.configuration || '2 BHK'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-xs ${
                property.listingType === 'rent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {property.listingType === 'rent' ? 'Rent' : 'Sale'}
            </span>
          </div>

          {/* Deal Switch Pill Overlay */}
          <div className="absolute top-2.5 right-2.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onToggleDealStatus(property)}
              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm border ${
                isClosed
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-emerald-500 text-white border-emerald-400'
              }`}
            >
              {isClosed ? (isSold ? 'SOLD' : 'RENTED') : 'AVAILABLE'}
            </button>
          </div>

          {/* Photo Navigation dots */}
          {allPhotos.length > 1 && (
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {allPhotos.slice(0, 5).map((_, pIdx) => (
                <span
                  key={pIdx}
                  onClick={() => setActivePhotoIdx(pIdx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activePhotoIdx === pIdx ? 'w-3.5 bg-orange-400' : 'w-1.5 bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3.5 space-y-2">
          {/* Price & Size */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm sm:text-base font-black text-emerald-800 tracking-tight">
              {priceLabel(property)}
            </span>
            <span className="text-xs font-extrabold text-slate-700">{property.sizeSqft || '50 Gaj'}</span>
          </div>

          {/* Title & Location */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 truncate leading-snug" title={property.title}>
              {property.title || `${property.configuration} in ${property.location || 'Delhi NCR'}`}
            </h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate mt-0.5" title={property.location}>
              <i className="ri-map-pin-2-fill text-orange-500 text-xs shrink-0" />
              <span>{property.location || 'Delhi NCR'}</span>
            </p>
          </div>

          {/* Specs Micro Strip */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-600 border-t border-slate-100 font-medium">
            <span className="truncate">🏢 {property.floor || 'Standard'}</span>
            <span className="truncate">🛗 Lift: {property.lift || 'NO'}</span>
            <span className="truncate">🚗 {property.parking && property.parking !== 'No Parking' ? 'Parking' : 'No Park'}</span>
            <span className="truncate">🛋️ {property.furnishingStatus || 'Semi-Furnished'}</span>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div
        className="px-3.5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onPitch(property)}
          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
        >
          <i className="ri-whatsapp-fill text-sm" />
          <span>Pitch</span>
        </button>

        <button
          type="button"
          onClick={() => onViewDetails(property)}
          className="p-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition cursor-pointer"
          title="View Details"
        >
          <i className="ri-eye-line" />
        </button>

        <button
          type="button"
          onClick={() => onEdit(property)}
          className="p-1.5 rounded-xl bg-white hover:bg-orange-50 text-orange-700 border border-slate-200 hover:border-orange-200 text-xs font-bold transition cursor-pointer"
          title="Edit"
        >
          <i className="ri-edit-line" />
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(property._id)}
            className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-bold transition cursor-pointer"
            title="Delete"
          >
            <i className="ri-delete-bin-line" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable Property Card Grid
 */
export default function PropertyGrid({
  listings = [],
  onViewDetails,
  onPitch,
  onEdit,
  onDelete,
  onToggleDealStatus,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
      {listings.map((item) => (
        <PropertyCard
          key={item._id}
          property={item}
          onViewDetails={onViewDetails}
          onPitch={onPitch}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleDealStatus={onToggleDealStatus}
        />
      ))}
    </div>
  );
}
