export default function AdminTable({
  columns,
  rows,
  sort,
  onSort,
  onEdit,
  onDelete,
  extraActions,
  selected,
  onToggleRow,
  onToggleAll,
}) {
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.__id));

  return (
    <div className="overflow-x-auto scrollbar-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-white/50">
          <tr>
            <th className="py-2 pr-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onToggleAll(!allSelected)}
              />
            </th>
            {columns.map((col) => (
              <th key={col.key} className="py-2 pr-3">
                {col.sortable ? (
                  <button
                    onClick={() => onSort(col.key)}
                    className="flex items-center gap-2 text-left hover:text-white"
                  >
                    {col.label}
                    {sort.column === col.key && (
                      <span>{sort.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            <th className="py-2 pr-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.__id}
              className="border-t border-white/5 text-white/80 hover:bg-white/5"
            >
              <td className="py-2 pr-3">
                <input
                  type="checkbox"
                  checked={selected.has(row.__id)}
                  onChange={() => onToggleRow(row.__id)}
                />
              </td>
              {columns.map((col) => (
                <td key={col.key} className="py-2 pr-3">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              <td className="py-2 pr-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(row)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 hover:text-white"
                  >
                    Edit
                  </button>
                  {extraActions &&
                    extraActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => action.onClick(row)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 hover:text-white"
                      >
                        {action.label}
                      </button>
                    ))}
                  <button
                    onClick={() => onDelete(row)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr className="border-t border-white/5">
              <td className="py-3 text-white/50" colSpan={columns.length + 2}>
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
