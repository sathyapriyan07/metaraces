import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTable, hasSupabase } from "../services/supabaseClient";

export default function CircuitDetails() {
  const { circuitId } = useParams();
  const [circuit, setCircuit] = useState(null);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const res = await fetchTable("circuits", {
        filters: { circuit_id: circuitId },
        limit: 1,
      });
      setCircuit(res.data[0]);
    };
    load();
  }, [circuitId]);

  if (!circuit) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-white/70">
        Circuit profile not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-white/5">
            {circuit.track_map_url ? (
              <img
                src={circuit.track_map_url}
                alt={circuit.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
                No track map available
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Circuit
            </p>
            <h1 className="mt-3 font-f1bold text-3xl">{circuit.name}</h1>
            <div className="mt-4 grid gap-2 text-sm text-white/70">
              <div>Location: {circuit.city}, {circuit.country}</div>
              <div>Track Length: {circuit.length_km} km</div>
              <div>First Grand Prix: {circuit.first_grand_prix}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
