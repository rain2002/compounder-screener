export default function EditableField({ label, value, onChange, step = "0.1", suffix }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</span>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
          className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
