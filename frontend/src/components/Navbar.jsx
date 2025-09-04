/**
 * Navigation Bar Component - CodementorX
 * Responsive navigation with authentication state and chatbot access
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  MessageSquare,
  Home,
  Code,
  BookOpen,
  Zap
} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  const isActivePath = (path) => location.pathname === path;

  // Close mobile menu when clicking outside
  const handleOverlayClick = () => {
    if (showUserMenu) setShowUserMenu(false);
    if (isOpen) setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CodementorX
                </span>
                <span className="text-xs text-gray-500 -mt-1">AI Coding Mentor</span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                {/* Navigation links for authenticated users */}
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActivePath('/dashboard')
                      ? 'text-blue-700 bg-blue-50 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/chat"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActivePath('/chat')
                      ? 'text-blue-700 bg-blue-50 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>AI Chat</span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </Link>

                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActivePath('/profile')
                      ? 'text-blue-700 bg-blue-50 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Profile</span>
                </Link>

                {/* User menu dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors border border-gray-200 hover:border-gray-300"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-medium">
                        {(user?.first_name?.[0] || user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block">
                      {user?.first_name || user?.username || 'User'}
                    </span>
                    {isAdmin && (
                      <Zap className="w-3 h-3 text-yellow-500" />
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={handleOverlayClick}
                        aria-hidden="true"
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 border border-gray-100">
                        <div className="py-1">
                          {/* User info */}
                          <div className="px-4 py-4 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white font-medium">
                                  {(user?.first_name?.[0] || user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {user?.first_name && user?.last_name 
                                    ? `${user.first_name} ${user.last_name}`
                                    : user?.username || user?.email
                                  }
                                </p>
                                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                                {isAdmin && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Menu items */}
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <User className="w-4 h-4 mr-3" />
                            View Profile
                          </Link>

                          <Link
                            to="/settings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Account Settings
                          </Link>

                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                              <LogOut className="w-4 h-4 mr-3" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Navigation for non-authenticated users */}
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActivePath('/login')
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
          <div className="md:hidden border-t border-gray-200 bg-white relative z-50">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {isAuthenticated ? (
                <>
                  {/* User info */}
                  <div className="px-3 py-4 bg-gray-50 rounded-xl mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white font-medium">
                          {(user?.first_name?.[0] || user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-gray-900 truncate">
                          {user?.first_name && user?.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : user?.username || user?.email
                          }
                        </p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                            <Zap className="w-3 h-3 mr-1" />
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile menu items */}
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActivePath('/dashboard')
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/chat"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActivePath('/chat')
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>AI Chat</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full ml-auto">
                      Live
                    </span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActivePath('/profile')
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>

                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-3 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;