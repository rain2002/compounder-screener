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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-zinc-800 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#09090b]/85 border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <NavLink
            to="/"
            className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/15 flex items-center justify-center text-white shadow-sm">
              <Icon name="compounder" size={17} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-zinc-100 tracking-tight">
                Compounder
              </span>
              <span className="text-[11px] font-medium text-zinc-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 hidden sm:inline-block">
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
                      ? "bg-white/[0.1] text-white border border-white/10 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Engine</span>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
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
          <div className="lg:hidden border-t border-white/[0.08] bg-[#0c0c0e]/95 backdrop-blur-2xl px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/[0.1] text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
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
      <footer className="border-t border-white/[0.08] bg-[#09090b] mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/15 flex items-center justify-center text-white">
                <Icon name="compounder" size={15} />
              </div>
              <span className="font-semibold text-sm text-zinc-200">Compounder Screener</span>
            </div>
            <div className="flex flex-wrap gap-6 text-xs text-zinc-400">
              <NavLink to="/" className="hover:text-zinc-200 transition-colors">Dashboard</NavLink>
              <NavLink to="/watchlist" className="hover:text-zinc-200 transition-colors">Watchlist</NavLink>
              <NavLink to="/dcf" className="hover:text-zinc-200 transition-colors">DCF Valuation</NavLink>
              <NavLink to="/financial" className="hover:text-zinc-200 transition-colors">Financials</NavLink>
              <NavLink to="/variance" className="hover:text-zinc-200 transition-colors">Variance</NavLink>
              <NavLink to="/sentiment" className="hover:text-zinc-200 transition-colors">Sentiment</NavLink>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 text-xs text-zinc-500">
            <p>© 2026 Raja Nithin. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Licensed under GNU AGPLv3 • Open Source</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
