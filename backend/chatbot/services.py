"""
AI Services for CodementorX Chatbot
Business logic for chat functionality - localStorage version (stateless backend)
"""

import os
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
from decouple import config
from openai import AsyncOpenAI

from models import ChatMessage, ChatRequest, ChatResponse, UserInfo, ConversationHistory

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger("services")


class AIService:
    """AI service for handling chat functionality - stateless version"""

    def __init__(self):
        # OpenAI Configuration
        self.api_key = config("OPENAI_API_KEY")
        self.api_base = config("OPENAI_API_BASE", default="https://api.openai.com/v1")
        self.default_model = config("AI_MODEL_NAME", default="gpt-4o-mini")

        # OpenAI async client
        self.openai_client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.api_base,
        )

        self.system_prompt = self._get_system_prompt()

    def _get_system_prompt(self) -> str:
        """Default system prompt for CodementorX"""
        return """You are CodementorX, an expert AI assistant specializing in software development, programming, and technology.

Your expertise includes:
- Web Development (Django, React, FastAPI, Node.js, etc.)
- Programming Languages (Python, JavaScript, Java, C++, etc.)
- Database Design and Management
- Cloud Technologies and DevOps
- Software Architecture and Best Practices
- Authentication and Security
- API Development and Integration

Guidelines:
- Provide clear, practical, and accurate technical advice
- Include code examples when helpful
- Explain complex concepts in simple terms
- Focus on best practices and modern approaches
- Be concise but thorough in explanations
- If unsure, acknowledge it
- Always consider security implications in recommendations
"""

    async def generate_response(
        self, request: ChatRequest, user: UserInfo
    ) -> ChatResponse:
        """Generate AI response for user message - stateless version"""
        try:
            # Generate new conversation ID if not provided
            conversation_id = request.conversation_id or str(uuid.uuid4())
            
            # Prepare messages for AI API call
            messages = self._prepare_messages(request)

            # Call OpenAI API
            response = await self.openai_client.chat.completions.create(
                model=request.model or self.default_model,
                messages=messages,
                temperature=request.temperature or 0.7,
                max_tokens=request.max_tokens or 1000,
            )

            ai_message = response.choices[0].message.content
            
            # Extract token usage if available
            token_usage = (
                {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
                if response.usage
                else None
            )

            # Create response object - no storage needed, frontend handles persistence
            chat_response = ChatResponse(
                message=ai_message,
                conversation_id=conversation_id,
                model_used=request.model or self.default_model,
                token_usage=token_usage,
                metadata={
                    "user_id": user.user_id,
                    "user_email": user.email,
                    "stateless": True  # Indicates this is localStorage version
                },
            )

            logger.info(
                f"Generated stateless response for user {user.user_id} in conversation {conversation_id}"
            )
            return chat_response

        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            raise Exception(f"Failed to generate response: {str(e)}")

    def _prepare_messages(self, request: ChatRequest) -> List[Dict[str, str]]:
        """Prepare messages for AI API call"""
        messages = []
        
        # Add system prompt
        system_prompt = request.system_prompt or self.system_prompt
        messages.append({"role": "system", "content": system_prompt})

        # Add context from previous messages (sent by frontend)
        for msg in request.context[-10:]:  # Last 10 messages for context
            messages.append({"role": msg.role.value, "content": msg.content})

        # Add current user message
        messages.append({"role": "user", "content": request.message})
        
        return messages

    # NOTE: All conversation storage methods removed since we're using localStorage
    # The frontend will handle all conversation persistence

    async def get_conversation_history(
        self, conversation_id: str, user_id: int
    ) -> Optional[ConversationHistory]:
        """
        NOT USED in localStorage version - frontend manages all conversation data
        This endpoint can be removed or return empty for backwards compatibility
        """
        logger.info(f"get_conversation_history called but not implemented in localStorage version")
        return None

    async def get_user_conversations(self, user_id: int) -> List[Dict[str, Any]]:
        """
        NOT USED in localStorage version - frontend manages all conversation data
        This endpoint can be removed or return empty for backwards compatibility
        """
        logger.info(f"get_user_conversations called but not implemented in localStorage version")
        return []

    async def delete_conversation(self, conversation_id: str, user_id: int) -> bool:
        """
        NOT USED in localStorage version - frontend manages all conversation data
        This endpoint can be removed or return True for backwards compatibility
        """
        logger.info(f"delete_conversation called but not implemented in localStorage version")
        return True


# Global AI service instance
ai_service = AIService()