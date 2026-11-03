'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { fetchApi } from '../../../lib/api';
import {
  CategoryNode,
  Author,
  Publisher,
  BookCondition,
  WeightBucket,
} from '@boi-hat/shared-types';
import {
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  BookPlus,
  Camera,
  Barcode,
} from 'lucide-react';
import BarcodeScannerModal from '../../../components/BarcodeScannerModal';

export default function PostAdPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const { locale, t } = useI18n();

  // Form states
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [categoryLevel1, setCategoryLevel1] = useState('');
  const [categoryLevel2, setCategoryLevel2] = useState('');
  const [categoryLevel3, setCategoryLevel3] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [condition, setCondition] = useState<BookCondition>(BookCondition.LIKE_NEW);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [weightBucket, setWeightBucket] = useState<WeightBucket>(WeightBucket.UNDER_300G);
  const [description, setDescription] = useState('');
  const [isRare, setIsRare] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedIsbn, setScannedIsbn] = useState('');

  // Photos state (minimum 3 required, 5 for rare)
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    'https://images.unsplash.com/photo-1510172951991-856a654063f9?w=600&q=80',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Dropdown lists
  const [categoriesTree, setCategoriesTree] = useState<CategoryNode[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Author Request Modal
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [reqAuthorEn, setReqAuthorEn] = useState('');
  const [reqAuthorBn, setReqAuthorBn] = useState('');
  const [reqAuthorSuccess, setReqAuthorSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [catRes, authRes, pubRes] = await Promise.all([
        fetchApi<CategoryNode[]>('/categories/tree'),
        fetchApi<Author[]>('/authors/search'),
        fetchApi<Publisher[]>('/publishers'),
      ]);
      if (catRes.success && catRes.data) setCategoriesTree(catRes.data);
      if (authRes.success && authRes.data) setAuthors(authRes.data);
      if (pubRes.success && pubRes.data) setPublishers(pubRes.data);
    }
    loadData();
  }, []);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const handleRequestNewAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqAuthorEn || !reqAuthorBn) return;
    const res = await fetchApi('/authors/request-new', {
      method: 'POST',
      body: JSON.stringify({ name_en: reqAuthorEn, name_bn: reqAuthorBn }),
    });
    if (res.success) {
      setReqAuthorSuccess(true);
      setTimeout(() => {
        setAuthorModalOpen(false);
        setReqAuthorSuccess(false);
        setReqAuthorEn('');
        setReqAuthorBn('');
      }, 1500);
    }
  };

  const handleScannedBook = (meta: any) => {
    if (meta.title_bn) setTitleBn(meta.title_bn);
    if (meta.title_en) setTitleEn(meta.title_en || meta.title_bn);
    if (meta.description) setDescription(meta.description);
    if (meta.original_price) setOriginalPrice(String(meta.original_price));
    if (meta.isbn) setScannedIsbn(meta.isbn);

    if (meta.author && authors.length > 0) {
      const cleanAuth = meta.author.toLowerCase();
      const matched = authors.find(
        (a) =>
          a.name_bn.includes(meta.author) ||
          meta.author.includes(a.name_bn) ||
          a.name_en.toLowerCase().includes(cleanAuth),
      );
      if (matched) setAuthorId(matched.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal();
      return;
    }

    const minRequiredImages = isRare ? 5 : 3;
    if (images.length < minRequiredImages) {
      setError(
        `বিজ্ঞাপন প্রকাশের জন্য সর্বনিম্ন ${minRequiredImages}টি ছবি আবশ্যক (সামনে, পেছনে, ভেতরের পাতা/স্পাইন)।`,
      );
      return;
    }

    if (!categoryLevel1 || !categoryLevel2) {
      setError('অনুগ্রহ করে লেভেল ১ এবং লেভেল ২ ক্যাটাগরি নির্বাচন করুন।');
      return;
    }

    const selectedCategoryIds = [categoryLevel1, categoryLevel2];
    if (categoryLevel3) selectedCategoryIds.push(categoryLevel3);

    setLoading(true);
    setError(null);

    const payload = {
      title_en: titleEn || titleBn,
      title_bn: titleBn,
      author_id: authorId || undefined,
      publisher_id: publisherId || undefined,
      category_ids: selectedCategoryIds,
      description,
      condition,
      price: Number(price),
      original_price: originalPrice ? Number(originalPrice) : undefined,
      weight_bucket: weightBucket,
      is_rare: isRare,
      images,
    };

    const res = await fetchApi('/books', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.success && res.data) {
      router.push(`/books/${res.data.id}`);
    } else {
      setError(res.error?.message || 'বিজ্ঞাপন তৈরি করা যায়নি');
    }
  };

  const level1Node = categoriesTree.find((c) => c.id === categoryLevel1);
  const level2Options = level1Node?.children || [];
  const level2Node = level2Options.find((c) => c.id === categoryLevel2);
  const level3Options = level2Node?.children || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center justify-center gap-2">
          <BookPlus className="w-8 h-8 text-emerald-600" />
          <span>{t('seller.post_ad')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          আপনার ব্যবহৃত বইয়ের বিস্তারিত ও স্পষ্ট ছবি আপলোড করে ৩ মিনিটে বিজ্ঞাপন দিন
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
        {/* Quick Barcode Scanner Banner (Phase 5) */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>বারকোড ও ISBN ক্যামেরা স্ক্যানার</span>
                {scannedIsbn && (
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">
                    {scannedIsbn}
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-emerald-800">
                বইয়ের পেছনের বারকোড স্ক্যান করলে নাম, লেখক ও বিবরণ স্বয়ংক্রিয়ভাবে বসে যাবে
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>বারকোড স্ক্যান করুন</span>
          </button>
        </div>

        {/* Photo Upload Section (Min 3 required) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-gray-900">
              {t('seller.upload_photos')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <span className="text-xs text-emerald-700 font-semibold">
              {images.length} টি ছবি সংযুক্ত
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 relative group">
                <img src={img} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-80 group-hover:opacity-100 transition shadow"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                  {idx === 0 ? 'সামনের কভার' : idx === 1 ? 'পেছনের কভার' : idx === 2 ? 'ভেতরের পাতা' : `ছবি ${idx + 1}`}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="ছবির লিংক দিন (Image URL) অথবা ড্রপ করুন"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Title Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('seller.book_title_bn')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              placeholder="যেমন: দেবী, শঙ্খনীল কারাগার, পদার্থবিজ্ঞান"
              className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('seller.book_title_en')}
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Debi, Shonkhonil Karagar"
              className="w-full p-3 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Hierarchy Selection (Level 1 -> Level 2 -> Level 3 per Section 8.1) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700">
            {t('seller.category')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] text-gray-500 block mb-1">লেভেল ১ (মূল বিভাগ)</span>
              <select
                required
                value={categoryLevel1}
                onChange={(e) => {
                  setCategoryLevel1(e.target.value);
                  setCategoryLevel2('');
                  setCategoryLevel3('');
                }}
                className="w-full p-2.5 text-xs rounded-xl border border-gray-300 bg-white"
              >
                <option value="">নির্বাচন করুন</option>
                {categoriesTree.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === 'bn' ? c.name_bn : c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] text-gray-500 block mb-1">লেভেল ২ (শাখা)</span>
              <select
                required
                disabled={!categoryLevel1}
                value={categoryLevel2}
                onChange={(e) => {
                  setCategoryLevel2(e.target.value);
                  setCategoryLevel3('');
                }}
                className="w-full p-2.5 text-xs rounded-xl border border-gray-300 bg-white disabled:bg-gray-100"
              >
                <option value="">সাব-ক্যাটাগরি</option>
                {level2Options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === 'bn' ? c.name_bn : c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] text-gray-500 block mb-1">লেভেল ৩ (নির্দিষ্ট বিষয় - ঐচ্ছিক)</span>
              <select
                disabled={!categoryLevel2 || level3Options.length === 0}
                value={categoryLevel3}
                onChange={(e) => setCategoryLevel3(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-gray-300 bg-white disabled:bg-gray-100"
              >
                <option value="">ঐচ্ছিক নির্দিষ্ট বিষয়</option>
                {level3Options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === 'bn' ? c.name_bn : c.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Author Selection & Request New Author */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                {t('seller.author')}
              </label>
              <button
                type="button"
                onClick={() => setAuthorModalOpen(true)}
                className="text-[11px] text-emerald-600 font-semibold hover:underline"
              >
                + নতুন লেখক যোগ করতে অনুরোধ
              </button>
            </div>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-gray-300 bg-white"
            >
              <option value="">লেখক নির্বাচন করুন...</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name_bn} ({a.name_en})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('seller.publisher')}
            </label>
            <select
              value={publisherId}
              onChange={(e) => setPublisherId(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-gray-300 bg-white"
            >
              <option value="">প্রকাশক নির্বাচন করুন...</option>
              {publishers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_bn} ({p.name_en})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Book Condition (Section 8.2) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            বইয়ের অবস্থা (Condition) <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { key: BookCondition.NEW, label: t('condition.new'), desc: t('condition.new_desc') },
              { key: BookCondition.LIKE_NEW, label: t('condition.like_new'), desc: t('condition.like_new_desc') },
              { key: BookCondition.GOOD, label: t('condition.good'), desc: t('condition.good_desc') },
              { key: BookCondition.ACCEPTABLE, label: t('condition.acceptable'), desc: t('condition.acceptable_desc') },
            ].map((c) => (
              <button
                type="button"
                key={c.key}
                onClick={() => setCondition(c.key)}
                className={`p-3 rounded-2xl border text-left transition ${
                  condition === c.key
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="font-bold text-xs block mb-1">{c.label}</span>
                <span className="text-[10px] text-gray-500 block leading-tight">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Weight Bucket Dropdown (Section 10.2: Mandatory before Phase 4) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {t('seller.weight_bucket')} <span className="text-red-500">*</span>
          </label>
          <select
            value={weightBucket}
            onChange={(e) => setWeightBucket(e.target.value as WeightBucket)}
            className="w-full p-2.5 text-xs rounded-xl border border-gray-300 bg-white"
          >
            <option value={WeightBucket.UNDER_300G}>{t('seller.under_300g')}</option>
            <option value={WeightBucket.BETWEEN_300G_1KG}>{t('seller.between_300g_1kg')}</option>
            <option value={WeightBucket.OVER_1KG}>{t('seller.over_1kg')}</option>
          </select>
        </div>

        {/* Price Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('seller.price_bdt')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-bold">৳</span>
              <input
                type="number"
                required
                min={10}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="যেমন: ১৮০"
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('seller.original_price')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-bold">৳</span>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="যেমন: ৩০০"
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Rare Book Toggle (Section 8.3) */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-950 block">
              এটি কি কোনো দুর্লভ, প্রথম সংস্করণ বা আউট-অব-প্রিন্ট বই?
            </span>
            <span className="text-[11px] text-amber-900/80">
              দুর্লভ বইয়ের ক্ষেত্রে ন্যূনতম ৫টি ছবি ও এডমিন ভেরিফিকেশন প্রযোজ্য হবে।
            </span>
          </div>
          <input
            type="checkbox"
            checked={isRare}
            onChange={(e) => setIsRare(e.target.checked)}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {t('seller.description')} <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="বইটির পাতার অবস্থা, কোনো দাগ বা ভাঁজ আছে কি না বিস্তারিত লিখুন..."
            className="w-full p-3 text-xs sm:text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition disabled:opacity-50 text-sm"
        >
          {loading ? t('seller.submitting') : t('seller.submit_listing')}
        </button>
      </form>

      {/* Author Request Modal */}
      {authorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-sm text-gray-900">নতুন লেখকের নাম অনুরোধ করুন</h3>
            {reqAuthorSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>অনুরোধ সফলভাবে পাঠানো হয়েছে!</span>
              </div>
            ) : (
              <form onSubmit={handleRequestNewAuthor} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="লেখকের নাম (বাংলা) যেমন: হুমায়ূন আহমেদ"
                  value={reqAuthorBn}
                  onChange={(e) => setReqAuthorBn(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-300"
                />
                <input
                  type="text"
                  required
                  placeholder="Author Name (English) e.g. Humayun Ahmed"
                  value={reqAuthorEn}
                  onChange={(e) => setReqAuthorEn(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-300"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                  >
                    অনুরোধ জমা দিন
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthorModalOpen(false)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded-xl"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal (Phase 5) */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleScannedBook}
      />
    </div>
  );
}

