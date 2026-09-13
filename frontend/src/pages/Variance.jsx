export default function Variance() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Variance Analysis</h2>
      <p className="text-slate-400 text-sm mb-6">
        Wraps Technical, Sentiment, and DCF outputs to measure forecast uncertainty (Monte Carlo
        spread, model confidence intervals). Wide uncertainty caps the Dashboard rating at
        "Watch" regardless of base-case score. Layer builds in Phase 6, after DCF/Technical/
        Sentiment are live.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {["DCF Spread", "Technical Confidence", "Sentiment Consistency"].map((label) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded p-4">
            <p className="text-slate-400 text-xs">{label}</p>
            <p className="text-2xl font-bold text-slate-500 mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
