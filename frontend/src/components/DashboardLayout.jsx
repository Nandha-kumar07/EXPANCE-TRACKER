import { useAuth } from '../context/AuthContext';
import { Link, useLocation, Outlet } from 'react-router-dom';

export default function DashboardLayout() {
    const location = useLocation();
    const { user, logout } = useAuth();

    // Fallback if user is not fully loaded yet (though protected route handles it)
    const displayName = user?.name || "User";
    const displayEmail = user?.email || "user@example.com";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff`;

    const NAV_ITEMS = [
        { label: "Profile", icon: "user", path: "/dashboard/profile" },
        { label: "Preferences", icon: "sliders", path: "/dashboard/preferences" },
        { label: "Security", icon: "shield", path: "/dashboard/security" },
        { label: "Account", icon: "credit-card", path: "/dashboard/account" },
    ];

    return (
        <div className="flex min-h-screen bg-[#0f172a] text-slate-300 font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 flex flex-col fixed h-full left-0 top-0 bg-[#0f172a] z-20">

                {/* Logo */}
                <div className="p-6 pb-0">
                    <h1 className="text-2xl font-black text-white tracking-tighter">ExpenseTracker</h1>
                </div>

                {/* User Profile Header (New Design) */}
                <div className="p-6 border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <img src={avatarUrl} alt="User" className="w-10 h-10 rounded-full bg-slate-700 ring-2 ring-slate-800" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{displayName}</p>
                            <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-1">
                    {/* Navigation Items */}
                    {[
                        { label: "Dashboard", icon: "grid", path: "/dashboard/overview" },
                        { label: "Transactions", icon: "list", path: "/dashboard/transactions" },
                        { label: "Reports", icon: "chart", path: "/dashboard/reports" },
                        { label: "Budgets", icon: "pie", path: "/dashboard/budgets" },
                        { label: "Notes", icon: "note", path: "/dashboard/notes" },
                        { label: "Settings", icon: "cog", path: "/dashboard/profile" }, // Mapping Settings to Profile for now
                    ].map((item) => {
                        const isActive = location.pathname.includes(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                    ? "bg-primary-600/10 text-primary-400 border-l-2 border-primary-500"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                <span className={`${isActive ? "text-primary-500" : "text-slate-500 group-hover:text-white"}`}>
                                    {/* Icons */}
                                    {item.icon === 'grid' && (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    )}
                                    {item.icon === 'list' && (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    )}
                                    {item.icon === 'chart' && (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    )}
                                    {item.icon === 'pie' && (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                                    )}
                                    {item.icon === 'cog' && (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    )}
                                    {item.icon === 'note' && (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    )}
                                </span>
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Links (Help, Logout) */}
                <div className="p-4 border-t border-slate-800 space-y-1">
                    <button className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-white rounded-lg transition-colors group">
                        <svg className="w-5 h-5 text-slate-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-medium text-sm text-white">Help</span>
                    </button>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-white rounded-lg transition-colors group"
                    >
                        <svg className="w-5 h-5 text-slate-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span className="font-medium text-sm text-white">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-12 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
