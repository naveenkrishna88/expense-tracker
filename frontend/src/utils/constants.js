export const DEFAULT_CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', icon: 'Utensils', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c' },
  { id: 'Travel', label: 'Travel & Commute', icon: 'Plane', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8' },
  { id: 'Utilities', label: 'Bills & Utilities', icon: 'Zap', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', text: '#fde047' },
  { id: 'Shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6' },
  { id: 'Health', label: 'Health & Medical', icon: 'HeartPulse', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
  { id: 'Entertainment', label: 'Entertainment', icon: 'Film', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
  { id: 'Groceries', label: 'Groceries', icon: 'Apple', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
  { id: 'Work', label: 'Work & Tech', icon: 'Briefcase', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
  { id: 'Other', label: 'Other', icon: 'CircleEllipsis', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1' },
];

export const CATEGORIES = DEFAULT_CATEGORIES;

export const CATEGORY_COLOR_PALETTE = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // amber
  '#14b8a6', // teal
];

export function getMergedCategories(customCategories = []) {
  const merged = [...DEFAULT_CATEGORIES];
  (customCategories || []).forEach(cc => {
    const name = cc.category_name || cc.category_id;
    if (!name) return;
    const exists = merged.some(m => m.id.toLowerCase() === name.toLowerCase());
    if (!exists) {
      const color = cc.color || '#10b981';
      merged.push({
        id: name,
        label: name,
        icon: cc.icon || 'Tag',
        color,
        bg: `${color}25`,
        text: color,
        isCustom: true
      });
    }
  });
  return merged;
}

export function getCategoryConfig(catId, customCategories = []) {
  const all = getMergedCategories(customCategories);
  const found = all.find(c => c.id === catId || c.label === catId);
  if (found) return found;
  return {
    id: catId || 'Other',
    label: catId || 'Other',
    icon: 'Tag',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    text: '#cbd5e1'
  };
}

export const PAYMENT_MODES = [
  { id: 'UPI', label: 'UPI', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'Credit Card', label: 'Credit Card', badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: 'Debit Card', label: 'Debit Card', badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'Cash', label: 'Cash', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'Net Banking', label: 'Net Banking', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
];

export const AMOUNT_PRESETS = [100, 200, 500, 1000, 2000, 5000];
