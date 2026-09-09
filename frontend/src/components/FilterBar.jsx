import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Calendar, Tag, CreditCard, Users, Check, ChevronDown } from 'lucide-react';
import { PAYMENT_MODES, getMergedCategories } from '../utils/constants';
import DateRangePickerModal from './DateRangePickerModal';

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedCategories = [],
  setSelectedCategories,
  selectedPaymentMode,
  setSelectedPaymentMode,
  selectedGroup,
  setSelectedGroup,
  startDate,
  endDate,
  onDateRangeChange,
  groups = [],
  customCategories = [],
  onResetFilters
}) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const allCategories = getMergedCategories(customCategories);

  // Toggle category in multi-select
  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const selectAllCategories = () => {
    setSelectedCategories(allCategories.map(c => c.id));
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const hasDateFilter = Boolean(startDate || endDate);
  const hasCategoryFilter = selectedCategories && selectedCategories.length > 0;
  const hasPaymentFilter = selectedPaymentMode !== 'ALL';
  const hasGroupFilter = selectedGroup !== 'ALL';
  const hasActiveFilters = searchQuery || hasCategoryFilter || hasPaymentFilter || hasGroupFilter || hasDateFilter;

  // Format date range button label
  const dateRangeLabel = () => {
    if (!startDate && !endDate) return '📅 All Dates';
    if (startDate && endDate) {
      if (startDate === endDate) return `📅 ${startDate}`;
      return `📅 ${startDate.slice(5)} to ${endDate.slice(5)}`;
    }
    if (startDate) return `📅 From ${startDate.slice(5)}`;
    return `📅 Until ${endDate.slice(5)}`;
  };

  // Format category button label
  const categoryFilterLabel = () => {
    if (!selectedCategories || selectedCategories.length === 0) return '🏷️ All Categories';
    if (selectedCategories.length === 1) return `🏷️ ${selectedCategories[0]}`;
    return `🏷️ ${selectedCategories.length} Categories`;
  };

  return (
    <div className="space-y-2.5">
      {/* Search Input */}
      <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800/90 focus-within:border-emerald-500/80 transition-all">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by description or notes..."
          className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Scroll Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {/* Google Flights 2-Handle Date Range Button */}
        <button
          type="button"
          onClick={() => setIsDatePickerOpen(true)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1.5 cursor-pointer transition ${
            hasDateFilter
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span>{dateRangeLabel()}</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>

        {/* Multi-Category Selector Button */}
        <button
          type="button"
          onClick={() => setIsCategoryModalOpen(true)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1.5 cursor-pointer transition ${
            hasCategoryFilter
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span>{categoryFilterLabel()}</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>

        {/* Payment Mode Filter */}
        <div className="flex-shrink-0 relative">
          <select
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border appearance-none pr-7 text-xs font-medium cursor-pointer transition ${
              selectedPaymentMode !== 'ALL'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <option value="ALL" className="bg-slate-900 text-white">💳 All Payment</option>
            {PAYMENT_MODES.map((pm) => (
              <option key={pm.id} value={pm.id} className="bg-slate-900 text-white">
                {pm.label}
              </option>
            ))}
          </select>
          <span className="absolute right-2.5 top-2 pointer-events-none text-slate-500 text-[10px]">▾</span>
        </div>

        {/* Group Filter */}
        <div className="flex-shrink-0 relative">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border appearance-none pr-7 text-xs font-medium cursor-pointer transition ${
              selectedGroup !== 'ALL'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <option value="ALL" className="bg-slate-900 text-white">👥 All Groups</option>
            <option value="NONE" className="bg-slate-900 text-white">👤 Personal Only</option>
            {groups.map((g) => (
              <option key={g.group_id} value={g.group_id} className="bg-slate-900 text-white">
                {g.group_name}
              </option>
            ))}
          </select>
          <span className="absolute right-2.5 top-2 pointer-events-none text-slate-500 text-[10px]">▾</span>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex-shrink-0 px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-1 hover:bg-rose-500/25 transition"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Date Range Picker Modal (Google Flights Style) */}
      {isDatePickerOpen && (
        <DateRangePickerModal
          startDate={startDate}
          endDate={endDate}
          onApply={(s, e) => onDateRangeChange(s, e)}
          onClose={() => setIsDatePickerOpen(false)}
        />
      )}

      {/* Multi-Category Selector Modal / Drawer */}
      {isCategoryModalOpen && (
        typeof document !== 'undefined' ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
            style={{ zIndex: 9999 }}
          >
            <div className="w-full max-w-sm bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-[10000]">
              <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Filter by Categories</h3>
                  <p className="text-[11px] text-slate-400">Select multiple categories to display</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selection Quick Actions */}
              <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={selectAllCategories}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearCategories}
                  className="text-slate-400 hover:text-white"
                >
                  Clear All
                </button>
              </div>

              {/* Category Checkbox Grid */}
              <div className="p-4 overflow-y-auto space-y-2">
                {allCategories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isChecked
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-semibold">{cat.label || cat.id}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-700 bg-slate-950'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Apply Action */}
              <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-glow-emerald flex items-center justify-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Apply Selection ({selectedCategories.length === 0 ? 'All' : selectedCategories.length})</span>
                </button>
              </div>
            </div>
          </div>,
          document.getElementById('modal-root') || document.body
        ) : null
      )}
    </div>
  );
}
