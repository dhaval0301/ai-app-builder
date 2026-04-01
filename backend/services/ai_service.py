import json
import logging
import os
import re
import uuid
from typing import AsyncIterator

from dotenv import load_dotenv

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
# Helpers
# ---------------------------------------------------------------------------
def _sse(data: dict) -> str:
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
) -> AsyncIterator[str]:
    """
    Async generator yielding SSE-formatted strings.

    Event types:
      {"type": "provider", "name": "openai"}
      {"type": "token",    "content": "..."}
      {"type": "done",     "description": "...", "components": [...],
                           "version_id": "...", "provider": "..."}
      {"type": "error",    "message": "..."}
    """
    chain = _build_chain()
    last_error = "No providers available"

    for provider in chain:
        if not provider.is_configured():
            logger.debug("Provider %s not configured — skipping", provider.name)
            continue

        try:
            yield _sse({"type": "provider", "name": provider.name})

            full_code = ""
            async for token in provider.generate_stream(prompt, mode, current_code):
                full_code += token
                yield _sse({"type": "token", "content": token})

            if not full_code.strip():
                raise ValueError("Provider returned empty response")

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
