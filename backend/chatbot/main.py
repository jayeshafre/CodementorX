"""
FastAPI Chatbot Service
Main application entry point with JWT integration
"""
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import os
from dotenv import load_dotenv
import logging
from fastapi.responses import JSONResponse
from fastapi import HTTPException

from routes import chat_router
from utils import verify_jwt_token

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="CodementorX Chatbot API",
    description="AI-powered chatbot service with JWT authentication",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
app.include_router(chat_router)

# Security scheme
security = HTTPBearer()

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Dependency for JWT authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to verify JWT token and extract user info
    """
    try:
        token = credentials.credentials
        user_info = verify_jwt_token(token)
        return user_info
    except Exception as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CodementorX Chatbot API",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "CodementorX Chatbot API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/health",
        "chat_endpoints": "/api/chat/"
    }

# Include chat routes
app.include_router(
    chat_router,
    prefix="/api",
    dependencies=[Depends(get_current_user)]
)

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP Exception: {exc.detail}")
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {
        "error": "Internal server error",
        "status_code": 500
    }

if __name__ == "__main__":
    port = int(os.getenv("FASTAPI_PORT", 8001))
    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    
    logger.info(f"Starting FastAPI server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True if os.getenv("DEBUG", "False").lower() == "true" else False,
        log_level="info"
    )

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": str(exc.detail)},
    )

