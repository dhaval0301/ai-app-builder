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
        history: list | None = None,
    ) -> AsyncIterator[str]:
        """
        Async generator that yields raw code tokens one at a time.

        mode         : "generate" | "modify" | "enhance"
        current_code : latest code state (modify mode)
        history      : list of langchain BaseMessage objects for conversation memory
        """
        ...
