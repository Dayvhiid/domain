import React, { useState } from 'react';
import { ChevronLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import logo from 'figma:asset/612f7289b99c44abc1363d55b6e8ffe9274868e3.png';
import { authService } from '../services/authService';

export default function ForgotPasswordScreen({ onNavigateLogin }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Error requesting password reset:', err);
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    onNavigateLogin();
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col px-6 py-12">
        <button onClick={handleBackToLogin} className="self-start mb-8">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Check Your Email</h2>

          <p className="text-sm text-gray-600 text-center mb-8">
            We've sent password reset instructions to <span className="font-medium text-gray-900">{email}</span>
          </p>

          <div className="w-full space-y-4">
            <button
              onClick={handleBackToLogin}
              className="w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors"
            >
              Back to Login
            </button>

            <button
              onClick={() => {
                setIsSubmitted(false);
                setError(null);
              }}
              className="w-full text-blue-700 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Resend Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-12">
      <button onClick={handleBackToLogin} className="self-start mb-8">
        <ChevronLeft className="w-6 h-6 text-gray-600" />
      </button>

      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
          <img src={logo} alt="SWA Logo" className="w-20 h-20 object-contain" />
        </div>
        <h1 className="text-4xl font-bold text-blue-700">SWA</h1>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">Forgot Password?</h2>
        <p className="text-sm text-gray-600 mb-8">
          No worries! Enter your email address and we'll send you instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}