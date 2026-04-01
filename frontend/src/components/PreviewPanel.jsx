import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Maximize2, AlertTriangle, Smartphone, Tablet, Monitor, Terminal, X, Trash2 } from 'lucide-react'
import { generatePreviewHTML } from '../utils/previewTemplate.js'

const VIEWPORTS = [
  { id: 'mobile',  label: 'Mobile',  icon: Smartphone, width: '375px'  },
  { id: 'tablet',  label: 'Tablet',  icon: Tablet,    width: '768px'  },
  { id: 'desktop', label: 'Desktop', icon: Monitor,   width: '100%'   },
]

export default function PreviewPanel({ code, isLoading }) {
  const iframeRef         = useRef(null)
  const consoleEndRef     = useRef(null)
  const [key, setKey]     = useState(0)
  const [hasError, setHasError] = useState(false)
  const [viewport, setViewport] = useState('desktop')
  const [showConsole, setShowConsole] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState([])

  // Listen for console messages from the preview iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type !== '__console') return
      setConsoleLogs(prev => [...prev.slice(-199), {
        level: e.data.level,
        args:  e.data.args,
        ts:    e.data.ts,
        id:    Math.random(),
      }])
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Auto-scroll console to bottom
  useEffect(() => {
    if (showConsole) consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLogs, showConsole])

  // Clear logs when new code is loaded
  useEffect(() => {
    setConsoleLogs([])
  }, [code])

  // Re-render whenever code changes
  useEffect(() => {
    setHasError(false)
    if (!iframeRef.current) return
    const html = generatePreviewHTML(code)
    iframeRef.current.srcdoc = html
  }, [code])
  const errorCount = consoleLogs.filter(l => l.level === 'error').length

  const handleRefresh = useCallback(() => {
    setKey(k => k + 1)
    setHasError(false)
  }, [])

  const handleOpenInTab = useCallback(() => {
    const html = generatePreviewHTML(code)
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [code])

  const currentWidth = VIEWPORTS.find(v => v.id === viewport)?.width ?? '100%'

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0d0d14] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60"   />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60"/>
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] text-gray-600 font-mono ml-1 select-none">
            localhost:preview
          </span>
        </div>

        {/* Viewport toggle */}
        <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
          {VIEWPORTS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewport(id)}
              title={label}
              className={`p-1.5 rounded-md transition-colors ${
                viewport === id
                  ? 'bg-violet-500/30 text-violet-400'
                  : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {hasError && (
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] mr-2">
              <AlertTriangle className="w-3 h-3" />
              <span>Preview error</span>
            </div>
          )}
          <button
            onClick={() => setShowConsole(s => !s)}
            title="Toggle console"
            className={`relative p-1.5 rounded-lg transition-colors ${
              showConsole
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.05]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            {consoleLogs.length > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                errorCount > 0 ? 'bg-rose-500 text-white' : 'bg-violet-500 text-white'
              }`}>
                {consoleLogs.length > 9 ? '9+' : consoleLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenInTab}
            disabled={!code}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Open in new tab"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 relative overflow-auto bg-[#0a0a0f]">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0f] gap-4"
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 loading-ring" />
                <div className="absolute inset-1 rounded-full bg-[#0a0a0f]" />
                <div className="absolute inset-0 flex items-center justify-center text-xl">⚡</div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-300">Building your app…</p>
                <p className="text-xs text-gray-600 mt-1">Streaming code in real-time</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {viewport === 'desktop' ? (
          <div className="w-full h-full">
            <iframe
              key={key}
              ref={iframeRef}
              title="App Preview"
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0"
              srcDoc={generatePreviewHTML(code)}
              onError={() => setHasError(true)}
            />
          </div>
        ) : (
          <div
            className="flex justify-center items-start py-8 min-h-full"
            style={{ background: 'radial-gradient(ellipse at center, #13131f 0%, #0a0a0f 70%)' }}
          >
            <motion.div
              key={viewport}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className={`relative flex-shrink-0 overflow-hidden bg-black ${
                viewport === 'mobile'
                  ? 'rounded-[2.8rem] border-[8px] border-gray-700/90'
                  : 'rounded-[1.8rem] border-[10px] border-gray-700/90'
              }`}
              style={{
                width:  viewport === 'mobile' ? 390 : 768,
                height: viewport === 'mobile' ? 844 : 1024,
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.06), 0 40px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {/* Side buttons (mobile only) */}
              {viewport === 'mobile' && (
                <>
                  <div className="absolute -left-[10px] top-24 w-[4px] h-10 rounded-l-full bg-gray-600/80" />
                  <div className="absolute -left-[10px] top-40 w-[4px] h-14 rounded-l-full bg-gray-600/80" />
                  <div className="absolute -left-[10px] top-56 w-[4px] h-14 rounded-l-full bg-gray-600/80" />
                  <div className="absolute -right-[10px] top-36 w-[4px] h-20 rounded-r-full bg-gray-600/80" />
                </>
              )}
              {/* Dynamic Island */}
              {viewport === 'mobile' && (
                <div className="absolute top-0 inset-x-0 flex justify-center z-20 pointer-events-none" style={{ paddingTop: 14 }}>
                  <div className="flex items-center gap-1.5 px-4 h-7 rounded-full bg-black">
                    <div className="w-2 h-2 rounded-full bg-[#1c1c1e]" />
                    <div className="w-14 h-[7px] rounded-full bg-[#1c1c1e]" />
                    <div className="w-2 h-2 rounded-full bg-[#1c1c1e]" />
                  </div>
                </div>
              )}
              {/* Camera dot — tablet */}
              {viewport === 'tablet' && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-600/60 z-20 pointer-events-none" />
              )}

              <iframe
                key={key}
                ref={iframeRef}
                title="App Preview"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-0"
                srcDoc={generatePreviewHTML(code)}
                onError={() => setHasError(true)}
              />

              {/* Home indicator */}
              {viewport === 'mobile' && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-[5px] rounded-full bg-gray-400/20 z-20 pointer-events-none" />
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Console Panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showConsole && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 200, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="flex-shrink-0 border-t border-white/[0.06] bg-[#0d0d14] overflow-hidden flex flex-col"
          >
            {/* Console header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-gray-500" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Console</span>
                {consoleLogs.length > 0 && (
                  <span className="text-[10px] text-gray-600">{consoleLogs.length} message{consoleLogs.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              <button
                onClick={() => setConsoleLogs([])}
                className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-300 transition-colors"
                title="Clear console"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Log entries */}
            <div className="flex-1 overflow-y-auto px-2 py-1 font-mono text-[11px]">
              {consoleLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-600">
                  No console output yet
                </div>
              ) : (
                consoleLogs.map(log => (
                  <div
                    key={log.id}
                    className={`flex gap-2 py-0.5 border-b border-white/[0.03] ${{
                      error: 'text-rose-400 bg-rose-500/5',
                      warn:  'text-amber-400 bg-amber-500/5',
                      info:  'text-blue-400',
                      log:   'text-gray-300',
                    }[log.level] ?? 'text-gray-300'}`}
                  >
                    <span className="text-gray-600 flex-shrink-0 select-none">
                      {log.level === 'error' ? '✖' : log.level === 'warn' ? '⚠' : log.level === 'info' ? 'ℹ' : '›'}
                    </span>
                    <span className="break-all whitespace-pre-wrap">{log.args.join(' ')}</span>
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

