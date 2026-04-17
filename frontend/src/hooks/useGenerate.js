/**
 * Streaming SSE helper — parses "data: {...}\n\n" chunks from a ReadableStream.
 *
 * Callbacks:
 *   onProvider(name)              — fired once when backend picks a provider
 *   onToken(content)              — fired for every streamed code token
 *   onDone({ description, components, version_id, provider })
 *   onError(message)
 */

// In production (Vercel) the vercel.json rewrite proxies /api → Railway backend.
// In development the Vite proxy handles it. Either way the base is just '/api'.
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') + '/api'

export async function generateAppStream(
  prompt,
  { onProvider, onToken, onDone, onError, sessionId = null },
) {
  let response
  try {
    response = await fetch(`${API_BASE}/generate/stream`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt, session_id: sessionId }),
    })
  } catch (err) {
    onError('Cannot reach the API server. Is the backend running?')
    return
  }

  if (!response.ok) {
    try {
      const body = await response.json()
      onError(body?.detail ?? `Server error ${response.status}`)
    } catch {
      onError(`Server error ${response.status}`)
    }
    return
  }

  await _readSSE(response.body, { onProvider, onToken, onDone, onError })
}

/**
 * Stream a modification of existing app code.
 */
export async function modifyAppStream(
  instruction,
  currentCode,
  { onProvider, onToken, onDone, onError, sessionId = null },
) {
  let response
  try {
    response = await fetch(`${API_BASE}/modify/stream`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ instruction, current_code: currentCode, session_id: sessionId }),
    })
  } catch (err) {
    onError('Cannot reach the API server. Is the backend running?')
    return
  }

  if (!response.ok) {
    try {
      const body = await response.json()
      onError(body?.detail ?? `Server error ${response.status}`)
    } catch {
      onError(`Server error ${response.status}`)
    }
    return
  }

  await _readSSE(response.body, { onProvider, onToken, onDone, onError })
}

/**
 * Stream an AI-enhanced rewrite of a rough prompt.
 * Callbacks: onToken(text), onDone(enhancedText), onError(message)
 */
export async function enhancePromptStream(
  prompt,
  { onToken, onDone, onError },
) {
  let response
  try {
    response = await fetch(`${API_BASE}/enhance/stream`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt }),
    })
  } catch {
    onError('Cannot reach the API server.')
    return
  }

  if (!response.ok) {
    try {
      const body = await response.json()
      onError(body?.detail ?? `Server error ${response.status}`)
    } catch {
      onError(`Server error ${response.status}`)
    }
    return
  }

  let accumulated = ''
  await _readSSE(response.body, {
    onToken: (t) => { accumulated += t; onToken?.(accumulated) },
    onDone:  ()  => onDone?.(accumulated),
    onError,
  })
}

/**
 * Consume a ReadableStream of SSE events.
 * Each event is "data: {json}\n\n".
 */
async function _readSSE(body, { onProvider, onToken, onDone, onError }) {
  const reader  = body.getReader()
  const decoder = new TextDecoder()
  let buffer    = ''

  function processChunk(chunk) {
    const parts = chunk.split('\n\n')
    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))
        if (event.type === 'provider') {
          onProvider?.(event.name)
        } else if (event.type === 'token') {
          onToken?.(event.content)
        } else if (event.type === 'done') {
          onDone?.(event)
        } else if (event.type === 'error') {
          onError?.(event.message)
        }
      } catch {
        // skip malformed SSE lines
      }
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        // Flush any remaining buffered data when stream closes
        if (buffer.trim()) {
          processChunk(buffer)
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() // keep incomplete last chunk

      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6))
          if (event.type === 'provider') {
            onProvider?.(event.name)
          } else if (event.type === 'token') {
            onToken?.(event.content)
          } else if (event.type === 'done') {
            onDone?.(event)
          } else if (event.type === 'error') {
            onError?.(event.message)
            return
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ── Legacy non-streaming helper (kept for backwards compat) ──────────────────
import axios from 'axios'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 90_000,
  headers: { 'Content-Type': 'application/json' },
})

export async function generateApp(prompt) {
  try {
    const { data } = await api.post('/generate', { prompt })
    return data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') throw new Error(detail)
      if (err.code === 'ECONNABORTED') throw new Error('Request timed out — try a simpler prompt.')
      if (!err.response)               throw new Error('Cannot reach the API server. Is the backend running?')
    }
    throw err
  }
}
