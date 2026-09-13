export default function StatCard({ label, value, tone = "default", icon }) {
  const toneClass = {
    default: "text-slate-100",
    good: "text-buy",
    bad: "text-avoid",
    neutral: "text-slate-400",
  }[tone];

  return (
    <div className="card card-hover p-5 flex-1 min-w-[160px]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        {icon}
      </div>
      <p className={`stat-value text-2xl ${toneClass}`}>{value}</p>
    </div>
  );
}
