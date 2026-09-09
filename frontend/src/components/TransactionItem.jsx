import React from 'react';
import {
  Utensils, Plane, Zap, ShoppingBag, HeartPulse, Film, Apple, Briefcase,
  CircleEllipsis, Edit3, Trash2, CloudOff, Users
} from 'lucide-react';
import { CATEGORIES, PAYMENT_MODES, getCategoryConfig } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

const ICON_MAP = {
  Utensils,
  Plane,
  Zap,
  ShoppingBag,
  HeartPulse,
  Film,
  Apple,
  Briefcase,
  CircleEllipsis
};

export default function TransactionItem({ transaction, groups = [], customCategories = [], onEdit, onDelete }) {
  const categoryConfig = getCategoryConfig(transaction.category, customCategories);
  const IconComponent = ICON_MAP[categoryConfig.icon] || CircleEllipsis;
  const paymentConfig = PAYMENT_MODES.find(p => p.id === transaction.payment_mode) || PAYMENT_MODES[0];
  const group = groups.find(g => g.group_id === transaction.group_id);

  return (
    <div className="glass-card glass-card-hover p-3.5 rounded-2xl border-slate-800/80 flex items-center justify-between group">
      {/* Left Icon & Details */}
      <div className="flex items-center space-x-3 min-w-0">
        {/* Category Icon with Custom Color */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: categoryConfig.bg, color: categoryConfig.color }}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Text Details */}
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px] sm:max-w-[220px]">
              {transaction.description}
            </h4>
            {transaction._is_pending_sync && (
              <span className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-medium" title="Saved offline; will sync automatically when online">
                <CloudOff className="w-2.5 h-2.5 inline" />
                <span className="hidden xs:inline">Pending</span>
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
            <span
              className="px-1.5 py-0.5 rounded-md font-medium"
              style={{ backgroundColor: categoryConfig.bg, color: categoryConfig.text }}
            >
              {transaction.category}
            </span>

            <span className={`px-1.5 py-0.5 rounded-md font-medium border ${paymentConfig.badge}`}>
              {transaction.payment_mode}
            </span>

            {group && (
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-medium flex items-center space-x-0.5">
                <Users className="w-2.5 h-2.5 mr-0.5" />
                <span className="truncate max-w-[80px]">{group.group_name}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Amount & Action Buttons */}
      <div className="flex items-center space-x-2 pl-2 flex-shrink-0">
        <div className="text-right">
          <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            {formatCurrency(transaction.amount)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/90 transition active:scale-95"
            title="Edit expense"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/90 transition active:scale-95"
            title="Delete expense"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
