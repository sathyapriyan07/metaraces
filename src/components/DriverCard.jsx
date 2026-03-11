import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function DriverCard({ driver }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="glass-panel group rounded-2xl p-4 transition"
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/5">
          {driver.photo_url ? (
            <img
              src={driver.photo_url}
              alt={`${driver.first_name} ${driver.last_name}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
              No photo
            </div>
          )}
        </div>
        <div>
          <div className="font-f1bold text-lg">
            {driver.first_name} {driver.last_name}
          </div>
          <div className="text-xs text-white/60">{driver.nationality}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <span>Debut {driver.debut_year || "—"}</span>
        <Link
          to={`/drivers/${driver.driver_id}`}
          className="text-f1red transition group-hover:text-white"
        >
          View profile
        </Link>
      </div>
    </motion.div>
  );
}
