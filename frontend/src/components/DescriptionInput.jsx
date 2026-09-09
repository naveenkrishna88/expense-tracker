import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FileText, Sparkles, CornerDownLeft } from 'lucide-react';

export default function DescriptionInput({
  value,
  onChange,
  historicalDescriptions = [],
  placeholder = "e.g., Grocery Shopping, Uber ride, Dinner"
}) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  // Clean, unique, trimmed historical descriptions sorted by length/frequency
  const uniqueHistory = useMemo(() => {
    const map = {};
    (historicalDescriptions || []).forEach((desc) => {
      if (!desc || typeof desc !== 'string') return;
      const clean = desc.trim();
      if (clean.length >= 2) {
        map[clean] = (map[clean] || 0) + 1;
      }
    });
    return Object.keys(map).sort((a, b) => map[b] - map[a]);
  }, [historicalDescriptions]);

  // Find best matching prefix for shadow ghost text
  const trimmedValue = (value || '').trim();
  const lowerVal = trimmedValue.toLowerCase();

  const bestMatch = useMemo(() => {
    if (!lowerVal || lowerVal.length < 2) return null;
    return uniqueHistory.find(
      (item) => item.toLowerCase().startsWith(lowerVal) && item.toLowerCase() !== lowerVal
    );
  }, [lowerVal, uniqueHistory]);

  // Suffix for ghost inline text
  const ghostSuffix = useMemo(() => {
    if (!bestMatch || !value) return '';
    // Preserve typed case, append remaining slice from bestMatch
    return bestMatch.slice(value.length);
  }, [bestMatch, value]);

  // Multiple matches for quick-tap chips (up to 4)
  const matchingChips = useMemo(() => {
    if (!lowerVal) return [];
    return uniqueHistory
      .filter((item) => item.toLowerCase().includes(lowerVal) && item.toLowerCase() !== lowerVal)
      .slice(0, 5);
  }, [lowerVal, uniqueHistory]);

  const handleAcceptSuggestion = (completeText) => {
    onChange(completeText);
  };

  return (
    <div ref={containerRef} className="space-y-1.5">
      <div className="relative rounded-xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-all overflow-hidden">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <FileText className="w-4 h-4" />
        </div>

        {/* Input & Inline Ghost Overlay Wrapper */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            className="w-full bg-transparent pl-10 pr-24 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none z-10"
          />

          {/* Single-tap Mobile Completion Badge */}
          {bestMatch && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAcceptSuggestion(bestMatch)}
              className="absolute right-2.5 z-20 flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold active:scale-95 transition"
              title="Tap to auto-complete description"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Complete</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Quick-Tap Match Chips (Touch friendly) */}
      {isFocused && matchingChips.length > 0 && (
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-0.5 animate-in fade-in duration-150">
          <span className="text-[10px] text-slate-500 font-medium pl-0.5 whitespace-nowrap">Suggestions:</span>
          {matchingChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAcceptSuggestion(chip)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800/90 text-xs font-medium whitespace-nowrap active:scale-95 transition shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
