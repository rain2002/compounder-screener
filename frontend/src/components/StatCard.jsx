export default function StatCard({ label, value, tone = "default", icon, sublabel }) {
  const toneClass = {
    default: "text-white",
    good: "text-emerald-400",
    bad: "text-rose-400",
    neutral: "text-zinc-400",
    electric: "text-blue-400",
  }[tone] || "text-white";

  return (
    <div className="card p-5 flex-1 min-w-[200px] hover:border-blue-500/40 transition-all group">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:border-blue-500/40 group-hover:shadow-[0_0_10px_rgba(0,102,255,0.3)] transition-all">
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl sm:text-3xl font-semibold tracking-tight ${toneClass} tabular-nums`}>
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-zinc-500 mt-1.5">
          {sublabel}
        </p>
      )}
    </div>
  );
}
