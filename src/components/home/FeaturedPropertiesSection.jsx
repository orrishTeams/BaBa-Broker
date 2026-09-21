import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ScrollReveal from "../ScrollReveal";

const fallbackProperties = [
  {
    id: "jewar-plot-1",
    title: "Residential Plot on Yamuna Expressway, Jewar",
    location: "YAMUNA EXPRESSWAY, Jewar, Greater Noida",
    price: "₹ 1.25 Crore",
    perSqftPrice: "₹ 2,323 per sqft",
    type: "Direct Sale",
    propertyType: "plot",
    plotAreaSqft: "5381.96 sqft",
    plotAreaSqm: "500 sq.m.",
    facing: "North-East",
    roadWidthFeet: "66.0 Feet",
    gatedSociety: "YES",
    boundaryWall: "YES",
    openSides: "1",
    overlooking: "Pool",
    possession: "Immediate",
    transactionType: "Resale",
    ownership: "Freehold",
    highlights: "Gated Society, On 66 ft Wide Road, Overlooking Swimming Pool, North-East Facing",
    amenities: "Gated Society, Water Storage, Rain Water Harvesting",
    description: "Residential plot is spread across of land on yamuna express way and situated close to education, residential and commercial hubs of the city. The preferential location plot is facing the green belt with planned airport in jewar, mall and large integrated townships nearby. The usp of the property is its strategic location with schools, research institutes, ATMs, banks and retail outlets in close proximity.",
    image: "https://housing-images.n7net.in/4f2250e8/233a502501247c905f9f712e15231459/v0/large/planner_lotus_residency-sewak_park-new+delhi-planner_n_maker.jpeg",
    details: [
      ["fa-map-location-dot", "5381.96 sqft"],
      ["fa-road", "66 ft Wide Road"],
      ["fa-[#f59e0b]", "North-East Facing"],
    ],
    tag: "🔥 HOT PRODUCT FOR SALE",
  },
];

function formatCommaPrice(val) {
  if (val === null || val === undefined || val === '') return '₹0';
  if (typeof val === 'number') {
    return '₹' + val.toLocaleString('en-IN');
  }
  const str = String(val).trim();
  const digits = str.replace(/[^\d]/g, '');
  if (digits && Number(digits) > 0) {
    return '₹' + Number(digits).toLocaleString('en-IN');
  }
  return str.startsWith('₹') ? str : `₹${str}`;
}

export default function FeaturedPropertiesSection() {
  const navigate = useNavigate();
  const [dbProperties, setDbProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/properties')
      .then((res) => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbProperties(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featuredList = useMemo(() => {
    // Only properties explicitly published via "Create New Featured Hot Product"
    // (or toggled Featured by an admin) appear here — never investment projects
    // or anything else that merely lacks the flag.
    const featured = (dbProperties || []).filter((p) => p.isFeatured === true);
    const listToUse = featured.length > 0 ? featured : fallbackProperties;

    return listToUse.map((p, idx) => {
      const defaultImg =
        'https://housing-images.n7net.in/4f2250e8/233a502501247c905f9f712e15231459/v0/large/planner_lotus_residency-sewak_park-new+delhi-planner_n_maker.jpeg';

      const rawImgs =
        Array.isArray(p.images) && p.images.length > 0
          ? p.images
          : p.image
          ? [p.image]
          : [defaultImg];

      // Filter out stale temporary browser blob: URLs
      const cleanImgs = rawImgs
        .map((img) => (typeof img === 'string' && img.startsWith('blob:') ? defaultImg : img))
        .filter(Boolean);

      const displayImg = cleanImgs[0] || defaultImg;

      const priceStr =
        p.price || (p.totalValuation ? `₹ ${(p.totalValuation / 100000).toFixed(1)} Lakhs` : 'Price on Request');

      const categoryLabel =
        p.propertyType === 'commercial'
          ? '🏬 Commercial'
          : p.propertyType === 'plot'
          ? '🏞️ Plot / Land'
          : '🏢 Residential';

      // Dynamic category specifications pills for CMS
      let specPills = [];
      if (p.propertyType === 'commercial') {
        specPills = [
          ['fa-building', 'Commercial'],
          ['fa-vector-square', p.sizeSqft || '800 sqft'],
          ['fa-chart-line', 'High Yield'],
        ];
      } else if (p.propertyType === 'plot') {
        specPills = [
          ['fa-map-location-dot', 'Plot / Land'],
          ['fa-vector-square', p.sizeSqft || '1,000 sqft'],
          ['fa-road', 'Road Facing'],
        ];
      } else {
        specPills = [
          ['fa-bed', p.bhk ? p.bhk.toUpperCase() : '2 BHK'],
          ['fa-bath', '1 Bath'],
          ['fa-vector-square', p.sizeSqft || '1,200 sqft'],
        ];
      }

      return {
        id: p._id || `featured-${idx}`,
        rawProject: p,
        title: p.title,
        location: p.location,
        price: priceStr,
        categoryLabel,
        image: displayImg,
        tag: p.tag || '🔥 HOT DEAL',
        details: specPills,
      };
    });
  }, [dbProperties]);

  return (
    <section
      id="properties"
      className="relative overflow-hidden bg-slate-950 px-6 py-24 sm:py-32"
    >
      {/* Ambient background accent light leak meshes */}
      <div className="absolute -right-32 top-16 h-80 w-80 rounded-full bg-orange-600/10 blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute -left-32 bottom-16 h-80 w-80 rounded-full bg-amber-500/5 blur-[120px] mix-blend-screen pointer-events-none"></div>

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal>
        <div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-orange-500">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              🔥 DIRECT SALE HOT DEALS
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Featured Hot{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                Properties
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              Handpicked prime plots, commercial spaces, and residential floors available for direct sale, verified titles, transparent pricing, and instant booking.
            </p>
          </div>

          <Link
            to="/all-properties"
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-3 text-xs font-bold text-white transition-all duration-300 hover:border-orange-500/40 hover:bg-orange-500 hover:text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] whitespace-nowrap"
          >
            View All Properties
            <i className="fa-solid fa-arrow-right text-[10px] transition-transform duration-300 group-hover:translate-x-1"></i>
          </Link>
        </div>

        {/* Properties Dynamic Card Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {featuredList.map((property) => (
            <div
              key={property.id}
              onClick={() => {
                if (property.rawProject) {
                  navigate('/property-details', { state: { project: property.rawProject } });
                } else {
                  navigate('/property-details');
                }
              }}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-900/60 bg-slate-900/20 shadow-xl transition-all duration-300 will-change-transform hover:-translate-y-2 hover:border-orange-500/30 hover:bg-slate-900/40 hover:shadow-[0_25px_50px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              {/* Image Media Shell */}
              <div className="relative h-56 overflow-hidden bg-slate-950">
                <img
                  src={property.image}
                  alt={property.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://housing-images.n7net.in/4f2250e8/233a502501247c905f9f712e15231459/v0/large/planner_lotus_residency-sewak_park-new+delhi-planner_n_maker.jpeg';
                  }}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Visual Contrast Protection Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-transparent transition-colors duration-300"></div>

                {/* Tags Positioning */}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <span className="rounded-md bg-slate-900/95 border border-slate-800 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                    {property.categoryLabel || property.type || 'INVESTMENT'}
                  </span>
                </div>

                <span className="absolute bottom-4 left-4 rounded-md bg-orange-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  {property.tag}
                </span>

                {/* Bookmark Action Control */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  aria-label={`Save ${property.title}`}
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-sm transition-all duration-300 hover:bg-orange-500 hover:border-orange-600 hover:text-white"
                >
                  <i className="fa-regular fa-heart text-xs"></i>
                </button>
              </div>

              {/* Data Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-xl font-black text-orange-500 tracking-tight">
                        {formatCommaPrice(property.totalValuation || property.price)}
                      </p>
                      <span className="block text-[10px] font-normal text-slate-400 -mt-0.5">
                        (Total Selling Price)
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-white tracking-tight leading-snug transition-colors duration-300 group-hover:text-orange-400">
                    {property.title}
                  </h3>

                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <i className="fa-solid fa-location-dot text-orange-500 text-xs shrink-0"></i>
                    <span className="truncate">{property.location}</span>
                  </p>
                </div>

                {/* Metadata Details Horizontal Row */}
                <div className="mt-5">
                  <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 border-t border-slate-900/80 pt-4 text-[11px] font-medium text-slate-400">
                    {property.details.map(([icon, label]) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 bg-slate-900/40 border border-slate-900/80 px-2 py-0.5 rounded-md shadow-inner"
                      >
                        <i
                          className={`fa-solid ${icon} text-[10px] text-orange-500/80`}
                        ></i>
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Interactive Details CTA Box */}
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-900/40 group-hover:bg-orange-500/10 border border-slate-900 group-hover:border-orange-500/20 px-4 py-2.5 text-xs font-bold text-white transition-all duration-300">
                    <span className="flex items-center gap-1.5 text-orange-400">
                      <i className="fa-solid fa-cart-shopping text-xs"></i>
                      Enquire / Purchase Property
                    </span>
                    <i className="fa-solid fa-arrow-right text-[10px] text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-orange-400"></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
