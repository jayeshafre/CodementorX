/**
 * Reset Password Page Component
 * Reset user password using token from email - Fully Responsive
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/axiosClient';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Lock,
  ArrowLeft
} from 'lucide-react';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isValidToken, setIsValidToken] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if token and uid are present
  useEffect(() => {
    if (!uid || !token) {
      setIsValidToken(false);
      setMessage({
        type: 'error',
        text: 'Invalid reset link. Please request a new password reset.'
      });
    }
  }, [uid, token]);

  // Calculate password strength
  useEffect(() => {
    const calculateStrength = (password) => {
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;
      return strength;
    };
    
    setPasswordStrength(calculateStrength(formData.newPassword));
  }, [formData.newPassword]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user types
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  // Validate form
  const validateForm = () => {
    if (!formData.newPassword) {
      setMessage({
        type: 'error',
        text: 'Please enter a new password'
      });
      return false;
    }

    if (formData.newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long'
      });
      return false;
    }

    if (passwordStrength < 3) {
      setMessage({
        type: 'error',
        text: 'Password is too weak. Include uppercase, lowercase, numbers, and special characters'
      });
      return false;
    }

    if (!formData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Please confirm your new password'
      });
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match'
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authAPI.resetPassword({
        uid: uid,
        token: token,
        new_password: formData.newPassword,
        new_password_confirm: formData.confirmPassword,
      });
      
      setIsSuccess(true);
      setMessage({
        type: 'success',
        text: 'Your password has been reset successfully!'
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful. Please sign in with your new password.' 
          }
        });
      }, 3000);
      
    } catch (error) {
      if (error.response?.status === 400) {
        setMessage({
          type: 'error',
          text: 'Invalid or expired reset link. Please request a new password reset.'
        });
        setIsValidToken(false);
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to reset password. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    if (passwordStrength === 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength === 3) return 'Fair';
    if (passwordStrength === 4) return 'Good';
    return 'Strong';
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile-first responsive container */}
        <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex-grow flex items-center justify-center">
            <div className="w-full max-w-sm sm:max-w-md text-center space-y-6 sm:space-y-8">
              <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Invalid Reset Link
                </h2>
                <p className="mt-2 text-sm text-gray-600 px-2">
                  This password reset link is invalid or has expired. 
                  Please request a new password reset.
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="w-full btn-primary h-12 text-base"
                >
                  Request New Reset Link
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Footer for mobile */}
          <div className="text-center text-xs text-gray-500 mt-4 sm:mt-8">
            <p>© 2024 Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first responsive container */}
      <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-primary-100">
                {isSuccess ? (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                ) : (
                  <Key className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                )}
              </div>
              <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900">
                {isSuccess ? 'Password Reset Complete' : 'Reset Your Password'}
              </h2>
              <p className="mt-2 text-sm text-gray-600 px-2">
                {isSuccess 
                  ? 'You can now sign in with your new password'
                  : 'Please enter your new password below'
                }
              </p>
            </div>

            {isSuccess ? (
              // Success State
              <div className="space-y-4 sm:space-y-6">
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Your password has been successfully reset. You will be redirected to the login page shortly.
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="w-full btn-primary h-12 text-base"
                >
                  Go to Sign In
                </Link>
              </div>
            ) : (
              <>
                {/* Status Message */}
                {message.text && (
                  <div className={`rounded-lg p-3 sm:p-4 ${
                    message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex">
                      {message.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      )}
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          message.type === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {message.text}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset Form */}
                <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* New Password Field */}
                    <div>
                      <label htmlFor="newPassword" className="form-label">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="form-input pl-9 sm:pl-10 pr-10 text-base"
                          placeholder="Enter your new password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {formData.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              passwordStrength <= 2 ? 'text-red-600' :
                              passwordStrength === 3 ? 'text-yellow-600' :
                              passwordStrength === 4 ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="form-input pl-9 sm:pl-10 pr-10 text-base"
                          placeholder="Confirm your new password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>

                      {/* Password Match Indicator */}
                      {formData.confirmPassword && (
                        <div className="mt-1 flex items-center">
                          {formData.newPassword === formData.confirmPassword ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm">Passwords match</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm">Passwords don't match</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Password Requirements:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className={`flex items-center ${
                        formData.newPassword.length >= 8 ? 'text-green-600' : ''
                      }`}>
                        <span className="mr-2 w-4">
                          {formData.newPassword.length >= 8 ? '✓' : '•'}
                        </span>
                        At least 8 characters
                      </li>
                      <li className={`flex items-center ${
                        /[A-Z]/.test(formData.newPassword) ? 'text-green-600' : ''
                      }`}>
                        <span className="mr-2 w-4">
                          {/[A-Z]/.test(formData.newPassword) ? '✓' : '•'}
                        </span>
                        One uppercase letter
                      </li>
                      <li className={`flex items-center ${
                        /[a-z]/.test(formData.newPassword) ? 'text-green-600' : ''
                      }`}>
                        <span className="mr-2 w-4">
                          {/[a-z]/.test(formData.newPassword) ? '✓' : '•'}
                        </span>
                        One lowercase letter
                      </li>
                      <li className={`flex items-center ${
                        /\d/.test(formData.newPassword) ? 'text-green-600' : ''
                      }`}>
                        <span className="mr-2 w-4">
                          {/\d/.test(formData.newPassword) ? '✓' : '•'}
                        </span>
                        One number
                      </li>
                      <li className={`flex items-center ${
                        /[^a-zA-Z0-9]/.test(formData.newPassword) ? 'text-green-600' : ''
                      }`}>
                        <span className="mr-2 w-4">
                          {/[^a-zA-Z0-9]/.test(formData.newPassword) ? '✓' : '•'}
                        </span>
                        One special character
                      </li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full btn-primary h-12 text-base ${
                        isLoading ? 'btn-disabled' : ''
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Resetting password...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </Link>
            </div>

            {/* Help Section - Only show when not success */}
            {!isSuccess && (
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Need help?
                </h4>
                <p className="text-sm text-gray-600">
                  If you're having trouble resetting your password, please{' '}
                  <Link to="/contact" className="text-primary-600 hover:text-primary-500 font-medium">
                    contact our support team
                  </Link>{' '}
                  for assistance.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer for mobile */}
        <div className="text-center text-xs text-gray-500 mt-4 sm:mt-8">
          <p>© 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;