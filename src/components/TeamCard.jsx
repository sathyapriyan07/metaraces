import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function TeamCard({ team }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="glass-panel group rounded-2xl p-4 transition"
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/5 p-2">
          {team.logo_url ? (
            <img
              src={team.logo_url}
              alt={team.name}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
              No logo
            </div>
          )}
        </div>
        <div>
          <div className="font-f1bold text-lg">{team.name}</div>
          <div className="text-xs text-white/60">{team.nationality}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <span>ID {team.constructor_id}</span>
        <Link
          to={`/constructors/${team.constructor_id}`}
          className="text-f1red transition group-hover:text-white"
        >
          View team
        </Link>
      </div>
    </motion.div>
  );
}
