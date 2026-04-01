import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, ArrowRight, Lightbulb, Wand2, Zap, Check } from 'lucide-react'
import { enhancePromptStream } from '../hooks/useGenerate.js'

const STYLE_PRESETS = [
  { id: 'glass',    label: 'Glassmorphism', modifier: 'with glassmorphism cards, frosted glass effects, and deep dark backgrounds' },
  { id: 'neon',     label: 'Neon',          modifier: 'with neon glow accents, cyberpunk color scheme (cyan/magenta/purple), and dark backgrounds' },
  { id: 'minimal',  label: 'Minimal',       modifier: 'with a ultra-clean minimal design, generous whitespace, and subtle shadows' },
  { id: 'colorful', label: 'Colorful',      modifier: 'with vibrant multi-color gradients, bold typography, and expressive visual hierarchy' },
  { id: 'corporate',label: 'Corporate',     modifier: 'with a professional corporate style, structured data-dense layout, and muted tones' },
]

const EXAMPLES = [
  'A fitness tracker with workout logs & charts',
  'A crypto portfolio dashboard with live prices',
  'A recipe manager with search and categories',
  'A kanban project board with drag-and-drop',
  'An e-commerce product page with cart',
  'A music player with playlists and waveform',
  'A social media analytics dashboard',
]

const PROVIDER_COLORS = {
  openai:    'bg-green-500/20 text-green-400 border-green-500/30',
  anthropic: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  gemini:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ollama:    'bg-purple-500/20 text-purple-400 border-purple-500/30',
  template:  'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export default function PromptPanel({
  prompt,
  onPromptChange,
  onGenerate,
  onModify,
  isLoading,
  isModifying,
  hasCode,
  providerUsed,
  description,
}) {
  const [modifyInput, setModifyInput]   = useState('')
  const [isEnhancing, setIsEnhancing]   = useState(false)
  const [enhancedPreview, setEnhancedPreview] = useState('')
  const [activePreset, setActivePreset] = useState(null)
  const busy = isLoading || isModifying || isEnhancing

  const handleEnhance = async () => {
    if (!prompt.trim() || busy) return
    setIsEnhancing(true)
    setEnhancedPreview('')
    await enhancePromptStream(prompt, {
      onToken:  (text) => setEnhancedPreview(text),
      onDone:   (text) => { onPromptChange(text); setEnhancedPreview(''); setIsEnhancing(false) },
      onError:  ()    => setIsEnhancing(false),
    })
  }

  const handlePreset = (preset) => {
    if (activePreset === preset.id) {
      // deselect — strip the modifier from the prompt
      setActivePreset(null)
      onPromptChange(prompt.replace(` ${preset.modifier}`, '').trim())
    } else {
      // replace previous preset modifier if any, then append new
      let base = prompt
      const prev = STYLE_PRESETS.find(p => p.id === activePreset)
      if (prev) base = base.replace(` ${prev.modifier}`, '').trim()
      setActivePreset(preset.id)
      onPromptChange(base ? `${base} ${preset.modifier}` : preset.modifier)
    }
  }

  const handleModifySubmit = () => {
    if (!modifyInput.trim() || busy) return
    onModify(modifyInput.trim())
    setModifyInput('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="p-4 flex flex-col gap-5"
    >
      {/* Provider badge */}
      {providerUsed && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest">AI</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${PROVIDER_COLORS[providerUsed] ?? PROVIDER_COLORS.template}`}>
            {providerUsed}
          </span>
        </div>
      )}

      {/* Style Presets */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Style</label>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map(preset => (
            <motion.button
              key={preset.id}
              onClick={() => handlePreset(preset)}
              disabled={busy}
              whileTap={{ scale: 0.94 }}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                activePreset === preset.id
                  ? 'bg-violet-500/20 border-violet-500/60 text-violet-300'
                  : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-gray-200 hover:border-white/[0.15]'
              }`}
            >
              {activePreset === preset.id && <Check className="w-2.5 h-2.5 inline mr-1" />}
              {preset.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Textarea + Enhance */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Describe your app</label>
          <motion.button
            onClick={handleEnhance}
            disabled={!prompt.trim() || busy}
            whileHover={prompt.trim() && !busy ? { scale: 1.05 } : undefined}
            whileTap={prompt.trim() && !busy ? { scale: 0.95 } : undefined}
            title="AI will rewrite your prompt to be more detailed"
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isEnhancing
              ? <><Loader2 className="w-3 h-3 animate-spin" />Enhancing…</>
              : <><Zap className="w-3 h-3" />Enhance</>
            }
          </motion.button>
        </div>
        <div className="relative">
          <textarea
            value={isEnhancing ? enhancedPreview : prompt}
            onChange={e => onPromptChange(e.target.value)}
            placeholder="e.g. Build a fitness tracker with workout logs, progress charts, and a dark dashboard UI…"
            disabled={busy}
            rows={5}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onGenerate() }}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all leading-relaxed disabled:opacity-50"
          />
          <AnimatePresence>
            {isEnhancing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-xl border border-amber-500/30 bg-amber-500/5 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>
        <p className="text-[10px] text-gray-600">⌘ + Enter to generate · ⚡ Enhance rewrites your idea with design details</p>
      </div>

      {/* Generate button */}
      <motion.button
        onClick={onGenerate}
        disabled={busy || !prompt.trim()}
        whileHover={!busy && prompt.trim() ? { scale: 1.02 } : undefined}
        whileTap={!busy && prompt.trim() ? { scale: 0.97 } : undefined}
        className="relative w-full py-3 rounded-xl font-semibold text-sm overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed group btn-glow"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600" />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <span className="relative flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate App
            </>
          )}
        </span>
      </motion.button>

      {/* Streaming skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[100, 80, 92, 60].map((w, i) => (
            <div key={i} className="h-2.5 rounded-full shimmer" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {/* Modify section — only visible when code exists */}
      {hasCode && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-gray-600 uppercase tracking-wider flex items-center gap-1">
              <Wand2 className="w-3 h-3" />
              Modify
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <textarea
            value={modifyInput}
            onChange={e => setModifyInput(e.target.value)}
            placeholder="e.g. Make the header blue, add a dark mode toggle…"
            disabled={busy}
            rows={3}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleModifySubmit() }}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all leading-relaxed disabled:opacity-50"
          />
          <motion.button
            onClick={handleModifySubmit}
            disabled={busy || !modifyInput.trim()}
            whileHover={!busy && modifyInput.trim() ? { scale: 1.02 } : undefined}
            whileTap={!busy && modifyInput.trim() ? { scale: 0.97 } : undefined}
            className="w-full py-2.5 rounded-xl font-semibold text-sm border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isModifying ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Modifying…</>
            ) : (
              <><Wand2 className="w-3.5 h-3.5" />Apply Changes</>
            )}
          </motion.button>
        </div>
      )}

      {/* Generated description card */}
      {description && !busy && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">
              What was built
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{description}</p>
        </motion.div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Examples</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Example prompts */}
      <div className="flex flex-col gap-1">
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => onPromptChange(ex)}
            disabled={busy}
            className="group flex items-center gap-2 text-left text-xs text-gray-600 hover:text-violet-400 transition-colors py-1.5 px-2 rounded-lg hover:bg-violet-500/10 disabled:opacity-40"
          >
            <ArrowRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span>{ex}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

