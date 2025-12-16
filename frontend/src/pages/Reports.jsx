import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API from '../api';

export default function Reports() {
    const [activeTab, setActiveTab] = useState('This Month');
    const [transactions, setTransactions] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [totalSpending, setTotalSpending] = useState(0);
    const [budgets, setBudgets] = useState([]);
    const [budgetStatus, setBudgetStatus] = useState([]);

    const COLORS = ['#10b981', '#f59e0b', '#0ea5e9', '#6366f1', '#3b82f6', '#64748b'];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (transactions.length > 0 || budgets.length > 0) {
            processData(transactions, budgets);
        }
    }, [activeTab, transactions, budgets]);

    const fetchData = async () => {
        try {
            const [txRes, budgetRes] = await Promise.all([
                API.get('/transactions'),
                API.get('/budgets')
            ]);

            setTransactions(txRes.data);
            setBudgets(budgetRes.data);
            // processData call moved to useEffect to react to activeTab changes
        } catch (error) {
            console.error("Failed to fetch report data", error);
        }
    };

    const processData = (txs, budgetList) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const filteredTxs = txs.filter(tx => {
            const txDate = new Date(tx.date);
            const txMonth = txDate.getMonth();
            const txYear = txDate.getFullYear();

            if (activeTab === 'This Month') {
                return txMonth === currentMonth && txYear === currentYear;
            } else if (activeTab === 'Last 3 Months') {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(now.getMonth() - 3);
                return txDate >= threeMonthsAgo && txDate <= now;
            } else if (activeTab === 'This Year') {
                return txYear === currentYear;
            } else if (activeTab === 'Last Year') {
                return txYear === currentYear - 1;
            }
            return true;
        });

        let spending = 0;
        const catMap = {}; // Total spending per category

        filteredTxs.forEach(tx => {
            if (tx.type === 'expense') {
                const amt = Number(tx.amount);
                spending += amt;
                if (catMap[tx.category]) {
                    catMap[tx.category] += amt;
                } else {
                    catMap[tx.category] = amt;
                }
            }
        });

        setTotalSpending(spending);

        // Prepare Donut Chart Data
        const catData = Object.keys(catMap).map((cat, index) => ({
            name: cat,
            value: catMap[cat],
            color: COLORS[index % COLORS.length]
        }));
        setCategoryData(catData);

        // Prepare Budget Adherence Data
        // budgetList = [{ category: 'Groceries', amount: 5000 }, ...]
        const budgetAdherence = budgetList.map(b => {
            const current = catMap[b.category] || 0;
            const max = b.amount;
            const percentage = Math.min((current / max) * 100, 100);

            let status = "On Track";
            let color = "bg-green-500";
            let textColor = "text-green-500";

            if (percentage >= 100) {
                status = "Over Budget";
                color = "bg-red-500";
                textColor = "text-red-500";
            } else if (percentage > 80) {
                status = "Nearing Limit";
                color = "bg-amber-500";
                textColor = "text-amber-500";
            } else {
                status = "Under Budget";
            }

            return {
                name: b.category,
                current,
                max,
                percentage,
                status,
                color,
                textColor
            };
        });

        setBudgetStatus(budgetAdherence);
    };

    // Dummy Trend Data - In a real app, aggregation by month from txs date
    const trendData = [
        { name: 'Jan', value: 2400 },
        { name: 'Feb', value: 3800 },
        { name: 'Mar', value: 3200 },
        { name: 'Apr', value: 4500 },
        { name: 'May', value: 2100 },
        { name: 'Jun', value: 5800 },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Reports & Analytics</h1>
                <p className="text-slate-400 mt-1">View your spending habits and financial health.</p>
            </div>

            {/* Time Filters */}
            <div className="flex gap-2 bg-[#121b2e] p-1 rounded-xl w-fit border border-slate-800">
                {['This Month', 'Last 3 Months', 'This Year', 'Last Year'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
                <button className="px-4 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2">
                    Custom Range <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Spending by Category (Donut Chart) */}
                <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white">Spending by Category</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold text-white">₹{totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <span className="text-sm font-medium text-green-500 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                +5.2%
                            </span>
                            <span className="text-xs text-slate-500 ml-1">vs. last month</span>
                        </div>
                    </div>

                    <div className="h-64 min-h-[300px] flex flex-col sm:flex-row items-center justify-center gap-8">
                        {/* Chart */}
                        <div className="w-48 h-48 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-white">{categoryData.length}</span>
                                <span className="text-xs text-slate-500">Categories</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {categoryData.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs font-medium text-slate-300">{item.name} ({totalSpending > 0 ? Math.round((item.value / totalSpending) * 100) : 0}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Spending Trend (Area Chart) */}
                <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white">Spending Trend</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold text-white">₹5,800.00</span>
                            <span className="text-sm font-medium text-red-500 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                -1.8%
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Last 3 Months</p>
                    </div>

                    <div className="h-64 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                                <XAxis dataKey="name" hide={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Budget Adherence */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Budget Adherence</h2>
                <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {budgetStatus.length > 0 ? (
                        budgetStatus.map((budget, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-slate-200">{budget.name}</span>
                                    <div className="text-slate-400">
                                        <span className="text-white font-bold">₹{budget.current}</span>
                                        <span className="opacity-70"> / ₹{budget.max}</span>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="h-3 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${budget.percentage}%` }}
                                        className={`h-full rounded-full transition-all duration-500 ${budget.color}`}
                                    ></div>
                                </div>
                                <p className={`text-xs ${budget.textColor} font-medium`}>{budget.status}</p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-slate-400">
                            No budgets set. Go to the <a href="/dashboard/budgets" className="text-primary-500 hover:underline">Budgets page</a> to set them up!
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
