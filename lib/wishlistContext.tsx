'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface WishlistArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  category?: string;
  summary?: string | null;
  published_at: string;
  added_at?: string;
}

interface WishlistContextType {
  wishlist: WishlistArticle[];
  isWishlisted: (url: string) => boolean;
  toggleWishlist: (article: WishlistArticle) => boolean;
  removeFromWishlist: (url: string) => void;
  clearWishlist: () => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = 'ssc_gk_wishlist_items_v1';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistArticle[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveWishlist = (items: WishlistArticle[]) => {
    setWishlist(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  };

  const isWishlisted = (url: string) => {
    return wishlist.some((item) => item.url === url);
  };

  const toggleWishlist = (article: WishlistArticle): boolean => {
    const exists = isWishlisted(article.url);
    if (exists) {
      const updated = wishlist.filter((item) => item.url !== article.url);
      saveWishlist(updated);
      return false;
    } else {
      const updated = [
        {
          ...article,
          added_at: new Date().toISOString(),
        },
        ...wishlist,
      ];
      saveWishlist(updated);
      return true;
    }
  };

  const removeFromWishlist = (url: string) => {
    const updated = wishlist.filter((item) => item.url !== url);
    saveWishlist(updated);
  };

  const clearWishlist = () => {
    saveWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        count: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
