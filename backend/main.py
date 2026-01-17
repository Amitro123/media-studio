"""
🎬 Media Studio - FastAPI Backend
Social Media Asset Generator
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import API routes
from api.media_studio import router as media_studio_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events for the FastAPI app.
    """
    # Startup: Ensure output directories exist
    static_dir = Path(__file__).parent.parent / "static" / "generated"
    static_dir.mkdir(parents=True, exist_ok=True)
    print("🎬 Media Studio Backend Started!")
    print(f"📂 Output directory: {static_dir}")
    
    yield
    
    # Shutdown
    print("👋 Media Studio Backend Shutting Down...")


# Initialize FastAPI app
app = FastAPI(
    title="Media Studio",
    description="Generate social media assets in multiple formats from images or text prompts",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server
        "http://localhost:3000",    # Alternative React port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving generated assets
static_path = Path(__file__).parent.parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Include API routes
app.include_router(media_studio_router, prefix="/api", tags=["Media Studio"])


@app.get("/")
async def root():
    """
    Root endpoint - health check and API info.
    """
    return {
        "message": "🎬 Media Studio API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "generate": "/api/generate",
            "health": "/health",
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    return {
        "status": "healthy",
        "gemini_configured": bool(gemini_key and gemini_key != "your_gemini_api_key_here"),
        "static_path": str(static_path),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
