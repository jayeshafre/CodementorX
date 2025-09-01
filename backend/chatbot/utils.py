import jwt
import os
import requests
from datetime import datetime
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

def verify_jwt_token(token: str) -> Dict:
    """
    Verify JWT token issued by Django
    Returns user information if valid
    """
    try:
        # Get Django secret key (should match Django settings)
        django_secret = os.getenv('DJANGO_SECRET_KEY')
        if not django_secret:
            raise ValueError("DJANGO_SECRET_KEY not found in environment")

        # Decode token
        payload = jwt.decode(
            token, 
            django_secret, 
            algorithms=['HS256'],
            options={"verify_signature": True}
        )
        
        # Check if token is expired
        exp_timestamp = payload.get('exp')
        if exp_timestamp and datetime.utcnow().timestamp() > exp_timestamp:
            raise jwt.ExpiredSignatureError("Token has expired")
        
        # Check if token is blacklisted (using Redis)
        from .redis_client import redis_client
        jti = payload.get('jti')
        if jti and redis_client.is_token_blacklisted(jti):
            raise jwt.InvalidTokenError("Token has been revoked")
        
        return {
            'user_id': payload.get('user_id'),
            'username': payload.get('username'),
            'email': payload.get('email'),
            'exp': payload.get('exp'),
            'jti': payload.get('jti')
        }
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        raise ValueError("Invalid token")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise ValueError("Token verification failed")

def get_user_from_django(user_id: int) -> Optional[Dict]:
    """
    Fetch user data from Django API
    """
    try:
        django_url = os.getenv('DJANGO_API_URL', 'http://localhost:8000')
        response = requests.get(
            f"{django_url}/api/auth/users/{user_id}/",
            timeout=5
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"Failed to fetch user {user_id}: {response.status_code}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching user from Django: {e}")
        return None

def extract_intent(message: str) -> str:
    """
    Simple intent recognition based on keywords
    In a real application, you might use a more sophisticated NLP model
    """
    message_lower = message.lower()
    
    # Coding keywords
    coding_keywords = [
        'code', 'python', 'javascript', 'html', 'css', 'react', 'django',
        'fastapi', 'function', 'class', 'variable', 'bug', 'error',
        'algorithm', 'database', 'sql', 'api', 'debug'
    ]
    
    # Translation keywords
    translation_keywords = [
        'translate', 'translation', 'language', 'spanish', 'french',
        'german', 'chinese', 'japanese', 'hindi', 'arabic'
    ]
    
    # Check for coding intent
    if any(keyword in message_lower for keyword in coding_keywords):
        return 'coding'
    
    # Check for translation intent
    if any(keyword in message_lower for keyword in translation_keywords):
        return 'translation'
    
    # Default to general
    return 'general'

def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent injection attacks
    """
    import html
    import re
    
    # HTML escape
    text = html.escape(text)
    
    # Remove potential script tags
    text = re.sub(r'<script.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Limit length
    if len(text) > 2000:
        text = text[:2000]
    
    return text.strip()