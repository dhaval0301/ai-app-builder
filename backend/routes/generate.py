from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from services.ai_service import generate_stream, generate_app_code

router = APIRouter()


# ── Request models ────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str
    session_id: str | None = None

    @field_validator("prompt")
    @classmethod
    def prompt_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Prompt cannot be empty")
        if len(v) > 2000:
            raise ValueError("Prompt must be 2000 characters or fewer")
        return v


class ModifyRequest(BaseModel):
    instruction: str
    current_code: str
    session_id: str | None = None

    @field_validator("instruction")
    @classmethod
    def instruction_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Instruction cannot be empty")
        if len(v) > 1000:
            raise ValueError("Instruction must be 1000 characters or fewer")
        return v

    @field_validator("current_code")
    @classmethod
    def code_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("current_code cannot be empty")
        return v


class EnhanceRequest(BaseModel):
    prompt: str

    @field_validator("prompt")
    @classmethod
    def prompt_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Prompt cannot be empty")
        if len(v) > 500:
            raise ValueError("Prompt must be 500 characters or fewer")
        return v


class GenerateResponse(BaseModel):
    code: str
    description: str
    components: list[str]
    version_id: str


# ── SSE headers ───────────────────────────────────────────────────────────────

_SSE_HEADERS = {
    "Cache-Control":     "no-cache",
    "X-Accel-Buffering": "no",
    "Connection":        "keep-alive",
}


# ── Streaming endpoints ───────────────────────────────────────────────────────

@router.post("/enhance/stream")
async def stream_enhance(request: EnhanceRequest):
    """Stream an AI-enhanced version of a rough prompt via Server-Sent Events."""
    return StreamingResponse(
        generate_stream(request.prompt, mode="enhance"),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


@router.post("/generate/stream")
async def stream_generate(request: GenerateRequest):
    """Stream React code generation via Server-Sent Events."""
    return StreamingResponse(
        generate_stream(
            request.prompt,
            mode="generate",
            session_id=request.session_id,
        ),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


@router.post("/modify/stream")
async def stream_modify(request: ModifyRequest):
    """Stream React code modification via Server-Sent Events."""
    return StreamingResponse(
        generate_stream(
            request.instruction,
            mode="modify",
            current_code=request.current_code,
            session_id=request.session_id,
        ),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


# ── Legacy non-streaming endpoint ────────────────────────────────────────────

@router.post("/generate", response_model=GenerateResponse)
async def generate_app(request: GenerateRequest):
    """Non-streaming endpoint — awaits full response before returning."""
    try:
        result = await generate_app_code(request.prompt)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
