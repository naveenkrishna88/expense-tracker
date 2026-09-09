import React, { useState } from 'react';
import { X, Check, Plus, Tag, CreditCard, Calendar, Users, IndianRupee } from 'lucide-react';
import { PAYMENT_MODES, AMOUNT_PRESETS, getMergedCategories } from '../utils/constants';
import { getCurrentDateLocal, generateTimestampId } from '../utils/formatters';
import DescriptionInput from './DescriptionInput';

export default function TransactionForm({ groups = [], customCategories = [], historicalDescriptions = [], onSave, onClose }) {
  const allCategories = getMergedCategories(customCategories);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getCurrentDateLocal());
  const [category, setCategory] = useState(allCategories[0]?.id || 'Food');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPreset = (val) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for the expense.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Date in YYYY-MM-DD format (no timestamp)
      const formattedDate = (date || getCurrentDateLocal()).split('T')[0].split(' ')[0];
      await onSave({
        id: generateTimestampId(),
        amount: numAmount,
        description: description.trim(),
        date: formattedDate,
        category,
        payment_mode: paymentMode,
        group_id: groupId || ''
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity">
      <div className="w-full sm:max-w-lg bg-[#0f172a] rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Log Expense</h2>
              <p className="text-xs text-slate-400">Save to Google Sheets</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Amount Input with Currency Symbol */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Amount (₹) *
            </label>
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400 text-2xl font-bold">
                ₹
              </div>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent pl-11 pr-4 py-3 text-2xl font-extrabold text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            {/* Quick Amount Presets */}
            <div className="flex items-center space-x-2 mt-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Add:</span>
              {AMOUNT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleAddPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 whitespace-nowrap active:scale-95 transition"
                >
                  +{p}
                </button>
              ))}
            </div>
          </div>

          {/* Description with Smart Suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <DescriptionInput
              value={description}
              onChange={setDescription}
              historicalDescriptions={historicalDescriptions}
              placeholder="e.g., Grocery Shopping, Uber ride, Dinner"
            />
          </div>

          {/* Category Tag Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {allCategories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center space-x-2 p-2 rounded-xl text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-glow-emerald'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.label || cat.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Mode Selector */}
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold shadow-glow-emerald'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Occasion / Group (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Occasion / Group (Optional)
            </label>
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-all">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Users className="w-4 h-4" />
              </div>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full bg-transparent pl-10 pr-8 py-2.5 text-sm text-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-300">Personal / No Group</option>
                {groups.map((g) => (
                  <option key={g.group_id} value={g.group_id} className="bg-slate-900 text-white">
                    {g.group_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                ▾
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-all">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-glow-emerald flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Saving...' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
