export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        className="rounded-full border border-white/10 px-3 py-2 text-white/70 hover:text-white"
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, index) => {
        const value = index + 1;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`rounded-full px-3 py-2 ${
              value === page
                ? "bg-f1red text-white"
                : "border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {value}
          </button>
        );
      })}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        className="rounded-full border border-white/10 px-3 py-2 text-white/70 hover:text-white"
      >
        Next
      </button>
    </div>
  );
}
