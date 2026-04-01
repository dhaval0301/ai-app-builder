from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes.generate import router as generate_router
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 AI App Builder API is starting...")
    yield
    print("👋 AI App Builder API shut down.")


app = FastAPI(
    title="AI App Builder API",
    description="Generate React apps from natural language using OpenAI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI App Builder API", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
