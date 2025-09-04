"""
Business logic for chat processing and AI integration
"""

import asyncio
import json
import time
from typing import Optional, Dict, Any, List
import structlog
import httpx
from decouple import config

from backend.chatbot.models import ChatIntent, ChatRole
from backend.chatbot.utils import cache_get, cache_set, extract_intent

logger = structlog.get_logger(__name__)

class AIService:
    """AI service for generating chat responses"""
    
    def __init__(self):
        self.deepseek_api_key = config('DEEPSEEK_API_KEY', default='')
        self.openai_api_key = config('OPENAI_API_KEY', default='')
        self.model_name = config('AI_MODEL_NAME', default='deepseek-chat')
        self.max_tokens = config('MAX_TOKENS', default=2000, cast=int)
        self.timeout = 30.0
        
        # Choose AI provider based on available keys
        self.use_deepseek = bool(self.deepseek_api_key)
        self.use_openai = bool(self.openai_api_key)
        
        if not (self.use_deepseek or self.use_openai):
            logger.warning("No AI API keys configured, using fallback responses")
    
    async def generate_response(
        self, 
        content: str, 
        intent: ChatIntent,
        conversation_history: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI response based on intent and conversation history
        """
        start_time = time.time()
        
        try:
            # Try real AI API first
            if self.use_deepseek:
                response = await self._call_deepseek_api(content, intent, conversation_history)
            elif self.use_openai:
                response = await self._call_openai_api(content, intent, conversation_history)
            else:
                # Fallback to mock responses if no API keys
                response = await self._generate_fallback_response(content, intent)
            
            processing_time = time.time() - start_time
            
            return {
                'response': response,
                'processing_time': processing_time,
                'tokens_used': self._estimate_tokens(response),
                'model': self.model_name
            }
            
        except Exception as e:
            logger.error("AI response generation failed", error=str(e))
            # Fallback response
            processing_time = time.time() - start_time
            return {
                'response': "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
                'processing_time': processing_time,
                'tokens_used': 20,
                'model': 'fallback'
            }
    
    async def _call_deepseek_api(
        self, 
        content: str, 
        intent: ChatIntent,
        conversation_history: List[Dict[str, Any]] = None
    ) -> str:
        """Call DeepSeek API for response generation"""
        
        # Build messages array
        messages = []
        
        # Add system message based on intent
        system_message = self._get_system_message(intent)
        messages.append({"role": "system", "content": system_message})
        
        # Add conversation history if available
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages only
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current user message
        messages.append({"role": "user", "content": content})
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    "https://api.deepseek.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.deepseek_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model_name,
                        "messages": messages,
                        "max_tokens": self.max_tokens,
                        "temperature": 0.7,
                        "stream": False
                    }
                )
                response.raise_for_status()
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except httpx.TimeoutException:
            logger.error("DeepSeek API timeout")
            return await self._generate_fallback_response(content, intent)
        except httpx.HTTPStatusError as e:
            logger.error("DeepSeek API HTTP error", status_code=e.response.status_code)
            return await self._generate_fallback_response(content, intent)
        except Exception as e:
            logger.error("DeepSeek API unexpected error", error=str(e))
            return await self._generate_fallback_response(content, intent)
    
    async def _call_openai_api(
        self, 
        content: str, 
        intent: ChatIntent,
        conversation_history: List[Dict[str, Any]] = None
    ) -> str:
        """Call OpenAI API for response generation"""
        
        # Build messages array
        messages = []
        
        # Add system message based on intent
        system_message = self._get_system_message(intent)
        messages.append({"role": "system", "content": system_message})
        
        # Add conversation history if available
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages only
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current user message
        messages.append({"role": "user", "content": content})
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-3.5-turbo",  # Or gpt-4 if you have access
                        "messages": messages,
                        "max_tokens": self.max_tokens,
                        "temperature": 0.7,
                        "stream": False
                    }
                )
                response.raise_for_status()
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except httpx.TimeoutException:
            logger.error("OpenAI API timeout")
            return await self._generate_fallback_response(content, intent)
        except httpx.HTTPStatusError as e:
            logger.error("OpenAI API HTTP error", status_code=e.response.status_code)
            return await self._generate_fallback_response(content, intent)
        except Exception as e:
            logger.error("OpenAI API unexpected error", error=str(e))
            return await self._generate_fallback_response(content, intent)
    
    def _get_system_message(self, intent: ChatIntent) -> str:
        """Get system message based on intent"""
        
        base_prompt = """You are CodementorX, an expert AI coding mentor and assistant. You help developers learn, debug, and build better software."""
        
        if intent == ChatIntent.CODING:
            return f"""{base_prompt}
            
Focus on:
- Providing clear, working code examples
- Explaining concepts step-by-step
- Best practices and clean code principles
- Debugging help and error solutions
- Architecture and design patterns

Always format code using markdown code blocks with appropriate language tags."""
        
        elif intent == ChatIntent.TRANSLATION:
            return f"""{base_prompt}
            
You also help with language translation tasks. Provide:
- Accurate translations between languages
- Cultural context when relevant
- Alternative phrasings when appropriate
- Technical translation for programming terms"""
        
        else:  # GENERAL
            return f"""{base_prompt}
            
You can help with:
- General programming questions
- Technology recommendations
- Learning path guidance
- Career advice for developers
- Problem-solving strategies

Keep responses helpful, encouraging, and educational."""
    
    async def _generate_fallback_response(self, content: str, intent: ChatIntent) -> str:
        """Generate fallback response when AI APIs are unavailable"""
        await asyncio.sleep(0.5)  # Simulate processing time
        
        if intent == ChatIntent.CODING:
            return self._get_coding_fallback(content)
        elif intent == ChatIntent.TRANSLATION:
            return self._get_translation_fallback(content)
        else:
            return self._get_general_fallback(content)
    
    def _get_coding_fallback(self, content: str) -> str:
        """Coding-specific fallback responses"""
        content_lower = content.lower()
        
        if any(word in content_lower for word in ['jwt', 'authentication', 'auth']):
            return """Here's a basic JWT implementation pattern:

```python
# JWT Token Creation
import jwt
from datetime import datetime, timedelta

def create_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, 'your-secret-key', algorithm='HS256')

# JWT Verification
def verify_token(token):
    try:
        payload = jwt.decode(token, 'your-secret-key', algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
```

For FastAPI integration, use dependency injection with HTTPBearer for secure endpoints."""
        
        elif any(word in content_lower for word in ['fastapi', 'api', 'endpoint']):
            return """FastAPI endpoint pattern:

```python
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

app = FastAPI()

class ItemRequest(BaseModel):
    name: str
    description: str

@app.post("/items/")
async def create_item(item: ItemRequest):
    # Process the item
    return {"message": "Item created", "item": item}

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    # Fetch item logic
    return {"item_id": item_id}
```

Remember to add proper error handling and validation!"""
        
        else:
            return f"""I understand you're asking about: "{content}"

Here are some general coding best practices:

1. **Write Clean Code**: Use meaningful variable names and functions
2. **Handle Errors**: Always add try-catch blocks for external calls
3. **Test Your Code**: Write unit tests for critical functions
4. **Document**: Add docstrings and comments for complex logic

Could you provide more specific details about your coding challenge?"""
    
    def _get_translation_fallback(self, content: str) -> str:
        """Translation-specific fallback"""
        return f"""For translation needs regarding: "{content}"

I recommend using these services:
- **Google Translate API**: Best for general translation
- **DeepL API**: Excellent for European languages
- **Azure Translator**: Enterprise-grade solution

Example usage:
```python
import requests

def translate_text(text, target_lang='es'):
    # Implementation depends on chosen service
    pass
```

What specific languages are you working with?"""
    
    def _get_general_fallback(self, content: str) -> str:
        """General fallback response"""
        return f"""Thank you for your question: "{content}"

I'm CodementorX, your AI coding mentor! I can help with:

🔹 **Programming Languages**: Python, JavaScript, React, Django, FastAPI
🔹 **Architecture & Design**: System design, best practices, patterns
🔹 **Debugging**: Error analysis and troubleshooting
🔹 **Learning Paths**: Skill development roadmaps

What specific technical challenge can I help you solve today?"""
    
    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimation"""
        return int(len(text.split()) * 1.3)

class ChatService:
    """Main chat service orchestrator"""
    
    def __init__(self):
        self.ai_service = AIService()
    
    async def process_chat_message(
        self, 
        content: str,
        user_id: int,
        conversation_id: Optional[int] = None,
        intent: Optional[ChatIntent] = None
    ) -> Dict[str, Any]:
        """
        Process incoming chat message and generate response
        """
        start_time = time.time()
        
        try:
            # Detect intent if not provided
            if not intent:
                intent = ChatIntent(extract_intent(content))
            
            logger.info(
                "Processing chat message",
                user_id=user_id,
                conversation_id=conversation_id,
                intent=intent.value,
                content_length=len(content)
            )
            
            # Get conversation history
            conversation_history = await self._get_conversation_history(
                conversation_id, user_id
            )
            
            # Generate AI response
            ai_result = await self.ai_service.generate_response(
                content, intent, conversation_history
            )
            
            # In production, save to database here
            # For now, return mock conversation/message IDs
            mock_conversation_id = conversation_id or int(time.time())
            mock_message_id = int(time.time() * 1000)  # More unique
            
            total_time = time.time() - start_time
            
            result = {
                'reply': ai_result['response'],
                'conversation_id': mock_conversation_id,
                'message_id': mock_message_id,
                'intent': intent,
                'processing_time': total_time,
                'metadata': {
                    'tokens_used': ai_result.get('tokens_used', 0),
                    'model': ai_result.get('model', 'unknown'),
                    'ai_processing_time': ai_result.get('processing_time', 0)
                }
            }
            
            # Cache the conversation for history
            await self._cache_message(user_id, mock_conversation_id, {
                'role': 'user',
                'content': content,
                'timestamp': time.time()
            })
            
            await self._cache_message(user_id, mock_conversation_id, {
                'role': 'assistant', 
                'content': ai_result['response'],
                'timestamp': time.time()
            })
            
            logger.info(
                "Chat message processed successfully",
                user_id=user_id,
                conversation_id=mock_conversation_id,
                processing_time=total_time
            )
            
            return result
            
        except Exception as e:
            logger.error(
                "Failed to process chat message",
                user_id=user_id,
                error=str(e)
            )
            raise
    
    async def _get_conversation_history(
        self, 
        conversation_id: Optional[int], 
        user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get conversation history from cache/database
        """
        if not conversation_id:
            return []
        
        try:
            # Try to get from cache first
            cache_key = f"conversation:{user_id}:{conversation_id}"
            cached_history = await cache_get(cache_key)
            
            if cached_history:
                return json.loads(cached_history)
            
            # In production, query database here
            return []
            
        except Exception as e:
            logger.error("Failed to get conversation history", error=str(e))
            return []
    
    async def _cache_message(
        self, 
        user_id: int, 
        conversation_id: int, 
        message: Dict[str, Any]
    ):
        """Cache message in conversation history"""
        try:
            cache_key = f"conversation:{user_id}:{conversation_id}"
            
            # Get existing history
            existing_history = await cache_get(cache_key)
            history = json.loads(existing_history) if existing_history else []
            
            # Add new message
            history.append(message)
            
            # Keep only last 50 messages
            history = history[-50:]
            
            # Cache for 24 hours
            await cache_set(cache_key, json.dumps(history), expire=86400)
            
        except Exception as e:
            logger.error("Failed to cache message", error=str(e))

# Global service instance
chat_service = ChatService()