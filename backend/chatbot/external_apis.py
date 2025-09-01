import httpx
import os
import logging
from typing import Optional, Dict, Any
import asyncio
import json

logger = logging.getLogger(__name__)

class DeepSeekAPI:
    def __init__(self):
        self.api_key = os.getenv('DEEPSEEK_API_KEY')
        self.base_url = "https://api.deepseek.com/v1"
        self.timeout = 30.0
        
    async def get_coding_help(self, question: str, context: str = "") -> str:
        """Get coding assistance from DeepSeek API"""
        if not self.api_key:
            logger.warning("DeepSeek API key not configured")
            return self._fallback_coding_response()
        
        try:
            prompt = self._build_coding_prompt(question, context)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-coder",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a helpful coding assistant. Provide clear, concise, and accurate coding help."
                            },
                            {
                                "role": "user", 
                                "content": prompt
                            }
                        ],
                        "max_tokens": 1000,
                        "temperature": 0.1
                    },
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    logger.error(f"DeepSeek API error: {response.status_code}")
                    return self._fallback_coding_response()
                    
        except Exception as e:
            logger.error(f"DeepSeek API request failed: {e}")
            return self._fallback_coding_response()
    
    def _build_coding_prompt(self, question: str, context: str) -> str:
        """Build prompt for coding questions"""
        if context:
            return f"Context from previous conversation:\n{context}\n\nCoding question: {question}"
        return f"Coding question: {question}"
    
    def _fallback_coding_response(self) -> str:
        return """I'm having trouble accessing the coding assistance service right now. Here are some general tips:

1. Check your code for syntax errors
2. Make sure all variables are properly defined
3. Verify that you're using the correct method names
4. Check for proper indentation (especially in Python)
5. Look for missing brackets, parentheses, or semicolons

Please try your question again, and I'll do my best to help!"""

class GeneralQAAPI:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')  # Optional fallback
        self.timeout = 30.0
        
    async def get_answer(self, question: str, context: str = "") -> str:
        """Get general Q&A response"""
        # For now, provide intelligent responses without external API
        # In production, you could integrate with OpenAI, Anthropic, etc.
        
        return await self._generate_local_response(question, context)
    
    async def _generate_local_response(self, question: str, context: str) -> str:
        """Generate response using local logic"""
        question_lower = question.lower()
        
        # Simple keyword-based responses
        if any(word in question_lower for word in ['hello', 'hi', 'hey']):
            return "Hello! I'm CodementorX, your AI assistant. How can I help you today?"
        
        elif any(word in question_lower for word in ['thank', 'thanks']):
            return "You're welcome! Is there anything else I can help you with?"
        
        elif any(word in question_lower for word in ['bye', 'goodbye', 'see you']):
            return "Goodbye! Feel free to come back anytime if you need help."
        
        elif 'weather' in question_lower:
            return "I don't have access to real-time weather data, but you can check your local weather service or apps like Weather.com for current conditions."
        
        elif 'time' in question_lower:
            from datetime import datetime
            current_time = datetime.now().strftime("%H:%M")
            return f"The current time is {current_time}. Is there anything else I can help you with?"
        
        else:
            return f"""I understand you're asking about: "{question}"

While I'm designed to be most helpful with coding questions, I'll do my best to assist you. Could you provide a bit more context or let me know if this relates to:

1. Programming or software development
2. Technical concepts
3. Learning resources
4. Problem-solving approaches

This will help me give you a more targeted and useful response!"""

class TranslationAPI:
    def __init__(self):
        self.api_key = os.getenv('TRANSLATION_API_KEY')
        self.timeout = 30.0
        
    async def translate_text(self, text: str) -> str:
        """Provide basic translation assistance"""
        # For demo purposes, provide basic translation guidance
        # In production, integrate with Google Translate, DeepL, etc.
        
        return f"""I can help with translation requests! For the text: "{text}"

Currently, I provide translation guidance rather than direct translation. Here are some suggestions:

1. **Google Translate**: translate.google.com - Free and supports 100+ languages
2. **DeepL**: deepl.com - High-quality translations for European languages
3. **Microsoft Translator**: translator.microsoft.com - Good for technical content

For programming-related translations:
- If you need to translate code comments or variable names
- Help with internationalization (i18n) in your applications
- Guidance on Unicode and character encoding

Would you like specific help with any of these areas?"""

# Utility functions for API management
class APIRateLimiter:
    def __init__(self):
        self.request_counts = {}
        self.rate_limits = {
            'deepseek': {'requests': 100, 'window': 3600},  # 100 requests per hour
            'openai': {'requests': 50, 'window': 3600},     # 50 requests per hour
            'translation': {'requests': 200, 'window': 3600} # 200 requests per hour
        }
    
    async def check_rate_limit(self, service: str, user_id: int) -> bool:
        """Check if user has exceeded rate limit for specific service"""
        key = f"{service}:{user_id}"
        current_time = int(asyncio.get_event_loop().time())
        
        if key not in self.request_counts:
            self.request_counts[key] = []
        
        # Clean old requests outside the window
        window = self.rate_limits.get(service, {}).get('window', 3600)
        self.request_counts[key] = [
            req_time for req_time in self.request_counts[key] 
            if current_time - req_time < window
        ]
        
        # Check if under limit
        max_requests = self.rate_limits.get(service, {}).get('requests', 100)
        if len(self.request_counts[key]) < max_requests:
            self.request_counts[key].append(current_time)
            return True
        
        return False

# Global rate limiter instance
api_rate_limiter = APIRateLimiter()