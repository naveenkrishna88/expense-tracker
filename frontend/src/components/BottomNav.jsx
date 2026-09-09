import React from 'react';
import { Receipt, Plus, PieChart, SlidersHorizontal } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenAddModal }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe glass-nav px-4 py-2 border-t border-slate-800">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Expenses Tab */}
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center py-1 px-3 transition-colors ${
            activeTab === 'expenses' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-5 h-5 mb-1" />
          <span className="text-[11px]">Expenses</span>
        </button>

        {/* Center Floating Action Button (Add Expense) */}
        <div className="-mt-6">
          <button
            onClick={onOpenAddModal}
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-bold shadow-glow-emerald flex items-center justify-center transform active:scale-90 transition-transform hover:scale-105 border-4 border-[#090d16]"
            aria-label="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Analytics Tab */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center py-1 px-3 transition-colors ${
            activeTab === 'analytics' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-5 h-5 mb-1" />
          <span className="text-[11px]">Analytics</span>
        </button>

        {/* Manage Tab (Occasions & Categories) */}
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex flex-col items-center py-1 px-3 transition-colors ${
            activeTab === 'manage' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5 mb-1" />
          <span className="text-[11px]">Manage</span>
        </button>
      </div>
    </nav>
  );
}
