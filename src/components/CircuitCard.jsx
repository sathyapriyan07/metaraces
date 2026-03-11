import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function CircuitCard({ circuit }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="glass-panel group rounded-2xl p-4 transition"
    >
      <div className="h-32 overflow-hidden rounded-xl bg-white/5">
        {circuit.track_map_url ? (
          <img
            src={circuit.track_map_url}
            alt={circuit.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
            No map
          </div>
        )}
      </div>
      <div className="mt-3 font-f1bold text-lg">{circuit.name}</div>
      <div className="text-xs text-white/60">
        {circuit.country} · {circuit.length_km || "--"} km
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <span>First GP {circuit.first_grand_prix || "—"}</span>
        <Link
          to={`/circuits/${circuit.circuit_id}`}
          className="text-f1red transition group-hover:text-white"
        >
          View circuit
        </Link>
      </div>
    </motion.div>
  );
}
