import React from 'react';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OfflineSyncBanner({ isOnline, pendingSyncCount, onSyncNow, isSyncing }) {
  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div className={`p-3 rounded-2xl flex items-center justify-between transition-all border ${
      !isOnline
        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
    }`}>
      <div className="flex items-center space-x-2.5">
        {!isOnline ? (
          <CloudOff className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        )}
        <div className="text-xs">
          {!isOnline ? (
            <span>
              <strong>You're Offline.</strong> Expenses will save to your device and sync when you reconnect.
            </span>
          ) : (
            <span>
              <strong>{pendingSyncCount} pending change{pendingSyncCount > 1 ? 's' : ''}</strong> waiting to sync to Google Sheets.
            </span>
          )}
        </div>
      </div>

      {isOnline && pendingSyncCount > 0 && (
        <button
          type="button"
          onClick={onSyncNow}
          disabled={isSyncing}
          className="ml-3 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-glow-emerald transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      )}
    </div>
  );
}
