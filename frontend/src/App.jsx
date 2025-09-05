/**
 * Main App Component
 * Handles routing and global layout
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import ChatInterface from './chatbot/ChatInterface';
import { ChatProvider } from './context/ChatContext';

// Import styles
import './styles/tailwind.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

              {/* Chat with Provider & Protection */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatProvider>
                      <ChatInterface />
                    </ChatProvider>
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Admin Only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Verified Users Only */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requireVerified={true}>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/chat" replace />} />

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Placeholder components (you can create these later)
const AdminDashboard = () => (
  <div className="container-lg py-8">
    <div className="card">
      <div className="card-body text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to the admin panel!</p>
      </div>
    </div>
  </div>
);

const Settings = () => (
  <div className="container-lg py-8">
    <div className="card">
      <div className="card-body text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
        <p className="text-gray-600">Manage your account settings here.</p>
        <p className="text-sm text-yellow-600 mt-2">
          This page requires email verification.
        </p>
      </div>
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-xl text-gray-600">Page not found</p>
      <p className="mt-2 text-gray-500">
        The page you're looking for doesn't exist.
      </p>
      <div className="mt-6">
        <button
          onClick={() => window.history.back()}
          className="btn-secondary mr-3"
        >
          Go Back
        </button>
        <button
          onClick={() => (window.location.href = '/')}
          className="btn-primary"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);

export default App;
