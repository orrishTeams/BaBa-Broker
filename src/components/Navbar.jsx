import { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const MotionLink = motion(Link);

const NAV_LINKS = [
  { to: "/", label: "Home", icon: "fa-solid fa-house-chimney", id: "hero" },
  { to: "/about", label: "About Us", icon: "fa-solid fa-circle-info", id: null },
  { to: "/properties", label: "Investment Plans", icon: "fa-solid fa-chart-pie", id: null },
  { to: "/contact", label: "Contact Us", icon: "fa-solid fa-envelope-open-text", id: null },
];

const spring = { type: "spring", stiffness: 260, damping: 22, mass: 0.8 };

const linkVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { ...spring, delay: i * 0.06 },
  }),
};

const mobileItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25, delay: i * 0.04 },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const hamburgerVariants = {
  closed: { rotate: 0 },
  open: { rotate: 180, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  const phoneRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleWhatsAppConnect = useCallback(() => {
    const url = `https://wa.me/919586505111?text=${encodeURIComponent(
      "Hello Baba Broker, I would like to connect with your investment team regarding properties.",
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const closeAll = useCallback(() => {
    setMobileOpen(false);
    setPhoneOpen(false);
  }, []);

  const handleMobileNavigation = useCallback((path) => {
    closeAll();
    // Give state a micro-tick before navigating to ensure smooth exit transition
    setTimeout(() => {
      navigate(path);
    }, 50);
  }, [closeAll, navigate]);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      const sectionIds = NAV_LINKS.filter((l) => l.id).map((l) => l.id);
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close phone dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (phoneRef.current && !phoneRef.current.contains(e.target)) setPhoneOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [mobileOpen]);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? "border-b border-orange-500/15 bg-slate-950/90 shadow-2xl shadow-black/60"
          : "bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent"
      }`}
      style={{
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
      }}
    >
      {/* Top accent gradient bar */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: scrolled || mobileOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "linear-gradient(90deg, #f97316 0%, #f59e0b 50%, #10b981 100%)",
        }}
      />

      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-12 py-2.5">
        {/* ─── Animated Logo ─── */}
        <div className="flex items-center">
          <Link to="/" onClick={closeAll} className="block group">
            <motion.img
              src="assets/img/logo.svg"
              alt="Baba Broker"
              className="h-9 sm:h-11 lg:h-13 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              style={{ maxWidth: "165px" }}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              draggable={false}
            />
          </Link>
        </div>

        {/* ─── Desktop Nav Links ─── */}
        <motion.ul
          className="hidden md:flex items-center gap-1.5"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
        >
          {NAV_LINKS.map((link, i) => (
            <motion.li key={link.label} custom={i} variants={linkVariants}>
              <NavLink
                to={link.to}
                onClick={closeAll}
                className={({ isActive }) => {
                  const isSectionActive = link.id && activeSection === link.id && location.pathname === "/";
                  const isActiveRoute = link.id ? isSectionActive : isActive;
                  return `relative px-4 py-2 rounded-xl text-[13px] font-semibold tracking-wide transition-colors duration-200 ${
                    isActiveRoute ? "text-orange-400" : "text-slate-300 hover:text-orange-300"
                  }`;
                }}
              >
                {({ isActive }) => {
                  const isSectionActive = link.id && activeSection === link.id && location.pathname === "/";
                  const active = link.id ? isSectionActive : isActive;
                  return (
                    <>
                      {active && (
                        <motion.span
                          layoutId="navPill"
                          className="absolute inset-0 rounded-xl bg-orange-500/15 border border-orange-500/25 shadow-inner"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <i className={`${link.icon} text-[11px] opacity-70`} />
                        {link.label}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            </motion.li>
          ))}
        </motion.ul>

        {/* ─── Right Controls ─── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Become an Investor (Desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.25 }}
            className="hidden sm:block"
          >
            <MotionLink
              to="/become-investor"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:brightness-105 active:scale-95 transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={spring}
            >
              <i className="fa-solid fa-user-tie text-[12px]" />
              <span>Become an Investor</span>
            </MotionLink>
          </motion.div>

          {/* Staff & Admin Portal (Desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.3 }}
            className="hidden sm:block"
          >
            <MotionLink
              to="/admin/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/35 bg-gradient-to-r from-slate-900 to-slate-950 text-amber-400 text-xs font-bold hover:border-amber-400 hover:text-amber-300 hover:bg-slate-900 transition-all shadow-md active:scale-95"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={spring}
            >
              <i className="fa-solid fa-shield-halved text-orange-400 text-[12px]" />
              <span>Staff &amp; Admin Portal</span>
            </MotionLink>
          </motion.div>

          {/* Phone Contact Dropdown */}
          <motion.div
            className="relative"
            ref={phoneRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.35 }}
          >
            <motion.button
              onClick={() => setPhoneOpen(!phoneOpen)}
              aria-label="Call or WhatsApp contact options"
              className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl border flex items-center justify-center transition-all shadow-md ${
                phoneOpen
                  ? "bg-orange-500 text-white border-orange-400 shadow-orange-500/30"
                  : "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              transition={spring}
            >
              <motion.i
                className="fa-solid fa-phone text-sm"
                animate={phoneOpen ? { rotate: [0, -15, 15, -8, 8, 0] } : { rotate: 0 }}
                transition={{ duration: 0.4 }}
              />
            </motion.button>

            <AnimatePresence>
              {phoneOpen && (
                <motion.div
                  className="absolute right-0 top-13 sm:top-14 z-50 w-72 rounded-2xl border border-slate-700/80 bg-slate-900/98 p-4 shadow-2xl space-y-2.5 overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ ...spring, damping: 25 }}
                  style={{ backdropFilter: "blur(20px)" }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: "linear-gradient(90deg, #f97316, #10b981)" }}
                  />

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] pt-1">
                    Direct Contact Hotline
                  </p>

                  <a
                    href="tel:+919586505111"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-phone" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Call Support
                      </span>
                      <span className="text-sm font-bold text-slate-200 group-hover:text-orange-400 transition-colors">
                        +91 95865 05111
                      </span>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      closeAll();
                      handleWhatsAppConnect();
                    }}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      <i className="fa-brands fa-whatsapp text-sm" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        WhatsApp Connect
                      </span>
                      <span className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                        Chat with Advisory
                      </span>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ─── Hamburger Button ─── */}
          <motion.button
            onClick={() => {
              setPhoneOpen(false);
              setMobileOpen((v) => !v);
            }}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all md:hidden ${
              mobileOpen
                ? "bg-slate-800 border-orange-500/40 text-orange-400 shadow-md"
                : "bg-slate-900/90 border-white/15 text-slate-200 hover:border-orange-500/30"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            variants={hamburgerVariants}
            animate={mobileOpen ? "open" : "closed"}
          >
            <div className="flex flex-col gap-1.5 items-center justify-center w-5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block h-[2px] w-5 rounded-full bg-current origin-center"
                  animate={
                    mobileOpen
                      ? i === 0
                        ? { rotate: 45, y: 6 }
                        : i === 1
                        ? { opacity: 0, scaleX: 0 }
                        : { rotate: -45, y: -6 }
                      : { rotate: 0, y: 0, opacity: 1, scaleX: 1 }
                  }
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              ))}
            </div>
          </motion.button>
        </div>
      </div>

      {/* ─── Full-Screen Mobile Menu Overlay ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 top-[60px] h-[calc(100dvh-60px)] w-full z-50 bg-[#060913]/98 backdrop-blur-3xl overflow-y-auto overscroll-contain flex flex-col justify-between md:hidden border-t border-slate-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            {/* Ambient luxury light leak blobs */}
            <div className="absolute top-12 -right-20 h-72 w-72 rounded-full bg-orange-500/15 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-16 -left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

            {/* Top vibrant accent stripe */}
            <div
              className="h-[3px] w-full shrink-0"
              style={{ background: "linear-gradient(90deg, #f97316 0%, #f59e0b 50%, #10b981 100%)" }}
            />

            <div className="relative p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full flex-1 flex flex-col justify-start">
              {/* Navigation Links Grid with Solid High-Contrast Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {NAV_LINKS.map((link, i) => {
                  const isSectionActive = link.id && activeSection === link.id && location.pathname === "/";
                  const isPathActive = location.pathname === link.to;
                  const active = link.id ? isSectionActive : isPathActive;

                  return (
                    <motion.button
                      key={link.label}
                      type="button"
                      custom={i}
                      variants={mobileItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={() => handleMobileNavigation(link.to)}
                      className={`flex flex-col items-start justify-center p-3.5 rounded-2xl border text-left transition-all active:scale-95 shadow-md cursor-pointer ${
                        active
                          ? "bg-gradient-to-br from-orange-500/25 to-amber-500/15 border-orange-500 text-orange-300 ring-1 ring-orange-500/40"
                          : "bg-[#101726] border-slate-700/90 text-slate-100 hover:bg-[#162032] hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs shadow-inner ${
                            active ? "bg-orange-500 text-white font-black" : "bg-[#1c273c] border border-slate-700 text-orange-400"
                          }`}
                        >
                          <i className={link.icon} />
                        </div>
                        {active && (
                          <span className="inline-block h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                        )}
                      </div>
                      <span className="text-xs font-black tracking-wide text-white">{link.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Divider with Portal Header */}
              <div className="pt-2 pb-1 flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-slate-800" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Portals &amp; Actions
                </span>
                <div className="h-[1px] flex-1 bg-slate-800" />
              </div>

              {/* Primary Action: Become an Investor */}
              <motion.button
                type="button"
                custom={NAV_LINKS.length}
                variants={mobileItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => handleMobileNavigation("/become-investor")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-slate-950 font-black text-xs shadow-xl shadow-orange-500/25 active:scale-[0.98] transition-transform border border-amber-300/40 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-black/20 border border-black/10 flex items-center justify-center text-slate-950 text-base shadow-inner">
                    <i className="fa-solid fa-user-tie" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm leading-tight text-slate-950">
                      Become an Investor
                    </div>
                    <div className="text-[11px] font-bold text-slate-900/90 mt-0.5">
                      Start fractional co-investing
                    </div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-black/15 flex items-center justify-center text-slate-950">
                  <i className="fa-solid fa-arrow-right text-xs" />
                </div>
              </motion.button>

              {/* Prominent Action: Staff & Admin Portal */}
              <motion.button
                type="button"
                custom={NAV_LINKS.length + 1}
                variants={mobileItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => handleMobileNavigation("/admin/login")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#0e1626] border-2 border-amber-500/70 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all group cursor-pointer hover:border-amber-400"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/25 border border-amber-500/50 text-amber-300 flex items-center justify-center text-base group-hover:scale-105 transition-transform shadow-xs">
                    <i className="fa-solid fa-shield-halved" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm leading-tight text-amber-300 flex items-center gap-2">
                      <span>Staff &amp; Admin Portal</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-slate-950 tracking-wider">
                        LOGIN
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      Admin • Sales • Audit Access
                    </div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <i className="fa-solid fa-lock-open text-xs" />
                </div>
              </motion.button>

              {/* Quick Contact Duo: Call & WhatsApp */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href="tel:+919586505111"
                  onClick={closeAll}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#111927] border border-slate-700/80 text-white active:scale-95 transition-all"
                >
                  <div className="h-8 w-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs shrink-0">
                    <i className="fa-solid fa-phone" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Call Support</span>
                    <span className="text-xs font-black text-slate-100 truncate block">+91 95865 05111</span>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    closeAll();
                    handleWhatsAppConnect();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#062419] border border-emerald-500/60 text-emerald-300 active:scale-95 transition-all text-left cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/25 text-emerald-400 flex items-center justify-center text-xs shrink-0">
                    <i className="fa-brands fa-whatsapp text-sm" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] text-emerald-400/80 font-bold uppercase">WhatsApp</span>
                    <span className="text-xs font-black text-emerald-300 truncate block">Chat Support</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Trust Badge */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 text-center shrink-0">
              <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <i className="ri-checkbox-circle-fill text-xs" /> RERA Title Clear
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <i className="ri-shield-check-fill text-xs" /> 100% Bank Verified
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}