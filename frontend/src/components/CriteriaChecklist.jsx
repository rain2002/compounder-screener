export default function CriteriaChecklist({ checks }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
      {checks.map((c, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
            c.pass ? "bg-buy/20 text-buy" : "bg-avoid/20 text-avoid"
          }`}>
            {c.pass ? "✓" : "✕"}
          </span>
          <span className={c.pass ? "text-slate-300" : "text-slate-500"}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}
