/**
 * Chatbot API Client for FastAPI Service - localStorage Version
 * Handles communication with the stateless FastAPI chatbot service
 */
import axios from 'axios';
import { TokenManager } from './axiosClient';

// Create axios instance for chatbot service
const chatbotClient = axios.create({
  baseURL: import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for AI responses
});

// Request interceptor to add auth token
chatbotClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🤖 Chatbot Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Chatbot Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
chatbotClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ Chatbot Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    // If token expired, try to refresh and retry
    if (error.response?.status === 401) {
      console.warn('Chatbot service received 401 - token may be expired');
      // Let the main axios client handle token refresh
      // This request will be retried automatically via the auth context
    }
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ Chatbot Error: ${error.response?.status} ${error.config?.url}`, {
        message: error.response?.data?.detail || error.message,
        data: error.response?.data,
      });
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const CHATBOT_ENDPOINTS = {
  // Chat - only need message endpoint for localStorage version
  SEND_MESSAGE: '/chat/message',
  CONTINUE_CONVERSATION: (conversationId) => `/chat/conversations/${conversationId}/continue`,
  
  // Other endpoints (kept for compatibility but not used in localStorage version)
  GET_CONVERSATIONS: '/chat/conversations',
  GET_CONVERSATION: (conversationId) => `/chat/conversations/${conversationId}`,
  DELETE_CONVERSATION: (conversationId) => `/chat/conversations/${conversationId}`,
  
  // Functional endpoints
  GET_MODELS: '/chat/models',
  GET_STATS: '/chat/stats',
  
  // Health
  HEALTH: '/health',
};

// Chatbot API methods - localStorage version
export const chatbotAPI = {
  // Send a new message (primary endpoint for localStorage version)
  sendMessage: async (messageData) => {
    try {
      const response = await chatbotClient.post(CHATBOT_ENDPOINTS.SEND_MESSAGE, {
        message: messageData.message,
        conversation_id: messageData.conversationId,
        context: messageData.context || [], // Frontend provides conversation context
        model: messageData.model || 'gpt-4o-mini',
        temperature: messageData.temperature || 0.7,
        max_tokens: messageData.maxTokens || 1000,
        system_prompt: messageData.systemPrompt,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Continue an existing conversation (uses same endpoint as sendMessage in localStorage version)
  continueConversation: async (conversationId, messageData) => {
    try {
      const response = await chatbotClient.post(
        CHATBOT_ENDPOINTS.CONTINUE_CONVERSATION(conversationId), 
        {
          message: messageData.message,
          context: messageData.context || [], // Frontend provides context
          model: messageData.model || 'gpt-4o-mini',
          temperature: messageData.temperature || 0.7,
          max_tokens: messageData.maxTokens || 1000,
          system_prompt: messageData.systemPrompt,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error continuing conversation:', error);
      throw error;
    }
  },

  // Get all user conversations (NOT USED in localStorage version - returns empty)
  getConversations: async () => {
    try {
      // In localStorage version, this returns empty array from backend
      // Frontend manages conversations via localStorage
      console.warn('getConversations called but not functional in localStorage version');
      return [];
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  },

  // Get specific conversation history (NOT USED in localStorage version)
  getConversation: async (conversationId) => {
    try {
      // In localStorage version, frontend manages conversation history
      console.warn('getConversation called but not functional in localStorage version');
      throw new Error('Conversations managed by localStorage on frontend');
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  },

  // Delete a conversation (NOT USED in localStorage version - frontend handles)
  deleteConversation: async (conversationId) => {
    try {
      // In localStorage version, deletion is handled by frontend
      console.warn('deleteConversation called but handled by frontend in localStorage version');
      return { success: true, note: 'Handled by frontend localStorage' };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, error: error.message };
    }
  },

  // Get available AI models (FUNCTIONAL)
  getModels: async () => {
    try {
      const response = await chatbotClient.get(CHATBOT_ENDPOINTS.GET_MODELS);
      return response.data;
    } catch (error) {
      console.error('Error getting models:', error);
      // Return default models if API fails
      return {
        models: [
          {
            id: "gpt-3.5-turbo",
            name: "GPT-3.5 Turbo",
            description: "Fast and efficient model for general conversations",
            max_tokens: 4096,
            available: true
          },
          {
            id: "gpt-4o-mini", 
            name: "GPT-4o Mini",
            description: "Efficient and capable model for coding and technical questions",
            max_tokens: 16384,
            available: true
          }
        ],
        default_model: "gpt-4o-mini"
      };
    }
  },

  // Get user chat statistics (LIMITED in localStorage version)
  getStats: async () => {
    try {
      const response = await chatbotClient.get(CHATBOT_ENDPOINTS.GET_STATS);
      return response.data;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        user_id: null,
        total_conversations: 0,
        total_messages: 0,
        recent_conversation: null,
        storage_type: "localStorage"
      };
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await chatbotClient.get(CHATBOT_ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  },
};

// Helper functions for message formatting (same as before)
export const MessageHelpers = {
  // Format message for display
  formatMessage: (message) => {
    if (!message) return '';
    
    // Basic markdown-like formatting
    let formatted = message
      .replace(/```(\w+)?\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    
    return formatted;
  },

  // Extract code blocks from message
  extractCodeBlocks: (message) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const blocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(message)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2],
      });
    }
    
    return blocks;
  },

  // Generate conversation title from first message
  generateTitle: (firstMessage) => {
    if (!firstMessage) return 'New Conversation';
    
    // Take first 50 characters and clean up
    let title = firstMessage.substring(0, 50).trim();
    
    // Remove markdown and special characters
    title = title
      .replace(/[#*`_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (firstMessage.length > 50) {
      title += '...';
    }
    
    return title || 'New Conversation';
  },

  // Validate message input
  validateMessage: (message) => {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Message is required' };
    }
    
    if (message.trim().length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }
    
    if (message.length > 10000) {
      return { valid: false, error: 'Message is too long (max 10,000 characters)' };
    }
    
    return { valid: true };
  },

  // Create message object for localStorage
  createMessage: (role, content, conversationId, metadata = {}) => {
    return {
      id: `${role}_${conversationId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      conversationId,
      ...metadata
    };
  },

  // Create conversation object for localStorage
  createConversation: (conversationId, firstMessage, title = null) => {
    const now = new Date().toISOString();
    return {
      conversation_id: conversationId,
      title: title || MessageHelpers.generateTitle(firstMessage),
      created_at: now,
      updated_at: now,
      message_count: 0,
      messages: [],
      status: 'active'
    };
  }
};

// localStorage-specific utilities
export const LocalStorageUtils = {
  // Get conversations from localStorage
  getConversations: (userId) => {
    try {
      const key = `codementorx_conversations_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load conversations from localStorage:', error);
      return [];
    }
  },

  // Save conversations to localStorage
  saveConversations: (conversations, userId) => {
    try {
      const key = `codementorx_conversations_${userId}`;
      localStorage.setItem(key, JSON.stringify(conversations));
      return true;
    } catch (error) {
      console.error('Failed to save conversations to localStorage:', error);
      return false;
    }
  },

  // Get current conversation from localStorage
  getCurrentConversation: (userId) => {
    try {
      const key = `codementorx_current_conversation_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load current conversation:', error);
      return null;
    }
  },

  // Save current conversation to localStorage
  saveCurrentConversation: (conversation, userId) => {
    try {
      const key = `codementorx_current_conversation_${userId}`;
      if (conversation) {
        localStorage.setItem(key, JSON.stringify(conversation));
      } else {
        localStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error('Failed to save current conversation:', error);
      return false;
    }
  },

  // Clear all user data from localStorage
  clearUserData: (userId) => {
    try {
      const keys = [
        `codementorx_conversations_${userId}`,
        `codementorx_current_conversation_${userId}`,
        `codementorx_chat_settings_${userId}`
      ];
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear user data:', error);
      return false;
    }
  },

  // Get storage stats
  getStorageStats: (userId) => {
    try {
      const conversations = LocalStorageUtils.getConversations(userId);
      const totalMessages = conversations.reduce((sum, conv) => sum + (conv.message_count || 0), 0);
      const storageSize = localStorage.length;
      
      return {
        total_conversations: conversations.length,
        total_messages: totalMessages,
        storage_entries: storageSize,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        total_conversations: 0,
        total_messages: 0,
        storage_entries: 0,
        error: error.message
      };
    }
  }
};

// Export for testing purposes
export { chatbotClient };

export default chatbotAPI;