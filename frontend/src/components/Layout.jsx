import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/watchlist", label: "Watchlist", icon: "screener" },
  { to: "/dcf", label: "DCF Model", icon: "dcf" },
  { to: "/financial", label: "Financials", icon: "technical" },
  { to: "/sentiment", label: "Sentiment", icon: "sentiment" },
  { to: "/variance", label: "Variance", icon: "variance" },
];

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col selection:bg-blue-600/30 selection:text-blue-100">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#05070f]/85 border-b border-blue-500/15 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <NavLink
            to="/"
            className="flex items-center gap-3 text-white hover:opacity-95 transition-opacity group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 border border-blue-400/30 flex items-center justify-center text-white shadow-[0_0_18px_rgba(0,102,255,0.45)] group-hover:shadow-[0_0_24px_rgba(0,102,255,0.7)] transition-all">
              <Icon name="compounder" size={17} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-white tracking-tight">
                Compounder
              </span>
              <span className="text-[11px] font-semibold text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 hidden sm:inline-block">
                Screener
              </span>
            </div>
          </NavLink>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/35 shadow-[0_0_12px_rgba(0,102,255,0.25)] font-semibold"
                      : "text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10"
                  }`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-950/40 border border-blue-500/25 text-xs text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#0066FF] animate-pulse" />
              <span>Live Engine</span>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
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
          <div className="lg:hidden border-t border-blue-500/20 bg-[#070b18]/95 backdrop-blur-2xl px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-zinc-400 hover:text-blue-200 hover:bg-blue-500/10"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>

      {/* Refined Footer */}
      <footer className="border-t border-blue-500/15 bg-[#05070f] mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_12px_rgba(0,102,255,0.3)]">
                <Icon name="compounder" size={15} />
              </div>
              <div>
                <span className="font-semibold text-sm text-white">Compounder Screener</span>
                <p className="text-xs text-zinc-500">
                  Dual-Market Fundamental Valuation Terminal
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400">
              <NavLink to="/" className="hover:text-blue-300 transition-colors">Dashboard</NavLink>
              <NavLink to="/watchlist" className="hover:text-blue-300 transition-colors">Watchlist</NavLink>
              <NavLink to="/dcf" className="hover:text-blue-300 transition-colors">DCF Simulation</NavLink>
              <NavLink to="/financial" className="hover:text-blue-300 transition-colors">Financials</NavLink>
              <NavLink to="/sentiment" className="hover:text-blue-300 transition-colors">Sentiment</NavLink>
              <NavLink to="/variance" className="hover:text-blue-300 transition-colors">Variance Envelope</NavLink>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <p>© 2026 Compounder Screener. Released under AGPL-3.0 License.</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#0066FF]" />
                <span>US Equities &amp; India Equities Active</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
