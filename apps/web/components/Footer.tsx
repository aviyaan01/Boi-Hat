'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '../lib/i18n';
import { ShieldCheck, Truck, BookOpen, Heart, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  const { locale, t } = useI18n();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">
                {locale === 'bn' ? '৪৮ ঘণ্টার বায়ার প্রটেকশন' : '48h Buyer Protection'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {locale === 'bn'
                  ? 'বই হাতে পেয়ে পাতা ও কভার দেখে নিন। বিজ্ঞাপনের সাথে অমিল থাকলে রিফান্ড সুবিধা।'
                  : 'Inspect book condition upon delivery. Dispute window for unmatched descriptions.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">
                {locale === 'bn' ? 'ক্যাশ অন ডেলিভারি (ঢাকা)' : 'Cash on Delivery (Dhaka)'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {locale === 'bn'
                  ? 'নীলক্ষেত, বাংলাবাজার ও ঢাকার যেকোনো এলাকা থেকে ১-২ দিনে হোম ডেলিভারি।'
                  : 'Fast doorstep delivery from Nilkhet, Bangla Bazar and readers citywide.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">
                {locale === 'bn' ? 'দুর্লভ ও আউট-অব-প্রিন্ট বই' : 'Rare & Vintage Curation'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {locale === 'bn'
                  ? 'প্রথম সংস্করণ, স্বাক্ষরিত কপি ও পুরনো পত্রিকার সংরক্ষিত আর্কাইভ।'
                  : 'Curated first editions, signed literary treasures, and historic journals.'}
              </p>
            </div>
          </div>
        </div>

        {/* Links & Brand */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Boi-Hat (বই হাট) Bangladesh. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/books" className="hover:text-slate-300">
              {t('app.all_categories')}
            </Link>
            <Link href="/books?is_rare=true" className="hover:text-amber-400">
              Rare & Vintage
            </Link>
            <Link href="/post-ad" className="hover:text-emerald-400">
              {t('app.sell_book')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
