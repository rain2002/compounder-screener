export default function PageHeader({ title, subtitle, description, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-white/[0.08]">
      <div>
        {subtitle && (
          <div className="flex items-center gap-2 mb-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03]">
              {subtitle}
            </span>
          </div>
        )}
        <h1 className="font-syne text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl mt-2 font-sans">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
