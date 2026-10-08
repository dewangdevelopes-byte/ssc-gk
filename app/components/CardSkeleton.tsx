import React from 'react';

export function CardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-5 animate-pulse space-y-4 shadow-xs">
      <div className="space-y-3">
        {/* Meta badge line */}
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-24 bg-slate-200 rounded-full" />
          <div className="h-4 w-28 bg-slate-100 rounded-md" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-2 pt-1">
          <div className="h-5 bg-slate-200 rounded-md w-full" />
          <div className="h-5 bg-slate-200 rounded-md w-4/5" />
        </div>

        {/* Snippet skeleton */}
        <div className="space-y-1.5 pt-2">
          <div className="h-3.5 bg-slate-100 rounded w-full" />
          <div className="h-3.5 bg-slate-100 rounded w-5/6" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
        <div className="h-3.5 w-20 bg-slate-100 rounded" />
        <div className="h-4 w-24 bg-slate-200 rounded-md" />
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-5 animate-pulse space-y-4 shadow-xs">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 bg-slate-200 rounded-xl" />
          <div className="h-5 w-16 bg-slate-100 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-3/4" />
          <div className="h-3.5 bg-slate-100 rounded w-full" />
          <div className="h-3.5 bg-slate-100 rounded w-5/6" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between">
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="h-4 w-4 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
