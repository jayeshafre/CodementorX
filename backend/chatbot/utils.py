"""
Utility functions for JWT verification, Redis connection, and logging
Ensures seamless integration with Django JWT authentication
"""

import asyncio
import redis.asyncio as redis
import structlog
import logging
import sys
from typing import Optional, Dict, Any
from contextvars import ContextVar
from datetime import datetime, timezone
from jose import JWTError, jwt
from fastapi import HTTPException, status
from decouple import config

# Context variable for correlation ID
correlation_id_var: ContextVar[str] = ContextVar('correlation_id', default='')

# Configuration - FIXED: Must match Django settings exactly
JWT_SECRET_KEY = config('JWT_SECRET_KEY')
JWT_ALGORITHM = config('JWT_ALGORITHM', default='HS256')
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

# Redis client instance
_redis_client: Optional[redis.Redis] = None

def setup_logging():
    """Configure structured logging with enhanced formatting"""
    
    def add_correlation_id(_, __, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Add correlation ID to log entries"""
        correlation_id = correlation_id_var.get()
        if correlation_id:
            event_dict["correlation_id"] = correlation_id
        return event_dict
    
    def add_service_context(_, __, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Add service context to logs"""
        event_dict["service"] = "chatbot-api"
        event_dict["version"] = "1.0.0"
        return event_dict
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            add_correlation_id,
            add_service_context,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            # Use JSON in production, console in development
            structlog.processors.JSONRenderer() 
            if not config('DEBUG', default=False, cast=bool) 
            else structlog.dev.ConsoleRenderer(colors=True)
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard logging
    log_level = config('LOG_LEVEL', default='INFO')
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )
    
    # Reduce noise from other libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("redis").setLevel(logging.WARNING)

def verify_jwt_token(token: str) -> Dict[str, Any]:
    """
    Verify JWT token issued by Django with enhanced validation
    Returns user information from token payload
    """
    logger = structlog.get_logger(__name__)
    
    try:
        # FIXED: Validate token format first
        if not token or not isinstance(token, str):
            logger.warning("Invalid token format", token_type=type(token))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )
        
        # Decode JWT token using same secret as Django
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
        
        logger.debug("JWT payload decoded", keys=list(payload.keys()))
        
        # ENHANCED: Validate required fields
        required_fields = ['user_id', 'exp']
        missing_fields = [field for field in required_fields if field not in payload]
        if missing_fields:
            logger.warning("Missing required JWT fields", missing_fields=missing_fields)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: missing fields {missing_fields}"
            )
        
        # Validate token expiration
        exp = payload.get('exp')
        if exp:
            try:
                exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
                current_time = datetime.now(timezone.utc)
                
                if exp_datetime <= current_time:
                    logger.warning(
                        "Token has expired", 
                        exp_time=exp_datetime.isoformat(),
                        current_time=current_time.isoformat()
                    )
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired"
                    )
                
                # Log time until expiration for debugging
                time_until_exp = (exp_datetime - current_time).total_seconds()
                logger.debug("Token expiration validated", seconds_until_exp=time_until_exp)
                
            except (ValueError, OSError) as e:
                logger.warning("Invalid expiration timestamp", exp=exp, error=str(e))
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token expiration"
                )
        
        # Extract and validate user information
        user_id = payload.get('user_id')
        
        # FIXED: Handle both string and integer user IDs
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            logger.warning("Invalid user_id format", user_id=user_id, user_id_type=type(user_id))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: invalid user_id"
            )
        
        logger.info("JWT token verified successfully", user_id=user_id)
        
        return {
            'user_id': user_id,
            'username': payload.get('username', ''),
            'email': payload.get('email', ''),
            'role': payload.get('role', 'user'),
            'exp': exp,
            'iat': payload.get('iat'),
            'token_type': payload.get('token_type', 'access'),
            # Additional fields that might be present
            'is_staff': payload.get('is_staff', False),
            'is_superuser': payload.get('is_superuser', False),
            'first_name': payload.get('first_name', ''),
            'last_name': payload.get('last_name', ''),
        }
        
    except JWTError as e:
        logger.warning("JWT verification failed", error=str(e), error_type=type(e).__name__)
        # Determine specific JWT error type for better error messages
        if "signature" in str(e).lower():
            detail = "Invalid token signature"
        elif "expired" in str(e).lower():
            detail = "Token has expired"
        elif "decode" in str(e).lower():
            detail = "Token decode failed"
        else:
            detail = "Invalid token"
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(
            "Unexpected error during JWT verification", 
            error=str(e), 
            error_type=type(e).__name__
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )

async def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client instance with enhanced connection handling"""
    global _redis_client
    
    logger = structlog.get_logger(__name__)
    
    if _redis_client is None:
        try:
            # ENHANCED: Parse Redis URL and add connection parameters
            _redis_client = redis.from_url(
                REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20,
                retry_on_timeout=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                health_check_interval=30
            )
            
            # Test connection with timeout
            await asyncio.wait_for(_redis_client.ping(), timeout=5.0)
            logger.info("Redis client initialized successfully")
            
        except asyncio.TimeoutError:
            logger.error("Redis connection timeout")
            _redis_client = None
        except Exception as e:
            logger.error("Failed to initialize Redis client", error=str(e))
            _redis_client = None
    
    return _redis_client

async def close_redis_connection():
    """Close Redis connection gracefully"""
    global _redis_client
    
    logger = structlog.get_logger(__name__)
    
    if _redis_client:
        try:
            await _redis_client.close()
            logger.info("Redis connection closed successfully")
        except Exception as e:
            logger.error("Error closing Redis connection", error=str(e))
        finally:
            _redis_client = None

async def cache_set(key: str, value: str, expire: int = 3600) -> bool:
    """Set cache value with expiration and error handling"""
    logger = structlog.get_logger(__name__)
    
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            logger.warning("Redis client not available for cache_set")
            return False
            
        await redis_client.setex(key, expire, value)
        logger.debug("Cache set successful", key=key, expire=expire)
        return True
        
    except Exception as e:
        logger.error("Cache set failed", key=key, error=str(e))
        return False

async def cache_get(key: str) -> Optional[str]:
    """Get cache value with error handling"""
    logger = structlog.get_logger(__name__)
    
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            logger.debug("Redis client not available for cache_get")
            return None
            
        value = await redis_client.get(key)
        logger.debug("Cache get", key=key, found=value is not None)
        return value
        
    except Exception as e:
        logger.error("Cache get failed", key=key, error=str(e))
        return None

async def rate_limit_check(user_id: int, window: int = 60, limit: int = 100) -> bool:
    """
    Enhanced rate limiting with sliding window algorithm
    Returns True if request is allowed, False if rate limited
    """
    logger = structlog.get_logger(__name__)
    
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            logger.warning("Redis not available, allowing request")
            return True
        
        key = f"rate_limit:user:{user_id}"
        now = datetime.now().timestamp()
        
        # Use transaction for atomicity
        async with redis_client.pipeline(transaction=True) as pipe:
            # Remove expired entries (older than window)
            pipe.zremrangebyscore(key, 0, now - window)
            
            # Count current requests in window
            pipe.zcard(key)
            
            # Add current request timestamp
            pipe.zadd(key, {str(now): now})
            
            # Set expiration for cleanup
            pipe.expire(key, window + 10)
            
            results = await pipe.execute()
            
        current_count = results[1]  # Result from zcard
        
        is_allowed = current_count < limit
        
        if not is_allowed:
            logger.warning(
                "Rate limit exceeded",
                user_id=user_id,
                current_count=current_count,
                limit=limit,
                window=window
            )
        else:
            logger.debug(
                "Rate limit check passed",
                user_id=user_id,
                current_count=current_count,
                limit=limit
            )
        
        return is_allowed
        
    except Exception as e:
        logger.error("Rate limit check failed", user_id=user_id, error=str(e))
        # Allow request if rate limiting fails (fail open)
        return True

def extract_intent(content: str) -> str:
    """
    Enhanced intent extraction from user message
    In production, replace with proper NLP model
    """
    if not content or not isinstance(content, str):
        return 'general'
    
    content_lower = content.lower().strip()
    
    # Enhanced coding keywords with weighted scoring
    coding_keywords = [
        'code', 'coding', 'programming', 'develop', 'developer', 'software',
        'python', 'javascript', 'react', 'django', 'fastapi', 'nodejs', 'express',
        'sql', 'database', 'mysql', 'postgresql', 'mongodb', 'redis',
        'algorithm', 'function', 'class', 'method', 'variable', 'array', 'object',
        'loop', 'condition', 'if', 'else', 'try', 'catch', 'exception',
        'api', 'endpoint', 'route', 'middleware', 'authentication', 'jwt',
        'debug', 'error', 'bug', 'fix', 'troubleshoot', 'stack trace',
        'framework', 'library', 'package', 'import', 'export',
        'html', 'css', 'scss', 'tailwind', 'bootstrap',
        'git', 'github', 'version control', 'commit', 'merge',
        'docker', 'kubernetes', 'deployment', 'ci/cd', 'testing'
    ]
    
    # Translation keywords
    translation_keywords = [
        'translate', 'translation', 'language', 'lingua', 'idioma',
        'français', 'french', 'spanish', 'español', 'deutsch', 'german',
        'chinese', 'mandarin', 'japanese', 'hindi', 'arabic', 'portuguese',
        'italian', 'russian', 'korean', 'turkish', 'dutch', 'swedish',
        'meaning', 'interpret', 'localize', 'localization'
    ]
    
    # Count matches for each intent
    coding_score = sum(1 for keyword in coding_keywords if keyword in content_lower)
    translation_score = sum(1 for keyword in translation_keywords if keyword in content_lower)
    
    # Enhanced logic with threshold
    if coding_score >= 1:
        return 'coding'
    elif translation_score >= 1:
        return 'translation'
    
    # Check for specific patterns
    if any(pattern in content_lower for pattern in [
        'how to', 'how do i', 'how can i', 'help me', 'explain',
        'what is', 'what are', 'why does', 'why is'
    ]):
        # These could be coding questions even without explicit keywords
        if any(tech_term in content_lower for tech_term in [
            'implement', 'create', 'build', 'make', 'write',
            'syntax', 'logic', 'structure', 'pattern'
        ]):
            return 'coding'
    
    return 'general'

# ADDITIONAL: Cache utilities for better performance
async def cache_exists(key: str) -> bool:
    """Check if cache key exists"""
    logger = structlog.get_logger(__name__)
    
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return False
            
        exists = await redis_client.exists(key)
        return bool(exists)
        
    except Exception as e:
        logger.error("Cache exists check failed", key=key, error=str(e))
        return False

async def cache_delete(key: str) -> bool:
    """Delete cache key"""
    logger = structlog.get_logger(__name__)
    
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return False
            
        deleted = await redis_client.delete(key)
        logger.debug("Cache delete", key=key, deleted=bool(deleted))
        return bool(deleted)
        
    except Exception as e:
        logger.error("Cache delete failed", key=key, error=str(e))
        return False

async def cache_increment(key: str, expire: int = 3600) -> int:
    """Increment cache counter"""
    logger = structlog.get_logger(__name__)
    
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return 0
            
        # Use pipeline for atomicity
        async with redis_client.pipeline(transaction=True) as pipe:
            pipe.incr(key)
            pipe.expire(key, expire)
            results = await pipe.execute()
            
        count = results[0]
        logger.debug("Cache increment", key=key, count=count)
        return int(count)
        
    except Exception as e:
        logger.error("Cache increment failed", key=key, error=str(e))
        return 0

# Health check utilities
async def check_redis_health() -> Dict[str, Any]:
    """Comprehensive Redis health check"""
    logger = structlog.get_logger(__name__)
    
    health_info = {
        "status": "unknown",
        "latency": None,
        "memory_usage": None,
        "connected_clients": None,
        "error": None
    }
    
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            health_info["status"] = "unavailable"
            health_info["error"] = "Redis client not initialized"
            return health_info
        
        # Test latency
        import time
        start = time.time()
        await redis_client.ping()
        latency = round((time.time() - start) * 1000, 2)  # Convert to ms
        
        # Get Redis info
        info = await redis_client.info()
        
        health_info.update({
            "status": "healthy",
            "latency": f"{latency}ms",
            "memory_usage": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "redis_version": info.get("redis_version", "unknown")
        })
        
    except Exception as e:
        health_info.update({
            "status": "unhealthy",
            "error": str(e)
        })
        logger.error("Redis health check failed", error=str(e))
    
    return health_info

# JWT utilities for token introspection
def decode_jwt_without_verification(token: str) -> Dict[str, Any]:
    """
    Decode JWT token without verification (for debugging/introspection)
    WARNING: Only use for non-security purposes!
    """
    try:
        # Decode without verification
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except Exception as e:
        logger = structlog.get_logger(__name__)
        logger.warning("JWT decode without verification failed", error=str(e))
        return {}

def get_jwt_expiry_time(token: str) -> Optional[datetime]:
    """Get JWT token expiry time without full verification"""
    try:
        payload = decode_jwt_without_verification(token)
        exp = payload.get('exp')
        if exp:
            return datetime.fromtimestamp(exp, tz=timezone.utc)
        return None
    except Exception:
        return None