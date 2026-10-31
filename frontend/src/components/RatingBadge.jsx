const styles = {
  Buy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  Watch: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  Caution: "bg-orange-500/10 text-orange-400 border-orange-500/25",
  Avoid: "bg-rose-500/10 text-rose-400 border-rose-500/25",
};

const dotColors = {
  Buy: "bg-emerald-400",
  Watch: "bg-amber-400",
  Caution: "bg-orange-400",
  Avoid: "bg-rose-400",
};

export default function RatingBadge({ rating }) {
  if (!rating) return <span className="text-zinc-500 text-xs">—</span>;
  const style = styles[rating] || "bg-zinc-800 text-zinc-300 border-zinc-700";
  const dot = dotColors[rating] || "bg-zinc-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{rating}</span>
    </span>
  );
}
