import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Mail, Lock, Loader2 } from 'lucide-react';
import logo from 'figma:asset/612f7289b99c44abc1363d55b6e8ffe9274868e3.png';
import { authService } from '../services/authService';

export default function LoginScreen({ onLogin, onNavigateSignup, onNavigateForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRetryMessage = (retryAfter?: string) => {
    if (!retryAfter) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }

    const retrySeconds = Number(retryAfter);
    if (!Number.isNaN(retrySeconds)) {
      return `Too many login attempts. Please try again in ${retrySeconds} seconds.`;
    }

    const retryDate = new Date(retryAfter);
    if (!Number.isNaN(retryDate.getTime())) {
      const waitSeconds = Math.max(1, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
      return `Too many login attempts. Please try again in about ${waitSeconds} seconds.`;
    }

    return 'Too many login attempts. Please wait a moment and try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      onLogin(response);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ERR_NETWORK') {
          setError('Cannot reach the backend service. Ensure the API server is running and reachable.');
        } else if (err.response?.status === 429) {
          const retryAfter = err.response.headers?.['retry-after'];
          setError(getRetryMessage(retryAfter));
        } else if (err.response?.status === 415) {
          setError('Login request format is not supported by the backend. Contact the API maintainer.');
        } else {
          setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-12">
      <div className="flex flex-col items-center mt-8 mb-12">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
          <img src={logo} alt="SWA Logo" className="w-20 h-20 object-contain" />
        </div>
        <h1 className="text-4xl font-bold text-blue-700">SWA</h1>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-8">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className={`p-4 border rounded-xl flex items-start gap-3 ${error.toLowerCase().includes('pending validation') || error.toLowerCase().includes('approval')
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-red-50 border-red-200 text-red-600'
              }`}>
              <div className="flex-1 text-sm">
                {error}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-blue-700 hover:underline"
              onClick={onNavigateForgotPassword}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">Don't have an account? </span>
          <button
            onClick={onNavigateSignup}
            className="text-sm text-blue-700 hover:underline font-medium"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}