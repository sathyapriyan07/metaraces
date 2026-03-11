import { AnimatePresence, motion } from "framer-motion";

export default function AdminModal({
  open,
  title,
  fields,
  values,
  onChange,
  onClose,
  onSave,
  saving,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel w-full max-w-2xl rounded-3xl p-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {fields.map((field) => {
                const value = values[field.key] ?? "";
                const isUrl = field.key.endsWith("_url");
                return (
                  <div key={field.key} className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={value}
                        onChange={(event) =>
                          onChange(field.key, event.target.value)
                        }
                        className="w-full rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Select</option>
                        {(field.options || []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        value={value}
                        onChange={(event) =>
                          onChange(field.key, event.target.value)
                        }
                        className="w-full rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-sm text-white"
                      />
                    )}
                    {isUrl && value && (
                      <div className="h-24 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                        <img
                          src={value}
                          alt="preview"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="rounded-full bg-f1red px-4 py-2 text-xs uppercase tracking-[0.2em]"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

