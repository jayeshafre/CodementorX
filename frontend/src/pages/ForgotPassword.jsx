/**
 * Forgot Password Page Component
 * Send password reset email to user - Fully Responsive
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/axiosClient';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter your email address'
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid email address'
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authAPI.forgotPassword(email.trim());
      
      setIsSubmitted(true);
      setMessage({
        type: 'success',
        text: 'If your email is registered, you will receive a password reset link shortly.'
      });
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send reset email. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first responsive container */}
      <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-primary-100">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              </div>
              <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900">
                Forgot your password?
              </h2>
              <p className="mt-2 text-sm text-gray-600 px-2">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {!isSubmitted ? (
              <>
                {/* Status Message */}
                {message.text && (
                  <div className={`rounded-lg p-3 sm:p-4 ${
                    message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
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

                {/* Form */}
                <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="form-label">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input pl-9 sm:pl-10 text-base"
                        placeholder="Enter your email address"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

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
                          Sending reset link...
                        </>
                      ) : (
                        'Send reset link'
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center space-y-4">
                  <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Check your email
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 px-2">
                      If an account with the email <strong>{email}</strong> exists, 
                      we've sent you a password reset link.
                    </p>
                  </div>
                  
                  <div className="mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      Didn't receive the email?
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Check your spam or junk folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• Wait a few minutes for the email to arrive</li>
                    </ul>
                  </div>
                </div>

                {/* Try Again Button */}
                <div>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                      setMessage({ type: '', text: '' });
                    }}
                    className="w-full btn-secondary h-12 text-base"
                  >
                    Try with different email
                  </button>
                </div>
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

            {/* Help Section */}
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

export default ForgotPassword;