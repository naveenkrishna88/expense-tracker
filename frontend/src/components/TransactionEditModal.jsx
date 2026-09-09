import React, { useState } from 'react';
import { X, Check, Calendar, Users } from 'lucide-react';
import { PAYMENT_MODES, getMergedCategories } from '../utils/constants';
import DescriptionInput from './DescriptionInput';

export default function TransactionEditModal({
  transaction,
  groups = [],
  customCategories = [],
  historicalDescriptions = [],
  onSave,
  onClose
}) {
  const allCategories = getMergedCategories(customCategories);
  const [amount, setAmount] = useState(String(transaction.amount || ''));
  const [description, setDescription] = useState(transaction.description || '');
  const [date, setDate] = useState(() => {
    if (transaction.date) {
      return transaction.date.split('T')[0].split(' ')[0];
    }
    return '';
  });
  const [category, setCategory] = useState(transaction.category || allCategories[0]?.id || 'Food');
  const [paymentMode, setPaymentMode] = useState(transaction.payment_mode || 'UPI');
  const [groupId, setGroupId] = useState(transaction.group_id || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      setError('Description cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = date ? date.split('T')[0].split(' ')[0] : transaction.date;
      await onSave(transaction.id, {
        amount: numAmount,
        description: description.trim(),
        date: formattedDate,
        category,
        payment_mode: paymentMode,
        group_id: groupId || ''
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-white">Edit Expense</h2>
            <p className="text-xs text-slate-400">Update transaction details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-all">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-bold">
                ₹
              </div>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent pl-9 pr-4 py-2.5 text-lg font-bold text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Description with Smart Suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <DescriptionInput
              value={description}
              onChange={setDescription}
              historicalDescriptions={historicalDescriptions}
              placeholder="Expense description..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {allCategories.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.label || c.id}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Payment Mode
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_MODES.map((pm) => {
                const isSelected = paymentMode === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMode(pm.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300'
                    }`}
                  >
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Occasion / Group
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="" className="bg-slate-900 text-slate-400">Personal / No Group</option>
              {groups.map((g) => (
                <option key={g.group_id} value={g.group_id} className="bg-slate-900">
                  {g.group_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-bold shadow-glow-emerald flex items-center justify-center space-x-1 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Update'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
