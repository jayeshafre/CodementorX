/**
 * ChatContext.jsx - Global Chat State Management
 * Manages conversation history, real-time messaging, and chat sessions
 * Integrates with FastAPI chatbot service and Redis caching
 */
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { chatbotAPI, CHAT_INTENTS, ChatbotError, getRateLimitInfo } from '../api/ChatbotClient';
import { useAuth } from './AuthContext';

// Create Chat Context
const ChatContext = createContext();

// Chat Actions
const CHAT_ACTIONS = {
  // Message actions
  SEND_MESSAGE_START: 'SEND_MESSAGE_START',
  SEND_MESSAGE_SUCCESS: 'SEND_MESSAGE_SUCCESS',
  SEND_MESSAGE_FAILURE: 'SEND_MESSAGE_FAILURE',
  
  // Conversation actions
  SET_ACTIVE_CONVERSATION: 'SET_ACTIVE_CONVERSATION',
  LOAD_CONVERSATIONS: 'LOAD_CONVERSATIONS',
  CREATE_CONVERSATION: 'CREATE_CONVERSATION',
  DELETE_CONVERSATION: 'DELETE_CONVERSATION',
  
  // UI actions
  SET_INPUT_VALUE: 'SET_INPUT_VALUE',
  SET_TYPING_INDICATOR: 'SET_TYPING_INDICATOR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  
  // Service actions
  SET_SERVICE_STATUS: 'SET_SERVICE_STATUS',
  UPDATE_RATE_LIMIT: 'UPDATE_RATE_LIMIT',
};

// Message types
export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  ERROR: 'error'
};

// Conversation status
export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
};

// Map UI labels → API enum values
const intentMapping = {
  "💻 Coding Help": CHAT_INTENTS.CODING,
  "🌐 Translation": CHAT_INTENTS.TRANSLATION,
  "💬 General Chat": CHAT_INTENTS.GENERAL
};

// Initial state
const initialState = {
  // Current conversation
  activeConversation: null,
  messages: [],
  
  // All conversations
  conversations: [],
  
  // UI state
  inputValue: '',
  isTyping: false,
  isSending: false,
  
  // Service state
  serviceStatus: 'unknown', // unknown, healthy, degraded, down
  lastHealthCheck: null,
  
  // Rate limiting
  rateLimitInfo: {
    remaining: 100,
    resetTime: Date.now() + 60000,
    maxPerMinute: 100
  },
  
  // Error handling
  error: null,
  lastError: null,
};

// Chat Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SEND_MESSAGE_START:
      return {
        ...state,
        isSending: true,
        error: null,
        messages: [
          ...state.messages,
          {
            id: action.payload.tempId,
            type: MESSAGE_TYPES.USER,
            content: action.payload.content,
            timestamp: new Date().toISOString(),
            isTemporary: true
          }
        ]
      };
    
    case CHAT_ACTIONS.SEND_MESSAGE_SUCCESS:
      const { userMessage, assistantMessage, conversationId } = action.payload;
      
      return {
        ...state,
        isSending: false,
        isTyping: false,
        inputValue: '',
        activeConversation: conversationId,
        messages: [
          ...state.messages.filter(msg => msg.id !== userMessage.tempId),
          {
            ...userMessage,
            isTemporary: false
          },
          assistantMessage
        ]
      };
    
    case CHAT_ACTIONS.SEND_MESSAGE_FAILURE:
      return {
        ...state,
        isSending: false,
        isTyping: false,
        error: action.payload.error,
        lastError: {
          type: action.payload.type,
          message: action.payload.error,
          timestamp: new Date().toISOString(),
          details: action.payload.details
        },
        // Remove temporary message on failure
        messages: state.messages.filter(msg => !msg.isTemporary)
      };
    
    case CHAT_ACTIONS.SET_ACTIVE_CONVERSATION:
      return {
        ...state,
        activeConversation: action.payload.conversationId,
        messages: action.payload.messages || []
      };
    
    case CHAT_ACTIONS.LOAD_CONVERSATIONS:
      return {
        ...state,
        conversations: action.payload
      };
    
    case CHAT_ACTIONS.CREATE_CONVERSATION:
      const newConversation = action.payload;
      return {
        ...state,
        conversations: [newConversation, ...state.conversations],
        activeConversation: newConversation.id,
        messages: []
      };
    
    case CHAT_ACTIONS.DELETE_CONVERSATION:
      const conversationIdToDelete = action.payload;
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== conversationIdToDelete),
        ...(state.activeConversation === conversationIdToDelete && {
          activeConversation: null,
          messages: []
        })
      };
    
    case CHAT_ACTIONS.SET_INPUT_VALUE:
      return {
        ...state,
        inputValue: action.payload
      };
    
    case CHAT_ACTIONS.SET_TYPING_INDICATOR:
      return {
        ...state,
        isTyping: action.payload
      };
    
    case CHAT_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        error: null,
        lastError: null
      };
    
    case CHAT_ACTIONS.SET_SERVICE_STATUS:
      return {
        ...state,
        serviceStatus: action.payload.status,
        lastHealthCheck: action.payload.timestamp || new Date().toISOString()
      };
    
    case CHAT_ACTIONS.UPDATE_RATE_LIMIT:
      return {
        ...state,
        rateLimitInfo: action.payload
      };
    
    default:
      return state;
  }
};

// Utility functions
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Chat Provider Component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  
  // Check service status on mount and periodically
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const result = await chatbotAPI.getStatus();
        dispatch({
          type: CHAT_ACTIONS.SET_SERVICE_STATUS,
          payload: {
            status: result.success ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn('Service status check failed:', error.message);
        dispatch({
          type: CHAT_ACTIONS.SET_SERVICE_STATUS,
          payload: {
            status: 'down',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
    
    if (isAuthenticated) {
      checkServiceStatus();
      const interval = setInterval(checkServiceStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
  
  // Update rate limit info periodically
  useEffect(() => {
    const updateRateLimit = () => {
      const info = getRateLimitInfo();
      dispatch({
        type: CHAT_ACTIONS.UPDATE_RATE_LIMIT,
        payload: info
      });
    };
    
    updateRateLimit();
    const interval = setInterval(updateRateLimit, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // Reset conversation when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({
        type: CHAT_ACTIONS.SET_ACTIVE_CONVERSATION,
        payload: { conversationId: null, messages: [] }
      });
      dispatch({ type: CHAT_ACTIONS.LOAD_CONVERSATIONS, payload: [] });
      dispatch({ type: CHAT_ACTIONS.CLEAR_ERRORS });
    }
  }, [isAuthenticated]);
  
  // Send message function with intent normalization
  const sendMessage = useCallback(async (content, intent = CHAT_INTENTS.GENERAL) => {
    if (!isAuthenticated) throw new Error('Authentication required');
    if (!content || content.trim().length === 0) throw new Error('Message cannot be empty');

    const tempId = generateTempId();
    const normalizedIntent = intentMapping[intent] || intent || CHAT_INTENTS.GENERAL;

    try {
      // Start sending
      dispatch({ type: CHAT_ACTIONS.SEND_MESSAGE_START, payload: { tempId, content: content.trim() } });

      const typingTimeout = setTimeout(() => {
        dispatch({ type: CHAT_ACTIONS.SET_TYPING_INDICATOR, payload: true });
      }, 500);
      
      // API call
      const response = await chatbotAPI.sendMessage({
        content: content.trim(),
        conversationId: state.activeConversation,
        intent: normalizedIntent,
        metadata: {
          source: 'web_app',
          user_id: user?.id,
          timestamp: new Date().toISOString()
        }
      });
      
      clearTimeout(typingTimeout);

      // User + Assistant messages
      const userMessage = {
        id: generateMessageId(),
        tempId,
        type: MESSAGE_TYPES.USER,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        intent: normalizedIntent,
        conversationId: response.data.conversationId
      };
      
      const assistantMessage = {
        id: response.data.messageId || generateMessageId(),
        type: MESSAGE_TYPES.ASSISTANT,
        content: response.data.reply,
        timestamp: response.data.timestamp || new Date().toISOString(),
        intent: response.data.intent,
        metadata: response.data.metadata,
        conversationId: response.data.conversationId,
        processingTime: response.data.processingTime
      };
      
      dispatch({
        type: CHAT_ACTIONS.SEND_MESSAGE_SUCCESS,
        payload: { userMessage, assistantMessage, conversationId: response.data.conversationId }
      });
      
      if (!state.activeConversation && response.data.conversationId) {
        const newConversation = {
          id: response.data.conversationId,
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          status: CONVERSATION_STATUS.ACTIVE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: 2,
          last_message: content.slice(0, 100) + (content.length > 100 ? '...' : '')
        };
        dispatch({ type: CHAT_ACTIONS.LOAD_CONVERSATIONS, payload: [newConversation, ...state.conversations] });
      }
      
      return { success: true, conversationId: response.data.conversationId, messages: [userMessage, assistantMessage], metadata: response.data.metadata };
      
    } catch (error) {
      let errorType = 'UNKNOWN_ERROR';
      let errorMessage = 'Failed to send message';
      let errorDetails = {};
      
      if (error instanceof ChatbotError) {
        errorType = error.code;
        errorMessage = error.message;
        errorDetails = error.details || {};
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      switch (errorType) {
        case 'RATE_LIMITED':
          errorMessage = `You are sending messages too quickly. Please wait ${errorDetails.retryAfter || 60} seconds.`; break;
        case 'UNAUTHORIZED':
          errorMessage = 'Your session has expired. Please log in again.'; break;
        case 'NETWORK_ERROR':
          errorMessage = 'Unable to connect to the chat service. Please check your internet connection.'; break;
        case 'TIMEOUT':
          errorMessage = 'The request timed out. Please try again.'; break;
        case 'SERVICE_ERROR':
          errorMessage = 'The chat service is temporarily unavailable. Please try again in a moment.'; break;
        case 'MESSAGE_TOO_LONG':
          errorMessage = 'Your message is too long. Please limit to 4000 characters.'; break;
        case 'INVALID_INPUT':
          errorMessage = 'Please enter a valid message.'; break;
      }
      
      dispatch({ type: CHAT_ACTIONS.SEND_MESSAGE_FAILURE, payload: { type: errorType, error: errorMessage, details: errorDetails } });
      return { success: false, error: errorMessage, type: errorType, details: errorDetails };
    }
  }, [isAuthenticated, state.activeConversation, state.conversations, user]);
  
  // Helpers
  const setInputValue = useCallback((value) => dispatch({ type: CHAT_ACTIONS.SET_INPUT_VALUE, payload: value }), []);
  const clearErrors = useCallback(() => dispatch({ type: CHAT_ACTIONS.CLEAR_ERRORS }), []);
  const createNewConversation = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.SET_ACTIVE_CONVERSATION, payload: { conversationId: null, messages: [] } });
    dispatch({ type: CHAT_ACTIONS.SET_INPUT_VALUE, payload: '' });
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERRORS });
  }, []);
  const switchConversation = useCallback((conversationId) => {
    dispatch({ type: CHAT_ACTIONS.SET_ACTIVE_CONVERSATION, payload: { conversationId, messages: [] } });
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERRORS });
  }, []);
  const deleteConversation = useCallback((conversationId) => dispatch({ type: CHAT_ACTIONS.DELETE_CONVERSATION, payload: conversationId }), []);
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const result = await chatbotAPI.getConversations();
      if (result.success && result.data.conversations) {
        dispatch({ type: CHAT_ACTIONS.LOAD_CONVERSATIONS, payload: result.data.conversations });
      }
    } catch (error) {
      console.warn('Failed to load conversations:', error);
    }
  }, [isAuthenticated]);
  
  const getConversationSummary = useCallback(() => {
    if (state.messages.length === 0) {
      return { messageCount: 0, lastMessage: null, hasErrors: false, totalMessages: 0 };
    }
    const userMessages = state.messages.filter(msg => msg.type === MESSAGE_TYPES.USER && !msg.isTemporary);
    const lastMessage = state.messages[state.messages.length - 1];
    const hasErrors = state.messages.some(msg => msg.type === MESSAGE_TYPES.ERROR);
    return { messageCount: userMessages.length, lastMessage, hasErrors, totalMessages: state.messages.length };
  }, [state.messages]);
  
  const canSendMessage = useCallback(() => {
    const trimmedInput = state.inputValue.trim();
    return (isAuthenticated && !state.isSending && trimmedInput.length > 0 && trimmedInput.length <= 4000 && state.rateLimitInfo.remaining > 0 && state.serviceStatus !== 'down');
  }, [isAuthenticated, state.isSending, state.inputValue, state.rateLimitInfo.remaining, state.serviceStatus]);
  
  const getErrorDisplayMessage = useCallback(() => state.error || null, [state.error]);
  
  const value = {
    ...state,
    sendMessage,
    setInputValue,
    clearErrors,
    createNewConversation,
    switchConversation,
    deleteConversation,
    loadConversations,
    canSendMessage: canSendMessage(),
    conversationSummary: getConversationSummary(),
    errorDisplayMessage: getErrorDisplayMessage(),
    isRateLimited: state.rateLimitInfo.remaining <= 0,
    isServiceHealthy: state.serviceStatus === 'healthy',
    isServiceDegraded: state.serviceStatus === 'degraded',
    isServiceDown: state.serviceStatus === 'down',
    currentUser: user,
    hasActiveConversation: !!state.activeConversation,
    hasMessages: state.messages.length > 0,
    hasErrors: !!state.error,
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};

export { CHAT_INTENTS };
