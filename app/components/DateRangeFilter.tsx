'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Filter, Calendar, Loader2, CheckCircle2, Clock } from 'lucide-react';

interface DateRangeFilterProps {
  categorySlug?: string;
  categoryTitle?: string;
}

export default function DateRangeFilter({
  categorySlug,
  categoryTitle,
}: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentStartDate = searchParams.get('startDate');
  const currentEndDate = searchParams.get('endDate');
  const rangeType = searchParams.get('range'); // 'all' | '7d' | '30d' | undefined (today default)

  const isDefaultToday = !currentStartDate && !currentEndDate && rangeType !== 'all';

  const [startDate, setStartDate] = useState(currentStartDate || (isDefaultToday ? todayStr : ''));
  const [endDate, setEndDate] = useState(currentEndDate || (isDefaultToday ? todayStr : ''));
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);

  const applyRange = async (start: string, end: string, customRangeType?: string) => {
    const params = new URLSearchParams();

    if (customRangeType === 'all') {
      params.set('range', 'all');
    } else {
      if (start) params.set('startDate', start);
      if (end) params.set('endDate', end);
      if (customRangeType) params.set('range', customRangeType);
    }

    params.set('page', '1');

    setIsFetchingLive(true);
    setFetchNotice(null);

    try {
      const res = await fetch('/api/fetch-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categorySlug,
          startDate: start || undefined,
          endDate: end || undefined,
        }),
      });

      const data = await res.json();
      if (data.fetchedAndSaved > 0) {
        setFetchNotice(`Saved ${data.fetchedAndSaved} fresh articles to database!`);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsFetchingLive(false);
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
        router.refresh();
      });
      setTimeout(() => setFetchNotice(null), 5000);
    }
  };

  const handleCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    applyRange(startDate, endDate);
  };

  const handlePresetToday = () => {
    setStartDate(todayStr);
    setEndDate(todayStr);
    applyRange(todayStr, todayStr);
  };

  const handlePreset7Days = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const past7Str = d.toISOString().slice(0, 10);
    setStartDate(past7Str);
    setEndDate(todayStr);
    applyRange(past7Str, todayStr, '7d');
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    const firstDayStr = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    setStartDate(firstDayStr);
    setEndDate(todayStr);
    applyRange(firstDayStr, todayStr, '30d');
  };

  const handlePresetAll = () => {
    setStartDate('');
    setEndDate('');
    applyRange('', '', 'all');
  };

  const isLoading = isPending || isFetchingLive;

  // Active status description
  let activeFilterLabel = "Showing Today's News (Default)";
  if (rangeType === 'all') {
    activeFilterLabel = 'Showing All Available News';
  } else if (rangeType === '7d' || (startDate && endDate && startDate !== todayStr)) {
    activeFilterLabel = `Showing Custom Range: ${startDate || 'Past'} to ${endDate || 'Today'}`;
  }

  return (
    <div className="w-full space-y-3">
      {/* Quick Preset Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Time Filter:
          </span>

          <button
            type="button"
            onClick={handlePresetToday}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              isDefaultToday && !currentStartDate
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Today (Default)
          </button>

          <button
            type="button"
            onClick={handlePreset7Days}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              rangeType === '7d'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Past 7 Days
          </button>

          <button
            type="button"
            onClick={handlePresetThisMonth}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              rangeType === '30d'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            This Month
          </button>

          <button
            type="button"
            onClick={handlePresetAll}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              rangeType === 'all'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Dates
          </button>
        </div>

        <div className="text-[11px] font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto text-left truncate max-w-full">
          {activeFilterLabel}
        </div>
      </div>

      {/* Custom Specific Date Pickers Form */}
      <form
        onSubmit={handleCustomFilter}
        className="flex flex-col sm:flex-row sm:items-end gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs"
      >
        <div className="flex flex-col w-full sm:w-auto sm:flex-1">
          <label
            htmlFor="startDate"
            className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Specific From Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-col w-full sm:w-auto sm:flex-1">
          <label
            htmlFor="endDate"
            className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Specific To Date
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center w-full sm:w-auto pt-1 sm:pt-0">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Fetching & Filtering...</span>
              </>
            ) : (
              <>
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Specified Dates</span>
              </>
            )}
          </button>
        </div>
      </form>

      {fetchNotice && (
        <div className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{fetchNotice}</span>
        </div>
      )}
    </div>
  );
}
