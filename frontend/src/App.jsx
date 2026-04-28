import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'

import Header from './components/Header.jsx'
import PromptPanel from './components/PromptPanel.jsx'
import CodeEditor from './components/CodeEditor.jsx'
import PreviewPanel from './components/PreviewPanel.jsx'
import ComponentTree from './components/ComponentTree.jsx'
import VersionHistory from './components/VersionHistory.jsx'
import StatusBar from './components/StatusBar.jsx'
import { generateAppStream, modifyAppStream } from './hooks/useGenerate.js'
import { exportToZip } from './utils/exportCode.js'

const MAIN_TABS = ['Split', 'Preview', 'Code']
const LEFT_TABS = ['Prompt', 'Components', 'History']
const LS_VERSIONS_KEY = 'aibuilder_versions'

function loadVersionsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(LS_VERSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

export default function App() {
  const [prompt, setPrompt]           = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [isModifying, setIsModifying] = useState(false)
  const [activeTab, setActiveTab]     = useState('Split')
  const [leftTab, setLeftTab]         = useState('Prompt')
  const [generatedData, setGeneratedData] = useState(null)
  const [code, setCode]               = useState('')
  const [providerUsed, setProviderUsed] = useState(null)
  const [versions, setVersions]       = useState(loadVersionsFromStorage)
  const [activeVersionId, setActiveVersionId] = useState(null)
  const codeAccRef = useRef('')

  // Persist versions to localStorage
  useEffect(() => {
    localStorage.setItem(LS_VERSIONS_KEY, JSON.stringify(versions))
  }, [versions])

  const handleGenerate = useCallback(async () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      toast.error('Please enter an app description first.')
      return
    }
    setIsLoading(true)
    setCode('')
    setGeneratedData(null)
    setProviderUsed(null)
    codeAccRef.current = ''

    try {
      await generateAppStream(trimmedPrompt, {
        onProvider: (name) => {
          setProviderUsed(name)
          toast(`Using ${name}…`, { icon: '🤖', duration: 2000 })
        },
        onToken: (token) => {
          codeAccRef.current += token
          setCode(codeAccRef.current)
        },
        onDone: (meta) => {
          const finalCode = codeAccRef.current
          const newVersion = {
            id:          meta.version_id,
            prompt:      trimmedPrompt,
            description: meta.description,
            code:        finalCode,
            components:  meta.components,
            provider:    meta.provider,
            timestamp:   new Date().toISOString(),
          }
          setGeneratedData({ ...meta, code: finalCode })
          setActiveVersionId(meta.version_id)
          setVersions(prev => [newVersion, ...prev].slice(0, 30))
          setActiveTab('Split')
          setLeftTab('Components')
          toast.success(`Generated with ${meta.provider}!`, { icon: '⚡' })
        },
        onError: (msg) => {
          toast.error(msg || 'Generation failed — check backend.')
        },
        sessionId: null,
      })
    } catch (err) {
      toast.error('Unexpected error — please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [prompt])

  const handleModify = useCallback(async (instruction) => {
    if (!instruction.trim() || !code) return
    setIsModifying(true)
    codeAccRef.current = ''

    try {
      await modifyAppStream(instruction, code, {
        onProvider: (name) => setProviderUsed(name),
        onToken: (token) => {
          codeAccRef.current += token
          setCode(codeAccRef.current)
        },
        onDone: (meta) => {
          const finalCode = codeAccRef.current
          const newVersion = {
            id:          meta.version_id,
            prompt:      instruction,
            description: meta.description,
            code:        finalCode,
            components:  meta.components,
            provider:    meta.provider,
            timestamp:   new Date().toISOString(),
          }
          setGeneratedData(prev => ({ ...prev, ...meta, code: finalCode }))
          setActiveVersionId(meta.version_id)
          setVersions(prev => [newVersion, ...prev].slice(0, 30))
          toast.success('Modification applied!', { icon: '✏️' })
        },
        onError: (msg) => {
          toast.error(msg || 'Modification failed.')
        },
        sessionId: activeVersionId,
      })
    } catch (err) {
      toast.error('Unexpected error — please try again.')
    } finally {
      setIsModifying(false)
    }
  }, [code, activeVersionId])

  const handleVersionSelect = useCallback((version) => {
    setCode(version.code)
    setActiveVersionId(version.id)
    setPrompt(version.prompt)
    toast.success('Version restored')
  }, [])

  const handleVersionDelete = useCallback((id) => {
    setVersions(prev => prev.filter(v => v.id !== id))
    if (activeVersionId === id) {
      setActiveVersionId(null)
    }
  }, [activeVersionId])

  const handleExport = useCallback(async () => {
    if (!code) { toast.error('No code to export yet.'); return }
    try {
      await exportToZip(code, prompt || 'My App')
      toast.success('ZIP downloaded!')
    } catch {
      toast.error('Export failed.')
    }
  }, [code, prompt])

  const versionIndex = versions.findIndex(v => v.id === activeVersionId)
  const versionLabel = versionIndex >= 0 ? `v${versions.length - versionIndex}` : null

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden select-none">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
      />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <Header
        onExport={handleExport}
        hasCode={!!code}
        isLoading={isLoading}
      />

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Sidebar ─────────────────────────────────────────── */}
        <motion.aside
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="w-72 flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0d0d14]"
        >
          {/* Left tab bar */}
          <div className="flex border-b border-white/[0.06]">
            {LEFT_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  leftTab === tab
                    ? 'text-violet-400 border-b-2 border-violet-500'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Left tab content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {leftTab === 'Prompt' && (
                <PromptPanel
                  key="prompt"
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  onGenerate={handleGenerate}
                  onModify={handleModify}
                  isLoading={isLoading}
                  isModifying={isModifying}
                  hasCode={!!code}
                  providerUsed={providerUsed}
                  description={generatedData?.description}
                />
              )}
              {leftTab === 'Components' && (
                <ComponentTree
                  key="components"
                  components={generatedData?.components || []}
                  description={generatedData?.description}
                />
              )}
              {leftTab === 'History' && (
                <VersionHistory
                  key="history"
                  versions={versions}
                  activeVersionId={activeVersionId}
                  onSelect={handleVersionSelect}
                  onDelete={handleVersionDelete}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 flex flex-col overflow-hidden min-w-0"
        >
          {/* Main tab bar */}
          <div className="flex items-center border-b border-white/[0.06] bg-[#0d0d14] px-4 flex-shrink-0">
            <div className="flex">
              {MAIN_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="mainTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500"
                    />
                  )}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Main tab content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'Preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <PreviewPanel code={code} isLoading={isLoading} isModifying={isModifying} />
                </motion.div>
              )}

              {activeTab === 'Code' && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <CodeEditor code={code} onChange={setCode} isLoading={isLoading} />
                </motion.div>
              )}

              {activeTab === 'Split' && (
                <motion.div
                  key="split"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex"
                >
                  <div className="w-1/2 border-r border-white/[0.06]">
                    <CodeEditor code={code} onChange={setCode} isLoading={isLoading} />
                  </div>
                  <div className="w-1/2">
                    <PreviewPanel code={code} isLoading={isLoading} isModifying={isModifying} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Status Bar ───────────────────────────────────────────────── */}
      <StatusBar
        versionLabel={versionLabel}
        componentCount={generatedData?.components?.length ?? 0}
        isLoading={isLoading}
      />
    </div>
  )
}
