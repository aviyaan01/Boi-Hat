'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '../../../lib/i18n';
import { fetchApi } from '../../../lib/api';
import BookCard from '../../../components/BookCard';
import {
  BookDetail,
  CategoryNode,
  BookCondition,
  BookLanguage,
  Author,
} from '@boi-hat/shared-types';
import {
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Sparkles,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

function SearchAndBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t, formatPrice } = useI18n();

  // Query states
  const q = searchParams.get('q') || '';
  const categorySlug = searchParams.get('category_slug') || '';
  const condition = searchParams.get('condition') as BookCondition | '';
  const language = searchParams.get('language') as BookLanguage | '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const isRare = searchParams.get('is_rare') === 'true';
  const sort = searchParams.get('sort') || 'newest';
  const authorId = searchParams.get('author_id') || '';

  // Data states
  const [books, setBooks] = useState<BookDetail[]>([]);
  const [fallbackBooks, setFallbackBooks] = useState<BookDetail[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load categories and authors
  useEffect(() => {
    async function loadMetadata() {
      const [catRes, authRes] = await Promise.all([
        fetchApi<CategoryNode[]>('/categories/tree'),
        fetchApi<Author[]>('/authors/search'),
      ]);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (authRes.success && authRes.data) setAuthors(authRes.data);
    }
    loadMetadata();
  }, []);

  // Fetch books matching current query params
  useEffect(() => {
    async function loadBooks() {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has('limit')) params.set('limit', '30');

      const res = await fetchApi<BookDetail[]>(`/books?${params.toString()}`);
      if (res.success && res.data) {
        setBooks(res.data);
        setTotalCount(res.meta?.total || res.data.length);

        // If zero results, fetch fallback similar books per Section 8.2
        if (res.data.length === 0) {
          const fallbackRes = await fetchApi<BookDetail[]>('/books?limit=4&sort=popular');
          if (fallbackRes.success && fallbackRes.data) {
            setFallbackBooks(fallbackRes.data);
          }
        }
      }
      setLoading(false);
    }
    loadBooks();
  }, [searchParams]);

  // Update URL helper
  const updateQuery = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/books?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/books');
  };

  const removeSingleFilter = (key: string) => {
    updateQuery(key, null);
  };

  const activeFiltersCount = [
    q,
    categorySlug,
    condition,
    language,
    minPrice,
    maxPrice,
    isRare ? 'true' : '',
    authorId,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            {isRare ? 'দুর্লভ ও সংগ্রাহক বই (Rare & Vintage Archive)' : 'বই ব্রাউজ করুন (Browse Books)'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {t('search.books_found', { count: totalCount })}
            {q && <span className="font-semibold text-emerald-700"> “{q}”</span>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 shadow-sm"
          >
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>ফিল্টার ({activeFiltersCount})</span>
          </button>

          {/* Condition Guide Trigger */}
          <button
            onClick={() => setConditionModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:underline bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">বইয়ের অবস্থার নির্দেশিকা</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500 hidden sm:inline">{t('search.sort_by')}:</span>
            <select
              value={sort}
              onChange={(e) => updateQuery('sort', e.target.value)}
              className="py-2 pl-3 pr-8 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">{t('search.sort_newest')}</option>
              <option value="price_asc">{t('search.sort_price_low')}</option>
              <option value="price_desc">{t('search.sort_price_high')}</option>
              <option value="popular">{t('search.sort_popular')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside
          className={`space-y-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm sm:block ${
            mobileFilterOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span>{t('search.filters')}</span>
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('search.clear_all')}</span>
              </button>
            )}
          </div>

          {/* Rare Archive Filter Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100/70 transition">
              <input
                type="checkbox"
                checked={isRare}
                onChange={(e) => updateQuery('is_rare', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                কেবল দুর্লভ ও সংগ্রাহক বই (Rare Only)
              </span>
            </label>
          </div>

          {/* Category Tree (Level 1 & Level 2) */}
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
              ক্যাটাগরি (Category)
            </h4>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => updateQuery('category_slug', null)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  !categorySlug
                    ? 'bg-emerald-100 text-emerald-900 font-bold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                সব ক্যাটাগরি (All)
              </button>
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-0.5">
                  <button
                    onClick={() => updateQuery('category_slug', cat.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      categorySlug === cat.slug
                        ? 'bg-emerald-100 text-emerald-900 font-bold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{locale === 'bn' ? cat.name_bn : cat.name_en}</span>
                  </button>
                  {cat.children && (
                    <div className="pl-3 space-y-0.5 border-l-2 border-emerald-100 ml-2">
                      {cat.children.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => updateQuery('category_slug', sub.slug)}
                          className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition ${
                            categorySlug === sub.slug
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {locale === 'bn' ? sub.name_bn : sub.name_en}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Book Condition Chips (Section 8.2) */}
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
              {t('search.condition')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: '', label: 'সব' },
                { key: BookCondition.NEW, label: t('condition.new') },
                { key: BookCondition.LIKE_NEW, label: t('condition.like_new') },
                { key: BookCondition.GOOD, label: t('condition.good') },
                { key: BookCondition.ACCEPTABLE, label: t('condition.acceptable') },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => updateQuery('condition', c.key || null)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    condition === c.key
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter (BDT) */}
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
              {t('search.price_range')}
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="মিনিমাম"
                value={minPrice}
                onChange={(e) => updateQuery('min_price', e.target.value)}
                className="w-1/2 px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="সর্বোচ্চ"
                value={maxPrice}
                onChange={(e) => updateQuery('max_price', e.target.value)}
                className="w-1/2 px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Language Chips */}
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
              {t('search.language')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: '', label: 'সব' },
                { key: 'bn', label: 'বাংলা' },
                { key: 'en', label: 'English' },
              ].map((l) => (
                <button
                  key={l.key}
                  onClick={() => updateQuery('language', l.key || null)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    language === l.key
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Author Filter Dropdown */}
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
              {t('search.author')}
            </h4>
            <select
              value={authorId}
              onChange={(e) => updateQuery('author_id', e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-300 focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">সব লেখক (All Authors)</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {locale === 'bn' ? a.name_bn : a.name_en}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Books Results Column */}
        <div className="sm:col-span-3 space-y-6">
          {/* Active Filter Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-900">সক্রিয় ফিল্টার:</span>
              {q && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-xs font-medium">
                  অনুসন্ধান: {q}
                  <button onClick={() => removeSingleFilter('q')}>
                    <X className="w-3 h-3 hover:text-red-700" />
                  </button>
                </span>
              )}
              {categorySlug && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-xs font-medium">
                  ক্যাটাগরি: {categorySlug}
                  <button onClick={() => removeSingleFilter('category_slug')}>
                    <X className="w-3 h-3 hover:text-red-700" />
                  </button>
                </span>
              )}
              {condition && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-xs font-medium">
                  অবস্থা: {t(`condition.${condition}`)}
                  <button onClick={() => removeSingleFilter('condition')}>
                    <X className="w-3 h-3 hover:text-red-700" />
                  </button>
                </span>
              )}
              {isRare && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
                  দুর্লভ ও সংগ্রাহক
                  <button onClick={() => removeSingleFilter('is_rare')}>
                    <X className="w-3 h-3 hover:text-red-700" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:underline font-semibold ml-auto"
              >
                সব মুছুন
              </button>
            </div>
          )}

          {/* Book Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            /* Zero Results State with Concrete Suggestions per Section 8.2 */
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Info className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">{t('search.no_results')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                  {t('search.try_relaxing_filters')}। ফিল্টার শিথিল করে আবার অনুসন্ধান করুন অথবা নিচের
                  একই ঘরানার জনপ্রিয় বইগুলো দেখতে পারেন।
                </p>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition"
                >
                  ফিল্টার সরিয়ে সব বই দেখুন
                </button>
              )}

              {/* Fallback Similar Books Section */}
              {fallbackBooks.length > 0 && (
                <div className="pt-8 border-t border-gray-100 text-left">
                  <h4 className="text-base font-bold text-gray-900 mb-4">
                    {t('search.similar_books')}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {fallbackBooks.map((fb) => (
                      <BookCard key={fb.id} book={fb} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Condition Reference Modal (Section 8.2 & 15) */}
      {conditionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-200" />
                <span>বইয়ের অবস্থার প্রমিত মানদণ্ড (Condition Standards)</span>
              </h3>
              <button onClick={() => setConditionModalOpen(false)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-0.5">
                  একদম নতুন (New)
                </span>
                <p className="text-gray-600">{t('condition.new_desc')}</p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                <span className="font-bold text-teal-900 block mb-0.5">
                  নতুনের মত (Like New)
                </span>
                <p className="text-gray-600">{t('condition.like_new_desc')}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="font-bold text-blue-900 block mb-0.5">
                  ভালো (Good)
                </span>
                <p className="text-gray-600">{t('condition.good_desc')}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-900 block mb-0.5">
                  চলনসই (Acceptable)
                </span>
                <p className="text-gray-600">{t('condition.acceptable_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchAndBrowsePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-gray-500">লোড হচ্ছে...</div>}>
      <SearchAndBrowseContent />
    </Suspense>
  );
}
