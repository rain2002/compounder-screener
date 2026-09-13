import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/screener", label: "Screener" },
  { to: "/dcf", label: "DCF Calculator" },
  { to: "/technical", label: "Technical" },
  { to: "/sentiment", label: "Sentiment" },
  { to: "/variance", label: "Variance" },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-2">
        <h1 className="text-lg font-bold mb-4 text-slate-100">
          Compounder<br />Screener
        </h1>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-3 py-2 rounded text-sm font-medium ${
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
