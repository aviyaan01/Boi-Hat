'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '../../lib/i18n';
import { fetchApi } from '../../lib/api';
import BookCard from '../../components/BookCard';
import { BookDetail, CategoryNode } from '@boi-hat/shared-types';
import {
  GraduationCap,
  BookOpen,
  Compass,
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Store,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const { locale, t } = useI18n();
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<BookDetail[]>([]);
  const [personalizedBooks, setPersonalizedBooks] = useState<BookDetail[]>([]);
  const [recentBooks, setRecentBooks] = useState<BookDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, featRes, recRes, persRes] = await Promise.all([
          fetchApi<CategoryNode[]>('/categories/tree'),
          fetchApi<BookDetail[]>('/books?limit=4&sort=popular'),
          fetchApi<BookDetail[]>('/books?limit=8&sort=newest'),
          fetchApi<BookDetail[]>('/books/personalized/feed?limit=8'),
        ]);

        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
        if (featRes.success && featRes.data) {
          setFeaturedBooks(featRes.data);
        }
        if (recRes.success && recRes.data) {
          setRecentBooks(recRes.data);
        }
        if (persRes.success && persRes.data) {
          setPersonalizedBooks(persRes.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'academic':
        return <GraduationCap className="w-6 h-6 text-emerald-600" />;
      case 'literature':
        return <BookOpen className="w-6 h-6 text-blue-600" />;
      case 'religion':
        return <Compass className="w-6 h-6 text-indigo-600" />;
      case 'children-teens':
        return <Sparkles className="w-6 h-6 text-purple-600" />;
      case 'rare-vintage':
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <BookOpen className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-800 via-emerald-900 to-slate-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t('home.city_notice')}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            {t('home.hero_title')}
          </h1>

          <p className="text-sm sm:text-lg text-emerald-100 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            {t('home.hero_subtitle')}
          </p>

          {/* Quick Search Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-emerald-300 font-medium">জনপ্রিয় অনুসন্ধান:</span>
            {[
              { label: 'হুমায়ূন আহমেদ', query: 'humayun' },
              { label: 'এইচএসসি বিজ্ঞান', query: 'hsc' },
              { label: 'বিসিএস প্রস্তুতি', query: 'bcs' },
              { label: 'ফেলুদা সমগ্র', query: 'feluda' },
              { label: 'দুর্লভ পত্রিকা ও ফার্স্ট এডিশন', isRare: true },
            ].map((chip, idx) => (
              <Link
                key={idx}
                href={chip.isRare ? '/books?is_rare=true' : `/books?q=${encodeURIComponent(chip.query || '')}`}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-sm transition"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Level 1 Category Grid (Section 8.1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/books?category_slug=${cat.slug}`}
              className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:border-emerald-300 hover:shadow-xl transition flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-3 transition group-hover:scale-110">
                {getCategoryIcon(cat.slug)}
              </div>
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition">
                {locale === 'bn' ? cat.name_bn : cat.name_en}
              </h3>
              <span className="text-[11px] text-gray-400 mt-1 flex items-center gap-0.5 group-hover:text-emerald-600">
                {t('home.view_all')} <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Rare & Vintage Special Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-700/30">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Award className="w-4 h-4 text-amber-400" />
              <span>সংগ্রাহক সংস্করণ ও দুর্লভ সংগ্রহ (Rare & Vintage Archive)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-100">
              {locale === 'bn' ? 'আউট-অব-প্রিন্ট ও ঐতিহাসিক ক্লাসিকস' : 'Out-of-Print & Historic Classics'}
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 max-w-xl">
              {locale === 'bn'
                ? '১৯৭০ দশকের সাপ্তাহিক বিচিত্রা, দেশ পত্রিকার বিশেষ সংখ্যা, নন্দিত নরকের প্রথম মুদ্রণ সহ বিরল বইয়ের সম্ভার।'
                : 'Authenticated first editions, signed literary gems, and historic periodicals with expert verification.'}
            </p>
          </div>
          <Link
            href="/books?is_rare=true"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl shadow-lg transition flex items-center gap-2 shrink-0 text-sm"
          >
            <span>সংগ্রহ দেখুন (Explore Rare)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Featured Books Section */}
      {featuredBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {t('home.featured_books')}
              </h2>
            </div>
            <Link
              href="/books"
              className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              {t('home.view_all')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* Personalized Feed Section (Section 9.2: Stage 1 Rule-Based Scoring) */}
      {personalizedBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                আপনার জন্য বিশেষ সুপারিশ (Recommended for You)
              </h2>
            </div>
            <Link
              href="/books"
              className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              {t('home.view_all')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {personalizedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Listings Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              {t('home.recent_listings')}
            </h2>
          </div>
          <Link
            href="/books"
            className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            {t('home.view_all')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {recentBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* Nilkhet & Bangla Bazar Bookstore Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">
                {locale === 'bn' ? 'নীলক্ষেত ও বাংলাবাজার বুকশপ থেকে সরাসরি' : 'Directly from Nilkhet & Bangla Bazar Bookstores'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {locale === 'bn'
                  ? 'ঢাকা শহরের নামকরা পুরনো বইয়ের দোকানগুলো এখন বই হাটে ভেরিফায়েড শপ হিসেবে যুক্ত।'
                  : 'Authentic local bookshops with verified trade licenses and thousands of titles ready to ship.'}
              </p>
            </div>
          </div>
          <Link
            href="/books"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition shrink-0"
          >
            সব বই ব্রাউজ করুন
          </Link>
        </div>
      </section>
    </div>
  );
}

