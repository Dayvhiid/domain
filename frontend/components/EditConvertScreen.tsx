import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import BottomNav from './BottomNav';
import { convertService, Convert } from '../services/convertService';

interface EditConvertScreenProps {
    onNavigate: (screen: string, id?: string | null) => void;
    convertId: string | null;
}

export default function EditConvertScreen({ onNavigate, convertId }: EditConvertScreenProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsapp: '',
        houseAddress: '',
        dateBornAgain: '',
        ageGroup: '',
        gender: '',
        maritalStatus: '',
        career: ''
    });

    useEffect(() => {
        if (!convertId) {
            onNavigate('converts-list');
            return;
        }
        fetchConvertDetails();
    }, [convertId]);

    const fetchConvertDetails = async () => {
        setIsLoading(true);
        try {
            const data = await convertService.getConvertDetails(convertId!);
            setFormData({
                name: data.name || '',
                phone: data.phone || '',
                whatsapp: data.whatsapp || '',
                houseAddress: data.address || '',
                dateBornAgain: data.dateBornAgain ? data.dateBornAgain.split('T')[0] : '',
                ageGroup: data.ageGroup || '',
                gender: data.gender || '',
                maritalStatus: data.maritalStatus || '',
                career: data.occupation || ''
            });
        } catch (err) {
            setError('Failed to load convert details.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!convertId) return;

        setIsSaving(true);
        setError(null);
        try {
            const updateData: Partial<Convert> = {
                name: formData.name,
                phone: formData.phone,
                whatsapp: formData.whatsapp,
                address: formData.houseAddress,
                dateBornAgain: formData.dateBornAgain,
                gender: formData.gender,
                ageGroup: formData.ageGroup,
                maritalStatus: formData.maritalStatus,
                occupation: formData.career
            };
            await convertService.updateConvert(convertId, updateData);
            onNavigate('convert-details', convertId);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update convert. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <Loader2 className="w-8 h-8 text-blue-700 animate-spin mb-4" />
                <p className="text-gray-600">Loading convert details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center">
                <button onClick={() => onNavigate('convert-details', convertId)} className="mr-3">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Edit Convert</h1>
            </div>

            {error && (
                <div className="mx-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl mb-4 mt-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Full Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                            placeholder="Enter full name"
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Phone *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                                placeholder="Phone number"
                                required
                                disabled={isSaving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">WhatsApp</label>
                            <input
                                type="tel"
                                value={formData.whatsapp}
                                onChange={(e) => handleChange('whatsapp', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                                placeholder="WhatsApp"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">House Address</label>
                        <input
                            type="text"
                            value={formData.houseAddress}
                            onChange={(e) => handleChange('houseAddress', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                            placeholder="Enter house address"
                            disabled={isSaving}
                        />
                    </div>
                </div>

                <div className="border-t border-gray-100"></div>

                {/* Birth and Spiritual Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">Birth & Spiritual Information</h3>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Date Born Again *</label>
                        <input
                            type="date"
                            value={formData.dateBornAgain}
                            onChange={(e) => handleChange('dateBornAgain', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Age Group</label>
                            <select
                                value={formData.ageGroup}
                                onChange={(e) => handleChange('ageGroup', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
                                disabled={isSaving}
                            >
                                <option value="">Select</option>
                                <option value="Children">Children (0-12)</option>
                                <option value="Teenagers">Teenagers (13-19)</option>
                                <option value="Yaya">YAYA</option>
                                <option value="Adults">Adults</option>
                                <option value="Elders">Elders</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Gender</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => handleChange('gender', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
                                disabled={isSaving}
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Marital Status</label>
                            <select
                                value={formData.maritalStatus}
                                onChange={(e) => handleChange('maritalStatus', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
                                disabled={isSaving}
                            >
                                <option value="">Select</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Career/Occupation</label>
                            <input
                                type="text"
                                value={formData.career}
                                onChange={(e) => handleChange('career', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                                placeholder="Enter occupation"
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {isSaving ? 'Updating...' : 'Update Convert'}
                </button>
            </form>

            <BottomNav active="converts" onNavigate={onNavigate} />
        </div>
    );
}
