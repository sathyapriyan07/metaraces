export default function StandingsTable({ title, rows, type = "driver" }) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-f1bold text-lg">{title}</h3>
        <span className="text-xs uppercase tracking-[0.2em] text-white/50">
          {rows.length} entries
        </span>
      </div>
      <div className="overflow-x-auto scrollbar-hidden">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-white/50">
            <tr>
              <th className="py-2 pr-3">Pos</th>
              <th className="py-2 pr-3">{type === "driver" ? "Driver" : "Team"}</th>
              <th className="py-2 pr-3">Wins</th>
              <th className="py-2 pr-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id || row.driver_id || row.constructor_id}
                className="border-t border-white/5 text-white/80"
              >
                <td className="py-2 pr-3">{row.position}</td>
                <td className="py-2 pr-3">
                  {type === "driver"
                    ? row.driver_name || row.name || row.driver?.name
                    : row.constructor_name || row.name || row.constructor?.name}
                </td>
                <td className="py-2 pr-3">{row.wins}</td>
                <td className="py-2 pr-3">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
