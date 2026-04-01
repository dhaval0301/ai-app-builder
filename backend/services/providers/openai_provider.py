import os
from typing import AsyncIterator

from openai import AsyncOpenAI

from .base import BaseProvider
from services.prompts import (
    STREAM_GENERATE_SYSTEM,
    STREAM_MODIFY_SYSTEM,
    STREAM_ENHANCE_SYSTEM,
    build_generate_message,
    build_modify_message,
    build_enhance_message,
)


class OpenAIProvider(BaseProvider):
    name = "openai"

    def __init__(self) -> None:
        self._api_key = os.getenv("OPENAI_API_KEY", "")
        self._model   = os.getenv("OPENAI_MODEL", "gpt-4o")
        self._client  = AsyncOpenAI(api_key=self._api_key) if self._api_key else None

    def is_configured(self) -> bool:
        return bool(self._api_key and self._client)

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

        stream = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": content},
            ],
            temperature=0.7,
            max_tokens=4096,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
