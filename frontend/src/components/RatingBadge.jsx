const styles = {
  Buy: "bg-buy/15 text-buy ring-1 ring-inset ring-buy/30",
  Watch: "bg-watch/15 text-watch ring-1 ring-inset ring-watch/30",
  Caution: "bg-caution/15 text-caution ring-1 ring-inset ring-caution/30",
  Avoid: "bg-avoid/15 text-avoid ring-1 ring-inset ring-avoid/30",
};

export default function RatingBadge({ rating }) {
  if (!rating) return <span className="text-slate-600 text-sm">—</span>;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        styles[rating] || "bg-slate-700/30 text-slate-300"
      }`}
    >
      {rating}
    </span>
  );
}
