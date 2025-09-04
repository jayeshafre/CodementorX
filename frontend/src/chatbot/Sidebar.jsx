/**
 * Sidebar.jsx - Conversation History & Session Management
 * Displays conversation list, search, and user profile
 */
import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  Archive, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Clock,
  Filter
} from 'lucide-react';
import { useChat, CONVERSATION_STATUS } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

// Conversation item component
const ConversationItem = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete, 
  onArchive 
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
              {conversation.title}
            </h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatDate(conversation.updated_at)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {conversation.message_count > 0 && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {conversation.message_count}
                </span>
              )}
              
              {conversation.status === CONVERSATION_STATUS.ARCHIVED && (
                <Archive className="h-3 w-3 text-gray-400" />
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
              onArchive(conversation.id);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
            title="Archive conversation"
          >
            <Archive className="h-3 w-3" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
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
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
          {user.first_name?.[0] || user.username?.[0] || user.email?.[0]}
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.full_name || user.username}
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

// Filter component
const ConversationFilter = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { key: 'all', label: 'All Chats', count: null },
    { key: 'active', label: 'Active', count: null },
    { key: 'archived', label: 'Archived', count: null },
  ];
  
  return (
    <div className="flex space-x-1 mb-4">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            activeFilter === filter.key
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

// Main Sidebar component
const Sidebar = ({ isCollapsed = false }) => {
  const {
    conversations,
    activeConversation,
    createNewConversation,
    switchConversation,
    deleteConversation,
    conversationSummary
  } = useChat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    
    // Apply status filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(conv => conv.status === CONVERSATION_STATUS.ACTIVE);
    } else if (activeFilter === 'archived') {
      filtered = filtered.filter(conv => conv.status === CONVERSATION_STATUS.ARCHIVED);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.title.toLowerCase().includes(search)
      );
    }
    
    // Sort by updated_at (most recent first)
    return filtered.sort((a, b) => 
      new Date(b.updated_at) - new Date(a.updated_at)
    );
  }, [conversations, activeFilter, searchTerm]);
  
  const handleNewConversation = () => {
    createNewConversation();
  };
  
  const handleConversationSelect = (conversationId) => {
    switchConversation(conversationId);
  };
  
  const handleConversationDelete = (conversationId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversationId);
    }
  };
  
  const handleConversationArchive = (conversationId) => {
    // In a real implementation, this would call an API to archive
    console.log('Archive conversation:', conversationId);
  };
  
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
          {conversations.slice(0, 5).map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => handleConversationSelect(conversation.id)}
              className={`w-full p-3 flex justify-center ${
                activeConversation === conversation.id
                  ? 'bg-blue-100 border-r-2 border-blue-600'
                  : 'hover:bg-gray-100'
              }`}
              title={conversation.title}
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <UserProfile />
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <button
            onClick={handleNewConversation}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        
        {/* Filters */}
        <ConversationFilter 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchTerm.trim() 
                ? 'No conversations found'
                : 'No conversations yet'
              }
            </p>
            {!searchTerm.trim() && (
              <button
                onClick={handleNewConversation}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Start your first conversation
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversation === conversation.id}
              onSelect={() => handleConversationSelect(conversation.id)}
              onDelete={handleConversationDelete}
              onArchive={handleConversationArchive}
            />
          ))
        )}
      </div>
      
      {/* Current Conversation Stats */}
      {activeConversation && conversationSummary.messageCount > 0 && (
        <div className="flex-none p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Messages:</span>
              <span>{conversationSummary.messageCount}</span>
            </div>
            {conversationSummary.hasErrors && (
              <div className="flex justify-between text-red-600">
                <span>Has Errors:</span>
                <span>Yes</span>
              </div>
            )}
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