export default function StatCard({ label, value, tone = "default", icon, sublabel }) {
  const toneClass = {
    default: "text-[#f5f5f7]",
    good: "text-[#30d158]",
    bad: "text-[#ff453a]",
    neutral: "text-[#86868b]",
  }[tone];

  return (
    <div className="card-glass card-hover p-5 flex-1 min-w-[180px] relative overflow-hidden group">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[#86868b] text-xs font-semibold uppercase tracking-wider">{label}</p>
        {icon && (
          <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-[#a1a1a6] group-hover:text-white transition-colors">
            {icon}
          </div>
        )}
      </div>
      <p className={`stat-value text-2xl sm:text-3xl font-bold tracking-tight ${toneClass}`}>{value}</p>
      {sublabel && <p className="text-xs text-[#86868b] mt-1 font-medium">{sublabel}</p>}
    </div>
  );
}
