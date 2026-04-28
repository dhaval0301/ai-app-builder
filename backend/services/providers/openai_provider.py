import os
from typing import AsyncIterator

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from .base import BaseProvider
from services.prompts import (
    STREAM_GENERATE_SYSTEM, STREAM_MODIFY_SYSTEM, STREAM_ENHANCE_SYSTEM,
    build_generate_message, build_modify_message, build_enhance_message,
)


class OpenAIProvider(BaseProvider):
    name = "openai"

    def __init__(self) -> None:
        self._api_key    = os.getenv("OPENAI_API_KEY", "")
        self._model_name = os.getenv("OPENAI_MODEL", "gpt-4o")
        self._llm        = None
        if self._api_key:
            self._llm = ChatOpenAI(
                api_key=self._api_key,
                model=self._model_name,
                temperature=0.7,
                max_tokens=16000,
                streaming=True,
            ).with_retry(stop_after_attempt=2)

    def is_configured(self) -> bool:
        return bool(self._api_key and self._llm)

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


def _build_messages(prompt: str, mode: str, current_code: str, history: list | None) -> list:
    """Construct the message list, prepending conversation history when available."""
    if mode == "enhance":
        system  = STREAM_ENHANCE_SYSTEM
        content = build_enhance_message(prompt)
    elif mode == "generate":
        system  = STREAM_GENERATE_SYSTEM
        content = build_generate_message(prompt)
    else:
        system  = STREAM_MODIFY_SYSTEM
        content = build_modify_message(prompt, current_code)

    base = [SystemMessage(content=system)]
    if history:
        base.extend(history)
    base.append(HumanMessage(content=content))
    return base
