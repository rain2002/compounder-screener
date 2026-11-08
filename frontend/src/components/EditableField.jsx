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
          className="w-full bg-[#05070f] border border-blue-500/20 hover:border-blue-500/40 rounded-lg px-3.5 py-2 text-zinc-100 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all tabular-nums"
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400 text-xs pointer-events-none font-medium">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
