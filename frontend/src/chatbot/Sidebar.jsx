/**
 * Sidebar.jsx - Conversation History & Session Management
 * Updated for localStorage version with proper user context
 */
import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Clock
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

// Conversation item component
const ConversationItem = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete 
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours ago
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Less than 7 days ago
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
        isActive 
          ? 'bg-blue-100 border-l-4 border-blue-600' 
          : 'hover:bg-gray-100'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {conversation.title || 'New Conversation'}
            </h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatDate(conversation.updated_at || conversation.created_at)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {conversation.message_count > 0 && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {conversation.message_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      {showActions && !isActive && (
        <div className="absolute right-2 top-2 flex space-x-1 bg-white shadow-lg rounded border p-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.conversation_id);
            }}
            className="p-1 hover:bg-red-50 rounded text-gray-500 hover:text-red-600"
            title="Delete conversation"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// User profile dropdown
const UserProfile = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!user) return null;
  
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user.username) {
      return user.username[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };
  
  const getDisplayName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.username) {
      return user.username;
    }
    return 'User';
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {getInitials()}
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {getDisplayName()}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user.email}
          </p>
        </div>
        
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to profile page
                window.location.href = '/profile';
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to settings page
                window.location.href = '/settings';
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
            
            <div className="border-t border-gray-100 my-1" />
            
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Sidebar component
const Sidebar = ({ isCollapsed = false }) => {
  const {
    conversations,
    currentConversation,
    startNewConversation,
    loadConversation,
    deleteConversation,
    messages,
    isLoading,
    error,
    hasConversations,
    totalMessages
  } = useChat();
  
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations || [];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(conv =>
        (conv.title || '').toLowerCase().includes(search)
      );
    }
    
    // Sort by updated_at (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB - dateA;
    });
  }, [conversations, searchTerm]);
  
  const handleNewConversation = () => {
    startNewConversation();
  };
  
  const handleConversationSelect = async (conversationId) => {
    const result = await loadConversation(conversationId);
    if (!result.success) {
      console.error('Failed to load conversation:', result.error);
    }
  };
  
  const handleConversationDelete = async (conversationId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      const result = await deleteConversation(conversationId);
      if (!result.success) {
        alert('Failed to delete conversation: ' + result.error);
      }
    }
  };
  
  // Collapsed sidebar
  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <button
            onClick={handleNewConversation}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors"
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.slice(0, 5).map((conversation) => (
            <button
              key={conversation.conversation_id}
              onClick={() => handleConversationSelect(conversation.conversation_id)}
              className={`w-full p-3 flex justify-center ${
                currentConversation?.conversation_id === conversation.conversation_id
                  ? 'bg-blue-100 border-r-2 border-blue-600'
                  : 'hover:bg-gray-100'
              }`}
              title={conversation.title || 'New Conversation'}
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </button>
          ))}
        </div>
        
        <div className="p-2 border-t border-gray-200">
          {user && (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs mx-auto">
              {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Full sidebar
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <button
            onClick={handleNewConversation}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="flex-none p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">
              {searchTerm.trim() 
                ? 'No conversations found'
                : hasConversations 
                  ? 'No conversations match your search'
                  : 'No conversations yet'
              }
            </p>
            {!searchTerm.trim() && !hasConversations && (
              <button
                onClick={handleNewConversation}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Start your first conversation
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.conversation_id}
                conversation={conversation}
                isActive={currentConversation?.conversation_id === conversation.conversation_id}
                onSelect={() => handleConversationSelect(conversation.conversation_id)}
                onDelete={handleConversationDelete}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Current Conversation Stats */}
      {currentConversation && messages.length > 0 && (
        <div className="flex-none p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Messages:</span>
              <span>{messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Conversation:</span>
              <span className="truncate ml-2" title={currentConversation.title}>
                {currentConversation.title || 'New Conversation'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Statistics Summary */}
      {hasConversations && (
        <div className="flex-none p-4 border-t border-gray-200 bg-blue-50">
          <div className="text-xs text-blue-600 space-y-1">
            <div className="flex justify-between">
              <span>Total Conversations:</span>
              <span>{conversations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Messages:</span>
              <span>{totalMessages || 0}</span>
            </div>
            <div className="text-center mt-2 text-xs text-blue-500">
              💾 Stored in localStorage
            </div>
          </div>
        </div>
      )}
      
      {/* User Profile */}
      <div className="flex-none p-4 border-t border-gray-200">
        <UserProfile />
      </div>
    </div>
  );
};

export default Sidebar;