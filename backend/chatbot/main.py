"""
FastAPI Chatbot Microservice for CodementorX
Production-ready with JWT integration, Redis caching, and structured logging
"""

import asyncio
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog
from decouple import config

# Import our modules
from .routes import router as chat_router
from .utils import (
    setup_logging,
    get_redis_client,
    close_redis_connection,
    correlation_id_var,
)

# -------------------------
# Logging
# -------------------------
setup_logging()
logger = structlog.get_logger(__name__)


# -------------------------
# Lifespan events
# -------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("Starting CodementorX Chatbot API...")

    # Initialize Redis connection with retry
    max_retries = 3
    retry_count = 0
    while retry_count < max_retries:
        try:
            redis_client = await get_redis_client()
            await redis_client.ping()  # test connection
            app.state.redis = redis_client
            logger.info("Redis connection established successfully")
            break
        except Exception as e:
            retry_count += 1
            logger.warning(
                "Failed to connect to Redis",
                error=str(e),
                retry=retry_count,
                max_retries=max_retries,
            )
            if retry_count >= max_retries:
                logger.error("Max Redis connection retries exceeded")
                app.state.redis = None
            else:
                await asyncio.sleep(2**retry_count)  # exponential backoff

    yield

    logger.info("Shutting down CodementorX Chatbot API...")
    try:
        await close_redis_connection()
        logger.info("Redis connection closed successfully")
    except Exception as e:
        logger.error("Error closing Redis connection", error=str(e))


# -------------------------
# FastAPI app
# -------------------------
app = FastAPI(
    title="CodementorX Chatbot API",
    description="AI-powered coding mentor and Q&A chatbot service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# -------------------------
# Security middleware
# -------------------------
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "0.0.0.0", "*"],
)

# -------------------------
# CORS middleware (FIXED)
# -------------------------
CORS_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="").split(",")

if CORS_ORIGINS == [""] or not any(CORS_ORIGINS):
    # default allowed origins if env is empty
    CORS_ORIGINS = [
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",  # React dev
        "http://127.0.0.1:3000",
        "http://localhost:8000",  # Django API
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",  # Django API
        "http://127.0.0.1:8000",
        
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# -------------------------
# Request logging middleware
# -------------------------
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Add correlation ID and log all requests"""
    correlation_id = str(uuid.uuid4())
    correlation_id_var.set(correlation_id)
    request.state.correlation_id = correlation_id

    start_time = time.time()
    logger.info(
        "Request started",
        method=request.method,
        url=str(request.url),
        path=request.url.path,
        query_params=str(request.query_params),
        client_ip=request.client.host if request.client else "unknown",
        correlation_id=correlation_id,
    )

    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            "Request completed",
            method=request.method,
            url=str(request.url),
            path=request.url.path,
            status_code=response.status_code,
            process_time=round(process_time, 3),
            correlation_id=correlation_id,
        )
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Process-Time"] = str(round(process_time, 3))
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            "Request failed",
            method=request.method,
            url=str(request.url),
            path=request.url.path,
            error=str(e),
            error_type=type(e).__name__,
            process_time=round(process_time, 3),
            correlation_id=correlation_id,
        )
        raise


# -------------------------
# Exception handlers
# -------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.warning(
        "HTTP exception occurred",
        path=request.url.path,
        method=request.method,
        status_code=exc.status_code,
        detail=exc.detail,
        correlation_id=correlation_id,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "correlation_id": correlation_id,
            "timestamp": time.time(),
        },
        headers={"X-Correlation-ID": correlation_id},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.error(
        "Unexpected error occurred",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        error_type=type(exc).__name__,
        correlation_id=correlation_id,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "correlation_id": correlation_id,
            "timestamp": time.time(),
        },
        headers={"X-Correlation-ID": correlation_id},
    )


# -------------------------
# Routers
# -------------------------
app.include_router(chat_router, prefix="/api", tags=["chat"])


# -------------------------
# Root endpoint
# -------------------------
@app.get("/")
async def root():
    return {
        "service": "CodementorX Chatbot API",
        "version": "1.0.0",
        "status": "online",
        "timestamp": time.time(),
        "environment": "development"
        if config("DEBUG", default=True, cast=bool)
        else "production",
        "endpoints": {
            "chat": "/api/chat/",
            "health": "/api/health",
            "status": "/api/chat/status",
            "docs": "/docs",
            "redoc": "/redoc",
        },
    }


# -------------------------
# Development server
# -------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_config=None,
        access_log=False,
    )
