from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import logging
from contextlib import asynccontextmanager

# Import your modules
from .routes import router as chat_router
from .utils import verify_jwt_token
from .redis_client import redis_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting FastAPI Chatbot Service")
    try:
        # Test Redis connection
        redis_client._test_connection()
        logger.info("All connections established successfully")
    except Exception as e:
        logger.error(f"Failed to establish connections: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down FastAPI Chatbot Service")

# Create FastAPI app
app = FastAPI(
    title="CodementorX Chatbot API",
    description="FastAPI service for chatbot functionality",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user info"""
    try:
        user_info = verify_jwt_token(credentials.credentials)
        return user_info
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Include routers
app.include_router(
    chat_router, 
    prefix="/api/chat", 
    tags=["chat"],
    dependencies=[Depends(get_current_user)]
)

@app.get("/")
async def root():
    return {"message": "CodementorX Chatbot API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Redis connection
        redis_client.client.ping()
        return {
            "status": "healthy",
            "redis": "connected",
            "service": "chatbot-api"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "redis": "disconnected",
            "service": "chatbot-api",
            "error": str(e)
        }
    
@app.get("/api/chat/status")
async def chat_status():
    return {"status": "chat service running"}