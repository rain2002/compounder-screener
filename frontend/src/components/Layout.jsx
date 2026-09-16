import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";

const links = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/watchlist", label: "Watchlist", icon: "screener" },
  { to: "/dcf", label: "DCF Calculator", icon: "dcf" },
  { to: "/technical", label: "Technical", icon: "technical" },
  { to: "/sentiment", label: "Sentiment", icon: "sentiment" },
  { to: "/variance", label: "Variance", icon: "variance" },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex bg-base">
      <aside className="w-60 border-r border-border/60 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-bold text-white text-sm shrink-0">
              C
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100 leading-tight">Compounder</p>
              <p className="text-xs text-slate-500 leading-tight">Screener</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent/15 text-accent2"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`
              }
            >
              <Icon name={link.icon} size={17} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
