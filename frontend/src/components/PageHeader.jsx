export default function PageHeader({ title, subtitle, description, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-2">
      <div>
        {subtitle && (
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2997ff] mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
            {subtitle}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[#86868b] text-sm sm:text-base leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
