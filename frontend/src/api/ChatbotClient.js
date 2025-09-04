/**
 * ChatbotClient.js - FastAPI Chatbot Service Integration
 * FIXED: Proper field mapping between frontend/backend
 */
import axios from 'axios';
import { TokenManager } from './axiosClient';

// Create dedicated chatbot axios instance
const chatbotClient = axios.create({
  baseURL: import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds for AI responses
});

// Request retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
};

// Rate limiting tracking
const rateLimitTracker = {
  requests: [],
  maxPerMinute: 100,
  
  canMakeRequest() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);
    return this.requests.length < this.maxPerMinute;
  },
  
  recordRequest() {
    this.requests.push(Date.now());
  }
};

// Request interceptor
chatbotClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['X-Request-ID'] = `chatbot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!rateLimitTracker.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please slow down your requests.');
    }
    rateLimitTracker.recordRequest();
    
    if (import.meta.env.DEV) {
      console.log(`🤖 Chatbot Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
chatbotClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ Chatbot Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (import.meta.env.DEV) {
      console.error(`❌ Chatbot Error: ${error.response?.status} ${error.config?.url}`, {
        message: error.response?.data?.error || error.message,
        details: error.response?.data
      });
    }
    
    // Handle various error types...
    if (error.response?.status === 401) {
      throw error;
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 
                        error.response.data?.retry_after || 60;
      throw new ChatbotError(
        'Rate limit exceeded. Please wait before sending more messages.',
        'RATE_LIMITED',
        { retryAfter: parseInt(retryAfter) }
      );
    }
    
    if (error.response?.status === 422) {
      const validationDetails = error.response?.data?.detail || [];
      let errorMessage = 'Invalid request data';
      
      if (Array.isArray(validationDetails) && validationDetails.length > 0) {
        const fieldErrors = validationDetails.map(err => 
          `${err.loc?.join('.')} - ${err.msg}`
        ).join('; ');
        errorMessage = `Validation failed: ${fieldErrors}`;
      }
      
      throw new ChatbotError(errorMessage, 'VALIDATION_ERROR', { 
        details: validationDetails 
      });
    }
    
    // Retry logic
    if (shouldRetry(error) && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }
    
    if (shouldRetry(error) && originalRequest._retryCount < RETRY_CONFIG.maxRetries) {
      originalRequest._retryCount += 1;
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, originalRequest._retryCount - 1);
      
      console.log(`🔄 Retrying request (${originalRequest._retryCount}/${RETRY_CONFIG.maxRetries}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return chatbotClient(originalRequest);
    }
    
    throw error;
  }
);

// Custom error class
class ChatbotError extends Error {
  constructor(message, code = 'CHATBOT_ERROR', details = {}) {
    super(message);
    this.name = 'ChatbotError';
    this.code = code;
    this.details = details;
  }
}

function shouldRetry(error) {
  if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
    return false;
  }
  return (
    !error.response ||
    error.code === 'ECONNABORTED' ||
    error.response.status >= 500
  );
}

// Chat intent enum
export const CHAT_INTENTS = {
  GENERAL: 'general',
  CODING: 'coding', 
  TRANSLATION: 'translation'
};

// API endpoints
const ENDPOINTS = {
  CHAT: '/chat/',
  HEALTH: '/health',
  STATUS: '/chat/status',
  CONVERSATIONS: '/chat/conversations'
};

// Main chatbot API
export const chatbotAPI = {
  /**
   * FIXED: Send message with proper field mapping
   */
  async sendMessage({ content, conversationId = null, intent = null, metadata = {} }) {
    try {
      // Validate input
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new ChatbotError('Message content cannot be empty', 'INVALID_INPUT');
      }
      
      if (content.length > 4000) {
        throw new ChatbotError('Message too long. Please limit to 4000 characters.', 'MESSAGE_TOO_LONG');
      }
      
      // FIXED: Use snake_case for backend (conversation_id)
      const payload = {
        content: content.trim(),
        metadata: {
          source: 'web_app',
          ...metadata
        }
      };
      
      // Add optional fields using backend field names
      if (conversationId !== null && conversationId !== undefined) {
        payload.conversation_id = conversationId;
      }
      
      if (intent) {
        payload.intent = intent;
      }
      
      const response = await chatbotClient.post(ENDPOINTS.CHAT, payload);
      const data = response.data;
      
      if (!data.reply) {
        throw new ChatbotError('Invalid response from chatbot service', 'INVALID_RESPONSE');
      }
      
      // FIXED: Map backend fields (snake_case) to frontend fields (camelCase)
      return {
        success: true,
        data: {
          reply: data.reply,
          conversationId: data.conversation_id, // snake_case → camelCase
          messageId: data.message_id,           // snake_case → camelCase
          intent: data.intent,
          processingTime: data.processing_time, // snake_case → camelCase
          metadata: data.metadata || {},
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      if (error instanceof ChatbotError) {
        throw error;
      }
      
      if (error.response?.status === 401) {
        const detail = error.response.data?.detail || 'Authentication required';
        throw new ChatbotError(detail, 'UNAUTHORIZED');
      }
      
      if (error.response?.status === 422) {
        const detail = error.response.data?.detail;
        let message = 'Invalid request format';
        
        if (Array.isArray(detail)) {
          const fieldErrors = detail.map(err => {
            const field = err.loc?.join('.') || 'unknown';
            return `${field}: ${err.msg}`;
          }).join(', ');
          message = `Validation failed - ${fieldErrors}`;
        } else if (typeof detail === 'string') {
          message = detail;
        }
        
        throw new ChatbotError(message, 'VALIDATION_ERROR', { details: detail });
      }
      
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        const retryAfter = errorData?.retry_after || 60;
        const message = errorData?.message || 'Too many requests. Please wait before sending more messages.';
        throw new ChatbotError(message, 'RATE_LIMITED', { retryAfter });
      }
      
      if (error.response?.status >= 500) {
        const errorMessage = error.response.data?.error || 'Chatbot service temporarily unavailable';
        throw new ChatbotError(`${errorMessage}. Please try again.`, 'SERVICE_ERROR');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new ChatbotError(
          'Request timed out. The AI is taking too long to respond.',
          'TIMEOUT'
        );
      }
      
      if (!error.response) {
        throw new ChatbotError(
          'Unable to connect to chatbot service. Check your internet connection.',
          'NETWORK_ERROR'
        );
      }
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.response?.data?.message ||
                          error.message || 
                          'An unexpected error occurred';
      
      throw new ChatbotError(errorMessage, 'UNKNOWN_ERROR');
    }
  },

  async getHealth() {
    try {
      const response = await chatbotClient.get(ENDPOINTS.HEALTH);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Health check failed',
        status: error.response?.status || 'network_error'
      };
    }
  },

  async getStatus() {
    try {
      const statusClient = axios.create({
        baseURL: chatbotClient.defaults.baseURL,
        timeout: 10000
      });
      
      const response = await statusClient.get(ENDPOINTS.STATUS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Status check failed',
        status: error.response?.status || 'network_error'
      };
    }
  },

  async getConversations() {
    try {
      const response = await chatbotClient.get(ENDPOINTS.CONVERSATIONS);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 200 || error.response?.data?.message?.includes('coming soon')) {
        return {
          success: true,
          data: {
            user_id: null,
            conversations: [],
            message: 'Conversation history feature coming soon'
          }
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to load conversations'
      };
    }
  },

  async deleteConversation(conversationId) {
    try {
      const response = await chatbotClient.delete(`/chat/conversations/${conversationId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete conversation'
      };
    }
  }
};

export { ChatbotError };

export const getRateLimitInfo = () => ({
  remaining: Math.max(0, rateLimitTracker.maxPerMinute - rateLimitTracker.requests.length),
  resetTime: Date.now() + 60000,
  maxPerMinute: rateLimitTracker.maxPerMinute
});

export const checkServiceConnectivity = async () => {
  try {
    const result = await chatbotAPI.getStatus();
    return {
      isOnline: result.success,
      status: result.success ? 'healthy' : 'down',
      lastChecked: new Date().toISOString(),
      error: result.error || null
    };
  } catch (error) {
    return {
      isOnline: false,
      status: 'down', 
      lastChecked: new Date().toISOString(),
      error: error.message
    };
  }
};

export default chatbotAPI;