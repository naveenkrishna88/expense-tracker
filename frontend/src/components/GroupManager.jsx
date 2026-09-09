import React, { useState } from 'react';
import { Users, Plus, Archive, ArrowRight, Tag, Check, Palette, Layers, FolderArchive } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { CATEGORY_COLOR_PALETTE, getMergedCategories } from '../utils/constants';

export default function GroupManager({
  groups = [],
  allGroups = [],
  transactions = [],
  customCategories = [],
  onCreateGroup,
  onArchiveGroup,
  onCreateCategory,
  onSelectGroupFilter,
  onSelectCategoryFilter
}) {
  // Segmented Sub-Tab Switch: 'occasions' vs 'categories'
  const [subTab, setSubTab] = useState('categories');

  // Occasions State
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivingId, setArchivingId] = useState(null);

  // Category Creation State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLOR_PALETTE[0]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categorySuccessMsg, setCategorySuccessMsg] = useState('');

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setIsCreatingGroup(true);
    try {
      await onCreateGroup(newGroupName.trim());
      setNewGroupName('');
    } catch (err) {
      alert('Failed to create occasion group: ' + err.message);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    setCategorySuccessMsg('');
    try {
      await onCreateCategory({
        category_name: newCategoryName.trim(),
        color: selectedColor,
        icon: 'Tag'
      });
      setCategorySuccessMsg(`Category "${newCategoryName.trim()}" saved to Google Sheet!`);
      setNewCategoryName('');
      setTimeout(() => setCategorySuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to create category: ' + err.message);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleArchive = async (groupId) => {
    if (!confirm('Are you sure you want to archive this occasion? It will be hidden from new expense selections.')) {
      return;
    }
    setArchivingId(groupId);
    try {
      await onArchiveGroup(groupId);
    } catch (err) {
      alert('Failed to archive group: ' + err.message);
    } finally {
      setArchivingId(null);
    }
  };

  // Group Stats
  const getGroupStats = (groupId) => {
    const groupTx = transactions.filter(t => t.group_id === groupId);
    const total = groupTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const catMap = {};
    groupTx.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + (Number(t.amount) || 0);
    });

    const categories = Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return { total, count: groupTx.length, categories };
  };

  // Category Stats
  const allCategories = getMergedCategories(customCategories);
  const getCategoryStats = (catId) => {
    const catTx = transactions.filter(t => t.category === catId);
    const total = catTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    return { count: catTx.length, total };
  };

  const activeGroups = groups || [];
  const archivedGroups = (allGroups || []).filter(g => g.status === 'archived');

  return (
    <div className="space-y-4">
      {/* Top Segmented Sub-Tab Switch */}
      <div className="flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800/80">
        <button
          type="button"
          onClick={() => setSubTab('categories')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            subTab === 'categories'
              ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Categories ({allCategories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('occasions')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            subTab === 'occasions'
              ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Occasions & Trips ({activeGroups.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: CATEGORIES MANAGEMENT */}
      {/* ============================================================== */}
      {subTab === 'categories' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Create Category Card */}
          <div className="glass-card p-5 rounded-3xl border-slate-800/80">
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Create Custom Category</h2>
                <p className="text-xs text-slate-400">Saved directly to your Google Sheet Categories tab</p>
              </div>
            </div>

            {categorySuccessMsg && (
              <div className="my-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5">
                <Check className="w-4 h-4" />
                <span>{categorySuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Fitness, Investment, Pets, Courses"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Color Palette Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  {CATEGORY_COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        selectedColor === c ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {selectedColor === c && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingCategory || !newCategoryName.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-glow-emerald flex items-center justify-center space-x-1.5 transition disabled:opacity-50 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{isCreatingCategory ? 'Adding to Sheet...' : 'Add Category'}</span>
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                All Available Categories ({allCategories.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allCategories.map((cat) => {
                const stats = getCategoryStats(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="glass-card p-3 rounded-2xl border-slate-800/80 flex items-center justify-between group hover:border-slate-700 transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: cat.bg || `${cat.color}25`, color: cat.color }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs font-bold text-white truncate">{cat.label || cat.id}</h4>
                          {cat.isCustom && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 text-[9px] font-semibold border border-emerald-500/30">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {stats.count} expenses • {formatCurrency(stats.total)}
                        </p>
                      </div>
                    </div>

                    {onSelectCategoryFilter && (
                      <button
                        type="button"
                        onClick={() => onSelectCategoryFilter(cat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                        title="Filter transactions by this category"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: OCCASIONS & TRIPS MANAGEMENT */}
      {/* ============================================================== */}
      {subTab === 'occasions' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header & Create Group Card */}
          <div className="glass-card p-5 rounded-3xl border-slate-800/80">
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Occasion & Trip Groups</h2>
                <p className="text-xs text-slate-400">Track special events separately (e.g. Goa Trip, Renovation)</p>
              </div>
            </div>

            <form onSubmit={handleCreateGroup} className="flex space-x-2 mt-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New occasion name (e.g., Goa Vacation)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={isCreatingGroup || !newGroupName.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-glow-indigo flex items-center space-x-1.5 transition disabled:opacity-50 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingGroup ? 'Adding...' : 'Create'}</span>
              </button>
            </form>
          </div>

          {/* Active Groups List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Occasions ({activeGroups.length})
              </h3>
              {archivedGroups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowArchived(!showArchived)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {showArchived ? 'Hide Archived' : `Show Archived (${archivedGroups.length})`}
                </button>
              )}
            </div>

            {activeGroups.length === 0 ? (
              <div className="glass-card p-6 rounded-2xl text-center border-slate-800/60">
                <p className="text-xs text-slate-400">No active occasion groups. Create one above to track a trip or event!</p>
              </div>
            ) : (
              activeGroups.map((grp) => {
                const stats = getGroupStats(grp.group_id);
                return (
                  <div
                    key={grp.group_id}
                    className="glass-card p-4 rounded-2xl border-slate-800/80 space-y-3 hover:border-slate-700/80 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{grp.group_name}</h4>
                        <p className="text-[11px] text-slate-400">{stats.count} expenses logged</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-400">
                          {formatCurrency(stats.total)}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => onSelectGroupFilter(grp.group_id)}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition"
                      >
                        <span>View Transactions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleArchive(grp.group_id)}
                        disabled={archivingId === grp.group_id}
                        className="p-1.5 text-xs text-slate-400 hover:text-amber-400 transition flex items-center space-x-1"
                        title="Archive this group"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Archive</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Archived Groups Section */}
          {showArchived && archivedGroups.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Archived Occasions ({archivedGroups.length})</span>
              </h3>

              <div className="space-y-2">
                {archivedGroups.map((grp) => {
                  const stats = getGroupStats(grp.group_id);
                  return (
                    <div
                      key={grp.group_id}
                      className="glass-card p-3 rounded-xl border-slate-800/50 opacity-70 flex items-center justify-between"
                    >
                      <div>
                        <h5 className="text-xs font-semibold text-slate-300">{grp.group_name}</h5>
                        <p className="text-[10px] text-slate-500">{stats.count} expenses</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-400">{formatCurrency(stats.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
