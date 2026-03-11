export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/90">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-white/60 md:flex-row md:px-8">
        <div>F1 Archive · Historical FIA Formula One World Championship data</div>
        <div className="flex items-center gap-4">
          <span>Supabase Ready</span>
          <span>OpenF1 + Ergast</span>
        </div>
      </div>
    </footer>
  );
}
