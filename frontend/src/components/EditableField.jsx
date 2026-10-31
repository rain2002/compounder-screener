export default function EditableField({ label, value, onChange, step = "0.1", suffix }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
          className="w-full bg-zinc-900/90 border border-white/10 rounded-lg px-3.5 py-2 text-zinc-100 text-sm font-medium focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all tabular-nums"
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none font-medium">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
