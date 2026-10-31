export default function StatCard({ label, value, tone = "default", icon, sublabel }) {
  const toneClass = {
    default: "text-zinc-100",
    good: "text-emerald-400",
    bad: "text-rose-400",
    neutral: "text-zinc-400",
  }[tone];

  return (
    <div className="card p-5 flex-1 min-w-[200px] hover:border-zinc-700/80 transition-all group">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
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
