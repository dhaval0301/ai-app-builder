import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trash2, RotateCcw, History } from 'lucide-react'

function timeAgo(iso) {
  const ms    = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(ms / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days  > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins  > 0) return `${mins}m ago`
  return 'just now'
}

function VersionCard({ version, index, total, isActive, onSelect, onDelete }) {
  const versionNumber = total - index

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
        isActive
          ? 'bg-violet-500/10 border-violet-500/30'
          : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]'
      }`}
      onClick={() => onSelect(version)}
    >
      {/* Version badge + time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isActive
                ? 'bg-violet-500/30 text-violet-300'
                : 'bg-white/[0.06] text-gray-500'
            }`}
          >
            v{versionNumber}
          </span>
          {isActive && (
            <span className="text-[9px] uppercase tracking-wider text-violet-400 font-semibold">
              active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-gray-600">
          <Clock className="w-3 h-3" />
          <span className="text-[10px]">{timeAgo(version.timestamp)}</span>
        </div>
      </div>

      {/* Prompt */}
      <p className="text-xs text-gray-300 font-medium leading-snug line-clamp-2 mb-2">
        {version.prompt}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-600">
          {version.components?.length ?? 0} components
        </span>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onSelect(version) }}
            className="p-1 rounded-md text-gray-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
            title="Restore this version"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(version.id) }}
            className="p-1 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete this version"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function VersionHistory({
  versions,
  activeVersionId,
  onSelect,
  onDelete,
}) {
  if (!versions || versions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <History className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">No history yet</p>
          <p className="text-xs text-gray-700 mt-1">
            Generated apps will appear here so you can switch between them
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="p-4 flex flex-col gap-2"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
        {versions.length} version{versions.length !== 1 ? 's' : ''} saved
      </p>

      <AnimatePresence>
        {versions.map((version, index) => (
          <VersionCard
            key={version.id}
            version={version}
            index={index}
            total={versions.length}
            isActive={version.id === activeVersionId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
