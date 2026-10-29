export default function EditableField({ label, value, onChange, step = "0.1", suffix }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">{label}</span>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
          className="w-full bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-white font-mono text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-neutral-400 text-xs pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
