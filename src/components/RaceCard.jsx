import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function RaceCard({ race }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="glass-panel group rounded-2xl p-4 transition"
    >
      <div className="text-xs uppercase tracking-[0.18em] text-white/50">
        Round {race.round} · {race.season_year}
      </div>
      <div className="mt-2 font-f1bold text-lg">{race.name}</div>
      <div className="text-xs text-white/60">
        {race.circuit?.name || "Unknown Circuit"}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <span>{race.date || "TBD"}</span>
        <Link
          to={`/races/${race.race_id}`}
          className="text-f1red transition group-hover:text-white"
        >
          View race
        </Link>
      </div>
    </motion.div>
  );
}
