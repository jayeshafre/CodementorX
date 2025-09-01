import asyncio
import httpx
import os
import logging
from typing import List, Dict, Optional, Any
import json
from datetime import datetime

from .external_apis import DeepSeekAPI, GeneralQAAPI, TranslationAPI
from .redis_client import redis_client

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        self.django_base_url = os.getenv('DJANGO_API_URL', 'http://localhost:8000')
        self.deepseek_api = DeepSeekAPI()
        self.general_qa_api = GeneralQAAPI()
        self.translation_api = TranslationAPI()
        
    async def get_user_conversations(self, user_id: int) -> List[Dict]:
        """Fetch user conversations from Django API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.django_base_url}/api/chat-models/conversations/",
                    headers=self._get_internal_headers(user_id),
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to fetch conversations: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching conversations: {e}")
            return []
    
    async def create_conversation(self, user_id: int, title: str) -> Dict:
        """Create new conversation via Django API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.django_base_url}/api/chat-models/conversations/",
                    headers=self._get_internal_headers(user_id),
                    json={"title": title},
                    timeout=10.0
                )
                
                if response.status_code == 201:
                    return response.json()
                else:
                    logger.error(f"Failed to create conversation: {response.status_code}")
                    raise Exception("Failed to create conversation")
                    
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            raise
    
    async def get_conversation_messages(self, user_id: int, conversation_id: int) -> List[Dict]:
        """Get messages for a conversation"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.django_base_url}/api/chat-models/conversations/{conversation_id}/messages/",
                    headers=self._get_internal_headers(user_id),
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to fetch messages: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching messages: {e}")
            return []
    
    async def save_message(
        self, 
        user_id: int, 
        conversation_id: int, 
        content: str, 
        role: str, 
        intent: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Save message to Django API"""
        try:
            message_data = {
                "content": content,
                "role": role,
                "intent": intent,
                "metadata": metadata or {}
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.django_base_url}/api/chat-models/conversations/{conversation_id}/messages/",
                    headers=self._get_internal_headers(user_id),
                    json=message_data,
                    timeout=10.0
                )
                
                if response.status_code == 201:
                    return response.json()
                else:
                    logger.error(f"Failed to save message: {response.status_code}")
                    raise Exception("Failed to save message")
                    
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise
    
    async def delete_conversation(self, user_id: int, conversation_id: int) -> bool:
        """Delete conversation via Django API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.django_base_url}/api/chat-models/conversations/{conversation_id}/",
                    headers=self._get_internal_headers(user_id),
                    timeout=10.0
                )
                
                return response.status_code == 204
                
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            return False
    
    async def generate_response(
        self, 
        user_id: int, 
        conversation_id: int, 
        user_message: str, 
        intent: str
    ) -> str:
        """Generate AI response based on intent"""
        try:
            # Get conversation context
            messages = await self.get_conversation_messages(user_id, conversation_id)
            context = self._build_context(messages)
            
            # Route to appropriate AI service based on intent
            if intent == "coding":
                response = await self.deepseek_api.get_coding_help(user_message, context)
            elif intent == "translation":
                response = await self.translation_api.translate_text(user_message)
            else:
                response = await self.general_qa_api.get_answer(user_message, context)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return self._get_fallback_response(intent)
    
    def _get_internal_headers(self, user_id: int) -> Dict[str, str]:
        """Get headers for internal API calls"""
        # For internal calls, we can use a service token or user impersonation
        # This is a simplified version - in production, you'd want proper service authentication
        return {
            "Content-Type": "application/json",
            "X-Internal-Service": "fastapi-chatbot",
            "X-User-ID": str(user_id)
        }
    
    def _build_context(self, messages: List[Dict]) -> str:
        """Build conversation context from recent messages"""
        if not messages:
            return ""
        
        # Get last 5 messages for context
        recent_messages = messages[-5:]
        context_parts = []
        
        for msg in recent_messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            context_parts.append(f"{role}: {content}")
        
        return "\n".join(context_parts)
    
    def _get_fallback_response(self, intent: str) -> str:
        """Provide fallback response when AI services fail"""
        fallback_responses = {
            "coding": "I'm sorry, but I'm having trouble accessing the coding assistance service right now. Please try again in a moment, or feel free to rephrase your question.",
            "translation": "I'm currently unable to access the translation service. Please try again later.",
            "general": "I apologize, but I'm experiencing some technical difficulties right now. Please try asking your question again in a moment."
        }
        
        return fallback_responses.get(intent, fallback_responses["general"])

class ExternalAPIError(Exception):
    """Custom exception for external API errors"""
    pass