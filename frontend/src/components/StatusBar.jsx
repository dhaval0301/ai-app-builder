import { motion } from 'framer-motion'
import { Loader2, Boxes, GitBranch } from 'lucide-react'

export default function StatusBar({ versionLabel, componentCount, isLoading }) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="flex-shrink-0 flex items-center gap-4 px-4 py-1.5 bg-[#0d0d14] border-t border-white/[0.06] text-[11px] text-gray-600 select-none"
    >
      {/* Loading indicator */}
      {isLoading ? (
        <div className="flex items-center gap-1.5 text-amber-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Generating…</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-green-500">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>Ready</span>
        </div>
      )}

      <div className="w-px h-3 bg-white/[0.08]" />

      {/* Version */}
      <div className="flex items-center gap-1.5">
        <GitBranch className="w-3 h-3" />
        <span>{versionLabel ?? 'No version'}</span>
      </div>

      <div className="w-px h-3 bg-white/[0.08]" />

      {/* Component count */}
      <div className="flex items-center gap-1.5">
        <Boxes className="w-3 h-3" />
        <span>{componentCount} component{componentCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <span>JavaScript · React 18 · Tailwind CSS</span>
        <span className="text-gray-700">AI App Builder v1.0</span>
      </div>
    </motion.div>
  )
}
