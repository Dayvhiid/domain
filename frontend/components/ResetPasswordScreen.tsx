import React, { useState } from 'react';
import { Lock, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';
import { authService } from '../services/authService';
import logo from 'figma:asset/612f7289b99c44abc1363d55b6e8ffe9274868e3.png';

export default function ResetPasswordScreen({ token, onNavigateLogin }) {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await authService.resetPassword({
                token,
                newPassword: formData.newPassword
            });
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Error resetting password:', err);
            // Handle expired token or invalid token errors specifically if possible
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col px-6 py-12">
                <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Password Reset!</h2>

                    <p className="text-sm text-gray-600 text-center mb-8">
                        Your password has been successfully updated. You can now log in with your new password.
                    </p>

                    <button
                        onClick={onNavigateLogin}
                        className="w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col px-6 py-12">
            <button onClick={onNavigateLogin} className="self-start mb-8">
                <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex flex-col items-center mb-12">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
                    <img src={logo} alt="SWA Logo" className="w-20 h-20 object-contain" />
                </div>
                <h1 className="text-4xl font-bold text-blue-700">SWA</h1>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Reset Password</h2>
                <p className="text-sm text-gray-600 mb-8">
                    Please enter your new password below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => handleChange('newPassword', e.target.value)}
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:bg-gray-50"
                                placeholder="Enter new password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:bg-gray-50"
                                placeholder="Confirm new password"
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
                                Resetting...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
