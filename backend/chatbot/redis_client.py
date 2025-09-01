import redis
import json
import os
import time
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class RedisClient:
    def __init__(self):
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        self.client = redis.from_url(self.redis_url, decode_responses=True)
        self._test_connection()

    def _test_connection(self):
        """Test Redis connection"""
        try:
            self.client.ping()
            logger.info("Redis connection established successfully")
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            raise

    # JWT Blacklist Management
    def blacklist_token(self, jti: str, ttl: int) -> bool:
        """Add JWT token to blacklist"""
        try:
            key = f"jwt:blacklist:{jti}"
            self.client.setex(key, ttl, "blacklisted")
            logger.info(f"Token {jti} blacklisted")
            return True
        except Exception as e:
            logger.error(f"Error blacklisting token: {e}")
            return False

    def is_token_blacklisted(self, jti: str) -> bool:
        """Check if JWT token is blacklisted"""
        try:
            key = f"jwt:blacklist:{jti}"
            return self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking token blacklist: {e}")
            return False

    # User Chat Cache
    def cache_user_chats(self, user_id: int, chats: List[Dict], ttl: int = 3600) -> bool:
        """Cache user's recent chats"""
        try:
            key = f"user:{user_id}:chats"
            self.client.setex(key, ttl, json.dumps(chats, default=str))
            return True
        except Exception as e:
            logger.error(f"Error caching user chats: {e}")
            return False

    def get_cached_user_chats(self, user_id: int) -> Optional[List[Dict]]:
        """Get cached user chats"""
        try:
            key = f"user:{user_id}:chats"
            cached = self.client.get(key)
            return json.loads(cached) if cached else None
        except Exception as e:
            logger.error(f"Error getting cached chats: {e}")
            return None

    def invalidate_user_chats(self, user_id: int) -> bool:
        """Invalidate user chats cache"""
        try:
            key = f"user:{user_id}:chats"
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error invalidating user chats: {e}")
            return False

    # Rate Limiting
    def check_rate_limit(self, user_id: int, limit: int = 60, window: int = 60) -> tuple[bool, int]:
        """Check if user has exceeded rate limit"""
        try:
            key = f"rate_limit:{user_id}"
            current = self.client.get(key)
            
            if current is None:
                # First request in window
                self.client.setex(key, window, 1)
                return True, limit - 1
            
            current_count = int(current)
            if current_count >= limit:
                ttl = self.client.ttl(key)
                return False, ttl
            
            # Increment counter
            self.client.incr(key)
            return True, limit - (current_count + 1)
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            return True, limit  # Allow on error

    # Message Cache
    def cache_conversation_messages(self, conversation_id: int, messages: List[Dict], ttl: int = 1800) -> bool:
        """Cache recent messages for a conversation"""
        try:
            key = f"chat:{conversation_id}:messages"
            # Store last 20 messages to limit memory usage
            recent_messages = messages[-20:] if len(messages) > 20 else messages
            self.client.setex(key, ttl, json.dumps(recent_messages, default=str))
            return True
        except Exception as e:
            logger.error(f"Error caching messages: {e}")
            return False

    def get_cached_messages(self, conversation_id: int) -> Optional[List[Dict]]:
        """Get cached messages for conversation"""
        try:
            key = f"chat:{conversation_id}:messages"
            cached = self.client.get(key)
            return json.loads(cached) if cached else None
        except Exception as e:
            logger.error(f"Error getting cached messages: {e}")
            return None

    def invalidate_conversation_messages(self, conversation_id: int) -> bool:
        """Invalidate conversation messages cache"""
        try:
            key = f"chat:{conversation_id}:messages"
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error invalidating messages cache: {e}")
            return False

    # Processing Status
    def set_processing_status(self, conversation_id: int, status: str, ttl: int = 30) -> bool:
        """Set message processing status"""
        try:
            key = f"processing:{conversation_id}"
            status_data = {
                "status": status, 
                "timestamp": time.time()
            }
            self.client.setex(key, ttl, json.dumps(status_data))
            return True
        except Exception as e:
            logger.error(f"Error setting processing status: {e}")
            return False

    def get_processing_status(self, conversation_id: int) -> Optional[Dict]:
        """Get processing status"""
        try:
            key = f"processing:{conversation_id}"
            cached = self.client.get(key)
            return json.loads(cached) if cached else None
        except Exception as e:
            logger.error(f"Error getting processing status: {e}")
            return None

    def clear_processing_status(self, conversation_id: int) -> bool:
        """Clear processing status"""
        try:
            key = f"processing:{conversation_id}"
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error clearing processing status: {e}")
            return False

    # Session Management
    def store_user_session(self, user_id: int, session_data: Dict, ttl: int = 3600) -> bool:
        """Store user session data"""
        try:
            key = f"session:{user_id}"
            self.client.setex(key, ttl, json.dumps(session_data, default=str))
            return True
        except Exception as e:
            logger.error(f"Error storing session: {e}")
            return False

    def get_user_session(self, user_id: int) -> Optional[Dict]:
        """Get user session data"""
        try:
            key = f"session:{user_id}"
            cached = self.client.get(key)
            return json.loads(cached) if cached else None
        except Exception as e:
            logger.error(f"Error getting session: {e}")
            return None

    def clear_user_session(self, user_id: int) -> bool:
        """Clear user session"""
        try:
            key = f"session:{user_id}"
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error clearing session: {e}")
            return False

    # Health check
    def health_check(self) -> Dict[str, Any]:
        """Perform Redis health check"""
        try:
            start_time = time.time()
            self.client.ping()
            response_time = time.time() - start_time
            
            info = self.client.info()
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time * 1000, 2),
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory_human", "unknown"),
                "redis_version": info.get("redis_version", "unknown")
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

# Global Redis client instance
redis_client = RedisClient()