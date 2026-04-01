import os
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

_anthropic_available = False
try:
    import anthropic as _anthropic_module
    _anthropic_available = True
except ImportError:
    pass


class AnthropicProvider(BaseProvider):
    name = "anthropic"

    def __init__(self) -> None:
        self._api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self._model   = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        self._client  = None
        if _anthropic_available and self._api_key:
            self._client = _anthropic_module.AsyncAnthropic(api_key=self._api_key)

    def is_configured(self) -> bool:
        return bool(_anthropic_available and self._api_key and self._client)

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

        async with self._client.messages.stream(
            model=self._model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": content}],
        ) as stream:
            async for text in stream.text_stream:
                yield text
