"""
Comprehensive tests for FastAPI chatbot service
"""

import pytest
import asyncio
from unittest.mock import patch
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

# ✅ Absolute imports from project root
from backend.chatbot.main import app
from backend.chatbot.utils import verify_jwt_token, rate_limit_check, extract_intent, get_redis_client
from backend.chatbot.services import ChatService
from backend.chatbot.models import ChatIntent

# Test client
client = TestClient(app)

# Sample JWT payload for testing
SAMPLE_USER_PAYLOAD = {
    'user_id': 123,
    'username': 'testuser',
    'email': 'test@example.com',
    'role': 'user',
    'exp': (datetime.utcnow() + timedelta(hours=1)).timestamp(),
    'iat': datetime.utcnow().timestamp(),
    'token_type': 'access'
}


class TestChatEndpoints:
    """Test chat API endpoints"""

    @pytest.fixture
    def mock_jwt_verification(self):
        """Mock JWT verification for testing"""
        with patch("backend.chatbot.utils.verify_jwt_token") as mock:
            mock.return_value = SAMPLE_USER_PAYLOAD
            yield mock

    @pytest.fixture
    def mock_rate_limit(self):
        """Mock rate limiting for testing"""
        with patch("backend.chatbot.utils.rate_limit_check") as mock:
            mock.return_value = True  # Allow all requests
            yield mock

    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "timestamp" in data
        assert "services" in data

    def test_chat_status_public(self):
        """Test public chat status endpoint"""
        response = client.get("/api/chat/status")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "CodementorX Chatbot API"

    def test_chat_endpoint_no_auth(self):
        """Test chat endpoint without authentication"""
        chat_data = {"content": "Hello, world!", "intent": "general"}
        response = client.post("/api/chat/", json=chat_data)
        assert response.status_code == 401

    def test_chat_endpoint_invalid_token(self):
        """Test chat endpoint with invalid token"""
        chat_data = {"content": "Hello, world!", "intent": "general"}
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.post("/api/chat/", json=chat_data, headers=headers)
        assert response.status_code == 401

    def test_chat_endpoint_success(self, mock_jwt_verification, mock_rate_limit):
        """Test successful chat endpoint"""
        chat_data = {
            "content": "How do I implement JWT in FastAPI?",
            "intent": "coding",
        }
        headers = {"Authorization": "Bearer valid-token"}

        with patch("backend.chatbot.services.ChatService.process_chat_message") as mock_process:
            mock_process.return_value = {
                "reply": "Here is how to implement JWT...",
                "conversation_id": 123,
                "message_id": 456,
                "intent": ChatIntent.CODING,
                "processing_time": 1.23,
                "metadata": {"tokens_used": 100},
            }

            response = client.post("/api/chat/", json=chat_data, headers=headers)
            assert response.status_code == 200
            data = response.json()
            assert "reply" in data
            assert "conversation_id" in data
            assert data["intent"] == "coding"

    def test_chat_endpoint_rate_limited(self, mock_jwt_verification):
        """Test chat endpoint when rate limited"""
        chat_data = {"content": "Hello, world!", "intent": "general"}
        headers = {"Authorization": "Bearer valid-token"}

        with patch("backend.chatbot.utils.rate_limit_check") as mock_rate_limit:
            mock_rate_limit.return_value = False  # Rate limited
            response = client.post("/api/chat/", json=chat_data, headers=headers)
            assert response.status_code == 429


class TestUtilities:
    """Test utility functions"""

    def test_extract_intent_coding(self):
        coding_messages = [
            "How do I write a Python function?",
            "Debug this JavaScript code",
            "FastAPI vs Django comparison",
        ]
        for message in coding_messages:
            assert extract_intent(message) == "coding"

    def test_extract_intent_translation(self):
        translation_messages = [
            "Translate this to Spanish",
            "How do you say hello in French?",
            "Chinese translation please",
        ]
        for message in translation_messages:
            assert extract_intent(message) == "translation"

    def test_extract_intent_general(self):
        general_messages = [
            "What's the weather like?",
            "Tell me a joke",
            "How are you doing?",
        ]
        for message in general_messages:
            assert extract_intent(message) == "general"

    @patch("backend.chatbot.utils.jwt.decode")
    def test_jwt_verification_success(self, mock_decode):
        mock_decode.return_value = SAMPLE_USER_PAYLOAD
        result = verify_jwt_token("valid-token")
        assert result["user_id"] == 123
        assert result["email"] == "test@example.com"
        assert result["role"] == "user"

    @patch("backend.chatbot.utils.jwt.decode")
    def test_jwt_verification_expired(self, mock_decode):
        expired_payload = SAMPLE_USER_PAYLOAD.copy()
        expired_payload["exp"] = (datetime.utcnow() - timedelta(hours=1)).timestamp()
        mock_decode.return_value = expired_payload
        with pytest.raises(Exception):
            verify_jwt_token("expired-token")


class TestChatService:
    """Test chat service business logic"""

    @pytest.fixture
    def chat_service(self):
        return ChatService()

    @pytest.mark.asyncio
    async def test_process_chat_message_coding(self, chat_service):
        result = await chat_service.process_chat_message(
            content="How do I implement JWT in FastAPI?",
            user_id=123,
            intent=ChatIntent.CODING,
        )
        assert "reply" in result
        assert result["intent"] == ChatIntent.CODING
        assert "jwt" in result["reply"].lower()
        assert "fastapi" in result["reply"].lower()

    @pytest.mark.asyncio
    async def test_process_chat_message_general(self, chat_service):
        result = await chat_service.process_chat_message(
            content="Hello, how are you?", user_id=123, intent=ChatIntent.GENERAL
        )
        assert "reply" in result
        assert result["intent"] == ChatIntent.GENERAL
        assert "CodementorX" in result["reply"]

    @pytest.mark.asyncio
    async def test_process_chat_message_auto_intent(self, chat_service):
        result = await chat_service.process_chat_message(
            content="Debug this Python code please", user_id=123
        )
        assert result["intent"] == ChatIntent.CODING


class TestPerformance:
    """Test performance characteristics"""

    @pytest.mark.asyncio
    async def test_chat_response_time(self):
        service = ChatService()
        start_time = asyncio.get_event_loop().time()
        result = await service.process_chat_message(
            content="Quick test message", user_id=123
        )
        end_time = asyncio.get_event_loop().time()
        response_time = end_time - start_time
        assert response_time < 5.0
        assert result["processing_time"] < 5.0


class TestIntegration:
    """Integration tests with external dependencies"""

    @pytest.mark.asyncio
    async def test_redis_connection(self):
        try:
            redis_client = await get_redis_client()
            await redis_client.ping()
            assert True
        except Exception:
            pytest.skip("Redis not available for testing")


if __name__ == "__main__":
    pytest.main(["-v", __file__])
