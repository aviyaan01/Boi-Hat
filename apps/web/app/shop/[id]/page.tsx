'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Search,
  BookOpen,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { useI18n } from '../../../lib/i18n';
import BookCard from '../../../components/BookCard';
import { BookDetail } from '@boi-hat/shared-types';

export default function ShopStorefrontPage() {
  const params = useParams();
  const shopId = params.id as string;
  const { t } = useI18n();

  const [shop, setShop] = useState<any | null>(null);
  const [listings, setListings] = useState<BookDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');

  useEffect(() => {
    async function loadShop() {
      setLoading(true);
      try {
        const res = await fetchApi<any>(`/merchants/shops/${shopId}`);
        if (res.success && res.data) {
          setShop(res.data.shop);
          setListings(res.data.listings || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (shopId) loadShop();
  }, [shopId]);

  const filteredListings = listings.filter((book) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      book.title_bn.includes(q) ||
      book.title_en.toLowerCase().includes(q) ||
      (book.author?.name_bn || '').includes(q) ||
      (book.author?.name_en || '').toLowerCase().includes(q);

    const matchesCond =
      selectedCondition === 'all' || book.condition === selectedCondition;

    return matchesSearch && matchesCond;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-44 bg-gray-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Store className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">বুকশপটি পাওয়া যায়নি</h2>
        <Link
          href="/books"
          className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          সব বই ব্রাউজ করুন
        </Link>
      </div>
    );
  }

  const isNilkhet =
    shop.address?.toLowerCase().includes('nilkhet') || shop.address?.includes('নীলক্ষেত');
  const marketBadge = isNilkhet
    ? 'নীলক্ষেত ভেরিফাইড বুকশপ'
    : 'বাংলাবাজার ভেরিফাইড বুকস্টল';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/books"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল বইয়ে ফিরে যান</span>
        </Link>
      </div>

      {/* Store Banner & Profile Header */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Decorative Top Ribbon */}
        <div className="h-32 bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 relative">
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{marketBadge}</span>
            </span>
          </div>
        </div>

        {/* Shop Info Container */}
        <div className="p-6 sm:p-8 -mt-12 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-3xl bg-white p-2 border-2 border-emerald-500 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-contain" />
              ) : (
                <Store className="w-10 h-10 text-emerald-700" />
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <span>{shop.name}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
              </h1>
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{shop.address}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>সকাল ১০টা - রাত ৯টা (খোলা)</span>
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  <span>{listings.length}টি বই মজুত</span>
                </span>
                {shop.trade_license_number && (
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-700">
                    লাইসেন্স: {shop.trade_license_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/messages"
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>মেসেজ দিন</span>
            </Link>
            {shop.contact_phone && (
              <a
                href={`tel:${shop.contact_phone}`}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="font-mono">{shop.contact_phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* In-Store Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="এই দোকানের বই খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-gray-500 font-semibold">অবস্থা:</span>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="all">সকল অবস্থা</option>
            <option value="LIKE_NEW">নতুন মতো (Like New)</option>
            <option value="GOOD">ভালো (Good)</option>
            <option value="ACCEPTABLE">মোটামুটি (Acceptable)</option>
          </select>
        </div>
      </div>

      {/* Book Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>দোকানের বইসমূহ ({filteredListings.length})</span>
          </h2>
        </div>

        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-800">কোনো বই পাওয়া যায়নি</h3>
            <p className="text-xs text-gray-400">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredListings.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
