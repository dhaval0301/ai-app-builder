import { motion } from 'framer-motion'
import { Download, Zap, Github } from 'lucide-react'

export default function Header({ onExport, hasCode, isLoading }) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-[#0d0d14] border-b border-white/[0.06] z-10"
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white leading-none">
            AI App Builder
          </h1>
          <p className="text-[10px] text-gray-600 leading-none mt-0.5">
            Powered by GPT-4o
          </p>
        </div>
      </div>

      {/* Status pill */}
      <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'
          }`}
        />
        <span className="text-[11px] text-gray-400">
          {isLoading ? 'Generating…' : 'Ready'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          title="View on GitHub"
        >
          <Github className="w-4.5 h-4.5" />
        </a>

        <motion.button
          onClick={onExport}
          disabled={!hasCode}
          whileHover={hasCode ? { scale: 1.04 } : undefined}
          whileTap={hasCode ? { scale: 0.96 } : undefined}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-gray-200"
          title="Export project as ZIP"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </motion.button>
      </div>
    </motion.header>
  )
}
