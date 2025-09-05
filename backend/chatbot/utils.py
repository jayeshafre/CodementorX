"""
Utility functions for FastAPI Chatbot Service
JWT token verification and helper functions
"""
import os
import jwt
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from models import UserInfo

# Configure logging
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")


def verify_jwt_token(token: str) -> UserInfo:
    """
    Verify JWT token and extract user information
    Compatible with Django REST Framework SimpleJWT tokens
    """
    try:
        # Decode the JWT token
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={"verify_exp": True}
        )
        
        # Extract user information from payload
        user_id = payload.get("user_id")
        if not user_id:
            raise ValueError("Invalid token: missing user_id")
        
        # Create UserInfo object
        user_info = UserInfo(
            user_id=int(user_id),
            email=payload.get("email", ""),
            username=payload.get("username", ""),
            full_name=payload.get("full_name", ""),
            role=payload.get("role", "user"),
            is_verified=payload.get("is_verified", False)
        )
        
        logger.info(f"JWT token verified for user {user_id}")
        return user_info
        
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
        raise ValueError("Token has expired")
    
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        raise ValueError(f"Invalid token: {str(e)}")
    
    except Exception as e:
        logger.error(f"JWT verification error: {e}")
        raise ValueError(f"Token verification failed: {str(e)}")


def extract_bearer_token(authorization_header: str) -> str:
    """
    Extract Bearer token from Authorization header
    """
    try:
        if not authorization_header:
            raise ValueError("Authorization header is missing")
        
        parts = authorization_header.split()
        
        if len(parts) != 2:
            raise ValueError("Invalid authorization header format")
        
        scheme, token = parts
        
        if scheme.lower() != "bearer":
            raise ValueError("Invalid authorization scheme")
        
        return token
        
    except Exception as e:
        logger.error(f"Error extracting bearer token: {e}")
        raise ValueError(f"Invalid authorization header: {str(e)}")


def format_datetime(dt: datetime) -> str:
    """
    Format datetime for consistent API responses
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def parse_datetime(dt_string: str) -> datetime:
    """
    Parse datetime string to datetime object
    """
    try:
        # Try parsing with timezone info
        return datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
    except ValueError:
        try:
            # Try parsing without timezone info
            dt = datetime.fromisoformat(dt_string)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError as e:
            logger.error(f"Failed to parse datetime: {dt_string}, error: {e}")
            raise ValueError(f"Invalid datetime format: {dt_string}")


def sanitize_string(text: str, max_length: int = 1000) -> str:
    """
    Sanitize string input for security
    """
    if not isinstance(text, str):
        text = str(text)
    
    # Remove null bytes and control characters
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    
    # Trim whitespace
    text = text.strip()
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length].rstrip() + "..."
    
    return text


def validate_conversation_id(conversation_id: str) -> bool:
    """
    Validate conversation ID format
    """
    if not conversation_id:
        return False
    
    # Check length (UUIDs are typically 36 characters)
    if len(conversation_id) > 100:
        return False
    
    # Check for valid characters (alphanumeric, hyphens, underscores)
    pattern = r'^[a-zA-Z0-9_-]+$'
    return bool(re.match(pattern, conversation_id))


def generate_conversation_id() -> str:
    """
    Generate a unique conversation ID
    """
    return str(uuid.uuid4())


def get_client_ip(headers: Dict[str, str]) -> str:
    """
    Extract client IP from request headers
    """
    # Check X-Forwarded-For header first
    forwarded_for = headers.get('x-forwarded-for', '')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    
    # Check X-Real-IP header
    real_ip = headers.get('x-real-ip', '')
    if real_ip:
        return real_ip.strip()
    
    # Fallback to remote address
    return headers.get('x-forwarded-host', 'unknown')


def create_error_response(message: str, detail: Optional[str] = None, status_code: int = 400) -> Dict[str, Any]:
    """
    Create standardized error response
    """
    return {
        "error": message,
        "detail": detail,
        "status_code": status_code,
        "timestamp": format_datetime(datetime.now(timezone.utc))
    }


def log_request(method: str, url: str, user_id: Optional[int] = None, ip: Optional[str] = None):
    """
    Log API request for monitoring
    """
    log_data = {
        "method": method,
        "url": url,
        "timestamp": format_datetime(datetime.now(timezone.utc))
    }
    
    if user_id:
        log_data["user_id"] = user_id
    
    if ip:
        log_data["ip"] = ip
    
    logger.info(f"API Request: {log_data}")


def check_rate_limit(user_id: int, action: str = "chat", limit: int = 100, window: int = 3600) -> Dict[str, Any]:
    """
    Simple rate limiting check (would need Redis implementation for production)
    Returns dict with 'allowed' boolean and 'remaining' count
    """
    # This is a placeholder - in production, you'd implement this with Redis
    # For now, always return allowed with dummy remaining count
    return {
        "allowed": True,
        "remaining": limit - 1,
        "reset_time": datetime.now(timezone.utc).timestamp() + window
    }


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to specified length with suffix
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)].rstrip() + suffix


def is_valid_email(email: str) -> bool:
    """
    Basic email validation
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def clean_html(text: str) -> str:
    """
    Remove HTML tags from text (basic sanitization)
    """
    clean_pattern = re.compile('<.*?>')
    return re.sub(clean_pattern, '', text)


def validate_message_content(content: str) -> Dict[str, Any]:
    """
    Validate chat message content
    """
    if not content or not isinstance(content, str):
        return {
            "valid": False,
            "error": "Message content is required and must be a string"
        }
    
    content = content.strip()
    
    if len(content) == 0:
        return {
            "valid": False,
            "error": "Message content cannot be empty"
        }
    
    if len(content) > 10000:
        return {
            "valid": False,
            "error": "Message content is too long (maximum 10,000 characters)"
        }
    
    # Check for potentially harmful content patterns
    suspicious_patterns = [
        r'<script[^>]*>',
        r'javascript:',
        r'vbscript:',
        r'data:text/html',
        r'eval\s*\(',
    ]
    
    for pattern in suspicious_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return {
                "valid": False,
                "error": "Message contains potentially harmful content"
            }
    
    return {
        "valid": True,
        "cleaned_content": sanitize_string(content, 10000)
    }


def format_token_usage(usage_data: Optional[Dict[str, int]]) -> Dict[str, Any]:
    """
    Format token usage data for consistent API responses
    """
    if not usage_data:
        return {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "cost_estimate": 0.0
        }
    
    prompt_tokens = usage_data.get("prompt_tokens", 0)
    completion_tokens = usage_data.get("completion_tokens", 0)
    total_tokens = usage_data.get("total_tokens", prompt_tokens + completion_tokens)
    
    # Rough cost estimate (you'd replace with actual pricing)
    cost_per_1k_tokens = 0.002  # Example pricing
    cost_estimate = (total_tokens / 1000) * cost_per_1k_tokens
    
    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "cost_estimate": round(cost_estimate, 6)
    }


def extract_mentions(text: str) -> List[str]:
    """
    Extract @mentions from text
    """
    mention_pattern = r'@(\w+)'
    mentions = re.findall(mention_pattern, text)
    return list(set(mentions))  # Remove duplicates


def extract_hashtags(text: str) -> List[str]:
    """
    Extract #hashtags from text
    """
    hashtag_pattern = r'#(\w+)'
    hashtags = re.findall(hashtag_pattern, text)
    return list(set(hashtags))  # Remove duplicates


def calculate_message_complexity(text: str) -> Dict[str, Any]:
    """
    Calculate basic complexity metrics for a message
    """
    if not text:
        return {
            "character_count": 0,
            "word_count": 0,
            "sentence_count": 0,
            "avg_word_length": 0.0,
            "complexity_score": 0.0
        }
    
    # Basic metrics
    char_count = len(text)
    words = text.split()
    word_count = len(words)
    sentences = re.split(r'[.!?]+', text)
    sentence_count = len([s for s in sentences if s.strip()])
    
    # Average word length
    avg_word_length = sum(len(word) for word in words) / word_count if word_count > 0 else 0
    
    # Simple complexity score (0-100)
    complexity_score = min(100, (avg_word_length * 10) + (sentence_count * 5))
    
    return {
        "character_count": char_count,
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_word_length": round(avg_word_length, 2),
        "complexity_score": round(complexity_score, 2)
    }


def mask_sensitive_data(data: Dict[str, Any], sensitive_keys: List[str] = None) -> Dict[str, Any]:
    """
    Mask sensitive data in dictionaries for logging
    """
    if sensitive_keys is None:
        sensitive_keys = ['password', 'token', 'key', 'secret', 'api_key']
    
    masked_data = {}
    for key, value in data.items():
        if any(sensitive_key in key.lower() for sensitive_key in sensitive_keys):
            if isinstance(value, str) and len(value) > 8:
                masked_data[key] = value[:4] + '*' * (len(value) - 8) + value[-4:]
            else:
                masked_data[key] = '***masked***'
        elif isinstance(value, dict):
            masked_data[key] = mask_sensitive_data(value, sensitive_keys)
        else:
            masked_data[key] = value
    
    return masked_data


def create_conversation_summary(messages: List[Dict[str, Any]], max_length: int = 100) -> str:
    """
    Create a summary of a conversation from messages
    """
    if not messages:
        return "Empty conversation"
    
    # Get the first user message
    first_user_message = None
    for msg in messages:
        if msg.get("role") == "user":
            first_user_message = msg.get("content", "")
            break
    
    if not first_user_message:
        return "New conversation"
    
    # Clean and truncate
    summary = clean_html(first_user_message)
    summary = re.sub(r'\s+', ' ', summary).strip()
    
    return truncate_text(summary, max_length)


def validate_model_parameters(temperature: float, max_tokens: int) -> Dict[str, Any]:
    """
    Validate AI model parameters
    """
    errors = []
    
    if not isinstance(temperature, (int, float)):
        errors.append("Temperature must be a number")
    elif not 0.0 <= temperature <= 2.0:
        errors.append("Temperature must be between 0.0 and 2.0")
    
    if not isinstance(max_tokens, int):
        errors.append("Max tokens must be an integer")
    elif not 1 <= max_tokens <= 4000:
        errors.append("Max tokens must be between 1 and 4000")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "normalized_temperature": max(0.0, min(2.0, float(temperature))) if isinstance(temperature, (int, float)) else 0.7,
        "normalized_max_tokens": max(1, min(4000, int(max_tokens))) if isinstance(max_tokens, int) else 1000
    }


def get_system_info() -> Dict[str, Any]:
    """
    Get basic system information for health checks
    """
    return {
        "service": "CodementorX Chatbot API",
        "version": "1.0.0",
        "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
        "timestamp": format_datetime(datetime.now(timezone.utc)),
        "timezone": str(timezone.utc),
        "environment": "development" if os.getenv("DEBUG", "False").lower() == "true" else "production"
    }