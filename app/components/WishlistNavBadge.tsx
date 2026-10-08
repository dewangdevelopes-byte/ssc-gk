'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/lib/wishlistContext';

export default function WishlistNavBadge() {
  const { count } = useWishlist();

  return (
    <Link
      href="/wishlist"
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-rose-300 text-xs font-semibold text-slate-700 transition-all shadow-xs group"
    >
      <Heart
        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
          count > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover:text-rose-500'
        }`}
      />
      <span>Wishlist Directory</span>
      <span
        className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
          count > 0
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
