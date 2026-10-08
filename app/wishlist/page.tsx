'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Heart,
  ArrowLeft,
  Search,
  Trash2,
  Calendar,
  ExternalLink,
  BookOpen,
  Filter,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';
import { useWishlist } from '@/lib/wishlistContext';
import { ALL_CATEGORIES, CATEGORY_MAP } from '@/lib/categories';
import CategoryIcon from '@/app/components/CategoryIcon';
import WishlistButton from '@/app/components/WishlistButton';

export default function WishlistPage() {
  const { wishlist, clearWishlist, count } = useWishlist();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // Filter wishlist by category and search query
  const filteredArticles = wishlist.filter((article) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (article.category || 'national-schemes') === selectedCategory;

    const matchesSearch =
      !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.source &&
        article.source.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleExportNotes = () => {
    if (wishlist.length === 0) return;
    const textContent = wishlist
      .map(
        (a, i) =>
          `${i + 1}. [${a.source}] ${a.title}\n   Category: ${
            CATEGORY_MAP[a.category || 'national-schemes']?.title || a.category
          }\n   Date: ${a.published_at}\n   Link: ${a.url}\n`
      )
      .join('\n----------------------------------------\n\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SSC-GK-Wishlist-Notes-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-rose-600 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-rose-200/40 via-pink-200/30 to-purple-200/20 blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Top Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-rose-600" />
            <span>Back to All Categories</span>
          </Link>

          {count > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportNotes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-rose-600" />
                Export Notes (.txt)
              </button>

              {confirmClear ? (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-red-700 font-medium">Clear all?</span>
                  <button
                    onClick={() => {
                      clearWishlist();
                      setConfirmClear(false);
                    }}
                    className="font-bold text-red-600 hover:underline ml-1 cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-slate-500 hover:text-slate-800 ml-1 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-xs font-semibold text-slate-600 hover:text-red-600 transition cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Wishlist
                </button>
              )}
            </div>
          )}
        </div>

        {/* Wishlist Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50/90 via-white to-pink-50/80 border border-slate-200/80 p-5 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30 shrink-0">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 fill-white" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Wishlist & Revision Directory
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Your bookmarked high-yield current affairs, government schemes, and GK notes saved for quick revision before competitive exams.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
              <div className="text-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-slate-900">{count}</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
                  Saved Items
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Search & Category Filter */}
          {count > 0 && (
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-xs'
                  }`}
                >
                  All ({count})
                </button>
                {ALL_CATEGORIES.map((cat) => {
                  const catCount = wishlist.filter(
                    (w) => (w.category || 'national-schemes') === cat.slug
                  ).length;
                  if (catCount === 0) return null;

                  return (
                    <button
                      key={cat.slug}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                        selectedCategory === cat.slug
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-xs'
                      }`}
                    >
                      {cat.shortTitle} ({catCount})
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-auto md:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search wishlisted notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3.5 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Wishlist Articles Grid */}
        <div className="space-y-4">
          {count === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
                <Heart className="w-8 h-8 text-rose-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-xl font-bold text-slate-900">Your Wishlist Directory is Empty</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click the heart icon (❤️) on any news article card across the dashboard or category pages to save it here for fast revision.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-sm shadow-rose-600/20 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Explore Current Affairs
                </Link>
              </div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                No wishlisted articles match your filter.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="text-xs text-rose-600 hover:underline cursor-pointer font-medium"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArticles.map((article) => {
                const catMeta = CATEGORY_MAP[article.category || 'national-schemes'];
                let formattedDate = 'Recent';
                try {
                  formattedDate = format(
                    new Date(article.published_at),
                    'MMM dd, yyyy • hh:mm a'
                  );
                } catch {
                  formattedDate = article.published_at;
                }

                return (
                  <article
                    key={article.url}
                    className="flex flex-col justify-between rounded-2xl bg-white hover:bg-white border border-slate-200 hover:border-rose-400 p-5 transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-rose-500/5 group relative"
                  >
                    <div className="space-y-3">
                      {/* Meta header with Category Tag & Heart button */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]">
                            {catMeta?.shortTitle || 'GK'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                            {article.source}
                          </span>
                        </div>

                        {/* Heart wishlist button */}
                        <WishlistButton article={article} size="sm" />
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors leading-snug">
                        {article.title}
                      </h3>

                      {/* Summary */}
                      {article.summary && (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {article.summary}
                        </p>
                      )}
                    </div>

                    {/* Footer external link */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formattedDate}
                      </span>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 hover:underline transition text-xs"
                      >
                        Read Full Story
                        <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
