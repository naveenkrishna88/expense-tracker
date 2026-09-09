import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function DeleteConfirmModal({ transaction, onConfirm, onClose, isDeleting }) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0f172a] rounded-3xl border border-rose-500/30 shadow-2xl p-5 animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-white text-center mb-1">Delete Expense?</h3>
        <p className="text-xs text-slate-400 text-center mb-4">
          Are you sure you want to delete this expense? It will be marked as deleted in your Google Sheet.
        </p>

        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white truncate max-w-[180px]">
              {transaction.description}
            </p>
            <p className="text-[11px] text-slate-500">
              {transaction.category} • {transaction.payment_mode}
            </p>
          </div>
          <span className="text-sm font-extrabold text-rose-400">
            {formatCurrency(transaction.amount)}
          </span>
        </div>

        <div className="flex space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(transaction.id)}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1 shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
