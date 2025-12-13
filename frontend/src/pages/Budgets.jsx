import { useState, useEffect } from 'react';
import API from '../api';

export default function Budgets() {
    // Pre-defined categories that users typically use
    const DEFAULT_CATEGORIES = [
        'Groceries', 'Transport', 'Utilities', 'Dining',
        'Shopping', 'Health', 'Entertainment', 'Others'
    ];

    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Map of category -> amount for editing
    const [budgetMap, setBudgetMap] = useState({});

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const res = await API.get('/budgets');
            const data = res.data;
            setBudgets(data);

            // Initialize map with backend data or 0
            const initialMap = {};
            DEFAULT_CATEGORIES.forEach(cat => {
                const existing = data.find(b => b.category === cat);
                initialMap[cat] = existing ? existing.amount : 0;
            });
            setBudgetMap(initialMap);

            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch budgets", error);
            setLoading(false);
        }
    };

    const handleInputChange = (category, value) => {
        setBudgetMap(prev => ({
            ...prev,
            [category]: Number(value)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Convert map back to array for API
            const budgetsArray = Object.keys(budgetMap).map(cat => ({
                category: cat,
                amount: budgetMap[cat]
            })).filter(b => b.amount > 0); // Only save non-zero budgets? Or save all? Let's save all to explicit 0. 

            await API.post('/budgets', { budgets: budgetsArray });
            setSaving(false);
            // Optional: show success message
            alert("Budgets updated successfully!");
        } catch (error) {
            console.error("Failed to save budgets", error);
            setSaving(false);
            alert("Failed to save budgets.");
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-8">
            <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Budgets</h1>
                <p className="text-slate-400 mt-1">Set your monthly limits for each category.</p>
            </div>

            <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {DEFAULT_CATEGORIES.map(category => (
                        <div key={category} className="bg-[#0f172a]/80 p-5 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-300">
                                        {/* Simple dynamic icon placeholder */}
                                        <span className="text-lg font-bold">{category[0]}</span>
                                    </div>
                                    <h3 className="text-white font-medium">{category}</h3>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Monthly Limit</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        value={budgetMap[category]}
                                        onChange={(e) => handleInputChange(category, e.target.value)}
                                        className="w-full bg-[#1e293b] border border-slate-600 rounded-lg py-2 pl-7 pr-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                Save All Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
