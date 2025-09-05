"""
FastAPI Routes for Chatbot Service - localStorage Version
API endpoints for chat functionality (stateless backend)
"""
from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import logging

from models import (
    ChatRequest, 
    ChatResponse, 
    ConversationHistory, 
    ConversationSummary,
    UserInfo,
    ErrorResponse
)
from services import ai_service
from utils import verify_jwt_token, log_request, validate_conversation_id

# Configure logging
logger = logging.getLogger(__name__)

# Create router
chat_router = APIRouter(prefix="/chat", tags=["Chat"])

# Security scheme
security = HTTPBearer()

# Dependency for JWT authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInfo:
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
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@chat_router.post(
    "/message",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Send Chat Message",
    description="Send a message to the AI chatbot and get a response (stateless)"
)
async def send_message(
    request: ChatRequest,
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Send a message to the AI chatbot - localStorage version (stateless)
    Frontend manages all conversation persistence
    """
    try:
        # Log the request
        log_request("POST", "/chat/message", current_user.user_id)
        
        # Validate request
        if not request.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty"
            )
        
        # Generate AI response (no storage in backend)
        response = await ai_service.generate_response(request, current_user)
        
        logger.info(f"Generated stateless response for user {current_user.user_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}"
        )


@chat_router.get(
    "/conversations",
    response_model=List[ConversationSummary],
    status_code=status.HTTP_200_OK,
    summary="Get User Conversations",
    description="Returns empty list - localStorage version manages conversations on frontend"
)
async def get_conversations(
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Returns empty list - localStorage version manages conversations on frontend
    Kept for API compatibility but not functional
    """
    try:
        log_request("GET", "/chat/conversations", current_user.user_id)
        
        logger.info(f"get_conversations called for user {current_user.user_id} - localStorage version returns empty")
        return []  # Frontend manages all conversations via localStorage
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversations: {str(e)}"
        )


@chat_router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationHistory,
    status_code=status.HTTP_200_OK,
    summary="Get Conversation History",
    description="Not functional in localStorage version - returns 404"
)
async def get_conversation(
    conversation_id: str,
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Not functional in localStorage version - frontend manages conversation history
    """
    try:
        log_request("GET", f"/chat/conversations/{conversation_id}", current_user.user_id)
        
        # Validate conversation ID format
        if not validate_conversation_id(conversation_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid conversation ID format"
            )
        
        # Always return 404 since we don't store conversations on backend
        logger.info(f"get_conversation called for {conversation_id} - localStorage version doesn't store conversations")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversations are managed in localStorage on frontend"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation: {str(e)}"
        )


@chat_router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Conversation",
    description="Returns success - localStorage version manages deletion on frontend"
)
async def delete_conversation(
    conversation_id: str,
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Returns success - localStorage version manages deletion on frontend
    """
    try:
        log_request("DELETE", f"/chat/conversations/{conversation_id}", current_user.user_id)
        
        # Validate conversation ID format
        if not validate_conversation_id(conversation_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid conversation ID format"
            )
        
        logger.info(f"delete_conversation called for {conversation_id} - localStorage version always succeeds")
        
        return {
            "message": "Conversation deletion handled by frontend localStorage",
            "conversation_id": conversation_id,
            "note": "Backend doesn't store conversations in localStorage version"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete conversation: {str(e)}"
        )


@chat_router.post(
    "/conversations/{conversation_id}/continue",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Continue Conversation",
    description="Continue conversation - context provided by frontend via request"
)
async def continue_conversation(
    conversation_id: str,
    request: ChatRequest,
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Continue an existing conversation - localStorage version
    Frontend provides all conversation context in the request
    """
    try:
        log_request("POST", f"/chat/conversations/{conversation_id}/continue", current_user.user_id)
        
        # Validate conversation ID format
        if not validate_conversation_id(conversation_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid conversation ID format"
            )
        
        # Validate message
        if not request.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty"
            )
        
        # Set conversation ID in request
        request.conversation_id = conversation_id
        
        # Frontend should have provided conversation context in request.context
        # No need to fetch from backend since we don't store anything
        
        # Generate response using provided context
        response = await ai_service.generate_response(request, current_user)
        
        logger.info(f"Continued conversation {conversation_id} for user {current_user.user_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error continuing conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to continue conversation: {str(e)}"
        )


@chat_router.get(
    "/models",
    status_code=status.HTTP_200_OK,
    summary="Get Available Models",
    description="Get list of available AI models"
)
async def get_available_models(
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Get list of available AI models
    """
    try:
        log_request("GET", "/chat/models", current_user.user_id)
        
        # Return list of available models
        models = [
            {
                "id": "gpt-3.5-turbo",
                "name": "GPT-3.5 Turbo",
                "description": "Fast and efficient model for general conversations",
                "max_tokens": 4096,
                "available": True
            },
            {
                "id": "gpt-4o-mini", 
                "name": "GPT-4o Mini",
                "description": "Efficient and capable model for coding and technical questions",
                "max_tokens": 16384,
                "available": True
            }
        ]
        return {
            "models": models,
            "default_model": "gpt-4o-mini"
        }
        
    except Exception as e:
        logger.error(f"Error getting models: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get models: {str(e)}"
        )


@chat_router.get(
    "/stats",
    status_code=status.HTTP_200_OK,
    summary="Get User Chat Stats",
    description="Returns basic stats - localStorage version has limited backend stats"
)
async def get_chat_stats(
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Returns basic stats - localStorage version has limited backend stats
    """
    try:
        log_request("GET", "/chat/stats", current_user.user_id)
        
        # Return basic stats since we don't store conversations
        stats = {
            "user_id": current_user.user_id,
            "total_conversations": 0,  # Frontend manages this
            "total_messages": 0,       # Frontend manages this
            "recent_conversation": None,
            "storage_type": "localStorage",
            "note": "Detailed stats are managed by frontend localStorage"
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting chat stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat stats: {str(e)}"
        )