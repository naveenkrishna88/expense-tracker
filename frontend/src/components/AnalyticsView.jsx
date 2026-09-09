import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { PieChart, TrendingUp, CreditCard, Layers, Tag, Filter } from 'lucide-react';
import { PAYMENT_MODES, getMergedCategories, getCategoryConfig } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';
import FilterBar from './FilterBar';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function AnalyticsView({
  transactions = [],
  groups = [],
  customCategories = [],
  // Filter props passed from parent
  searchQuery,
  setSearchQuery,
  selectedCategories,
  setSelectedCategories,
  selectedPaymentMode,
  setSelectedPaymentMode,
  selectedGroup,
  setSelectedGroup,
  startDate,
  endDate,
  onDateRangeChange,
  onResetFilters
}) {
  // Common chart dark mode theme options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          boxWidth: 10,
          padding: 12,
          font: { size: 11, family: 'Plus Jakarta Sans' }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context) {
            const val = context.raw || 0;
            return ` ${context.label}: ${formatCurrency(val)}`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 11, family: 'Plus Jakarta Sans' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 10, family: 'Plus Jakarta Sans' },
          callback: function(value) {
            return '₹' + value;
          }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context) {
            return ` Spend: ${formatCurrency(context.raw)}`;
          }
        }
      }
    }
  };

  // 1. Category Spend Data (reacts dynamically to custom categories & active filters)
  const categoryChartData = useMemo(() => {
    const catTotals = {};
    transactions.forEach(t => {
      const cat = t.category || 'Other';
      catTotals[cat] = (catTotals[cat] || 0) + (Number(t.amount) || 0);
    });

    const labels = Object.keys(catTotals);
    const data = Object.values(catTotals);
    const backgroundColors = labels.map(l => {
      const config = getCategoryConfig(l, customCategories);
      return config.color || '#94a3b8';
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: '#090d16',
          borderWidth: 2,
        }
      ]
    };
  }, [transactions, customCategories]);

  // 2. Payment Mode Data
  const paymentChartData = useMemo(() => {
    const modeTotals = {};
    PAYMENT_MODES.forEach(pm => { modeTotals[pm.id] = 0; });
    transactions.forEach(t => {
      const mode = t.payment_mode || 'UPI';
      modeTotals[mode] = (modeTotals[mode] || 0) + (Number(t.amount) || 0);
    });

    const activeModes = Object.entries(modeTotals).filter(([_, val]) => val > 0);
    const labels = activeModes.map(([k]) => k);
    const data = activeModes.map(([_, v]) => v);
    const colors = ['#10b981', '#6366f1', '#06b6d4', '#f59e0b', '#a855f7', '#ec4899'];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#090d16',
          borderWidth: 2,
        }
      ]
    };
  }, [transactions]);

  // 3. Month-over-Month (MoM) Data
  const momChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthTotals = {};

    // Get last 6 months
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
      months.push({ key, year: d.getFullYear(), month: d.getMonth() });
      monthTotals[key] = 0;
    }

    transactions.forEach(t => {
      if (!t.date) return;
      const parts = t.date.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const key = `${monthNames[m]} '${String(y).slice(-2)}`;
        if (monthTotals[key] !== undefined) {
          monthTotals[key] += (Number(t.amount) || 0);
        }
      }
    });

    return {
      labels: months.map(m => m.key),
      datasets: [
        {
          label: 'Monthly Spend',
          data: months.map(m => monthTotals[m.key] || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderRadius: 8,
          hoverBackgroundColor: '#10b981'
        }
      ]
    };
  }, [transactions]);

  // 4. Group Spend Comparison
  const groupChartData = useMemo(() => {
    const groupTotals = {};
    const groupMap = {};
    groups.forEach(g => {
      groupMap[g.group_id] = g.group_name;
      groupTotals[g.group_name] = 0;
    });

    let personalTotal = 0;
    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.group_id && groupMap[t.group_id]) {
        groupTotals[groupMap[t.group_id]] += amt;
      } else {
        personalTotal += amt;
      }
    });

    const labels = ['Personal', ...Object.keys(groupTotals)];
    const data = [personalTotal, ...Object.values(groupTotals)];

    return {
      labels,
      datasets: [
        {
          label: 'Spend by Group',
          data,
          backgroundColor: [
            'rgba(99, 102, 241, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(236, 72, 153, 0.85)',
            'rgba(6, 182, 212, 0.85)'
          ],
          borderRadius: 8
        }
      ]
    };
  }, [transactions, groups]);

  const totalSpent = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Filter Bar Inside Analytics Tab */}
      {setSearchQuery && (
        <div className="glass-card p-3.5 rounded-3xl border-slate-800/80">
          <div className="flex items-center space-x-2 mb-2 px-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Filter Analytics Data
            </span>
          </div>
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedPaymentMode={selectedPaymentMode}
            setSelectedPaymentMode={setSelectedPaymentMode}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={onDateRangeChange}
            groups={groups}
            customCategories={customCategories}
            onResetFilters={onResetFilters}
          />
        </div>
      )}

      {/* Header Metric */}
      <div className="glass-card p-5 rounded-3xl border-slate-800/80">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Filtered Spend</span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              {formatCurrency(totalSpent)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Reflecting {transactions.length} matching transactions
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <PieChart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: 2 Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Distribution */}
        <div className="glass-card p-4 rounded-3xl border-slate-800/80">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Category Distribution
            </h3>
          </div>
          <div className="h-56 relative flex items-center justify-center">
            {transactions.length > 0 ? (
              <Doughnut data={categoryChartData} options={doughnutOptions} />
            ) : (
              <p className="text-xs text-slate-500">No data available for filters</p>
            )}
          </div>
        </div>

        {/* Payment Mode Distribution */}
        <div className="glass-card p-4 rounded-3xl border-slate-800/80">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Payment Mode Breakdown
            </h3>
          </div>
          <div className="h-56 relative flex items-center justify-center">
            {transactions.length > 0 ? (
              <Doughnut data={paymentChartData} options={doughnutOptions} />
            ) : (
              <p className="text-xs text-slate-500">No data available for filters</p>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart 1: Month-over-Month Trend */}
      <div className="glass-card p-4 rounded-3xl border-slate-800/80">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Monthly Spending Trend
          </h3>
        </div>
        <div className="h-52">
          <Bar data={momChartData} options={barOptions} />
        </div>
      </div>

      {/* Bar Chart 2: Group / Occasion Spend Comparison */}
      <div className="glass-card p-4 rounded-3xl border-slate-800/80">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Occasion / Group Comparison
          </h3>
        </div>
        <div className="h-52">
          <Bar data={groupChartData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}
