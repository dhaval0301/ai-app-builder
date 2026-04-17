import os
from typing import AsyncIterator

from .base import BaseProvider
from .openai_provider import _build_messages

_lc_ollama_available = False
try:
    from langchain_ollama import ChatOllama
    _lc_ollama_available = True
except ImportError:
    try:
        from langchain_community.chat_models import ChatOllama
        _lc_ollama_available = True
    except ImportError:
        pass


class OllamaProvider(BaseProvider):
    name = "ollama"

    def __init__(self) -> None:
        self._base_url   = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
        self._model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
        self._llm        = None
        if _lc_ollama_available:
            self._llm = ChatOllama(
                base_url=self._base_url,
                model=self._model_name,
                temperature=0.7,
            )

    def is_configured(self) -> bool:
        return bool(
            _lc_ollama_available
            and (os.getenv("OLLAMA_URL") or os.getenv("OLLAMA_MODEL"))
        )

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
