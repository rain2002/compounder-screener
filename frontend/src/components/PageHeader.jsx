export default function PageHeader({ title, subtitle, description, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-blue-500/15">
      <div>
        {subtitle && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 shadow-[0_0_10px_rgba(0,102,255,0.15)]">
              {subtitle}
            </span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {description && (
          <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl mt-1.5">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
