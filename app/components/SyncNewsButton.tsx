'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SectionUpdate {
  slug: string;
  title: string;
  shortTitle: string;
  count: number;
}

interface ToastData {
  newlyAddedCount: number;
  totalFetched: number;
  sections: SectionUpdate[];
}

export default function SyncNewsButton() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const router = useRouter();

  const handleSync = async () => {
    setLoading(true);
    setToast(null);
    setErrorToast(null);

    try {
      const res = await fetch('/api/cron/fetch-news');
      const data = await res.json();

      if (res.ok) {
        const newlyAddedCount =
          data.results?.newlyAddedCount !== undefined
            ? data.results.newlyAddedCount
            : data.results?.insertedOrUpdated || 0;
        const totalFetched = data.results?.totalFetched || 0;
        const sections: SectionUpdate[] = data.results?.sectionsUpdated || [];

        setToast({
          newlyAddedCount,
          totalFetched,
          sections,
        });

        router.refresh();

        // Auto-dismiss after 9 seconds
        setTimeout(() => {
          setToast(null);
        }, 9000);
      } else {
        setErrorToast('Failed to sync feeds from external sources.');
        setTimeout(() => setErrorToast(null), 5000);
      }
    } catch {
      setErrorToast('Network error while syncing feeds.');
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-600/20 border border-blue-500 transition-all disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Fetching Feeds...' : 'Fetch Latest Feeds'}</span>
      </button>

      {/* Rich Interactive Toastr Notification */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:max-w-md rounded-2xl bg-white/95 border border-emerald-300 p-4 sm:p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                {toast.newlyAddedCount > 0 ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {toast.newlyAddedCount > 0
                      ? `+${toast.newlyAddedCount} New Updates Saved`
                      : 'Database is Up to Date'}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {toast.newlyAddedCount > 0 ? (
                    <>
                      Added {toast.newlyAddedCount} fresh news items across{' '}
                      <strong className="text-emerald-700">
                        {toast.sections.length} categories
                      </strong>
                      :
                    </>
                  ) : (
                    <>
                      Polled {toast.totalFetched} feed sources. All current
                      affairs items are already synchronized.
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section Badges Grid (Shown when new items exist) */}
          {toast.newlyAddedCount > 0 && toast.sections.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-600" />
                Sections with Fresh Articles
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {toast.sections.map((sec) => (
                  <Link
                    key={sec.slug}
                    href={`/category/${sec.slug}`}
                    onClick={() => setToast(null)}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[11px] font-medium text-slate-700 hover:text-emerald-800 transition shadow-xs"
                  >
                    <span>{sec.shortTitle}</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      +{sec.count}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Toastr */}
      {errorToast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:max-w-md rounded-2xl bg-white/95 border border-rose-300 p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button
            onClick={() => setErrorToast(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
