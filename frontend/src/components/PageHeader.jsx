export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5">{title}</h1>
        {description && (
          <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
