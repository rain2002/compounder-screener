import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";

const links = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/screener", label: "Screener", icon: "screener" },
  { to: "/dcf", label: "DCF Calculator", icon: "dcf" },
  { to: "/technical", label: "Technical", icon: "technical" },
  { to: "/sentiment", label: "Sentiment", icon: "sentiment" },
  { to: "/variance", label: "Variance", icon: "variance" },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex bg-base">
      <aside className="w-64 border-r border-border/60 flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-bold text-white text-sm">
              C
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Compounder</p>
              <p className="text-slate-500 text-xs leading-tight">Screener</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent/10 text-accent2 shadow-glow"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`
              }
            >
              <Icon name={link.icon} className="w-4.5 h-4.5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-border/60">
          <p className="text-slate-600 text-xs leading-relaxed">
            Buffett + Lynch screener · US & India
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8 fade-in">{children}</div>
      </main>
    </div>
  );
}
