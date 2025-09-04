"""
FastAPI routes for chat endpoints
"""

import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from fastapi.security import HTTPBearer
from typing import Optional
import structlog

# FIXED: Use relative imports
from .models import (
    ChatRequest, 
    ChatResponse, 
    HealthResponse, 
    ErrorResponse,
    ChatIntent
)
from .utils import verify_jwt_token, rate_limit_check, get_redis_client
from .services import chat_service

logger = structlog.get_logger(__name__)
router = APIRouter()
security = HTTPBearer()

# FIXED: Better JWT token extraction and validation
async def get_current_user(authorization: str = Header(None)):
    """
    Dependency to verify JWT token and extract user info
    Enhanced with better error handling and validation
    """
    if not authorization:
        logger.warning("Authorization header missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Extract token from "Bearer <token>" format
    try:
        parts = authorization.split()
        if len(parts) != 2:
            raise ValueError("Invalid format")
        
        scheme, token = parts
        if scheme.lower() != "bearer":
            logger.warning("Invalid authorization scheme", scheme=scheme)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization scheme. Expected 'Bearer'",
                headers={"WWW-Authenticate": "Bearer"}
            )
    except ValueError:
        logger.warning("Invalid authorization header format", header=authorization)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verify token using Django's JWT secret
    try:
        user_info = verify_jwt_token(token)
        logger.debug("JWT token verified successfully", user_id=user_info['user_id'])
        return user_info
    except HTTPException:
        # Re-raise HTTP exceptions from verify_jwt_token
        raise
    except Exception as e:
        logger.error("Unexpected error during token verification", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
            headers={"WWW-Authenticate": "Bearer"}
        )

@router.post("/chat/", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    FIXED: Complete chat endpoint with proper response handling
    """
    user_id = current_user["user_id"]

    logger.info(
        "Processing chat message",
        user_id=user_id,
        content_length=len(request.content),
        conversation_id=request.conversation_id,
        intent=request.intent.value if request.intent else None
    )

    # Rate limiting check
    try:
        is_allowed = await rate_limit_check(user_id)
        if not is_allowed:
            logger.warning("Rate limit exceeded", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Too many requests",
                    "message": "You have exceeded the rate limit. Please try again later.",
                    "retry_after": 60
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Rate limit check failed, allowing request", error=str(e))
        # Continue with request if rate limiting fails

    try:
        # Process chat message
        result = await chat_service.process_chat_message(
            content=request.content,
            user_id=user_id,
            conversation_id=request.conversation_id,
            intent=request.intent
        )

        logger.info(
            "Chat message processed successfully",
            user_id=user_id,
            conversation_id=result["conversation_id"],
            message_id=result["message_id"],
            intent=result["intent"].value,
            processing_time=result["processing_time"]
        )

        # FIXED: Return ALL required fields for ChatResponse
        return ChatResponse(
            reply=result.get("reply", "No reply generated"),
            conversation_id=result["conversation_id"],
            message_id=result["message_id"],
            intent=result["intent"],
            processing_time=result["processing_time"],
            metadata=result.get("metadata", {})
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(
            "Chat processing failed",
            user_id=user_id,
            error=str(e),
            error_type=type(e).__name__
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Processing failed",
                "message": "Failed to process your message. Please try again."
            }
        )

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint - verifies all services are operational
    Enhanced with comprehensive service checking
    """
    services_status = {}
    
    # Test Redis connection
    try:
        redis_client = await get_redis_client()
        if redis_client:
            await redis_client.ping()
            services_status["redis"] = "healthy"
        else:
            services_status["redis"] = "unavailable"
    except Exception as e:
        logger.warning("Redis health check failed", error=str(e))
        services_status["redis"] = "unhealthy"
    
    # Test AI service availability (basic check)
    try:
        # This is a simple check - in production you might ping the actual AI service
        from decouple import config
        deepseek_key = config('DEEPSEEK_API_KEY', default='')
        openai_key = config('OPENAI_API_KEY', default='')
        
        if deepseek_key or openai_key:
            services_status["ai_service"] = "healthy"
        else:
            services_status["ai_service"] = "configured_fallback"
    except Exception as e:
        logger.warning("AI service health check failed", error=str(e))
        services_status["ai_service"] = "unhealthy"
    
    # Overall status
    unhealthy_services = [k for k, v in services_status.items() if v == "unhealthy"]
    if unhealthy_services:
        overall_status = "degraded"
        logger.warning("Health check shows degraded status", unhealthy_services=unhealthy_services)
    else:
        overall_status = "healthy"
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.utcnow(),
        version="1.0.0",
        services=services_status
    )

@router.get("/chat/status")
async def chat_status():
    """
    Public chat service status endpoint (no auth required)
    """
    return {
        "status": "online",
        "service": "CodementorX Chatbot API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": "Service is running",
        "features": {
            "jwt_auth": True,
            "rate_limiting": True,
            "conversation_history": True,
            "intent_detection": True
        }
    }

# ADDITIONAL: User-specific endpoints
@router.get("/chat/conversations")
async def get_user_conversations(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's conversation history (placeholder for future implementation)
    """
    user_id = current_user['user_id']
    
    logger.info("Fetching user conversations", user_id=user_id)
    
    # TODO: Implement actual database query
    return {
        "user_id": user_id,
        "conversations": [],
        "message": "Conversation history feature coming soon"
    }

@router.delete("/chat/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific conversation (placeholder for future implementation)
    """
    user_id = current_user['user_id']
    
    logger.info(
        "Deleting conversation",
        user_id=user_id,
        conversation_id=conversation_id
    )
    
    # TODO: Implement actual database deletion
    return {
        "message": f"Conversation {conversation_id} deleted successfully",
        "user_id": user_id
    }