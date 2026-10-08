'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useTransition } from 'react';
import { Search, X, Sparkles, Loader2 } from 'lucide-react';

const SUGGESTED_TOPICS = [
  'ISRO',
  'Padma Awards',
  'Nobel Prize',
  'Chief Justice',
  'RBI',
  'Asian Games',
  'DRDO',
  'Budget',
];

export default function MetaSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(currentQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Sync state if URL query param changes from external navigation (e.g. back button)
  useEffect(() => {
    if (currentQuery !== query && isFirstRender.current) {
      setQuery(currentQuery);
    }
  }, [currentQuery]);

  const executeSearch = (searchTerm: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
      // When searching across entire database, default to all time if no specific date filter is applied
      if (!params.get('range') && !params.get('startDate')) {
        params.set('range', 'all');
      }
    } else {
      params.delete('q');
    }

    params.set('page', '1');

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  // 0.5s (500ms) Debounced Live Search Effect as user types
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (query.trim() !== currentQuery.trim()) {
        executeSearch(query);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeSearch(query);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQuery('');
    executeSearch('');
  };

  return (
    <div className="w-full space-y-3">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full rounded-2xl bg-white border border-slate-200 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 shadow-sm backdrop-blur-sm transition-all"
      >
        <div className="pl-4 text-slate-400">
          {isPending ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-blue-600" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Global Meta Search: Type any topic to search entire database (live 0.5s)..."
          className="w-full bg-transparent px-3.5 py-3.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
        />

        {query && (
          <div className="pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </form>

      {/* Suggested Search Chips */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-500 font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Popular Searches:
        </span>
        {SUGGESTED_TOPICS.map((topic) => {
          const isActive = currentQuery.toLowerCase() === topic.toLowerCase();
          return (
            <button
              key={topic}
              type="button"
              onClick={() => {
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }
                setQuery(topic);
                executeSearch(topic);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-xs'
              }`}
            >
              {topic}
            </button>
          );
        })}
      </div>
    </div>
  );
}
