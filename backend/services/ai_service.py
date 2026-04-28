import json
import logging
import os
import re
import uuid
from collections import OrderedDict
from typing import AsyncIterator

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage

from services.providers.openai_provider import OpenAIProvider
from services.providers.anthropic_provider import AnthropicProvider
from services.providers.gemini_provider import GeminiProvider
from services.providers.ollama_provider import OllamaProvider
from services.providers.template_provider import TemplateProvider

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Provider registry & chain
# ---------------------------------------------------------------------------
_ALL_PROVIDERS = [
    OpenAIProvider(),
    AnthropicProvider(),
    GeminiProvider(),
    OllamaProvider(),
    TemplateProvider(),
]

_PROVIDER_MAP = {p.name: p for p in _ALL_PROVIDERS}


def _build_chain():
    """Return the provider chain based on AI_PROVIDER env var."""
    pin = os.getenv("AI_PROVIDER", "auto").lower().strip()
    if pin == "auto":
        return list(_ALL_PROVIDERS)
    if pin in _PROVIDER_MAP:
        return [_PROVIDER_MAP[pin], TemplateProvider()]
    logger.warning("Unknown AI_PROVIDER=%r — falling back to auto", pin)
    return list(_ALL_PROVIDERS)


# ---------------------------------------------------------------------------
# Conversation memory  (per session, max 20 sessions, last 6 turns kept)
# ---------------------------------------------------------------------------
_MAX_SESSIONS = 20
_MAX_TURNS    = 6   # pairs of HumanMessage + AIMessage

# OrderedDict so we can evict the oldest session when full
_sessions: OrderedDict[str, list] = OrderedDict()


def _get_history(session_id: str | None) -> list:
    if not session_id or session_id not in _sessions:
        return []
    return list(_sessions[session_id])


def _save_turn(session_id: str, human_msg: str, ai_msg: str) -> None:
    if not session_id:
        return
    if session_id not in _sessions:
        if len(_sessions) >= _MAX_SESSIONS:
            _sessions.popitem(last=False)   # evict oldest
        _sessions[session_id] = []
    hist = _sessions[session_id]
    hist.append(HumanMessage(content=human_msg))
    hist.append(AIMessage(content=ai_msg))
    # Keep only the last _MAX_TURNS pairs
    if len(hist) > _MAX_TURNS * 2:
        _sessions[session_id] = hist[-(  _MAX_TURNS * 2):]
    _sessions.move_to_end(session_id)


def clear_session(session_id: str) -> None:
    _sessions.pop(session_id, None)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _patch_truncated_code(code: str) -> str:
    """
    If the LLM output was truncated mid-generation (hit token limit),
    the last line may have an unclosed string, JSX tag, or brace.
    This patcher:
      1. Drops the last line if it looks incomplete (no closing punctuation).
      2. Counts unbalanced braces/parens and appends the minimum closing tokens
         needed so Babel can at least parse and render what was generated.
    """
    lines = code.rstrip().splitlines()
    if not lines:
        return code

    last = lines[-1].rstrip()
    # If the last line ends mid-string (odd number of unescaped quotes) or
    # has no closing punctuation at all, drop it — it's garbage.
    def _looks_incomplete(line: str) -> bool:
        stripped = line.strip()
        if not stripped:
            return False
        # Incomplete if it ends with an opening token or assignment operator
        if stripped[-1] in ('=', '+', '-', '(', '{', '[', ',', '<', '|', '&', '?', ':'):
            return True
        # Count unescaped double quotes — odd means unterminated string
        dq = stripped.count('"') - stripped.count('\\"')
        sq = stripped.count("'") - stripped.count("\\'")
        bt = stripped.count('`') - stripped.count('\\`')
        if dq % 2 != 0 or sq % 2 != 0 or bt % 2 != 0:
            return True
        return False

    if _looks_incomplete(last):
        lines = lines[:-1]

    patched = '\n'.join(lines)

    # Balance braces and parens
    opens  = patched.count('{') - patched.count('}')
    parens = patched.count('(') - patched.count(')')

    closing = ''
    if parens > 0:
        closing += ')' * parens
    if opens > 0:
        closing += '\n' + '}'.join([''] * (opens + 1))  # opens closing braces

    return patched + closing if closing else patched



    return f"data: {json.dumps(data)}\n\n"


def extract_components(code: str) -> list:
    names = re.findall(
        r"(?:^|\n)(?:function|const)\s+([A-Z][a-zA-Z0-9]*)\s*[=(]",
        code,
    )
    seen, result = set(), []
    for name in names:
        if name not in seen:
            seen.add(name)
            result.append(name)
    return result or ["App"]


# ---------------------------------------------------------------------------
# Core streaming generator
# ---------------------------------------------------------------------------
async def generate_stream(
    prompt: str,
    mode: str = "generate",
    current_code: str = "",
    session_id: str | None = None,
) -> AsyncIterator[str]:
    """
    Async generator yielding SSE-formatted strings.

    Event types:
      {"type": "provider", "name": "openai"}
      {"type": "token",    "content": "..."}
      {"type": "done",     "description": "...", "components": [...],
                           "version_id": "...", "provider": "..."}
      {"type": "error",    "message": "..."}

    session_id: when provided, conversation history is loaded (modify mode)
                and the new turn is persisted after a successful response.
    """
    chain      = _build_chain()
    last_error = "No providers available"
    history    = _get_history(session_id) if mode == "modify" else []

    for provider in chain:
        if not provider.is_configured():
            logger.debug("Provider %s not configured — skipping", provider.name)
            continue

        try:
            yield _sse({"type": "provider", "name": provider.name})

            full_code = ""
            async for token in provider.generate_stream(
                prompt, mode, current_code, history
            ):
                full_code += token
                yield _sse({"type": "token", "content": token})

            if not full_code.strip():
                raise ValueError("Provider returned empty response")

            # Guard against truncated output (LLM hit token limit mid-line).
            # If the code doesn't end with a closing brace/paren after trimming
            # any trailing whitespace, it was cut off — patch it closed so the
            # frontend can at least transpile and show what was generated.
            full_code = _patch_truncated_code(full_code)

            # Persist conversation turn for modify / generate sessions
            if session_id and mode in ("generate", "modify"):
                human_content = prompt if mode == "generate" else f"[modify] {prompt}"
                _save_turn(session_id, human_content, full_code)

            components = extract_components(full_code)
            version_id = str(uuid.uuid4())
            description = (
                f"'{prompt}' — built with {provider.name.title()}"
                if mode == "generate"
                else f"Modified with {provider.name.title()}: {prompt}"
            )

            yield _sse({
                "type":        "done",
                "description": description,
                "components":  components,
                "version_id":  version_id,
                "provider":    provider.name,
            })
            return  # success

        except Exception as exc:
            last_error = str(exc)
            logger.warning("Provider %s failed: %s", provider.name, exc)
            continue

    yield _sse({"type": "error", "message": f"All providers failed: {last_error}"})


# ---------------------------------------------------------------------------
# Non-streaming wrapper (legacy /api/generate endpoint compat)
# ---------------------------------------------------------------------------
async def generate_app_code(prompt: str) -> dict:
    """Collect the full streamed response and return a plain dict."""
    code_parts: list = []
    meta: dict = {}

    async for raw in generate_stream(prompt, mode="generate"):
        if not raw.startswith("data: "):
            continue
        try:
            event = json.loads(raw[6:])
        except json.JSONDecodeError:
            continue
        if event.get("type") == "token":
            code_parts.append(event["content"])
        elif event.get("type") == "done":
            meta = event
        elif event.get("type") == "error":
            raise RuntimeError(event.get("message", "Unknown error"))

    code = "".join(code_parts)
    return {
        "code":        code,
        "description": meta.get("description", f"A React application for: {prompt}"),
        "components":  meta.get("components", extract_components(code)),
        "version_id":  meta.get("version_id", str(uuid.uuid4())),
        "provider":    meta.get("provider", "unknown"),
    }
