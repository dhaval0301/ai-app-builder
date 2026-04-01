import JSZip from 'jszip'

/**
 * Packages the generated code into a downloadable ZIP containing:
 *  - A standalone index.html (works without a build step)
 *  - A full Vite + React project structure ready for `npm install && npm run dev`
 */
export async function exportToZip(code, prompt = 'My App') {
  const zip = new JSZip()

  const appName = prompt
    .replace(/[^a-z0-9 ]/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-')
    .toLowerCase() || 'generated-app'

  // ── 1. Standalone HTML (zero dependencies) ────────────────────────────
  const safeCode = code.replace(/<\/script>/gi, '<\\/script>')
  const standaloneHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${prompt}</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100vh; }
    body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,env">
    const { useState, useEffect, useCallback, useMemo, useRef, useReducer, useContext, createContext, Fragment } = React;
    ${safeCode}
    ReactDOM.createRoot(document.getElementById('root')).render(
      React.createElement(React.StrictMode, null, React.createElement(App))
    );
  <\/script>
</body>
</html>`

  zip.file('standalone.html', standaloneHTML)

  // ── 2. Vite project ───────────────────────────────────────────────────
  const proj = zip.folder('vite-project')

  proj.file('index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`)

  proj.file('package.json', JSON.stringify({
    name: appName,
    private: true,
    version: '0.1.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
    devDependencies: {
      '@vitejs/plugin-react': '^4.2.1',
      autoprefixer: '^10.4.19',
      postcss: '^8.4.38',
      tailwindcss: '^3.4.3',
      vite: '^5.2.8',
    },
  }, null, 2))

  proj.file('vite.config.js', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
`)

  proj.file('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
`)

  proj.file('postcss.config.js', `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
`)

  const src = proj.folder('src')

  src.file('main.jsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`)

  src.file('index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
`)

  src.file('App.jsx', `import React, {
  useState, useEffect, useCallback, useMemo, useRef,
  useReducer, useContext, createContext, Fragment
} from 'react'

${code}

export default App
`)

  proj.file('README.md', `# ${prompt}

Generated with **AI App Builder** ⚡

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:5173 in your browser.

## Project structure

\`\`\`
src/
  App.jsx        # Generated component
  main.jsx       # React entry point
  index.css      # Tailwind base styles
\`\`\`
`)

  zip.file('README.md', `# ${prompt}

Generated with **AI App Builder** ⚡

## Files

| File | Description |
|------|-------------|
| \`standalone.html\` | Zero-dependency preview — just open in a browser |
| \`vite-project/\`   | Full Vite + React project — run \`npm install && npm run dev\` |
`)

  // ── Generate & download ───────────────────────────────────────────────
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `${appName}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
