import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function Profile() {
    const { user, login } = useAuth(); // login is reused to update user in context
    const [formData, setFormData] = useState({
        fullName: "",
        email: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.name || "",
                email: user.email || ""
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await API.put('/auth/profile', {
                name: formData.fullName,
                email: formData.email
            });

            // Update context
            const updatedUser = res.data.user;
            // We need to keep the token, assuming login function updates user in localStorage/state
            // Check AuthContext: login(token, userData)
            const token = localStorage.getItem("token");
            login(token, updatedUser);

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Failed to update profile", error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pb-10">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Profile</h1>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between backdrop-blur-sm gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden ring-4 ring-slate-800">
                            {/* Using the avatar from the design concept */}
                            <svg className="w-16 h-16 text-teal-800 translate-y-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{formData.fullName || "User"}</h2>
                        <p className="text-slate-400 mt-1">{formData.email}</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                    >
                        <span className="text-white">Cancel</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 shadow-lg shadow-primary-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="text-white">{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Full Name</label>
                    <input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        type="text"
                        className="w-full bg-[#121b2e]/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all placeholder-slate-600"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Email Address</label>
                    <input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        className="w-full bg-[#121b2e]/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all placeholder-slate-600"
                    />
                </div>

            </div>

            {/* Divider */}
            <div className="h-px bg-slate-800 my-8"></div>

            {/* Danger Zone */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Danger Zone</h3>
                <p className="text-slate-400 text-sm">These actions are permanent and cannot be undone.</p>

                <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 mt-4">
                    <div>
                        <h4 className="text-white font-bold mb-1">Delete Account</h4>
                        <p className="text-slate-400 text-sm">Once you delete your account, there is no going back. Please be certain.</p>
                    </div>

                    <button className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 whitespace-nowrap">
                        Delete My Account
                    </button>
                </div>
            </div>

        </div>
    );
}
