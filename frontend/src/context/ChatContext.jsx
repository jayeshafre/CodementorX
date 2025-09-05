/**
 * Chat Context for Global Chat State Management - localStorage Version
 * Manages conversations, messages, and chat functionality with localStorage persistence
 */
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { chatbotAPI, MessageHelpers } from '../api/ChatbotClient';
import { useAuth } from './AuthContext';

// Create Chat Context
const ChatContext = createContext();

// Conversation Status Constants
export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
};

// localStorage keys
const STORAGE_KEYS = {
  CONVERSATIONS: 'codementorx_conversations',
  CURRENT_CONVERSATION: 'codementorx_current_conversation',
  SETTINGS: 'codementorx_chat_settings'
};

// Chat Actions
const CHAT_ACTIONS = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_SENDING: 'SET_SENDING',
  
  // Conversations
  LOAD_CONVERSATIONS: 'LOAD_CONVERSATIONS',
  SET_CURRENT_CONVERSATION: 'SET_CURRENT_CONVERSATION',
  CREATE_CONVERSATION: 'CREATE_CONVERSATION',
  DELETE_CONVERSATION: 'DELETE_CONVERSATION',
  UPDATE_CONVERSATION: 'UPDATE_CONVERSATION',
  
  // Messages
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  
  // Models and settings
  SET_MODELS: 'SET_MODELS',
  SET_SETTINGS: 'SET_SETTINGS',
  
  // Errors
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  // Conversations
  conversations: [],
  currentConversation: null,
  
  // Messages
  messages: [],
  
  // Models and settings
  availableModels: [],
  currentModel: 'gpt-4o-mini',
  settings: {
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: null,
  },
  
  // UI state
  isLoading: false,
  isSending: false,
  error: null,
  
  // Stats
  stats: null,
};

// localStorage Helper Functions
const storageHelpers = {
  // Save conversations to localStorage
  saveConversations: (conversations, userId) => {
    try {
      const key = `${STORAGE_KEYS.CONVERSATIONS}_${userId}`;
      localStorage.setItem(key, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations to localStorage:', error);
    }
  },

  // Load conversations from localStorage
  loadConversations: (userId) => {
    try {
      const key = `${STORAGE_KEYS.CONVERSATIONS}_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load conversations from localStorage:', error);
    }
    return [];
  },

  // Save current conversation
  saveCurrentConversation: (conversation, userId) => {
    try {
      const key = `${STORAGE_KEYS.CURRENT_CONVERSATION}_${userId}`;
      localStorage.setItem(key, JSON.stringify(conversation));
    } catch (error) {
      console.error('Failed to save current conversation:', error);
    }
  },

  // Load current conversation
  loadCurrentConversation: (userId) => {
    try {
      const key = `${STORAGE_KEYS.CURRENT_CONVERSATION}_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load current conversation:', error);
    }
    return null;
  },

  // Save settings
  saveSettings: (settings, userId) => {
    try {
      const key = `${STORAGE_KEYS.SETTINGS}_${userId}`;
      localStorage.setItem(key, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  // Load settings
  loadSettings: (userId) => {
    try {
      const key = `${STORAGE_KEYS.SETTINGS}_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return null;
  },

  // Clear user data from localStorage
  clearUserData: (userId) => {
    try {
      const keys = [
        `${STORAGE_KEYS.CONVERSATIONS}_${userId}`,
        `${STORAGE_KEYS.CURRENT_CONVERSATION}_${userId}`,
        `${STORAGE_KEYS.SETTINGS}_${userId}`
      ];
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear user data from localStorage:', error);
    }
  },

  // Generate conversation ID
  generateConversationId: () => {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
};

// Chat Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case CHAT_ACTIONS.SET_SENDING:
      return { ...state, isSending: action.payload };
    
    case CHAT_ACTIONS.LOAD_CONVERSATIONS:
      return { ...state, conversations: action.payload, isLoading: false };
    
    case CHAT_ACTIONS.SET_CURRENT_CONVERSATION:
      return { 
        ...state, 
        currentConversation: action.payload,
        messages: action.payload?.messages || []
      };
    
    case CHAT_ACTIONS.CREATE_CONVERSATION:
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        currentConversation: action.payload,
        messages: action.payload.messages || []
      };
    
    case CHAT_ACTIONS.UPDATE_CONVERSATION:
      const updatedConversations = state.conversations.map(conv =>
        conv.conversation_id === action.payload.conversation_id 
          ? { ...conv, ...action.payload }
          : conv
      );
      return {
        ...state,
        conversations: updatedConversations,
        currentConversation: state.currentConversation?.conversation_id === action.payload.conversation_id
          ? { ...state.currentConversation, ...action.payload }
          : state.currentConversation
      };
    
    case CHAT_ACTIONS.DELETE_CONVERSATION:
      const filteredConversations = state.conversations.filter(
        conv => conv.conversation_id !== action.payload
      );
      return {
        ...state,
        conversations: filteredConversations,
        currentConversation: state.currentConversation?.conversation_id === action.payload 
          ? null : state.currentConversation,
        messages: state.currentConversation?.conversation_id === action.payload 
          ? [] : state.messages
      };
    
    case CHAT_ACTIONS.ADD_MESSAGE:
      const newMessages = [...state.messages, action.payload];
      return { 
        ...state, 
        messages: newMessages,
        isSending: false
      };
    
    case CHAT_ACTIONS.UPDATE_MESSAGE:
      const updatedMessages = state.messages.map(msg =>
        msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
      );
      return { ...state, messages: updatedMessages };
    
    case CHAT_ACTIONS.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case CHAT_ACTIONS.CLEAR_MESSAGES:
      return { ...state, messages: [] };
    
    case CHAT_ACTIONS.SET_MODELS:
      return { ...state, availableModels: action.payload };
    
    case CHAT_ACTIONS.SET_SETTINGS:
      return { 
        ...state, 
        settings: { ...state.settings, ...action.payload }
      };
    
    case CHAT_ACTIONS.SET_ERROR:
      return { 
        ...state, 
        error: action.payload, 
        isLoading: false, 
        isSending: false 
      };
    
    case CHAT_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Chat Provider Component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  
  // Load data from localStorage when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // Load conversations
      const savedConversations = storageHelpers.loadConversations(user.id);
      dispatch({ type: CHAT_ACTIONS.LOAD_CONVERSATIONS, payload: savedConversations });
      
      // Load current conversation
      const savedCurrentConversation = storageHelpers.loadCurrentConversation(user.id);
      if (savedCurrentConversation) {
        dispatch({ type: CHAT_ACTIONS.SET_CURRENT_CONVERSATION, payload: savedCurrentConversation });
      }
      
      // Load settings
      const savedSettings = storageHelpers.loadSettings(user.id);
      if (savedSettings) {
        dispatch({ type: CHAT_ACTIONS.SET_SETTINGS, payload: savedSettings });
      }
      
      // Load models from API
      loadModels();
    } else {
      // Clear state when logged out
      dispatch({ type: CHAT_ACTIONS.LOAD_CONVERSATIONS, payload: [] });
      dispatch({ type: CHAT_ACTIONS.SET_CURRENT_CONVERSATION, payload: null });
      dispatch({ type: CHAT_ACTIONS.CLEAR_MESSAGES });
    }
  }, [isAuthenticated, user]);

  // Save to localStorage when conversations change
  useEffect(() => {
    if (isAuthenticated && user && state.conversations.length > 0) {
      storageHelpers.saveConversations(state.conversations, user.id);
    }
  }, [state.conversations, isAuthenticated, user]);

  // Save current conversation when it changes
  useEffect(() => {
    if (isAuthenticated && user && state.currentConversation) {
      storageHelpers.saveCurrentConversation(state.currentConversation, user.id);
    }
  }, [state.currentConversation, isAuthenticated, user]);

  // Save settings when they change
  useEffect(() => {
    if (isAuthenticated && user) {
      storageHelpers.saveSettings(state.settings, user.id);
    }
  }, [state.settings, isAuthenticated, user]);

  // Load available models
  const loadModels = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const modelsData = await chatbotAPI.getModels();
      dispatch({ 
        type: CHAT_ACTIONS.SET_MODELS, 
        payload: modelsData.models || [] 
      });
    } catch (error) {
      console.error('Failed to load models:', error);
      // Use default models if API fails
      dispatch({ 
        type: CHAT_ACTIONS.SET_MODELS, 
        payload: [
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
        ]
      });
    }
  }, [isAuthenticated]);

  // Send a new message
  const sendMessage = useCallback(async (messageText, conversationId = null) => {
    if (!messageText.trim() || !user) return;
    
    try {
      dispatch({ type: CHAT_ACTIONS.SET_SENDING, payload: true });
      dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
      
      // Validate message
      const validation = MessageHelpers.validateMessage(messageText);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Generate conversation ID if needed
      const finalConversationId = conversationId || storageHelpers.generateConversationId();
      
      // Add user message to UI immediately
      const userMessage = {
        id: `user_${finalConversationId}_${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString(),
        conversationId: finalConversationId
      };
      
      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: userMessage });
      
      // Prepare message data with conversation context
      const messageData = {
        message: messageText,
        conversationId: finalConversationId,
        context: state.messages.slice(-10), // Last 10 messages for context
        model: state.currentModel,
        temperature: state.settings.temperature,
        maxTokens: state.settings.maxTokens,
        systemPrompt: state.settings.systemPrompt,
      };
      
      // Send to API (backend is stateless, just processes the message)
      const response = await chatbotAPI.sendMessage(messageData);
      
      // Add AI response to messages
      const aiMessage = {
        id: `ai_${finalConversationId}_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
        conversationId: finalConversationId,
        modelUsed: response.model_used,
        tokenUsage: response.token_usage
      };
      
      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: aiMessage });
      
      // Update conversation with new messages
      let currentConv = state.currentConversation;
      
      if (!conversationId) {
        // Create new conversation
        const newConversation = {
          conversation_id: finalConversationId,
          title: MessageHelpers.generateTitle(messageText),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: 2,
          messages: [userMessage, aiMessage]
        };
        
        dispatch({ type: CHAT_ACTIONS.CREATE_CONVERSATION, payload: newConversation });
        currentConv = newConversation;
      } else {
        // Update existing conversation
        const updatedMessages = [...state.messages, userMessage, aiMessage];
        const updatedConversation = {
          ...currentConv,
          updated_at: new Date().toISOString(),
          message_count: updatedMessages.length,
          messages: updatedMessages
        };
        
        dispatch({ type: CHAT_ACTIONS.UPDATE_CONVERSATION, payload: updatedConversation });
      }
      
      return {
        success: true,
        conversationId: finalConversationId,
        message: response.message
      };
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove temporary message on error
      dispatch({ 
        type: CHAT_ACTIONS.SET_MESSAGES, 
        payload: state.messages.filter(m => m.id !== userMessage?.id) 
      });
      
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          'Failed to send message';
      
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      
      return { success: false, error: errorMessage };
    }
  }, [state.messages, state.currentModel, state.settings, state.currentConversation, user]);

  // Load a specific conversation (from localStorage)
  const loadConversation = useCallback(async (conversationId) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
      
      // Find conversation in localStorage
      const conversation = state.conversations.find(c => c.conversation_id === conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      dispatch({ type: CHAT_ACTIONS.SET_CURRENT_CONVERSATION, payload: conversation });
      
      return { success: true, conversation };
      
    } catch (error) {
      console.error('Error loading conversation:', error);
      const errorMessage = error.message || 'Failed to load conversation';
      
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [state.conversations]);

  // Delete a conversation (from localStorage)
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      dispatch({ type: CHAT_ACTIONS.DELETE_CONVERSATION, payload: conversationId });
      
      // Also clear from localStorage current conversation if it matches
      if (user && state.currentConversation?.conversation_id === conversationId) {
        storageHelpers.saveCurrentConversation(null, user.id);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
      const errorMessage = 'Failed to delete conversation';
      
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [state.currentConversation, user]);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.SET_CURRENT_CONVERSATION, payload: null });
    dispatch({ type: CHAT_ACTIONS.CLEAR_MESSAGES });
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
    
    // Clear current conversation from localStorage
    if (user) {
      storageHelpers.saveCurrentConversation(null, user.id);
    }
  }, [user]);

  // Update chat settings
  const updateSettings = useCallback((newSettings) => {
    dispatch({ type: CHAT_ACTIONS.SET_SETTINGS, payload: newSettings });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
  }, []);

  // Clear all data (for logout)
  const clearAllData = useCallback(() => {
    if (user) {
      storageHelpers.clearUserData(user.id);
    }
    dispatch({ type: CHAT_ACTIONS.LOAD_CONVERSATIONS, payload: [] });
    dispatch({ type: CHAT_ACTIONS.SET_CURRENT_CONVERSATION, payload: null });
    dispatch({ type: CHAT_ACTIONS.CLEAR_MESSAGES });
  }, [user]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    sendMessage,
    loadConversation,
    deleteConversation,
    startNewConversation,
    updateSettings,
    clearError,
    clearAllData,
    
    // Computed values
    hasConversations: state.conversations.length > 0,
    canSend: !state.isSending && isAuthenticated,
    totalMessages: state.conversations.reduce((total, conv) => total + (conv.message_count || 0), 0),
    storageType: 'localStorage', // Indicator for debugging
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use Chat Context
export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;};

// Debug helper for development
export const useChatDebug = () => {
  const {
    conversations,
    currentConversation,
    messages,
    availableModels,
    currentModel,
    settings,
    isLoading,
    isSending,
    error,
    totalMessages,
    storageType,
  } = useChat();

  return {
    conversations,
    currentConversation,
    messages,
    availableModels,
    currentModel,
    settings,
    isLoading,
    isSending,
    error,
    totalMessages,
    storageType,
  };
};
