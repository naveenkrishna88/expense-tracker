import React from 'react';
import { IndianRupee, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function KPIBanner({ transactions }) {
  // Current month calculation
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTx = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date.replace(' ', 'T'));
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalMonthlySpend = currentMonthTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const currentDay = Math.max(1, now.getDate());
  const dailyAverage = totalMonthlySpend / currentDay;

  // Top payment method in current month
  const paymentCounts = {};
  currentMonthTx.forEach(t => {
    const mode = t.payment_mode || 'UPI';
    paymentCounts[mode] = (paymentCounts[mode] || 0) + (Number(t.amount) || 0);
  });
  let topPayment = 'None';
  let topPaymentAmount = 0;
  Object.entries(paymentCounts).forEach(([mode, amt]) => {
    if (amt > topPaymentAmount) {
      topPaymentAmount = amt;
      topPayment = mode;
    }
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Monthly Total */}
      <div className="glass-card p-3.5 rounded-2xl border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">This Month</span>
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-white tracking-tight">
          {formatCurrency(totalMonthlySpend)}
        </div>
        <span className="text-[10px] text-emerald-400 font-medium">
          {currentMonthTx.length} expenses
        </span>
      </div>

      {/* Daily Average */}
      <div className="glass-card p-3.5 rounded-2xl border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Daily Avg</span>
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-white tracking-tight">
          {formatCurrency(dailyAverage)}
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          Day {currentDay} of {new Date(currentYear, currentMonth + 1, 0).getDate()}
        </span>
      </div>

      {/* Top Payment Mode */}
      <div className="glass-card p-3.5 rounded-2xl border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Top Method</span>
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-lg font-bold text-white tracking-tight truncate">
          {topPayment}
        </div>
        <span className="text-[10px] text-slate-400 font-medium truncate block">
          {topPaymentAmount > 0 ? formatCurrency(topPaymentAmount) : 'No data'}
        </span>
      </div>

      {/* All Time Transactions */}
      <div className="glass-card p-3.5 rounded-2xl border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">All-Time</span>
          <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-white tracking-tight">
          {formatCurrency(transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0))}
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          {transactions.length} total logged
        </span>
      </div>
    </div>
  );
}
