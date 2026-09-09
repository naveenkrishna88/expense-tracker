import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateString(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export default function DateRangePickerModal({
  startDate,
  endDate,
  onApply,
  onClose
}) {
  const initialDate = startDate ? new Date(startDate) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Two handles state: tempStart and tempEnd
  const [tempStart, setTempStart] = useState(startDate || '');
  const [tempEnd, setTempEnd] = useState(endDate || '');
  // Hover date for interactive preview
  const [hoverDate, setHoverDate] = useState(null);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Days in current view month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  // Calendar cells
  const calendarCells = useMemo(() => {
    const cells = [];
    // Blank cells before 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateString(viewYear, viewMonth, d);
      cells.push({
        day: d,
        dateStr,
        key: dateStr
      });
    }
    return cells;
  }, [viewYear, viewMonth, daysInMonth, firstDayOfWeek]);

  // Handle cell click (Google Flights 2-handle logic)
  const handleDateClick = (dateStr) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // 1st handle selected
      setTempStart(dateStr);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      // 2nd handle selected
      if (dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  // Quick preset shortcuts
  const applyPreset = (preset) => {
    const now = new Date();
    const todayStr = toDateString(now.getFullYear(), now.getMonth(), now.getDate());

    if (preset === 'TODAY') {
      setTempStart(todayStr);
      setTempEnd(todayStr);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    } else if (preset === 'LAST_7') {
      const d7 = new Date();
      d7.setDate(now.getDate() - 6);
      setTempStart(toDateString(d7.getFullYear(), d7.getMonth(), d7.getDate()));
      setTempEnd(todayStr);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    } else if (preset === 'THIS_MONTH') {
      const first = toDateString(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const last = toDateString(now.getFullYear(), now.getMonth(), lastDay);
      setTempStart(first);
      setTempEnd(last);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    } else if (preset === 'LAST_MONTH') {
      const prevM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const first = toDateString(prevM.getFullYear(), prevM.getMonth(), 1);
      const lastDay = new Date(prevM.getFullYear(), prevM.getMonth() + 1, 0).getDate();
      const last = toDateString(prevM.getFullYear(), prevM.getMonth(), lastDay);
      setTempStart(first);
      setTempEnd(last);
      setViewYear(prevM.getFullYear());
      setViewMonth(prevM.getMonth());
    } else if (preset === 'THIS_YEAR') {
      setTempStart(toDateString(now.getFullYear(), 0, 1));
      setTempEnd(toDateString(now.getFullYear(), 11, 31));
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    } else if (preset === 'ALL') {
      setTempStart('');
      setTempEnd('');
    }
  };

  // Calculate day count
  const dayCount = useMemo(() => {
    if (!tempStart || !tempEnd) return null;
    const s = new Date(tempStart);
    const e = new Date(tempEnd);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }, [tempStart, tempEnd]);

  // Determine effective range for styling (handles hover state when 1st date is chosen)
  const effectiveEnd = tempEnd || (hoverDate && hoverDate >= tempStart ? hoverDate : '');

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      style={{ zIndex: 9999 }}
    >
      <div className="w-full max-w-sm sm:max-w-md bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative z-[10000]">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Select Date Range</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Handles Visual Display */}
        <div className="p-3.5 bg-slate-950/70 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-2">
            {/* Start Handle Card */}
            <div className={`p-2.5 rounded-xl border text-center transition-all ${
              tempStart
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">Start Date</span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {tempStart ? formatShortDate(tempStart) : 'Tap date'}
              </span>
            </div>

            {/* End Handle Card */}
            <div className={`p-2.5 rounded-xl border text-center transition-all ${
              tempEnd
                ? 'bg-teal-500/10 border-teal-500/50 text-teal-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">End Date</span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {tempEnd ? formatShortDate(tempEnd) : (tempStart ? 'Tap 2nd date' : '—')}
              </span>
            </div>
          </div>

          {/* Duration Badge */}
          {dayCount && (
            <div className="mt-2 text-center">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
                {dayCount} {dayCount === 1 ? 'day' : 'days'} selected
              </span>
            </div>
          )}
        </div>

        {/* Quick Presets Bar */}
        <div className="px-3 pt-2.5 flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
          <button
            type="button"
            onClick={() => applyPreset('LAST_7')}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 whitespace-nowrap active:scale-95 transition"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => applyPreset('THIS_MONTH')}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 whitespace-nowrap active:scale-95 transition"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => applyPreset('LAST_MONTH')}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 whitespace-nowrap active:scale-95 transition"
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => applyPreset('THIS_YEAR')}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 whitespace-nowrap active:scale-95 transition"
          >
            This Year
          </button>
          <button
            type="button"
            onClick={() => applyPreset('ALL')}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 whitespace-nowrap active:scale-95 transition"
          >
            Clear
          </button>
        </div>

        {/* Month Navigation */}
        <div className="px-4 py-2 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-3">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center mb-1">
            {DAYS_OF_WEEK.map((dw) => (
              <span key={dw} className="text-[10px] font-semibold text-slate-500 uppercase">
                {dw}
              </span>
            ))}
          </div>

          {/* Days Matrix with 2-Handle Gradient Highlights */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarCells.map((cell) => {
              if (cell.empty) {
                return <div key={cell.key} className="h-9" />;
              }

              const isStart = cell.dateStr === tempStart;
              const isEnd = cell.dateStr === tempEnd;
              const isInRange =
                tempStart &&
                effectiveEnd &&
                cell.dateStr > tempStart &&
                cell.dateStr < effectiveEnd;

              return (
                <div
                  key={cell.key}
                  className={`h-9 flex items-center justify-center relative ${
                    isInRange ? 'bg-emerald-500/20 text-emerald-200' : ''
                  } ${
                    isStart && effectiveEnd ? 'rounded-l-xl bg-emerald-500/20' : ''
                  } ${
                    isEnd ? 'rounded-r-xl bg-emerald-500/20' : ''
                  }`}
                  onMouseEnter={() => setHoverDate(cell.dateStr)}
                >
                  <button
                    type="button"
                    onClick={() => handleDateClick(cell.dateStr)}
                    className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                      isStart
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-glow-emerald scale-105 z-10'
                        : isEnd
                        ? 'bg-teal-400 text-slate-950 font-bold shadow-glow-teal scale-105 z-10'
                        : isInRange
                        ? 'text-emerald-300 font-medium hover:bg-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cell.day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setTempStart('');
              setTempEnd('');
            }}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(tempStart, tempEnd);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 text-xs font-bold shadow-glow-emerald flex items-center justify-center space-x-1 transition active:scale-95"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Apply Range</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modalContent;
  const target = document.getElementById('modal-root') || document.body;
  return createPortal(modalContent, target);
}
