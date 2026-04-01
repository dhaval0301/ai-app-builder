import os
import json
from typing import AsyncIterator

import httpx

from .base import BaseProvider
from services.prompts import (
    STREAM_GENERATE_SYSTEM,
    STREAM_MODIFY_SYSTEM,
    STREAM_ENHANCE_SYSTEM,
    build_generate_message,
    build_modify_message,
    build_enhance_message,
)


class OllamaProvider(BaseProvider):
    name = "ollama"

    def __init__(self) -> None:
        self._base_url = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
        self._model    = os.getenv("OLLAMA_MODEL", "llama3.2")

    def is_configured(self) -> bool:
        # Ollama is available if the env var is set (or the default is reachable)
        return bool(os.getenv("OLLAMA_URL") or os.getenv("OLLAMA_MODEL"))

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

        payload = {
            "model":  self._model,
            "prompt": f"{system}\n\n{content}",
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self._base_url}/api/generate",
                json=payload,
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if not data.get("done"):
                                token = data.get("response", "")
                                if token:
                                    yield token
                        except json.JSONDecodeError:
                            continue
