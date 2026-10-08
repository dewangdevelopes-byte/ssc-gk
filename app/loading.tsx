import React from 'react';
import { CardSkeleton, CategoryCardSkeleton } from '@/app/components/CardSkeleton';
import { BookMarked, Sparkles, Layers } from 'lucide-react';

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-blue-200/40 via-indigo-200/30 to-purple-200/20 blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Top Navbar Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-slate-200 animate-pulse border border-slate-200" />
            <div className="space-y-2">
              <div className="h-6 w-56 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-4 w-72 bg-slate-200/70 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-32 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-9 w-28 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-14 w-full bg-white rounded-2xl border border-slate-200 animate-pulse shadow-xs" />

        {/* Hero Section Skeleton */}
        <div className="h-36 w-full bg-white rounded-3xl border border-slate-200 animate-pulse shadow-xs" />

        {/* Filter Bar Skeleton */}
        <div className="h-16 w-full bg-white rounded-2xl border border-slate-200 animate-pulse shadow-xs" />

        {/* Category Cards Grid Skeletons */}
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="h-7 w-64 bg-slate-200 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-7 w-64 bg-slate-200 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
