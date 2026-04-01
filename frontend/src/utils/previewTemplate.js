/**
 * Generates a fully self-contained HTML document that renders a React component
 * defined by `code` (a JSX/JS string without import statements).
 *
 * • React 18, ReactDOM, Babel standalone, and Tailwind CSS are loaded from CDN.
 * • All React hooks are destructured from `React` and made globally available.
 * • A visible error overlay is shown if the code throws at runtime.
 * • The iframe is sand-boxed (allow-scripts, allow-same-origin only).
 */
export function generatePreviewHTML(code) {
  if (!code || !code.trim()) return getEmptyStateHTML()

  // Escape </script> occurrences to prevent breaking the template
  const safeCode = code.replace(/<\/script>/gi, '<\\/script>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>

  <!-- React 18 -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>

  <!-- Babel standalone (JSX transpiler) -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"><\/script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100vh; }
    body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }

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

  <!-- Runtime error catcher -->
  <script>
    window.__showError = function(msg) {
      var el  = document.getElementById('__error-overlay');
      var pre = document.getElementById('__error-msg');
      if (el && pre) { pre.textContent = msg; el.classList.add('show'); }
    };
    window.onerror = function(msg, _src, _line, _col, err) {
      window.__showError((err && err.stack) ? err.stack : msg);
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

  <!-- User-generated component code -->
  <script type="text/babel" data-presets="react,env">
    const {
      useState, useEffect, useCallback, useMemo, useRef,
      useReducer, useContext, createContext, Fragment,
      forwardRef, memo, useId, useTransition, useDeferredValue
    } = React;

    try {
      ${safeCode}

      const __rootEl = document.getElementById('root');
      if (__rootEl) {
        ReactDOM.createRoot(__rootEl).render(
          React.createElement(React.StrictMode, null, React.createElement(App))
        );
      }
    } catch (__err) {
      window.__showError(__err.stack || __err.message || String(__err));
    }
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
    color: #475569;
  }
  .wrap { text-align: center; }
  .icon { font-size: 44px; margin-bottom: 14px; opacity: .45; }
  p { font-size: 13px; line-height: 1.6; }
  span { color: #6366f1; }
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
