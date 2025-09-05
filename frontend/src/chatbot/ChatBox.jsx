/**
 * Updated ChatBox.jsx - Main Chat Interface with Enhanced Message Formatting
 * Uses enhanced message formatting component for better readability
 */
import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  Bot, 
  Copy, 
  Loader, 
  AlertCircle,
  Settings,
  RefreshCw,
  Code,
  Check
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

// Code Block Component - separate component to handle copy functionality
const CodeBlock = ({ code, language, blockId }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const applySyntaxHighlighting = (code, language) => {
    let highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    switch (language) {
      case 'sql':
        highlighted = highlighted.replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|JOIN|INNER|LEFT|RIGHT|ON|GROUP BY|ORDER BY|HAVING|DISTINCT|AS|INTO|VALUES|TABLE|DATABASE|INDEX|PRIMARY|KEY|FOREIGN|NOT|NULL|DEFAULT|INT|VARCHAR|TEXT|DATE|DATETIME|AND|OR|IN|LIKE|BETWEEN|IS|EXISTS)\b/gi, 
          '<span style="color: #1e40af; font-weight: 600;">$1</span>');
        highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color: #7c3aed;">$1</span>');
        highlighted = highlighted.replace(/'([^']*)'/g, '<span style="color: #059669;">\'$1\'</span>');
        break;
        
      case 'python':
        highlighted = highlighted.replace(/\b(def|class|if|elif|else|for|while|in|import|from|as|try|except|finally|with|lambda|return|yield|pass|break|continue|and|or|not|is|None|True|False)\b/g, 
          '<span style="color: #059669; font-weight: 600;">$1</span>');
        highlighted = highlighted.replace(/"([^"]*)"/g, '<span style="color: #dc2626;">"$1"</span>');
        highlighted = highlighted.replace(/'([^']*)'/g, '<span style="color: #dc2626;">\'$1\'</span>');
        break;
        
      case 'javascript':
        highlighted = highlighted.replace(/\b(function|const|let|var|if|else|for|while|do|switch|case|default|break|continue|return|try|catch|finally|throw|new|this|class|extends|import|export|from|as|async|await|Promise)\b/g, 
          '<span style="color: #7c2d12; font-weight: 600;">$1</span>');
        highlighted = highlighted.replace(/"([^"]*)"/g, '<span style="color: #059669;">"$1"</span>');
        highlighted = highlighted.replace(/'([^']*)'/g, '<span style="color: #059669;">\'$1\'</span>');
        break;
    }
    
    return highlighted;
  };

  const highlightedCode = applySyntaxHighlighting(code, language);

  return (
    <div className="my-4 group" style={{ border: 'none', outline: 'none', background: 'none' }}>
      <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium capitalize">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100 border-none outline-none"
          title={isCopied ? 'Copied!' : 'Copy code'}
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm font-mono leading-relaxed" style={{ border: 'none', outline: 'none', boxShadow: 'none', background: '#111827' }}>
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  );
};

// Enhanced Message Formatter Component
const MessageFormatter = ({ content, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        <span className="text-sm">Thinking...</span>
      </div>
    );
  }

  // Simple language detection
  const detectLanguage = (code) => {
    const lowerCode = code.toLowerCase();
    
    if (lowerCode.includes('select') && lowerCode.includes('from')) return 'sql';
    if (lowerCode.includes('def ') || lowerCode.includes('import ') || lowerCode.includes('print(')) return 'python';
    if (lowerCode.includes('function') || lowerCode.includes('const ') || lowerCode.includes('let ')) return 'javascript';
    if (lowerCode.includes('public class') || lowerCode.includes('system.out')) return 'java';
    if (lowerCode.includes('#include') || lowerCode.includes('cout <<')) return 'cpp';
    if (lowerCode.includes('<!doctype') || lowerCode.includes('<html')) return 'html';
    if (lowerCode.includes('<?php')) return 'php';
    
    return 'text';
  };

  // Enhanced markdown parsing
  const parseMarkdown = (text) => {
    let processed = text;
    const codeBlocks = [];

    // Extract code blocks first and replace with placeholders
    processed = processed.replace(/```(\w+)?\n?([\s\S]*?)\n?```/g, (match, language, code) => {
      const blockId = `code-${codeBlocks.length}`;
      const cleanCode = code.trim();
      const detectedLang = language || detectLanguage(cleanCode);
      
      codeBlocks.push({
        id: blockId,
        language: detectedLang,
        code: cleanCode
      });
      
      return `__CODE_BLOCK_${blockId}__`;
    });

    // Process inline code
    processed = processed.replace(/`([^`]+)`/g, 
      '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    );

    // Process headers
    processed = processed.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
    processed = processed.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-900 mt-5 mb-3">$1</h2>');
    processed = processed.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>');

    // Process lists
    processed = processed.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li class="mb-1">• $1</li>');
    processed = processed.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li class="mb-1 ml-4">$1</li>');
    
    // Wrap consecutive list items
    processed = processed.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, (match) => {
      return `<ul class="my-3 ml-4 space-y-1">${match}</ul>`;
    });

    // Process bold and italic
    processed = processed.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong class="font-bold"><em class="italic">$1</em></strong>');
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    processed = processed.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700">$1</em>');

    // Process links
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1 ↗</a>'
    );

    // Process line breaks and paragraphs
    processed = processed.replace(/\n\n+/g, '</p><p class="mb-3">');
    processed = processed.replace(/\n/g, '<br>');

    // Wrap content in paragraphs if needed
    if (!processed.includes('<p>') && !processed.includes('<h') && !processed.includes('<ul>') && !processed.includes('__CODE_BLOCK_')) {
      processed = `<p class="mb-3">${processed}</p>`;
    }

    return { processed, codeBlocks };
  };

  const { processed, codeBlocks } = parseMarkdown(content);

  // Split content by code block placeholders
  const parts = processed.split(/(__CODE_BLOCK_\w+-\w+__)/);
  
  return (
    <div className="prose prose-sm max-w-none">
      {parts.map((part, index) => {
        const codeBlockMatch = part.match(/^__CODE_BLOCK_(.+)__$/);
        if (codeBlockMatch) {
          const blockId = codeBlockMatch[1];
          const block = codeBlocks.find(b => b.id === blockId);
          if (block) {
            return (
              <CodeBlock
                key={`${blockId}-${index}`}
                code={block.code}
                language={block.language}
                blockId={block.id}
              />
            );
          }
        }
        
        // Regular content
        return part ? (
          <div 
            key={index}
            dangerouslySetInnerHTML={{ __html: part }}
          />
        ) : null;
      })}
    </div>
  );
};

// Enhanced Message Component
const EnhancedMessage = ({ message, isUser, isLoading = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
          isUser ? 'bg-blue-600 text-white ml-3' : 'bg-white border-2 border-gray-200 text-gray-600 mr-3'
        }`}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
        
        {/* Message Content */}
        <div className={`rounded-2xl px-4 py-3 shadow-sm relative group ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="relative">
            <MessageFormatter content={message.content || ''} isLoading={isLoading} />
            
            {/* Copy button for assistant messages */}
            {!isUser && !isLoading && (
              <button
                onClick={handleCopyMessage}
                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 shadow-sm"
                title={copied ? 'Copied!' : 'Copy message'}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-500" />
                )}
              </button>
            )}
          </div>
          
          {/* Message metadata */}
          {message.timestamp && !isLoading && (
            <div className={`text-xs mt-3 pt-2 border-t ${
              isUser 
                ? 'text-blue-200 border-blue-500' 
                : 'text-gray-500 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                {message.modelUsed && !isUser && (
                  <span className="flex items-center space-x-1">
                    <Code className="h-3 w-3" />
                    <span>{message.modelUsed}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Settings Panel Component
const SettingsPanel = ({ isOpen, onClose, settings, onUpdateSettings, availableModels }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: null,
    };
    setLocalSettings(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg z-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Chat Settings</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Model
          </label>
          <select
            value={localSettings.model || 'gpt-4o-mini'}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, model: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature: {localSettings.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={localSettings.temperature}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Focused</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Tokens
          </label>
          <input
            type="number"
            min="100"
            max="4000"
            value={localSettings.maxTokens}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt (Optional)
          </label>
          <textarea
            value={localSettings.systemPrompt || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, systemPrompt: e.target.value || null }))}
            placeholder="Enter custom instructions for the AI..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Save Changes
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Chatbot Component
const Chatbot = () => {
  const {
    messages,
    currentConversation,
    sendMessage,
    isSending,
    canSend,
    error,
    clearError,
    settings,
    updateSettings,
    availableModels,
    currentModel
  } = useChat();

  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !canSend) return;
    
    const messageText = inputMessage.trim();
    setInputMessage('');
    
    const result = await sendMessage(messageText, currentConversation?.conversation_id);
    
    if (!result.success) {
      console.error('Failed to send message:', result.error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleRetry = () => {
    clearError();
    if (inputMessage.trim()) {
      handleSendMessage({ preventDefault: () => {} });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="flex-none bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentConversation?.title || 'New Conversation'}
            </h1>
            <p className="text-sm text-gray-500">
              {currentConversation 
                ? `${messages.length} messages`
                : 'Start a new conversation'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Chat settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex-none bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRetry}
                className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </button>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to CodementorX
              </h3>
              <p className="text-gray-500 mb-4 max-w-md">
                I'm here to help you with programming, development, and technical questions. 
                Start by asking me anything!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "How do I implement JWT authentication?",
                  "Explain React hooks",
                  "Best practices for API design",
                  "Help me debug Python code"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputMessage(suggestion)}
                    className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <EnhancedMessage
                key={message.id}
                message={message}
                isUser={message.role === 'user'}
                isLoading={false}
              />
            ))}
            
            {/* Loading indicator */}
            {isSending && (
              <EnhancedMessage
                message={{ content: '', role: 'assistant' }}
                isUser={false}
                isLoading={true}
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-none bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ 
                minHeight: '44px', 
                maxHeight: '120px',
                height: 'auto',
                overflow: inputMessage.length > 100 ? 'auto' : 'hidden'
              }}
              disabled={!canSend}
            />
          </div>
          
          <button
            type="submit"
            disabled={!canSend || !inputMessage.trim()}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              canSend && inputMessage.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        
        {/* Status */}
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>
            {isSending 
              ? 'AI is thinking...'
              : canSend 
                ? `Model: ${currentModel}`
                : 'Please log in to chat'
            }
          </span>
          {messages.length > 0 && (
            <span>
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        availableModels={availableModels}
      />
    </div>
  );
};

export default Chatbot;