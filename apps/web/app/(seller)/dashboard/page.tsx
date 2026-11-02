'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { fetchApi } from '../../../lib/api';
import { BookDetail } from '@boi-hat/shared-types';
import BookCard from '../../../components/BookCard';
import BoostModal from '../../../components/BoostModal';
import {
  BookOpen,
  PlusCircle,
  Package,
  TrendingUp,
  Trash2,
  Eye,
  CheckCircle2,
  Wallet,
  Sparkles,
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user, openAuthModal } = useAuth();
  const { locale, t, formatPrice } = useI18n();

  const [myBooks, setMyBooks] = useState<BookDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [boostingBook, setBoostingBook] = useState<{ id: string; title: string } | null>(null);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            <span>আমার বিজ্ঞাপিত বইসমূহ (My Listings)</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            আপনার সকল সক্রিয় বিজ্ঞাপন পরিচালনা, বুস্টিং ও নতুন বই বিক্রির তালিকা যুক্ত করুন
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/wallet"
            className="px-5 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-2xl shadow-sm transition flex items-center gap-2 text-xs sm:text-sm shrink-0 active:scale-95"
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>আমার ওয়ালেট</span>
          </Link>

          <Link
            href="/post-ad"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm shrink-0 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন বই বিক্রি করুন</span>
          </Link>
        </div>
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
            <div key={book.id} className="relative group flex flex-col">
              <BookCard book={book} />
              
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setBoostingBook({ id: book.id, title: book.title_bn || book.title_en });
                  }}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>{book.is_featured ? 'রিনিউ বুস্ট' : 'বুস্ট করুন'}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteListing(book.id);
                  }}
                  className="p-2 border border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-600 rounded-xl transition"
                  title="বিজ্ঞাপন মুছুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Boost Modal */}
      {boostingBook && (
        <BoostModal
          bookId={boostingBook.id}
          bookTitle={boostingBook.title}
          isOpen={true}
          onClose={() => setBoostingBook(null)}
          onSuccess={() => {
            loadMyBooks();
            setBoostingBook(null);
          }}
        />
      )}
    </div>
  );
}

