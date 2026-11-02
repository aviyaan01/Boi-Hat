'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { fetchApi } from '../../../lib/api';
import { BookDetail } from '@boi-hat/shared-types';
import BookCard from '../../../components/BookCard';
import {
  BookOpen,
  PlusCircle,
  Package,
  TrendingUp,
  Trash2,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user, openAuthModal } = useAuth();
  const { locale, t, formatPrice } = useI18n();

  const [myBooks, setMyBooks] = useState<BookDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMyBooks = async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetchApi<any>(`/users/${user.id}/public`);
    if (res.success && res.data) {
      setMyBooks(res.data.listings || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadMyBooks();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <BookOpen className="w-16 h-16 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">লিস্টিং দেখতে লগইন করুন</h2>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow"
        >
          লগইন / সাইনআপ
        </button>
      </div>
    );
  }

  const handleDeleteListing = async (bookId: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই বিজ্ঞাপনটি মুছে ফেলতে চান?')) return;
    const res = await fetchApi(`/books/${bookId}`, { method: 'DELETE' });
    if (res.success) {
      setMyBooks((prev) => prev.filter((b) => b.id !== bookId));
    } else {
      alert(res.error?.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            <span>আমার বিজ্ঞাপিত বইসমূহ (My Listings)</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            আপনার সকল সক্রিয় বিজ্ঞাপন পরিচালনা ও নতুন বইয়ের তালিকা যুক্ত করুন
          </p>
        </div>

        <Link
          href="/post-ad"
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন বই বিক্রি করুন</span>
        </Link>
      </div>

      {/* Grid of Listings */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : myBooks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-4">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">এখনো কোনো বই বিজ্ঞাপিত করেননি</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            আপনার কাছে থাকা পুরনো বা অপ্রয়োজনীয় বইগুলোর ছবি তুলে ৩ মিনিটে বিক্রির বিজ্ঞাপন দিন।
          </p>
          <Link
            href="/post-ad"
            className="inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow"
          >
            প্রথম বিজ্ঞাপন দিন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {myBooks.map((book) => (
            <div key={book.id} className="relative group">
              <BookCard book={book} />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteListing(book.id);
                }}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition z-20"
                title="বিজ্ঞাপন মুছুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
