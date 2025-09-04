/**
 * ChatBox.jsx - Main Chat Interface Component
 * Production-ready chat UI with code highlighting, auto-scroll, and accessibility
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Code, AlertCircle, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { useChat, CHAT_INTENTS, MESSAGE_TYPES } from '../context/ChatContext';

// Message component with code highlighting
const Message = ({ message, isLatest }) => {
  const [copied, setCopied] = useState(false);
  const messageRef = useRef(null);
  
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };
  
  // Auto-scroll to latest message
  useEffect(() => {
    if (isLatest && messageRef.current) {
      messageRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
    }
  }, [isLatest]);
  
  // Parse code blocks from message content
  const parseMessageContent = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }
      
      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };
  
  const renderMessagePart = (part, index) => {
    if (part.type === 'code') {
      return (
        <div key={index} className="relative my-4">
          <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg text-sm">
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>{part.language}</span>
            </div>
            <button
              onClick={() => copyToClipboard(part.content)}
              className="flex items-center space-x-1 hover:bg-gray-700 px-2 py-1 rounded text-xs transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
            <code className={`language-${part.language}`}>
              {part.content}
            </code>
          </pre>
        </div>
      );
    }
    
    return (
      <div key={index} className="whitespace-pre-wrap break-words">
        {part.content}
      </div>
    );
  };
  
  const parts = parseMessageContent(message.content);
  
  const getMessageStyles = () => {
    const baseStyles = "max-w-3xl mx-auto p-4 rounded-lg shadow-sm";
    
    switch (message.type) {
      case MESSAGE_TYPES.USER:
        return `${baseStyles} bg-blue-600 text-white ml-8`;
      case MESSAGE_TYPES.ASSISTANT:
        return `${baseStyles} bg-white border border-gray-200 mr-8`;
      case MESSAGE_TYPES.ERROR:
        return `${baseStyles} bg-red-50 border border-red-200 text-red-800 mr-8`;
      case MESSAGE_TYPES.SYSTEM:
        return `${baseStyles} bg-yellow-50 border border-yellow-200 text-yellow-800`;
      default:
        return `${baseStyles} bg-gray-50 border border-gray-200`;
    }
  };
  
  return (
    <div 
      ref={messageRef}
      className={`mb-4 ${message.type === MESSAGE_TYPES.USER ? 'text-right' : 'text-left'}`}
      role="article"
      aria-label={`${message.type} message`}
    >
      <div className={getMessageStyles()}>
        {message.type === MESSAGE_TYPES.ERROR && (
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-800">Error</span>
          </div>
        )}
        
        <div className="prose prose-sm max-w-none">
          {parts.map((part, index) => renderMessagePart(part, index))}
        </div>
        
        <div className={`text-xs mt-2 ${
          message.type === MESSAGE_TYPES.USER ? 'text-blue-200' : 'text-gray-500'
        }`}>
          {new Date(message.timestamp).toLocaleTimeString()}
          {message.isTemporary && (
            <span className="ml-2 inline-flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Sending...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Typing indicator component
const TypingIndicator = () => (
  <div className="mb-4 text-left">
    <div className="max-w-3xl mx-auto p-4 rounded-lg bg-gray-100 mr-8">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-sm text-gray-600">AI is thinking...</span>
      </div>
    </div>
  </div>
);

// Intent selector component
const IntentSelector = ({ selectedIntent, onIntentChange, disabled }) => (
  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg mb-2">
    <Code className="h-4 w-4 text-gray-500" />
    <select
      value={selectedIntent}
      onChange={(e) => onIntentChange(e.target.value)}
      disabled={disabled}
      className="text-sm bg-transparent border-none outline-none cursor-pointer disabled:cursor-not-allowed"
      aria-label="Select message intent"
    >
      <option value={CHAT_INTENTS.GENERAL}>💬 General Chat</option>
      <option value={CHAT_INTENTS.CODING_HELP}>💻 Coding Help</option>
      <option value={CHAT_INTENTS.QUESTION_ANSWER}>❓ Q&A</option>
      <option value={CHAT_INTENTS.TRANSLATION}>🌐 Translation</option>
    </select>
  </div>
);

// Rate limit indicator
const RateLimitIndicator = ({ rateLimitInfo, isRateLimited }) => {
  if (!isRateLimited && rateLimitInfo.remaining > 5) return null;
  
  const resetTime = new Date(rateLimitInfo.resetTime);
  const timeUntilReset = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
  
  return (
    <div className={`text-xs p-2 rounded-lg ${
      isRateLimited ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
    }`}>
      {isRateLimited ? (
        <span>Rate limit reached. Try again in {timeUntilReset}s</span>
      ) : (
        <span>{rateLimitInfo.remaining} messages remaining</span>
      )}
    </div>
  );
};

// Service status indicator
const ServiceStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return { color: 'text-green-600', bg: 'bg-green-50', text: '🟢 Service Online' };
      case 'degraded':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', text: '🟡 Service Degraded' };
      case 'down':
        return { color: 'text-red-600', bg: 'bg-red-50', text: '🔴 Service Offline' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', text: '⚪ Status Unknown' };
    }
  };
  
  const config = getStatusConfig();
  
  if (status === 'healthy') return null;
  
  return (
    <div className={`text-xs p-2 rounded-lg ${config.bg} ${config.color} mb-2`}>
      {config.text}
    </div>
  );
};

// Main ChatBox component
const ChatBox = () => {
  const {
    messages,
    inputValue,
    setInputValue,
    sendMessage,
    isSending,
    isTyping,
    error,
    clearErrors,
    canSendMessage,
    rateLimitInfo,
    isRateLimited,
    serviceStatus
  } = useChat();
  
  const [selectedIntent, setSelectedIntent] = useState(CHAT_INTENTS.GENERAL);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom) {
        messagesContainerRef.current.scrollTop = scrollHeight;
      }
    }
  }, [messages, isTyping]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!canSendMessage || !inputValue.trim()) {
      return;
    }
    
    clearErrors();
    
    try {
      await sendMessage(inputValue.trim(), selectedIntent);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [canSendMessage, inputValue, selectedIntent, clearErrors, sendMessage]);
  
  // Handle input changes
  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, [setInputValue]);
  
  // Handle retry for failed messages
  const handleRetry = useCallback(async () => {
    if (inputValue.trim()) {
      await sendMessage(inputValue.trim(), selectedIntent);
    }
  }, [inputValue, selectedIntent, sendMessage]);
  
  // Get placeholder text based on intent
  const getPlaceholderText = () => {
    switch (selectedIntent) {
      case CHAT_INTENTS.CODING_HELP:
        return "Ask a coding question or paste your code...";
      case CHAT_INTENTS.QUESTION_ANSWER:
        return "Ask me anything...";
      case CHAT_INTENTS.TRANSLATION:
        return "Enter text to translate...";
      default:
        return "Type your message...";
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-none p-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">CodementorX Assistant</h1>
        <p className="text-sm text-gray-600">AI-powered coding mentor and Q&A assistant</p>
        <ServiceStatus status={serviceStatus} />
      </div>
      
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 max-w-md">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium mb-2">Welcome to CodementorX!</h3>
              <p className="text-sm">
                I'm your AI coding mentor. Ask me questions about programming, 
                get help with code, or just have a conversation about tech.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <Message 
                key={message.id || `temp-${index}`}
                message={message} 
                isLatest={index === messages.length - 1}
              />
            ))}
            {isTyping && <TypingIndicator />}
          </>
        )}
      </div>
      
      {/* Input Area */}
      <div className="flex-none p-4 bg-white border-t border-gray-200">
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleRetry}
                  disabled={!canSendMessage}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3 inline mr-1" />
                  Retry
                </button>
                <button
                  onClick={clearErrors}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        
        <RateLimitIndicator rateLimitInfo={rateLimitInfo} isRateLimited={isRateLimited} />
        
        <IntentSelector
          selectedIntent={selectedIntent}
          onIntentChange={setSelectedIntent}
          disabled={isSending}
        />
        
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder={getPlaceholderText()}
              disabled={isSending || isRateLimited}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={3}
              maxLength={4000}
              aria-label="Message input"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                {inputValue.length}/4000 characters
              </div>
              <div className="text-xs text-gray-500">
                Press Ctrl+Enter to send
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!canSendMessage}
            className="flex-none flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;