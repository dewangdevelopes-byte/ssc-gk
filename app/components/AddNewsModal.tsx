'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  X,
  Calendar,
  Link as LinkIcon,
  Tag,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  Building2,
} from 'lucide-react';
import { ALL_CATEGORIES, CATEGORY_MAP } from '@/lib/categories';
import CategoryIcon from './CategoryIcon';

interface AddNewsModalProps {
  initialCategory?: string;
  buttonLabel?: string;
}

export default function AddNewsModal({
  initialCategory,
  buttonLabel = 'Add News',
}: AddNewsModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [category, setCategory] = useState(initialCategory || 'national-schemes');
  const [source, setSource] = useState('PIB / Official Gazette');
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setDate(todayStr);
    setCategory(initialCategory || 'national-schemes');
    setSource('PIB / Official Gazette');
    setUrl('');
    setSummary('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a news title.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/add-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          published_at: date ? new Date(date).toISOString() : new Date().toISOString(),
          category,
          source: source.trim() || 'Manual Entry',
          url: url.trim() || undefined,
          summary: summary.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessNotice('News article successfully saved to database!');
        router.refresh();
        setTimeout(() => {
          setSuccessNotice(null);
          setIsOpen(false);
          resetForm();
        }, 1200);
      } else {
        setError(data.error || 'Failed to add news article.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryMeta = CATEGORY_MAP[category];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          resetForm();
        }}
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs shadow-emerald-600/20 border border-emerald-500 transition-all cursor-pointer active:scale-95 shrink-0"
      >
        <PlusCircle className="w-4 h-4" />
        <span>{buttonLabel}</span>
      </button>

      {/* Modal Dialog Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-400/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Add Current Affairs & News
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter title, date, category and source to save to database.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {successNotice && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successNotice}</span>
                </div>
              )}

              {/* News Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  News Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Union Cabinet approves National Green Hydrogen Mission phase 2..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* Category & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    GK Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug} className="text-slate-900 bg-white">
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    News Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              </div>

              {/* Source & Link Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* News Source */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    News Source / Publisher
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., PIB Delhi, The Hindu, NITI Aayog"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>

                {/* URL / Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                    Reference Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://pib.gov.in/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              </div>

              {/* Summary / GK Key Points */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Key GK Points / Summary (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Key exam takeaways, ministry responsible, financial outlay, objective of the scheme..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 text-xs sm:text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs shadow-emerald-600/25 border border-emerald-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Article...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save News Article</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
