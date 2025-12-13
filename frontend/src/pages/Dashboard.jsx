import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import API from '../api';
import TransactionModal from '../components/TransactionModal';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    savings: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get('/transactions');
      const txs = res.data;
      setTransactions(txs);
      calculateSummary(txs);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      setLoading(false);
    }
  };

  const calculateSummary = (txs) => {
    let income = 0;
    let expense = 0;
    // For chart: map category -> amount
    const expenseByCategory = {};

    txs.forEach(tx => {
      const amt = Number(tx.amount);
      if (tx.type === 'income') {
        income += amt;
      } else {
        // expense: commonly stored as positive number in DB but treated as outflow?

        expense += amt;

        // Group for chart
        if (expenseByCategory[tx.category]) {
          expenseByCategory[tx.category] += amt;
        } else {
          expenseByCategory[tx.category] = amt;
        }
      }
    });

    setSummary({
      income,
      expense,
      savings: income - expense
    });

    // Format for Recharts
    const data = Object.keys(expenseByCategory).map(cat => ({
      name: cat,
      amount: expenseByCategory[cat]
    }));

    setChartData(data);
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (data) => {
    try {
      await API.post('/transactions', data);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to save transaction", error);
      throw error; // Propagate to modal to specific error handling if needed
    }
  };

  // Icon helper
  const getIcon = (category) => {
    // Simple mapping or return a generic default
    // We can also switch on 'icon' field if backend provides it, 
    // but the schema didn't seem to have an 'icon' field, just 'category'.
    // We can map category names to icons.
    switch (category?.toLowerCase()) {
      case 'groceries': return 'cart';
      case 'transport': return 'train';
      case 'utilities': return 'bolt';
      case 'dining': return 'food';
      case 'income': return 'bill';
      default: return 'bill'; // default
    }
  };

  const renderIcon = (iconName) => {
    if (iconName === 'cart') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    if (iconName === 'bill') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    if (iconName === 'food') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
    if (iconName === 'train') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
    if (iconName === 'bolt') return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenModal('expense')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary-500/20"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            <span className="text-white">Add Expense</span>
          </button>
          <button
            onClick={() => handleOpenModal('income')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white border border-slate-700 rounded-lg font-medium transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            <span className="text-white">Add Income</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income */}
        <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1">Total Income</p>
            <h3 className="text-3xl font-bold text-white">₹{summary.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-green-500 text-sm font-medium mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              +0.0% vs last month
            </p>
          </div>
          <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-24 h-24 text-primary-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.38 0 2.66-.84 2.66-2.12 0-1.27-1.03-1.63-2.66-2.02-2.09-.52-4.07-1.02-4.07-3.2 0-1.8 1.46-2.9 3.09-3.35V4h2.67v1.9c1.7.38 2.94 1.5 2.98 3.29h-2c-.08-.94-1.05-1.55-2.27-1.55-1.25 0-2.31.78-2.31 1.76 0 1.25 1.13 1.63 2.76 2.02 2.22.51 3.98 1.09 3.98 3.25 0 1.83-1.4 2.94-3.13 3.42z" /></svg>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1">Total Expenses</p>
            <h3 className="text-3xl font-bold text-white">₹{summary.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-red-500 text-sm font-medium mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
              -0.0% vs last month
            </p>
          </div>
        </div>

        {/* Savings */}
        <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1">Net Savings</p>
            <h3 className="text-3xl font-bold text-white">₹{summary.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-green-500 text-sm font-medium mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              +0.0% vs last month
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Monthly Spending Breakdown</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={40}>
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={'#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#121b2e]/50 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            <Link to="/dashboard/transactions" className="text-primary-500 text-sm font-medium hover:text-primary-400">View All</Link>
          </div>
          <div className="space-y-5">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx._id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-slate-700/50 text-slate-400'}`}>
                    {renderIcon(getIcon(tx.category))}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{tx.description || tx.category}</p>
                    <p className="text-slate-500 text-xs">{tx.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-slate-500 text-xs">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className='text-center text-slate-500 py-4'>No recent transactions</div>
            )}
          </div>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}
