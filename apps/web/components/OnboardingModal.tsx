'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { fetchApi } from '../lib/api';
import { CategoryNode, Author } from '@boi-hat/shared-types';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Award,
  Compass,
  GraduationCap,
  X,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const { locale, t } = useI18n();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  // Selections
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['bn']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [catRes, authRes] = await Promise.all([
        fetchApi<CategoryNode[]>('/categories/tree'),
        fetchApi<Author[]>('/authors/search'),
      ]);
      if (catRes.success && catRes.data) {
        // Show max 8-10 options per step per Section 9.1
        setCategories(catRes.data.slice(0, 8));
      }
      if (authRes.success && authRes.data) {
        setAuthors(authRes.data.slice(0, 8));
      }
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    if (selectedCats.includes(id)) {
      setSelectedCats(selectedCats.filter((c) => c !== id));
    } else {
      setSelectedCats([...selectedCats, id]);
    }
  };

  const toggleAuthor = (id: string) => {
    if (selectedAuthors.includes(id)) {
      setSelectedAuthors(selectedAuthors.filter((a) => a !== id));
    } else {
      setSelectedAuthors([...selectedAuthors, id]);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    await fetchApi('/users/me/preferences/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        category_ids: selectedCats,
        author_ids: selectedAuthors,
        languages: selectedLanguages,
      }),
    });
    setSaving(false);
    onClose();
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <h3 className="text-lg font-bold">
                {step === 1 && 'আপনি কী ধরনের বই পড়তে ভালোবাসেন?'}
                {step === 2 && 'আপনার পছন্দের লেখক নির্বাচন করুন'}
                {step === 3 && 'পছন্দের ভাষা নির্বাচন করুন'}
              </h3>
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              ধাপ {step} / ৩ — আপনার পছন্দের ভিত্তিতে হোমপেজে বই সুপারিশ করা হবে
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="text-xs text-emerald-100 hover:text-white px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            এড়িয়ে যান (Skip)
          </button>
        </div>

        {/* Step 1: Categories (Min 3 required) */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>সর্বনিম্ন ৩টি ক্যাটাগরি বেছে নিন:</span>
              <span className={`font-bold ${selectedCats.length >= 3 ? 'text-emerald-700' : 'text-amber-600'}`}>
                {selectedCats.length} টি নির্বাচিত
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
              {categories.map((cat) => {
                const isSelected = selectedCats.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-2 right-2" />
                    )}
                    <span className="text-xs font-bold block">
                      {locale === 'bn' ? cat.name_bn : cat.name_en}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={selectedCats.length < 3}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-40 flex items-center gap-1.5"
              >
                <span>পরবর্তী ধাপ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Authors (Optional) */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>আপনার প্রিয় ২-৩ জন লেখক বেছে নিন (ঐচ্ছিক):</span>
              <span className="font-bold text-emerald-700">{selectedAuthors.length} জন নির্বাচিত</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
              {authors.map((author) => {
                const isSelected = selectedAuthors.includes(author.id);
                return (
                  <button
                    key={author.id}
                    onClick={() => toggleAuthor(author.id)}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <img
                      src={author.photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80'}
                      alt={author.name_bn}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                    <span className="text-[11px] font-bold block truncate max-w-full">
                      {author.name_bn}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-2 right-2" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                ← পূর্ববর্তী
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                <span>পরবর্তী ধাপ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Languages */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <span className="text-xs text-gray-500 block">কোন ভাষার বই বেশি পড়তে পছন্দ করেন?</span>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'bn', label: 'বাংলা (Bengali)' },
                { key: 'en', label: 'English' },
              ].map((l) => {
                const isSelected = selectedLanguages.includes(l.key);
                return (
                  <button
                    key={l.key}
                    onClick={() => toggleLanguage(l.key)}
                    className={`p-4 rounded-2xl border text-center font-bold text-sm transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                ← পূর্ববর্তী
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition"
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'সম্পন্ন করুন (Finish)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
