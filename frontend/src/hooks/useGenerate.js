/**
 * Streaming SSE helper — parses "data: {...}\n\n" chunks from a ReadableStream.
 *
 * Callbacks:
 *   onProvider(name)              — fired once when backend picks a provider
 *   onToken(content)              — fired for every streamed code token
 *   onDone({ description, components, version_id, provider })
 *   onError(message)
 */
export async function generateAppStream(
  prompt,
  { onProvider, onToken, onDone, onError },
) {
  let response
  try {
    response = await fetch('/api/generate/stream', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt }),
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
  { onProvider, onToken, onDone, onError },
) {
  let response
  try {
    response = await fetch('/api/modify/stream', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ instruction, current_code: currentCode }),
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
    response = await fetch('/api/enhance/stream', {
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

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

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
  baseURL: '/api',
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
