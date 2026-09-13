const styles = {
  Buy: "bg-buy/20 text-buy border border-buy",
  Watch: "bg-watch/20 text-watch border border-watch",
  Caution: "bg-caution/20 text-caution border border-caution",
  Avoid: "bg-avoid/20 text-avoid border border-avoid",
};

export default function RatingBadge({ rating }) {
  if (!rating) return null;
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${
        styles[rating] || "bg-slate-700 text-slate-200"
      }`}
    >
      {rating}
    </span>
  );
}
