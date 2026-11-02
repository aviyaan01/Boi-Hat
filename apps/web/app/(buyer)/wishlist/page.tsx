'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { fetchApi } from '../../../lib/api';
import BookCard from '../../../components/BookCard';
import { BookDetail } from '@boi-hat/shared-types';
import { Heart, BookOpen } from 'lucide-react';

export default function WishlistPage() {
  const { user, openAuthModal } = useAuth();
  const { locale, t } = useI18n();

  const [wishlist, setWishlist] = useState<BookDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetchApi<BookDetail[]>('/wishlist');
    if (res.success && res.data) {
      setWishlist(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Heart className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">আপনার উইশলিস্ট দেখতে লগইন করুন</h2>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow"
        >
          লগইন / সাইনআপ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
          <Heart className="w-7 h-7 text-red-500 fill-current" />
          <span>আমার উইশলিস্ট (My Wishlist) ({wishlist.length})</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          পরবর্তীতে কেনার জন্য আপনার সংরক্ষিত বইসমূহ
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-4">
          <Heart className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">উইশলিস্টে এখনো কোনো বই নেই</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            যেকোনো বইয়ের ওপর হার্ট আইকনে ক্লিক করে পরবর্তীতে কেনার জন্য সহজে সংরক্ষণ করুন।
          </p>
          <Link
            href="/books"
            className="inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow"
          >
            বই ব্রাউজ করুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.map((book) => (
            <BookCard key={book.id} book={book} initialWishlisted={true} />
          ))}
        </div>
      )}
    </div>
  );
}
