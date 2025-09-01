from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

from .services import ChatbotService
from .models import ChatRequest, ChatResponse, ConversationList
from .redis_client import redis_client
from .utils import extract_intent, sanitize_input

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize chatbot service
chatbot_service = ChatbotService()

@router.get("/status", dependencies=[])
async def chat_status():
    return {"status": "chat service running"}

class MessageRequest(BaseModel):
    content: str
    intent: Optional[str] = None
    
    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Message content cannot be empty')
        if len(v.strip()) > 2000:
            raise ValueError('Message content too long (max 2000 characters)')
        return sanitize_input(v.strip())

class ConversationCreate(BaseModel):
    title: str
    
    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        if len(v.strip()) > 200:
            raise ValueError('Title too long (max 200 characters)')
        return sanitize_input(v.strip())

@router.get("/conversations/", response_model=List[Dict])
async def get_conversations(current_user: Dict = Depends()):
    """Get user's conversation list"""
    try:
        user_id = current_user['user_id']
        
        # Check cache first
        cached_conversations = redis_client.get_cached_user_chats(user_id)
        if cached_conversations:
            return cached_conversations
        
        # Fetch from Django API
        conversations = await chatbot_service.get_user_conversations(user_id)
        
        # Cache the result
        if conversations:
            redis_client.cache_user_chats(user_id, conversations)
        
        return conversations
    
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversations"
        )

@router.post("/conversations/", status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: Dict = Depends()
):
    """Create new conversation"""
    try:
        user_id = current_user['user_id']
        
        # Create conversation via Django API
        conversation = await chatbot_service.create_conversation(
            user_id, 
            conversation_data.title
        )
        
        # Invalidate cache
        redis_client.client.delete(f"user:{user_id}:chats")
        
        return conversation
    
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation"
        )

@router.get("/conversations/{conversation_id}/messages/")
async def get_conversation_messages(
    conversation_id: int,
    current_user: Dict = Depends()
):
    """Get messages for a conversation"""
    try:
        user_id = current_user['user_id']
        
        # Check cache first
        cached_messages = redis_client.get_cached_messages(conversation_id)
        if cached_messages:
            return cached_messages
        
        # Fetch from Django API
        messages = await chatbot_service.get_conversation_messages(
            user_id, 
            conversation_id
        )
        
        # Cache the result
        if messages:
            redis_client.cache_conversation_messages(conversation_id, messages)
        
        return messages
    
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch messages"
        )

@router.post("/conversations/{conversation_id}/messages/")
async def send_message(
    conversation_id: int,
    message_request: MessageRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends()
):
    """Send a message and get AI response"""
    try:
        user_id = current_user['user_id']
        
        # Rate limiting check
        can_proceed, remaining = redis_client.check_rate_limit(user_id)
        if not can_proceed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {remaining} seconds."
            )
        
        # Extract intent if not provided
        intent = message_request.intent or extract_intent(message_request.content)
        
        # Set processing status
        redis_client.set_processing_status(conversation_id, "processing")
        
        # Save user message first
        user_message = await chatbot_service.save_message(
            user_id,
            conversation_id,
            message_request.content,
            'user',
            intent
        )
        
        # Generate AI response
        ai_response = await chatbot_service.generate_response(
            user_id,
            conversation_id,
            message_request.content,
            intent
        )
        
        # Save AI response
        assistant_message = await chatbot_service.save_message(
            user_id,
            conversation_id,
            ai_response,
            'assistant',
            intent
        )
        
        # Update cache in background
        background_tasks.add_task(
            update_conversation_cache, 
            user_id, 
            conversation_id
        )
        
        # Clear processing status
        redis_client.client.delete(f"processing:{conversation_id}")
        
        return {
            "user_message": user_message,
            "assistant_message": assistant_message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        # Clear processing status on error
        redis_client.client.delete(f"processing:{conversation_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process message"
        )

@router.delete("/conversations/{conversation_id}/")
async def delete_conversation(
    conversation_id: int,
    current_user: Dict = Depends()
):
    """Delete a conversation"""
    try:
        user_id = current_user['user_id']
        
        await chatbot_service.delete_conversation(user_id, conversation_id)
        
        # Clear caches
        redis_client.client.delete(f"user:{user_id}:chats")
        redis_client.client.delete(f"chat:{conversation_id}:messages")
        
        return {"message": "Conversation deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation"
        )

@router.get("/conversations/{conversation_id}/status/")
async def get_processing_status(
    conversation_id: int,
    current_user: Dict = Depends()
):
    """Get processing status for a conversation"""
    status_info = redis_client.get_processing_status(conversation_id)
    return status_info or {"status": "idle"}

# Background task function
async def update_conversation_cache(user_id: int, conversation_id: int):
    """Update conversation cache in background"""
    try:
        # Invalidate user chats cache
        redis_client.client.delete(f"user:{user_id}:chats")
        
        # Update messages cache
        messages = await chatbot_service.get_conversation_messages(user_id, conversation_id)
        if messages:
            redis_client.cache_conversation_messages(conversation_id, messages)
            
    except Exception as e:
        logger.error(f"Error updating cache: {e}")


