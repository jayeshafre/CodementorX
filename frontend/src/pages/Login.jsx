/**
 * Login Page Component
 * User authentication with email and password - Perfectly Centered & Fully Responsive
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, isLoading, error, isAuthenticated, clearErrors } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component mounts
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await login({
      email: formData.email.trim(),
      password: formData.password,
    });

    if (result.success) {
      const from = location.state?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    }
  };

  return (
    <>
      {/* Reset any parent container styles */}
      <style>{`
        #root {
          display: block !important;
          place-items: unset !important;
        }
        body {
          display: block !important;
          place-items: unset !important;
        }
      `}</style>
      
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <Lock className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="auth-title">Sign in to your account</h2>
            <p className="auth-subtitle">
              Or{' '}
              <Link to="/register" className="auth-link">
                create a new account
              </Link>
            </p>
          </div>

          {/* Login Form Card */}
          <div className="card">
            <div className="card-body">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Global Error Message */}
                {error && (
                  <div className="alert-error">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Sign in failed
                        </h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="form-label">
                      Email address
                    </label>
                    <div className="input-with-icon">
                      <div className="input-icon-left">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-input input-with-left-icon ${
                          errors.email ? 'form-input-error' : ''
                        }`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && (
                      <p className="form-error">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="input-with-icon">
                      <div className="input-icon-left">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`form-input input-with-left-icon input-with-right-icon ${
                          errors.password ? 'form-input-error' : ''
                        }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="input-icon-right hover:bg-gray-50 rounded-r-lg transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="form-error">{errors.password}</p>
                    )}
                  </div>
                </div>

                {/* Remember me and Forgot password */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link to="/forgot-password" className="auth-link">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">New to our platform?</span>
                  </div>
                </div>

                {/* Create Account Button */}
                <div>
                  <Link
                    to="/register"
                    className="w-full btn-secondary"
                  >
                    Create new account
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <p>© 2024 Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;