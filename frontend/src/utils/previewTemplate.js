/**
 * Generates a fully self-contained HTML document that renders a React component
 * defined by `code` (a JSX/JS string without import statements).
 *
 * • React 18, ReactDOM, Babel standalone, and Tailwind CSS are loaded from CDN.
 * • All React hooks are destructured from `React` and made globally available.
 * • A visible error overlay is shown if the code throws at runtime.
 * • The iframe is sand-boxed (allow-scripts, allow-same-origin only).
 */
/**
 * Strip markdown code fences that LLMs sometimes wrap around their output.
 * e.g.  ```jsx\nfunction App() {...}\n```  → function App() {...}
 */
function stripMarkdownFences(raw) {
  const trimmed = raw.trim()
  // Full fence block: ```[lang]\n...\n```
  const fenceMatch = trimmed.match(/^```[\w]*\s*\n([\s\S]*?)```\s*$/)
  if (fenceMatch) return fenceMatch[1].trim()
  // Opening fence only (LLM didn't close it)
  const openOnly = trimmed.replace(/^```[\w]*\s*\n/, '').replace(/\n```[\s]*$/, '')
  return openOnly.trim()
}

export function generatePreviewHTML(code) {
  if (!code || !code.trim()) return getEmptyStateHTML()

  const cleanedCode = stripMarkdownFences(code)

  // JSON-encode the code — handles all escaping; additionally escape </script> for HTML safety
  const safeCodeJSON = JSON.stringify(cleanedCode).replace(/<\/script>/gi, '<\\/'+'script>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>

  <!-- Explicitly allow eval (needed for Babel) in case of inherited CSP -->
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">

  <!-- React 18 dev build (surfaces errors properly) -->
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js"><\/script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js"><\/script>

  <!-- Babel standalone (JSX transpiler) -->
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.10/babel.min.js"><\/script>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"><\/script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

  <style>
    *, *::before, *::after { box-sizing: border-box; }
    /* Use height:100% not min-height:100vh — guarantees h-screen/h-full work correctly in srcdoc iframes */
    html, body { margin: 0; padding: 0; height: 100%; }
    #root { height: 100%; }
    /* Dark background + text fallback in case Tailwind CDN hasn't applied classes yet */
    body { background: #070711; color: #f0f0ff; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

    /* Error overlay */
    #__error-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: #0f172a;
      color: #f8fafc;
      padding: 28px 32px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 12px;
      z-index: 99999;
      overflow: auto;
    }
    #__error-overlay.show { display: block; }
    #__error-overlay h2  { color: #ef4444; margin: 0 0 12px; font-size: 16px; font-family: Inter, sans-serif; }
    #__error-overlay pre { background: #1e293b; padding: 16px; border-radius: 10px; overflow: auto; line-height: 1.6; white-space: pre-wrap; }
    #__error-overlay p   { color: #64748b; margin-top: 14px; font-family: Inter, sans-serif; font-size: 11px; }
  </style>
</head>
<body>
  <div id="__error-overlay">
    <h2>⚠️  Preview Error</h2>
    <pre id="__error-msg"></pre>
    <p>Fix the error in the code editor — the preview updates automatically.</p>
  </div>
  <div id="root"></div>

  <!-- Runtime error catcher + CDN load checks -->
  <script>
    // Detect if critical CDN scripts failed to load
    window.addEventListener('load', function() {
      if (typeof React === 'undefined') {
        window.__showError('Failed to load React from CDN (cdn.jsdelivr.net).\nCheck your internet connection and try refreshing.');
        return;
      }
      if (typeof Babel === 'undefined') {
        window.__showError('Failed to load Babel from CDN.\nCheck your internet connection and try refreshing.');
      }
    });

    window.__showError = function(msg) {
      var el  = document.getElementById('__error-overlay');
      var pre = document.getElementById('__error-msg');
      if (el && pre) { pre.textContent = msg; el.classList.add('show'); }
      try {
        window.parent.postMessage({ type: '__console', level: 'error', args: [msg], ts: Date.now() }, '*');
      } catch(e) {}
    };
    window.onerror = function(msg, src, line, col, err) {
      var detail = (err && err.stack) ? err.stack : (msg + (src ? ' — ' + src + ':' + line : ''));
      if (msg === 'Script error.' || msg === 'Script error') {
        detail = 'Script error (cross-origin sanitised).\n\nLikely cause: Syntax error or undefined variable in the generated code.\n\nOpen the Console panel (terminal icon) for more detail.';
      }
      window.__showError(detail);
      return true;
    };
    window.addEventListener('unhandledrejection', function(e) {
      window.__showError(e.reason ? String(e.reason) : 'Unhandled promise rejection');
    });

    // Console bridge — forwards logs to parent app
    (function() {
      var _post = function(level, args) {
        try {
          window.parent.postMessage({
            type:  '__console',
            level: level,
            args:  Array.prototype.slice.call(args).map(function(a) {
              try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a) }
              catch(e) { return String(a) }
            }),
            ts: Date.now(),
          }, '*');
        } catch(e) {}
      };
      var _orig = {
        log:   console.log.bind(console),
        warn:  console.warn.bind(console),
        error: console.error.bind(console),
        info:  console.info.bind(console),
      };
      console.log   = function() { _orig.log.apply(console, arguments);   _post('log',   arguments); };
      console.warn  = function() { _orig.warn.apply(console, arguments);  _post('warn',  arguments); };
      console.error = function() { _orig.error.apply(console, arguments); _post('error', arguments); };
      console.info  = function() { _orig.info.apply(console, arguments);  _post('info',  arguments); };
    })();
  <\/script>

  <!-- User-generated component code — explicit Babel.transform() is more reliable than type=text/babel in srcDoc iframes -->
  <script>
    (function () {
      if (typeof Babel === 'undefined' || typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        window.__showError('Required CDN libraries failed to load. Check your internet connection and refresh.');
        return;
      }
      var rawCode = ${safeCodeJSON};
      var transpiled;
      try {
        transpiled = Babel.transform(rawCode, { presets: ['react'], filename: 'app.jsx' }).code;
      } catch (te) {
        window.__showError('Transpilation Error:\n' + (te.message || String(te)));
        return;
      }
      var preamble = [
        'const {useState,useEffect,useCallback,useMemo,useRef,useReducer,useContext,createContext,Fragment,forwardRef,memo,useId,useTransition,useDeferredValue}=React;',
        'class __ErrorBoundary extends React.Component{',
        '  constructor(p){super(p);this.state={error:null};}',
        '  static getDerivedStateFromError(e){return{error:e};}',
        '  componentDidCatch(e,i){window.__showError((e&&e.stack?e.stack:String(e))+(i&&i.componentStack?"\\n\\nComponent stack:"+i.componentStack:""));}',
        '  render(){if(this.state.error)return null;return this.props.children;}',
        '}',
      ].join('\n');
      var mount = [
        'var __el=document.getElementById("root");',
        'if(__el){ReactDOM.createRoot(__el,{onRecoverableError:function(e){window.__showError(e&&e.stack?e.stack:String(e));}}).render(React.createElement(__ErrorBoundary,null,React.createElement(App)));}',
      ].join('\n');
      try {
        new Function(preamble + '\n' + transpiled + '\n' + mount)();
      } catch (re) {
        window.__showError(re.stack || re.message || String(re));
      }
    })();
  <\/script>
</body>
</html>`
}

function getEmptyStateHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }
  body {
    background: #0a0a0f;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, sans-serif;
    color: #64748b;
  }
  .wrap { text-align: center; }
  .icon { font-size: 44px; margin-bottom: 14px; opacity: .7; }
  p { font-size: 13px; line-height: 1.6; }
  span { color: #818cf8; font-weight: 600; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="icon">⚡</div>
    <p>Enter a prompt and click <span>Generate App</span><br />to see your app previewed here.</p>
  </div>
</body>
</html>`
}
