import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import KPIBanner from './components/KPIBanner';
import FilterBar from './components/FilterBar';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import TransactionEditModal from './components/TransactionEditModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import GroupManager from './components/GroupManager';
import AnalyticsView from './components/AnalyticsView';
import OfflineSyncBanner from './components/OfflineSyncBanner';
import { api } from './services/api';
import { getSyncQueue } from './db/indexdb';

export default function App() {
  const [activeTab, setActiveTab] = useState('expenses');
  const [transactions, setTransactions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [storageMode, setStorageMode] = useState('google_sheets');

  // Network & Sync state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // PWA beforeinstallprompt handler
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]); // array of category IDs (empty = all)
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Update pending sync count
  const checkPendingQueue = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setPendingSyncCount(queue.length);
    } catch (e) {
      console.warn('Queue check error:', e);
    }
  }, []);

  // Fetch all data from backend (Google Sheets as single source of truth)
  const loadData = useCallback(async (showSpin = true) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const data = await api.getData();
      setTransactions(data.transactions || []);
      setGroups(data.groups || []);
      setAllGroups(data.all_groups || []);
      setCustomCategories(data.categories || []);
      setStorageMode(data.storage_mode || 'google_sheets');
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      if (showSpin) setIsRefreshing(false);
      checkPendingQueue();
    }
  }, [checkPendingQueue]);

  // Synchronize pending offline transactions
  const handleSyncNow = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      await api.syncPendingChanges();
      await loadData(false);
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setIsSyncing(false);
      checkPendingQueue();
    }
  }, [isSyncing, loadData, checkPendingQueue]);

  // Online / Offline & PWA listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSyncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Chrome PWA install prompt capture
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    loadData(false);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [handleSyncNow, loadData]);

  // Trigger Chrome PWA install prompt
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Transaction handlers
  const handleSaveTransaction = async (txData) => {
    const res = await api.createTransaction(txData);
    if (res.transaction) {
      setTransactions((prev) => [res.transaction, ...prev]);
    }
    checkPendingQueue();
  };

  const handleUpdateTransaction = async (id, updates) => {
    const res = await api.updateTransaction(id, updates);
    if (res.transaction) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    }
    setEditingTransaction(null);
    checkPendingQueue();
  };

  const handleDeleteTransaction = async (id) => {
    setIsDeleting(true);
    try {
      await api.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setDeletingTransaction(null);
    } catch (err) {
      alert('Failed to delete transaction: ' + err.message);
    } finally {
      setIsDeleting(false);
      checkPendingQueue();
    }
  };

  // Group handlers
  const handleCreateGroup = async (groupName) => {
    const res = await api.createGroup(groupName);
    if (res.group) {
      setGroups((prev) => [...prev, res.group]);
      setAllGroups((prev) => [...prev, res.group]);
    }
    checkPendingQueue();
  };

  const handleArchiveGroup = async (groupId) => {
    await api.archiveGroup(groupId);
    setGroups((prev) => prev.filter((g) => g.group_id !== groupId));
    setAllGroups((prev) =>
      prev.map((g) => (g.group_id === groupId ? { ...g, status: 'archived' } : g))
    );
    checkPendingQueue();
  };

  // Custom Category handler (persisted directly to Google Sheets Categories tab)
  const handleCreateCategory = async (catData) => {
    const res = await api.createCategory(catData);
    if (res.category) {
      setCustomCategories((prev) => [...prev, res.category]);
    }
  };

  const handleSelectGroupFilter = (groupId) => {
    setSelectedGroup(groupId);
    setActiveTab('expenses');
  };

  const handleSelectCategoryFilter = (catId) => {
    setSelectedCategories([catId]);
    setActiveTab('expenses');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedPaymentMode('ALL');
    setSelectedGroup('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Historical unique descriptions for smart suggestions
  const historicalDescriptions = useMemo(() => {
    return transactions.map((t) => t.description).filter(Boolean);
  }, [transactions]);

  // Filtered transactions computation (dynamically used by Expenses feed and Analytics)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const descMatch = (t.description || '').toLowerCase().includes(query);
        const catMatch = (t.category || '').toLowerCase().includes(query);
        if (!descMatch && !catMatch) return false;
      }

      // 2. Multi-Category Filter
      if (selectedCategories && selectedCategories.length > 0) {
        if (!selectedCategories.includes(t.category)) {
          return false;
        }
      }

      // 3. Payment Mode
      if (selectedPaymentMode !== 'ALL' && t.payment_mode !== selectedPaymentMode) {
        return false;
      }

      // 4. Group
      if (selectedGroup !== 'ALL') {
        if (selectedGroup === 'NONE') {
          if (t.group_id) return false;
        } else if (t.group_id !== selectedGroup) {
          return false;
        }
      }

      // 5. Google Flights 2-Handle Date Range Filter (YYYY-MM-DD string comparison)
      if (t.date) {
        const txDate = t.date.split('T')[0].split(' ')[0];
        if (startDate && txDate < startDate) {
          return false;
        }
        if (endDate && txDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, selectedCategories, selectedPaymentMode, selectedGroup, startDate, endDate]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col pb-24 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header Navbar */}
      <Navbar
        isOnline={isOnline}
        storageMode={storageMode}
        pendingSyncCount={pendingSyncCount}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        deferredPrompt={deferredPrompt}
        onInstallApp={handleInstallApp}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-lg sm:max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Offline / Pending Sync Alert Banner */}
        <OfflineSyncBanner
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          onSyncNow={handleSyncNow}
          isSyncing={isSyncing}
        />

        {/* Tab 1: Expenses Feed */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* KPI Cards Banner */}
            <KPIBanner transactions={filteredTransactions} />

            {/* Filter & Search Bar with Google Flights 2-handle picker & multi-category selector */}
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
              onDateRangeChange={handleDateRangeChange}
              groups={groups}
              customCategories={customCategories}
              onResetFilters={handleResetFilters}
            />

            {/* Transaction List */}
            <TransactionList
              transactions={filteredTransactions}
              groups={groups}
              customCategories={customCategories}
              onEdit={(tx) => setEditingTransaction(tx)}
              onDelete={(tx) => setDeletingTransaction(tx)}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Analytics & Visual Summaries (Dynamically reactive to filters) */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-200">
            <AnalyticsView
              transactions={filteredTransactions}
              groups={groups}
              customCategories={customCategories}
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
              onDateRangeChange={handleDateRangeChange}
              onResetFilters={handleResetFilters}
            />
          </div>
        )}

        {/* Tab 3: Manage (Occasions & Categories) */}
        {activeTab === 'manage' && (
          <div className="animate-in fade-in duration-200">
            <GroupManager
              groups={groups}
              allGroups={allGroups}
              transactions={transactions}
              customCategories={customCategories}
              onCreateGroup={handleCreateGroup}
              onArchiveGroup={handleArchiveGroup}
              onCreateCategory={handleCreateCategory}
              onSelectGroupFilter={handleSelectGroupFilter}
              onSelectCategoryFilter={handleSelectCategoryFilter}
            />
          </div>
        )}
      </main>

      {/* Transaction Entry Drawer / Modal */}
      {isAddModalOpen && (
        <TransactionForm
          groups={groups}
          customCategories={customCategories}
          historicalDescriptions={historicalDescriptions}
          onSave={handleSaveTransaction}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Transaction Inline Edit Modal */}
      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          groups={groups}
          customCategories={customCategories}
          historicalDescriptions={historicalDescriptions}
          onSave={handleUpdateTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <DeleteConfirmModal
          transaction={deletingTransaction}
          onConfirm={handleDeleteTransaction}
          onClose={() => setDeletingTransaction(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />
    </div>
  );
}
