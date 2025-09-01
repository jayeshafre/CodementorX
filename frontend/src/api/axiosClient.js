/**
 * Axios Client Configuration for JWT Authentication
 * Handles API requests, token refresh, and error handling
 */
import axios from 'axios';

// Create axios instance
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Token management utilities
const TokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  getUser: () => {
    const user = localStorage.getItem('user');
    try {
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  },
  setUser: (user) => {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  },
};

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If token expired and we haven't already tried to refresh
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      TokenManager.getRefreshToken() &&
      !originalRequest.url?.includes('/auth/refresh/') // FIXED: Prevent refresh loop
    ) {
      
      // FIXED: Prevent multiple simultaneous refresh attempts
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = TokenManager.getRefreshToken();
        
        // Attempt to refresh token
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/refresh/`,
          { refresh: refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );
        
        const { access, refresh } = response.data;
        TokenManager.setTokens(access, refresh || refreshToken);
        
        // Process any queued requests
        processQueue(null, access);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosClient(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Process queue with error
        processQueue(refreshError, null);
        
        // Refresh failed, clear tokens
        TokenManager.clearTokens();
        
        // FIXED: Only redirect if we're in a browser environment and not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          // Dispatch custom event instead of direct redirect
          window.dispatchEvent(new CustomEvent('auth:logout'));
          
          // Fallback redirect after short delay
          setTimeout(() => {
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }, 100);
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, {
        message: error.response?.data?.message || error.message,
        errors: error.response?.data?.errors || error.response?.data,
      });
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register/',
  LOGIN: '/auth/login/',
  LOGOUT: '/auth/logout/',
  REFRESH: '/auth/refresh/',
  
  // Profile
  PROFILE: '/auth/profile/',
  CHANGE_PASSWORD: '/auth/change-password/',
  
  // Password Reset
  FORGOT_PASSWORD: '/auth/forgot-password/',
  RESET_PASSWORD: '/auth/reset-password/',
  
  // Health
  HEALTH: '/auth/health/',
};

// Auth API methods
export const authAPI = {
  // Register new user
  register: (userData) => 
    axiosClient.post(API_ENDPOINTS.REGISTER, userData),
  
  // Login user
  login: (credentials) => 
    axiosClient.post(API_ENDPOINTS.LOGIN, credentials),
  
  // Logout user - FIXED: Better error handling and request format
  logout: (refreshToken) => {
    if (!refreshToken) {
      return Promise.resolve(); // No token to logout
    }
    
    return axiosClient.post(API_ENDPOINTS.LOGOUT, { 
      refresh: refreshToken // FIXED: Changed from refresh_token to refresh
    }).catch(error => {
      // Don't throw on logout errors, just log them
      console.warn('Logout API error:', error);
      return Promise.resolve();
    });
  },
  
  // Get user profile
  getProfile: () => 
    axiosClient.get(API_ENDPOINTS.PROFILE),
  
  // Update user profile
  updateProfile: (profileData) => 
    axiosClient.patch(API_ENDPOINTS.PROFILE, profileData),
  
  // Change password
  changePassword: (passwordData) => 
    axiosClient.post(API_ENDPOINTS.CHANGE_PASSWORD, passwordData),
  
  // Forgot password
  forgotPassword: (email) => 
    axiosClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email }),
  
  // Reset password
  resetPassword: (resetData) => 
    axiosClient.post(API_ENDPOINTS.RESET_PASSWORD, resetData),
  
  // Health check
  healthCheck: () => 
    axiosClient.get(API_ENDPOINTS.HEALTH),
};

// Export token manager for use in components
export { TokenManager };

export default axiosClient;