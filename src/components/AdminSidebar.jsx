export default function AdminSidebar({ sections, active, onChange }) {
  return (
    <aside className="glass-panel h-full w-full rounded-3xl p-4 md:sticky md:top-24 md:w-64">
      <div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">
        Admin
      </div>
      <nav className="grid gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onChange(section.id)}
            className={`rounded-xl px-3 py-2 text-left text-sm transition ${
              active === section.id
                ? "bg-f1red/20 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
