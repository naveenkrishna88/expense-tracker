import React from 'react';
import { PlusCircle, ReceiptText, Sparkles } from 'lucide-react';
import TransactionItem from './TransactionItem';
import { formatDateLabel, formatCurrency } from '../utils/formatters';

export default function TransactionList({
  transactions,
  groups = [],
  customCategories = [],
  onEdit,
  onDelete,
  onOpenAddModal
}) {
  if (transactions.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center border-slate-800/80 my-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <ReceiptText className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No expenses found</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
          Log your first expense or adjust your search and filters to see transactions.
        </p>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-glow-emerald transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>
    );
  }

  // Group transactions by date label
  const grouped = {};
  transactions.forEach((tx) => {
    const rawDate = tx.date ? tx.date.split(' ')[0] : 'Unknown';
    const label = formatDateLabel(tx.date);
    if (!grouped[rawDate]) {
      grouped[rawDate] = { label, items: [], total: 0 };
    }
    grouped[rawDate].items.push(tx);
    grouped[rawDate].total += Number(tx.amount) || 0;
  });

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([dateKey, groupData]) => (
        <div key={dateKey} className="space-y-2">
          {/* Section Date Header */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              {groupData.label}
            </span>
            <span className="font-semibold text-slate-400 text-[11px]">
              {formatCurrency(groupData.total)}
            </span>
          </div>

          {/* Transaction items */}
          <div className="space-y-2">
            {groupData.items.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                groups={groups}
                customCategories={customCategories}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
