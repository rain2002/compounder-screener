const styles = {
  Buy: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30 dot-[#22c55e]",
  Watch: "bg-[#eab308]/10 text-[#eab308] border-[#eab308]/30 dot-[#eab308]",
  Caution: "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30 dot-[#f97316]",
  Avoid: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 dot-[#ef4444]",
};

const dotColors = {
  Buy: "bg-[#22c55e]",
  Watch: "bg-[#eab308]",
  Caution: "bg-[#f97316]",
  Avoid: "bg-[#ef4444]",
};

export default function RatingBadge({ rating }) {
  if (!rating) return <span className="font-mono text-neutral-600 text-xs">—</span>;
  const style = styles[rating] || "bg-white/5 text-neutral-300 border-white/10";
  const dot = dotColors[rating] || "bg-white";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider border ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{rating}</span>
    </span>
  );
}
