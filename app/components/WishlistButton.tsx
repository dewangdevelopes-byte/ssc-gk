'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist, WishlistArticle } from '@/lib/wishlistContext';

interface WishlistButtonProps {
  article: WishlistArticle;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({
  article,
  showText = false,
  size = 'md',
}: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(article.url);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnimating(true);
    toggleWishlist(article);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      title={wishlisted ? 'Remove from Revision Wishlist' : 'Add to Revision Wishlist'}
      aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      className={`group/heart inline-flex items-center gap-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
        showText
          ? wishlisted
            ? 'bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 text-xs font-semibold shadow-xs'
            : 'bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold shadow-xs'
          : wishlisted
          ? 'p-2 bg-rose-50 text-rose-600 border border-rose-200 shadow-xs'
          : 'p-2 bg-slate-100/80 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200'
      } ${isAnimating ? 'scale-125' : 'hover:scale-105 active:scale-95'}`}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform duration-200 ${
          wishlisted
            ? 'fill-rose-500 text-rose-500 stroke-rose-500 animate-pulse'
            : 'text-slate-400 group-hover/heart:text-rose-500 group-hover/heart:fill-rose-100'
        }`}
      />
      {showText && (
        <span>{wishlisted ? 'Wishlisted' : 'Save to Wishlist'}</span>
      )}
    </button>
  );
}
