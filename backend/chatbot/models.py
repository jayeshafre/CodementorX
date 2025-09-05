"""
Pydantic Models for FastAPI Chatbot Service
Request/Response models for chat functionality
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    """Message role types"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    """Individual chat message model"""
    role: MessageRole = Field(..., description="Message role (user/assistant/system)")
    content: str = Field(..., min_length=1, max_length=10000, description="Message content")
    timestamp: Optional[datetime] = Field(default=None, description="Message timestamp")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")

    @validator('content')
    def content_must_not_be_empty(cls, v):
        if not v or v.strip() == '':
            raise ValueError('Content cannot be empty')
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "role": "user",
                "content": "How do I implement authentication in Django?",
                "timestamp": "2024-09-04T12:00:00Z",
                "metadata": {}
            }
        }


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str = Field(..., min_length=1, max_length=10000, description="User message")
    conversation_id: Optional[str] = Field(default=None, description="Conversation ID for context")
    context: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation context")
    model: Optional[str] = Field(default="deepseek-chat", description="AI model to use")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Response creativity")
    max_tokens: Optional[int] = Field(default=1000, ge=1, le=4000, description="Maximum response tokens")
    system_prompt: Optional[str] = Field(default=None, description="Custom system prompt")

    @validator('message')
    def message_must_not_be_empty(cls, v):
        if not v or v.strip() == '':
            raise ValueError('Message cannot be empty')
        return v.strip()

    @validator('context')
    def context_not_too_long(cls, v):
        if len(v) > 50:  # Limit context to last 50 messages
            return v[-50:]
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "message": "How do I implement JWT authentication in Django?",
                "conversation_id": "conv_123456",
                "context": [],
                "model": "deepseek-chat",
                "temperature": 0.7,
                "max_tokens": 1000
            }
        }


class ChatResponse(BaseModel):
    """Chat response model"""
    message: str = Field(..., description="AI response message")
    conversation_id: str = Field(..., description="Conversation ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    model_used: str = Field(..., description="AI model that generated the response")
    token_usage: Optional[Dict[str, int]] = Field(default=None, description="Token usage statistics")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional response metadata")

    class Config:
        protected_namespaces = ()
        json_schema_extra = {
            "example": {
                "message": "To implement JWT authentication in Django, you can use the djangorestframework-simplejwt package...",
                "conversation_id": "conv_123456",
                "timestamp": "2024-09-04T12:00:00Z",
                "model_used": "deepseek-chat",
                "token_usage": {
                    "prompt_tokens": 50,
                    "completion_tokens": 200,
                    "total_tokens": 250
                },
                "metadata": {}
            }
        }


class ConversationSummary(BaseModel):
    """Conversation summary model"""
    conversation_id: str = Field(..., description="Conversation ID")
    title: Optional[str] = Field(default=None, description="Conversation title")
    message_count: int = Field(..., description="Number of messages in conversation")
    created_at: datetime = Field(..., description="Conversation creation time")
    updated_at: datetime = Field(..., description="Last update time")
    preview: Optional[str] = Field(default=None, description="Preview of the conversation")

    class Config:
        json_schema_extra = {
            "example": {
                "conversation_id": "conv_123456",
                "title": "Django JWT Authentication",
                "message_count": 8,
                "created_at": "2024-09-04T10:00:00Z",
                "updated_at": "2024-09-04T12:00:00Z",
                "preview": "User asked about JWT authentication in Django..."
            }
        }


class ConversationHistory(BaseModel):
    """Full conversation history model"""
    conversation_id: str = Field(..., description="Conversation ID")
    messages: List[ChatMessage] = Field(..., description="List of messages in conversation")
    created_at: datetime = Field(..., description="Conversation creation time")
    updated_at: datetime = Field(..., description="Last update time")
    title: Optional[str] = Field(default=None, description="Conversation title")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "conversation_id": "conv_123456",
                "messages": [
                    {
                        "role": "user",
                        "content": "How do I implement JWT authentication?",
                        "timestamp": "2024-09-04T12:00:00Z"
                    },
                    {
                        "role": "assistant",
                        "content": "To implement JWT authentication...",
                        "timestamp": "2024-09-04T12:00:05Z"
                    }
                ],
                "created_at": "2024-09-04T10:00:00Z",
                "updated_at": "2024-09-04T12:00:00Z",
                "title": "JWT Authentication Discussion"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(default=None, description="Detailed error information")
    status_code: int = Field(..., description="HTTP status code")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "Invalid request",
                "detail": "Message cannot be empty",
                "status_code": 400,
                "timestamp": "2024-09-04T12:00:00Z"
            }
        }


class UserInfo(BaseModel):
    """User information from JWT token"""
    user_id: int = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    username: Optional[str] = Field(default=None, description="Username")
    full_name: Optional[str] = Field(default=None, description="Full name")
    role: Optional[str] = Field(default="user", description="User role")
    is_verified: Optional[bool] = Field(default=False, description="Account verification status")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "email": "user@example.com",
                "username": "johndoe",
                "full_name": "John Doe",
                "role": "user",
                "is_verified": True
            }
        }


# Health check model
class HealthCheck(BaseModel):
    """Health check response model"""
    status: str = Field(default="healthy", description="Service status")
    service: str = Field(default="CodementorX Chatbot API", description="Service name")
    version: str = Field(default="1.0.0", description="Service version")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "service": "CodementorX Chatbot API",
                "version": "1.0.0",
                "timestamp": "2024-09-04T12:00:00Z"
            }
        }
