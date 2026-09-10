import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Shield, Mail, Loader2, Users, Clock, Filter } from 'lucide-react';
import { userService } from '../services/userService';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isValidated: boolean;
}

export default function UserManagementScreen({ 
    onNavigate, 
    user: propUser 
}: { 
    onNavigate: (screen: string) => void,
    user?: any
}) {
    // Get user safely - prefer prop, fallback to localStorage
    const [loggedInUser, setLoggedInUser] = useState<any>(propUser);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!loggedInUser) {
            const storedUser = localStorage.getItem('swa_user');
            if (storedUser) {
                setLoggedInUser(JSON.parse(storedUser));
            }
        }
        fetchUsers();
    }, []);

    const getHubTitle = () => {
        const role = loggedInUser?.role || 'super_admin';
        switch (role) {
            case 'zonal_admin': return 'Zonal Admin Hub';
            case 'area_admin': return 'Area Admin Hub';
            case 'parish_admin': return 'Parish Admin Hub';
            default: return 'Super Admin Hub';
        }
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await userService.getAllUsers();
            console.log('DEBUG: Fetched users raw data:', data);
            // Normalize ID mapping: ensure 'id' is always populated from '_id'
            const normalizedUsers = data.map((u: any) => ({
                ...u,
                id: u._id || u.id
            }));
            setUsers(normalizedUsers);
        } catch (err) {
            console.error('DEBUG: Fetch users error:', err);
            setError('Failed to fetch users. Please make sure you have super admin privileges.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleValidation = async (userId: string, currentStatus: boolean) => {
        if (!userId) {
            console.error('DEBUG: Toggle error - userId is undefined');
            return;
        }
        console.log(`DEBUG: Toggling validation for user ${userId}, currentStatus: ${currentStatus}`);
        setProcessingId(userId);
        try {
            await userService.validateUser(userId, !currentStatus);
            setUsers(users.map(u => u.id === userId ? { ...u, isValidated: !currentStatus } : u));
        } catch (err) {
            console.error('DEBUG: Toggle API error:', err);
            alert('Failed to update user validation status.');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingCount = users.filter(u => !u.isValidated).length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onNavigate('dashboard')}
                            className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-600 border border-transparent hover:border-gray-200 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{getHubTitle()}</h1>
                        <p className="text-xs text-gray-500 font-medium">Control and validate platform access</p>
                    </div>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                    <Shield className="w-5 h-5 text-blue-700" />
                </div>
            </div>

            {/* Search & Stats Bar */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="relative">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <Shield className="w-4 h-4 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-50" />
                    </div>
                    <p className="text-gray-500 mt-4 font-medium">Loading user database...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl text-center shadow-sm">
                    <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">{error}</p>
                    <p className="text-sm mt-2 opacity-80">Please ensure you have the required administrative privileges.</p>
                </div>
            ) : (
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Users</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                            </div>
                        </div>

                        {/* User List */}
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <Filter className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No users match your filters.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">User Details</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-blue-50/10 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-900 text-sm">{user.name}</span>
                                                            <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                                <Mail className="w-3 h-3" />
                                                                {user.email}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                                                            {user.role?.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.isValidated
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isValidated ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                                                            {user.isValidated ? 'Validated' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            disabled={processingId === user.id}
                                                            onClick={() => handleToggleValidation(user.id, user.isValidated)}
                                                            className={`p-2 rounded-xl transition-all ${user.isValidated
                                                                ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                                                : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                                                                }`}
                                                            title={user.isValidated ? 'Deactivate User' : 'Validate User'}
                                                        >
                                                            {processingId === user.id ? (
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                            ) : user.isValidated ? (
                                                                <XCircle className="w-5 h-5" />
                                                            ) : (
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
