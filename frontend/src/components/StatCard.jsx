export default function StatCard({ label, value, tone = "default", icon, sublabel }) {
  const toneClass = {
    default: "text-white",
    good: "text-[#22c55e]",
    bad: "text-[#ef4444]",
    neutral: "text-neutral-400",
  }[tone];

  return (
    <div className="card card-hover p-6 flex-1 min-w-[200px] bg-[#111111] border border-white/10 rounded-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest">{label}</p>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:border-white/20 transition-all">
            {icon}
          </div>
        )}
      </div>
      <p className={`stat-value text-3xl sm:text-4xl font-syne font-extrabold tracking-tight ${toneClass}`}>
        {value}
      </p>
      {sublabel && (
        <p className="font-mono text-[11px] text-neutral-500 mt-2 uppercase tracking-wide">
          {sublabel}
        </p>
      )}
    </div>
  );
}
