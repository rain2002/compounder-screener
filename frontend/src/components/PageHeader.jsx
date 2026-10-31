export default function PageHeader({ title, subtitle, description, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
      <div>
        {subtitle && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-zinc-400 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03]">
              {subtitle}
            </span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
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
