from abc import ABC, abstractmethod
from typing import AsyncIterator


class BaseProvider(ABC):
    name: str = "base"

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if the required credentials / dependencies are available."""
        ...

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        mode: str = "generate",
        current_code: str = "",
    ) -> AsyncIterator[str]:
        """
        Async generator that yields raw code tokens one at a time.
        `mode` is either "generate" (new app) or "modify" (edit existing code).
        `current_code` is populated when mode == "modify".
        """
        ...
