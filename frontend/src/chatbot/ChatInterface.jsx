/**
 * Chat Interface - Main chatbot component
 * Combines Sidebar and ChatBox components
 */
import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ChatBox from './ChatBox';
import { Menu, X, MessageSquare, AlertCircle } from 'lucide-react';

const ChatInterface = () => {
  const { user } = useAuth();
  const { 
    isSidebarOpen, 
    toggleSidebar, 
    setSidebarOpen,
    error, 
    clearError,
    isLoadingConversations 
  } = useChat();
  
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile
      if (mobile && isSidebarOpen) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isSidebarOpen, setSidebarOpen]);

  // Close sidebar when clicking outside (mobile)
  const handleOverlayClick = () => {
    if (isMobile && isSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900">Loading Chat...</h2>
          <p className="text-gray-600">Setting up your conversations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 md:hidden transition-colors"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Desktop sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
            
            {/* Title */}
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">CodementorX</h1>
            </div>
          </div>
          
          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500">AI Assistant</p>
            </div>
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* Mobile overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            ${isMobile ? 'fixed' : 'relative'}
            ${isMobile ? 'z-50' : 'z-10'}
            w-80 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
            ${!isMobile && !isSidebarOpen ? 'w-0 overflow-hidden' : ''}
          `}
        >
          <Sidebar />
        </div>

        {/* Chat Area */}
        <div className={`
          flex-1 flex flex-col
          ${!isMobile && isSidebarOpen ? 'ml-0' : ''}
        `}>
          <ChatBox />
        </div>
      </div>

      {/* Welcome Message for new users */}
      <WelcomeModal />
    </div>
  );
};

// Welcome modal for first-time users
const WelcomeModal = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const { conversations } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    // Show welcome if user has no conversations and hasn't seen welcome before
    const hasSeenWelcome = localStorage.getItem('chatbot_welcome_seen');
    if (!hasSeenWelcome && conversations.length === 0) {
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [conversations.length]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('chatbot_welcome_seen', 'true');
  };

  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Welcome to CodementorX!
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Hi {user?.first_name || 'there'}! 👋<br />
            I'm your AI coding mentor. I can help you with:
          </p>
          
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Programming questions & code reviews
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Debugging and optimization tips
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Learning new technologies
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              General questions & translations
            </div>
          </div>
          
          <button
            onClick={handleCloseWelcome}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Let's Start Coding! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;