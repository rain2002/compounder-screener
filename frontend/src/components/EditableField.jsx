export default function EditableField({ label, value, onChange, step = "0.1", suffix }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
          className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white text-sm font-semibold focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] transition-all"
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] text-xs font-medium">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
