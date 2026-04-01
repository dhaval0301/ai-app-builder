import os
import asyncio
from typing import AsyncIterator

from .base import BaseProvider
from services.prompts import (
    STREAM_GENERATE_SYSTEM,
    STREAM_MODIFY_SYSTEM,
    STREAM_ENHANCE_SYSTEM,
    build_generate_message,
    build_modify_message,
    build_enhance_message,
)

_gemini_available = False
try:
    import google.genai as _genai      # new SDK (google-genai >= 0.7)
    _gemini_available = True
    _GENAI_SDK = "new"
except ImportError:
    try:
        import google.generativeai as _genai   # legacy SDK fallback
        _GENAI_SDK = "legacy"
        _gemini_available = True
    except ImportError:
        _GENAI_SDK = None


class GeminiProvider(BaseProvider):
    name = "gemini"

    def __init__(self) -> None:
        self._api_key = os.getenv("GEMINI_API_KEY", "")
        self._model   = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    def is_configured(self) -> bool:
        return bool(_gemini_available and self._api_key)

    async def generate_stream(
        self,
        prompt: str,
        mode: str = "generate",
        current_code: str = "",
    ) -> AsyncIterator[str]:
        if mode == "enhance":
            system  = STREAM_ENHANCE_SYSTEM
            content = build_enhance_message(prompt)
        elif mode == "generate":
            system  = STREAM_GENERATE_SYSTEM
            content = build_generate_message(prompt)
        else:
            system  = STREAM_MODIFY_SYSTEM
            content = build_modify_message(prompt, current_code)
        full_prompt = f"{system}\n\n{content}"

        if _GENAI_SDK == "new":
            # New google-genai SDK (>=0.7)
            client = _genai.Client(api_key=self._api_key)

            def _sync_stream():
                parts = []
                for chunk in client.models.generate_content_stream(
                    model=self._model,
                    contents=full_prompt,
                ):
                    if chunk.text:
                        parts.append(chunk.text)
                return parts

            chunks = await asyncio.to_thread(_sync_stream)
            for text in chunks:
                yield text
        else:
            # Legacy google-generativeai SDK
            _genai.configure(api_key=self._api_key)
            model = _genai.GenerativeModel(self._model)

            def _sync_stream_legacy():
                return list(model.generate_content(full_prompt, stream=True))

            chunks = await asyncio.to_thread(_sync_stream_legacy)
            for chunk in chunks:
                if chunk.text:
                    yield chunk.text
