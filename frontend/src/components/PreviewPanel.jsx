import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Maximize2, AlertTriangle, Smartphone, Tablet, Monitor, Terminal, X, Trash2 } from 'lucide-react'
import { generatePreviewHTML } from '../utils/previewTemplate.js'

const VIEWPORTS = [
  { id: 'mobile',  label: 'Mobile',  icon: Smartphone, width: '375px'  },
  { id: 'tablet',  label: 'Tablet',  icon: Tablet,    width: '768px'  },
  { id: 'desktop', label: 'Desktop', icon: Monitor,   width: '100%'   },
]

// ─── Device frame (phone / tablet) ─────────────────────────────────────────
// The iframe renders at the true device content width so Tailwind responsive
// breakpoints fire correctly and the layout reflows like a real browser.
const DEVICE = {
  mobile: { outerW: 390, outerH: 844, border: 8,  radius: '2.5rem' },
  tablet: { outerW: 768, outerH: 1024, border: 10, radius: '1.6rem' },
}

function DeviceFrame({ viewport, iframeKey, iframeRef, code, setHasError }) {
  const d      = DEVICE[viewport]
  const innerW = d.outerW - d.border * 2
  const innerH = d.outerH - d.border * 2

  // Auto-fit: scale the whole device mockup so it always fits the container
  const containerRef  = useRef(null)
  const [fitScale, setFitScale] = useState(1)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const margin = 48  // 24px each side
      const sx = (width  - margin) / d.outerW
      const sy = (height - margin) / d.outerH
      setFitScale(Math.min(sx, sy, 1))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [viewport, d.outerW, d.outerH])

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-center w-full h-full"
      style={{ background: 'radial-gradient(ellipse at center, #13131f 0%, #0a0a0f 70%)' }}
    >
      <motion.div
        key={viewport}
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: fitScale, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="relative flex-shrink-0 bg-black"
        style={{
          transformOrigin: 'center center',
          width:        d.outerW,
          height:       d.outerH,
          borderRadius: d.radius,
          border:       `${d.border}px solid rgba(80,80,90,0.85)`,
          boxShadow:    '0 0 0 1px rgba(255,255,255,0.07), 0 40px 100px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.08)',
          overflow:     'hidden',
        }}
      >
        {/* ── Mobile hardware chrome ── */}
        {viewport === 'mobile' && (
          <>
            {/* Side buttons */}
            <div style={{ position:'absolute', left:-d.border, top:92,  width:4, height:36,  borderRadius:'2px 0 0 2px', background:'rgba(100,100,110,0.8)' }} />
            <div style={{ position:'absolute', left:-d.border, top:152, width:4, height:52,  borderRadius:'2px 0 0 2px', background:'rgba(100,100,110,0.8)' }} />
            <div style={{ position:'absolute', left:-d.border, top:216, width:4, height:52,  borderRadius:'2px 0 0 2px', background:'rgba(100,100,110,0.8)' }} />
            <div style={{ position:'absolute', right:-d.border,top:136, width:4, height:72,  borderRadius:'0 2px 2px 0', background:'rgba(100,100,110,0.8)' }} />
            {/* Dynamic Island */}
            <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:6, padding:'0 14px', height:28, borderRadius:14, background:'#000', zIndex:20, pointerEvents:'none' }}>
              <div style={{ width:8,  height:8,  borderRadius:'50%', background:'#1c1c1e' }} />
              <div style={{ width:52, height:7,  borderRadius:4,     background:'#1c1c1e' }} />
              <div style={{ width:8,  height:8,  borderRadius:'50%', background:'#1c1c1e' }} />
            </div>
            {/* Home indicator */}
            <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', width:112, height:5, borderRadius:3, background:'rgba(200,200,200,0.18)', zIndex:20, pointerEvents:'none' }} />
          </>
        )}

        {/* ── Tablet camera dot ── */}
        {viewport === 'tablet' && (
          <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', width:8, height:8, borderRadius:'50%', background:'rgba(100,100,110,0.6)', zIndex:20, pointerEvents:'none' }} />
        )}

        {/* ── Iframe — true device width, vertically scrollable ── */}
        <div
          style={{
            position:     'absolute',
            top:          0,
            left:         0,
            width:        innerW,
            height:       innerH,
            overflowX:    'hidden',
            overflowY:    'auto',
            borderRadius: `calc(${d.radius} - ${d.border}px)`,
          }}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            title="App Preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ width: innerW, height: innerH, minHeight: '100%', border: 'none', display: 'block' }}
            srcDoc={generatePreviewHTML(code)}
            onError={() => setHasError(true)}
          />
        </div>
      </motion.div>
    </div>
  )
}

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

  // Re-render whenever code changes (only update if content actually changed to avoid double-reload)
  useEffect(() => {
    setHasError(false)
    if (!iframeRef.current) return
    const html = generatePreviewHTML(code)
    if (iframeRef.current.srcdoc !== html) {
      iframeRef.current.srcdoc = html
    }
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
          <div className="absolute inset-0">
            <iframe
              key={key}
              ref={iframeRef}
              title="App Preview"
              sandbox="allow-scripts allow-same-origin"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              srcDoc={generatePreviewHTML(code)}
              onError={() => setHasError(true)}
            />
          </div>
        ) : (
          <DeviceFrame viewport={viewport} iframeKey={key} iframeRef={iframeRef} code={code} setHasError={setHasError} />
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

