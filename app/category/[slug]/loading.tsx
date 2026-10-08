import React from 'react';
import { CardSkeleton } from '@/app/components/CardSkeleton';
import { ArrowLeft } from 'lucide-react';

export default function CategoryLoading() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-blue-200/40 via-indigo-200/30 to-purple-200/20 blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Navigation Breadcrumb Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-9 w-44 bg-slate-200 rounded-xl animate-pulse border border-slate-200" />
          <div className="h-8 w-32 bg-slate-200 rounded-xl animate-pulse border border-slate-200" />
        </div>

        {/* Category Header Banner Skeleton */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 animate-pulse space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-7 w-60 bg-slate-200 rounded-lg" />
                <div className="h-4 w-96 bg-slate-200/70 rounded" />
              </div>
            </div>
            <div className="w-20 h-16 bg-slate-200 rounded-2xl" />
          </div>

          {/* Quick switcher bar skeleton */}
          <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
            <div className="h-6 w-20 bg-slate-200 rounded" />
            <div className="h-6 w-24 bg-slate-200/70 rounded-lg" />
            <div className="h-6 w-24 bg-slate-200/70 rounded-lg" />
            <div className="h-6 w-24 bg-slate-200/70 rounded-lg" />
          </div>
        </div>

        {/* Date Filter Bar Skeleton */}
        <div className="h-16 w-full bg-white rounded-2xl border border-slate-200 animate-pulse shadow-xs" />

        {/* News Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
