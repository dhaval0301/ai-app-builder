import { useRef, useCallback, useState } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { motion } from 'framer-motion'
import { Code2, Copy, Check } from 'lucide-react'

const EDITOR_OPTIONS = {
  fontSize: 13,
  fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  fontLigatures: true,
  lineHeight: 22,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'line',
  lineNumbers: 'on',
  glyphMargin: false,
  folding: true,
  wordWrap: 'off',
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
  scrollbar: {
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6,
    useShadows: false,
  },
  padding: { top: 16, bottom: 16 },
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  renderIndentGuides: true,
  bracketPairColorization: { enabled: true },
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-4 bg-[#0d0d14]">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
        <Code2 className="w-6 h-6 text-gray-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">No code yet</p>
        <p className="text-xs text-gray-700 mt-1">Generate an app to see its code here</p>
      </div>
    </div>
  )
}

export default function CodeEditor({ code, onChange, isLoading }) {
  const editorRef  = useRef(null)
  const [copied, setCopied] = useState(false)

  const handleMount = useCallback((editor) => {
    editorRef.current = editor
    editor.getModel()?.updateOptions({ tabSize: 2 })
  }, [])

  const handleCopy = useCallback(async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available — silently fail
    }
  }, [code])

  if (!code && !isLoading) {
    return <EmptyState />
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-3 p-6 bg-[#0d0d14]">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded shimmer"
            style={{ width: `${45 + Math.sin(i * 1.7) * 40}%` }}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full bg-[#0d0d14] flex flex-col"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-end px-3 py-1.5 border-b border-white/[0.04] flex-shrink-0">
        <button
          onClick={handleCopy}
          disabled={!code}
          title="Copy code"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {copied
            ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></>
            : <><Copy className="w-3 h-3" /> Copy</>
          }
        </button>
      </div>
      <div className="flex-1 min-h-0">
      <MonacoEditor
        height="100%"
        language="javascript"
        theme="vs-dark"
        value={code}
        onChange={val => onChange(val ?? '')}
        options={EDITOR_OPTIONS}
        onMount={handleMount}
        beforeMount={monaco => {
          monaco.editor.defineTheme('ai-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'comment',    foreground: '4b5563', fontStyle: 'italic' },
              { token: 'keyword',    foreground: 'a78bfa' },
              { token: 'string',     foreground: '86efac' },
              { token: 'number',     foreground: 'fb923c' },
              { token: 'identifier', foreground: 'e2e8f0' },
              { token: 'function',   foreground: '60a5fa' },
              { token: 'type',       foreground: '34d399' },
            ],
            colors: {
              'editor.background':           '#0d0d14',
              'editor.foreground':           '#e2e8f0',
              'editor.lineHighlightBackground': '#ffffff08',
              'editor.selectionBackground':  '#6366f140',
              'editorLineNumber.foreground': '#374151',
              'editorLineNumber.activeForeground': '#6b7280',
              'editorCursor.foreground':     '#a78bfa',
              'editor.inactiveSelectionBackground': '#6366f120',
              'editorWidget.background':     '#1e293b',
              'editorSuggestWidget.background': '#1e293b',
              'editorSuggestWidget.border':  '#334155',
            },
          })
          monaco.editor.setTheme('ai-dark')
        }}
      />
      </div>
    </motion.div>
  )
}
