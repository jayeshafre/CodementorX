"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class ChatRole(str, Enum):
    """Chat message roles"""
    USER = "user"
    ASSISTANT = "assistant"

class ChatIntent(str, Enum):
    """Chat message intents"""
    GENERAL = "general"
    CODING = "coding"
    TRANSLATION = "translation"

class ChatRequest(BaseModel):
    """Chat request model - FIXED duplicate fields"""
    model_config = ConfigDict(
        extra="forbid",  # Prevent extra fields
        json_schema_extra={
            "example": {
                "content": "How do I implement JWT authentication in FastAPI?",
                "conversation_id": 123,
                "intent": "coding",
                "metadata": {"source": "web_app"}
            }
        }
    )
    
    content: str = Field(
        ..., 
        min_length=1, 
        max_length=4000,
        description="User's message content"
    )
    conversation_id: Optional[int] = Field(
        None,
        description="ID of existing conversation (optional for new conversations)"
    )
    intent: Optional[ChatIntent] = Field(
        None,
        description="Message intent (auto-detected if not provided)"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional metadata for the message"
    )

class ChatResponse(BaseModel):
    """Chat response model"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "reply": "To implement JWT authentication in FastAPI, you can use python-jose...",
                "conversation_id": 123,
                "message_id": 456,
                "intent": "coding",
                "processing_time": 1.234,
                "metadata": {"tokens_used": 150, "model": "deepseek-chat"}
            }
        }
    )
    
    reply: str = Field(..., description="AI assistant's response")
    conversation_id: int = Field(..., description="Conversation ID")
    message_id: int = Field(..., description="Message ID")
    intent: ChatIntent = Field(..., description="Detected or provided intent")
    processing_time: float = Field(..., description="Processing time in seconds")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Response metadata (tokens used, model info, etc.)"
    )

class HealthResponse(BaseModel):
    """Health check response model"""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(..., description="Current timestamp")
    version: str = Field(..., description="API version")
    services: Dict[str, str] = Field(..., description="Dependent services status")

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    status_code: int = Field(..., description="HTTP status code")
    correlation_id: str = Field(..., description="Request correlation ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ConversationSummary(BaseModel):
    """Conversation summary model"""
    conversation_id: int
    title: str
    message_count: int
    last_message: Optional[str]
    created_at: datetime
    updated_at: datetime

class UserStats(BaseModel):
    """User statistics model"""
    total_conversations: int
    total_messages: int
    favorite_intent: ChatIntent
    avg_response_time: float