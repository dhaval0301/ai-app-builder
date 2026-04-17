import os
from typing import AsyncIterator

from .base import BaseProvider
from .openai_provider import _build_messages

_lc_gemini_available = False
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    _lc_gemini_available = True
except ImportError:
    pass


class GeminiProvider(BaseProvider):
    name = "gemini"

    def __init__(self) -> None:
        self._api_key    = os.getenv("GEMINI_API_KEY", "")
        self._model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self._llm        = None
        if _lc_gemini_available and self._api_key:
            self._llm = ChatGoogleGenerativeAI(
                google_api_key=self._api_key,
                model=self._model_name,
                temperature=0.7,
                max_output_tokens=4096,
                streaming=True,
            ).with_retry(stop_after_attempt=2)

    def is_configured(self) -> bool:
        return bool(_lc_gemini_available and self._api_key and self._llm)

    async def generate_stream(
        self,
        prompt: str,
        mode: str = "generate",
        current_code: str = "",
        history: list | None = None,
    ) -> AsyncIterator[str]:
        messages = _build_messages(prompt, mode, current_code, history)
        async for chunk in self._llm.astream(messages):
            if chunk.content:
                yield chunk.content
