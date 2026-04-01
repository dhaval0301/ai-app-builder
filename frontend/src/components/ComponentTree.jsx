import { motion } from 'framer-motion'
import { Boxes, ChevronRight } from 'lucide-react'

// Map component names to relevant icons / colors for visual variety
const COMPONENT_COLORS = [
  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'text-green-400 bg-green-500/10 border-green-500/20',
  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
]

function ComponentNode({ name, index }) {
  const colorClass = COMPONENT_COLORS[index % COMPONENT_COLORS.length]
  const isApp = name === 'App'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`flex items-center gap-3 p-2.5 rounded-lg border ${
        isApp
          ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
          : `${colorClass}`
      }`}
    >
      <div className="w-5 h-5 rounded-md bg-current/10 flex items-center justify-center flex-shrink-0">
        <Boxes className="w-3 h-3" />
      </div>
      <span className="text-xs font-mono font-medium flex-1 min-w-0 truncate">{name}</span>
      {isApp && (
        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 flex-shrink-0">
          root
        </span>
      )}
    </motion.div>
  )
}

export default function ComponentTree({ components, description }) {
  if (!components || components.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Boxes className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">No components yet</p>
          <p className="text-xs text-gray-700 mt-1">Generate an app to see its component tree</p>
        </div>
      </motion.div>
    )
  }

  // Build a simple tree: App is root, others are children
  const root     = components.find(c => c === 'App') ?? components[0]
  const children = components.filter(c => c !== root)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="p-4 flex flex-col gap-4"
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Component tree
        </p>

        {/* Root */}
        <ComponentNode name={root} index={0} />

        {/* Children */}
        {children.length > 0 && (
          <div className="mt-1 ml-4 flex flex-col gap-1 border-l-2 border-white/[0.06] pl-3 pt-1">
            {children.map((name, i) => (
              <div key={name} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-gray-700 flex-shrink-0" />
                <div className="flex-1">
                  <ComponentNode name={name} index={i + 1} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-xl font-bold text-white mt-0.5">{components.length}</p>
          <p className="text-[10px] text-gray-600">components</p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
          <p className="text-xs text-gray-600">Depth</p>
          <p className="text-xl font-bold text-white mt-0.5">{children.length > 0 ? 2 : 1}</p>
          <p className="text-[10px] text-gray-600">levels</p>
        </div>
      </div>

      {description && (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Description</p>
          <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        </div>
      )}
    </motion.div>
  )
}
