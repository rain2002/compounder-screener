const styles = {
  Buy: "bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30 shadow-[0_0_12px_rgba(48,209,88,0.15)]",
  Watch: "bg-[#ffd60a]/15 text-[#ffd60a] border border-[#ffd60a]/30 shadow-[0_0_12px_rgba(255,214,10,0.15)]",
  Caution: "bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/30 shadow-[0_0_12px_rgba(255,159,10,0.15)]",
  Avoid: "bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/30 shadow-[0_0_12px_rgba(255,69,58,0.15)]",
};

export default function RatingBadge({ rating }) {
  if (!rating) return <span className="text-[#86868b] text-sm">—</span>;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide backdrop-blur-md transition-all ${
        styles[rating] || "bg-white/10 text-white border border-white/10"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-90 animate-pulse" />
      {rating}
    </span>
  );
}
