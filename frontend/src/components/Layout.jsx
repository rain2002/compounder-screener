import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";

const navItems = [
  { to: "/", index: "01", label: "Dashboard", sub: "Executive Overview", icon: "dashboard" },
  { to: "/watchlist", index: "02", label: "Watchlist", sub: "Universe & Filings", icon: "screener" },
  { to: "/dcf", index: "03", label: "DCF Model", sub: "Monte Carlo Valuation", icon: "dcf" },
  { to: "/financial", index: "04", label: "Financials", sub: "10-Yr Statements", icon: "technical" },
  { to: "/sentiment", index: "05", label: "Sentiment", sub: "10-K FinBERT NLP", icon: "sentiment" },
  { to: "/variance", index: "06", label: "Variance", sub: "Risk Envelope", icon: "variance" },
];

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#080808] text-[#ededed] flex flex-col selection:bg-white selection:text-black">
      {/* 1. Neozen Fixed Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#080808]/90 border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Mark */}
          <NavLink
            to="/"
            className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-syne font-extrabold text-sm shadow-sm">
              <Icon name="compounder" size={17} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-syne font-extrabold text-base uppercase tracking-tight text-white">
                COMPOUNDER
              </span>
              <span className="font-mono text-[10px] text-neutral-400 tracking-widest uppercase hidden sm:inline">
                // PRO SCREENER
              </span>
            </div>
          </NavLink>

          {/* Desktop Nav Items (Neozen Numbered System) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.05]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? "text-neutral-500 font-bold" : "text-neutral-600"}>
                      {item.index}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 font-mono text-[11px] text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span>[ SYSTEM: ONLINE ]</span>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle Navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/[0.08] bg-[#0d0d0d]/95 backdrop-blur-2xl px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl font-mono text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-white text-black font-bold"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">{item.index}</span>
                  <span className="font-syne font-bold text-sm tracking-normal">{item.label}</span>
                </div>
                <span className="text-[10px] text-neutral-400">{item.sub}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* 2. Neozen Category Ribbon Shelf */}
      <div className="border-b border-white/[0.08] bg-[#0c0c0c] py-4 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4 min-w-max">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.08] border-white/40 text-white shadow-sm"
                      : "bg-[#111111] border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="font-mono text-[10px] text-neutral-500 font-semibold">
                      {item.index}
                    </span>
                    <Icon name={item.icon} size={15} className={isActive ? "text-white" : "text-neutral-500"} />
                    <span className="font-syne font-bold text-xs uppercase tracking-tight">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Page Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="fade-in">
          {children}
        </div>
      </main>

      {/* 4. Neozen Monochromatic Editorial Footer */}
      <footer className="border-t border-white/[0.08] bg-[#090909] text-neutral-400 text-xs py-14 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-8 border-b border-white/[0.08]">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-500 block mb-2">
                [ ARCHITECTURAL FINANCIAL SCREENER ]
              </span>
              <h2 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-white">
                COMPOUNDER // VALUATION SUITE
              </h2>
            </div>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
              US &amp; INDIA EQUITIES • BUFFETT + LYNCH + ML
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-mono text-[11px] leading-relaxed text-neutral-500">
            <div>
              <span className="text-white block font-bold uppercase mb-1">01 / METHODOLOGY</span>
              5-year discrete cash flow modeling with terminal growth bounded by real GDP caps (US: 2.5%, India: 7.0%).
            </div>
            <div>
              <span className="text-white block font-bold uppercase mb-1">02 / MACHINE LEARNING</span>
              Pooled multi-model XGBoost &amp; Random Forest ensemble calibrated on SEC 10-K XBRL financial filings.
            </div>
            <div>
              <span className="text-white block font-bold uppercase mb-1">03 / FRAUD PROTECTION</span>
              Beneish M-Score 8-ratio probabilistic forensic filter to weed out accounting manipulation before scoring.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06] font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <Icon name="compounder" size={14} className="text-neutral-400" />
              <span>COPYRIGHT © 2026 COMPOUNDER SCREENER. ALL RIGHTS RESERVED.</span>
            </div>
            <div className="flex items-center gap-5 text-neutral-400">
              <NavLink to="/watchlist" className="hover:text-white transition-colors">WATCHLIST</NavLink>
              <NavLink to="/dcf" className="hover:text-white transition-colors">DCF MODEL</NavLink>
              <NavLink to="/financial" className="hover:text-white transition-colors">FINANCIALS</NavLink>
              <NavLink to="/sentiment" className="hover:text-white transition-colors">SENTIMENT</NavLink>
              <NavLink to="/variance" className="hover:text-white transition-colors">VARIANCE</NavLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
