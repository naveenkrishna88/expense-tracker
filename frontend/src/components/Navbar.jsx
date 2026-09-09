import React from 'react';
import { ShieldCheck, Cloud, Wifi, WifiOff, Download, RefreshCw, Layers } from 'lucide-react';

export default function Navbar({
  isOnline,
  storageMode,
  pendingSyncCount,
  onRefresh,
  isRefreshing,
  deferredPrompt,
  onInstallApp
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg border border-amber-500/30 flex items-center justify-center bg-white flex-shrink-0">
            <img
              src="/logo.png"
              alt="PT Selavugal Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-bold tracking-tight text-white">PT Selavugal</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
              {storageMode === 'google_sheets' ? (
                <span className="flex items-center text-emerald-400">
                  <Cloud className="w-3 h-3 mr-1 inline" /> Google Sheets Sync
                </span>
              ) : (
                <a
                  href="/api/auth/login"
                  className="flex items-center text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  title="Click to authenticate your Google Account via Web OAuth"
                >
                  <Layers className="w-3 h-3 mr-1 inline" /> Connect Google Account
                </a>
              )}
            </p>
          </div>
        </div>

        {/* Right Status Actions */}
        <div className="flex items-center space-x-2">
          {/* Chrome PWA Install Button (renders when available) */}
          {deferredPrompt && (
            <button
              onClick={onInstallApp}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold shadow-glow-emerald transition-all active:scale-95"
              title="Install PT Selavugal as Chrome PWA"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Network Connection Pill */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400'
              }`}
            />
            {isOnline ? (
              <span className="text-[11px] hidden xs:inline">Online</span>
            ) : (
              <span className="text-[11px]">Offline</span>
            )}
          </div>

          {/* Refresh Data Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition active:scale-90"
            title="Refresh from backend"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
