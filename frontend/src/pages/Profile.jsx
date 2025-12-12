import { useState } from 'react';

export default function Profile() {
    const [formData, setFormData] = useState({
        fullName: "Alex Doe",
        username: "alex_doe",
        email: "alex.doe@example.com"
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="space-y-10 animate-fade-in pb-10">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Profile</h1>
            </div>

            {/* Profile Card */}
            <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-8 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden ring-4 ring-slate-800">
                            {/* Using the avatar from the design concept */}
                            <svg className="w-16 h-16 text-teal-800 translate-y-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                        <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center border-2 border-[#121b2e] text-white hover:bg-primary-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{formData.fullName}</h2>
                        <p className="text-slate-400 mt-1">Update your photo and personal details.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button className="px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 shadow-lg shadow-primary-500/20 transition-all hover:-translate-y-0.5">
                        Save Changes
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
                    <label className="text-sm font-medium text-slate-400">Username</label>
                    <input
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        type="text"
                        className="w-full bg-[#121b2e]/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all placeholder-slate-600"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
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
