from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"

class MessageIntent(str, Enum):
    GENERAL = "general"
    CODING = "coding"
    TRANSLATION = "translation"

class ChatRequest(BaseModel):
    content: str
    intent: Optional[MessageIntent] = MessageIntent.GENERAL
    
    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        if len(v) > 2000:
            raise ValueError('Content too long (max 2000 characters)')
        return v.strip()

class ChatResponse(BaseModel):
    id: int
    content: str
    role: MessageRole
    intent: MessageIntent
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = {}

class ConversationSummary(BaseModel):
    id: int
    title: str
    message_count: int
    last_message: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

class ConversationList(BaseModel):
    conversations: List[ConversationSummary]
    total_count: int

class ProcessingStatus(BaseModel):
    status: str
    timestamp: Optional[float] = None
    conversation_id: int

class APIError(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = datetime.utcnow()

class HealthCheck(BaseModel):
    status: str
    redis: str
    service: str
    timestamp: datetime = datetime.utcnow()
    error: Optional[str] = None