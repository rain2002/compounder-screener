import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";

const navItems = [
  { to: "/", label: "Dashboard", sub: "Overview", icon: "dashboard" },
  { to: "/watchlist", label: "Watchlist", sub: "Universe", icon: "screener" },
  { to: "/dcf", label: "DCF Model", sub: "Valuation", icon: "dcf" },
  { to: "/financial", label: "Financials", sub: "10-Yr Statements", icon: "technical" },
  { to: "/sentiment", label: "Sentiment", sub: "10-K NLP", icon: "sentiment" },
  { to: "/variance", label: "Variance", sub: "Risk Bounds", icon: "variance" },
];

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col selection:bg-[#0071e3]/30 selection:text-white">
      {/* 1. Apple Store Global Translucent Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/75 border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand Mark */}
          <NavLink
            to="/"
            className="flex items-center gap-2.5 text-white hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center text-white">
              <Icon name="apple" size={15} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">Compounder</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[#86868b] border border-white/[0.06]">
                Store Pro
              </span>
            </div>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white shadow-sm font-semibold border border-white/10"
                      : "text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.04]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-3">
            {/* Live Engine Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1c1e]/80 border border-white/[0.08] text-[11px] text-[#a1a1a6]">
              <span className="w-2 h-2 rounded-full bg-[#30d158] shadow-[0_0_8px_#30d158] animate-pulse" />
              <span>FastAPI 8000</span>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-[#86868b] hover:text-white hover:bg-white/10 transition-colors"
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
          <div className="md:hidden border-t border-white/[0.08] bg-[#161617]/95 backdrop-blur-2xl px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/10 text-white font-semibold"
                      : "text-[#86868b] hover:text-white hover:bg-white/[0.04]"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                </div>
                <span className="text-xs text-[#86868b]">{item.sub}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* 2. Apple Store Sub-ribbon Announcement Strip */}
      <div className="bg-[#121214] border-b border-white/[0.04] py-2 px-4 text-center text-xs text-[#86868b]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span>Buffett Quality & Lynch GARP Screener</span>
          <span className="text-white/20">•</span>
          <span className="hidden sm:inline">10-Yr SEC 10-K NLP & Monte Carlo DCF Analysis</span>
          <NavLink to="/watchlist" className="text-[#2997ff] hover:underline ml-1 font-medium inline-flex items-center gap-0.5">
            Explore Watchlist <Icon name="chevronRight" size={12} />
          </NavLink>
        </div>
      </div>

      {/* 3. Apple Store Category Shelf (Visual Product Rail) */}
      <div className="border-b border-white/[0.06] bg-gradient-to-b from-black to-[#09090b] py-6 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-8 min-w-max">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-2 group transition-all cursor-pointer ${
                    isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-apple ${
                        isActive
                          ? "bg-gradient-to-b from-[#2c2c2e] to-[#1c1c1e] ring-2 ring-[#2997ff] text-[#2997ff] shadow-[0_0_20px_rgba(41,151,255,0.25)]"
                          : "bg-[#1c1c1e]/80 border border-white/[0.08] text-[#a1a1a6] group-hover:text-white group-hover:border-white/[0.18]"
                      }`}
                    >
                      <Icon name={item.icon} size={22} />
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-xs font-medium tracking-tight leading-tight ${
                          isActive ? "text-white font-semibold" : "text-[#86868b] group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[10px] text-[#6e6e73] leading-tight mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Main Page Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="fade-in">
          {children}
        </div>
      </main>

      {/* 5. Apple Store Minimal Dark Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0c0c0e] text-[#86868b] text-xs py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-2 pb-6 border-b border-white/[0.06] text-[11px] leading-relaxed text-[#6e6e73]">
            <p>
              1. <strong>Valuation & Methodology:</strong> DCF valuations utilize 5-year discrete cash flow forecasting with conservative terminal growth rates strictly capped to real GDP bounds (2.5% for US, 7.0% for India).
            </p>
            <p>
              2. <strong>Machine Learning Forecasts:</strong> ML growth projections are derived from pooled XGBoost and Random Forest ensembles trained on historical SEC 10-K XBRL datasets.
            </p>
            <p>
              3. <strong>Disclaimer:</strong> Compounder Screener is an analytical research platform and does not constitute financial, investment, or trading advice.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Icon name="apple" size={14} className="text-[#86868b]" />
              <span>Copyright © 2026 Compounder Screener Inc. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <NavLink to="/watchlist" className="hover:text-white transition-colors">Watchlist</NavLink>
              <NavLink to="/dcf" className="hover:text-white transition-colors">DCF Valuation</NavLink>
              <NavLink to="/financial" className="hover:text-white transition-colors">Financials</NavLink>
              <NavLink to="/sentiment" className="hover:text-white transition-colors">NLP Sentiment</NavLink>
              <NavLink to="/variance" className="hover:text-white transition-colors">Risk Variance</NavLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
