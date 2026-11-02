'use client';

import React from 'react';
import Link from 'next/link';
import { BookDetail, BookCondition } from '@boi-hat/shared-types';
import { useI18n } from '../lib/i18n';
import { MapPin, Sparkles, Award } from 'lucide-react';

interface BookCardProps {
  book: BookDetail;
}

export default function BookCard({ book }: BookCardProps) {
  const { locale, formatPrice, t } = useI18n();

  const title = locale === 'bn' ? book.title_bn : book.title_en || book.title_bn;
  const authorName =
    locale === 'bn'
      ? book.author?.name_bn || book.author?.name_en
      : book.author?.name_en || book.author?.name_bn;

  const primaryImage =
    book.images?.find((img) => img.is_primary)?.url ||
    book.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80';

  const conditionColor: Record<BookCondition, string> = {
    [BookCondition.NEW]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [BookCondition.LIKE_NEW]: 'bg-teal-100 text-teal-800 border-teal-200',
    [BookCondition.GOOD]: 'bg-blue-100 text-blue-800 border-blue-200',
    [BookCondition.ACCEPTABLE]: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  const conditionLabel = t(`condition.${book.condition}`);

  return (
    <Link
      href={`/books/${book.id}`}
      className="group bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
    >
      {/* Featured / Rare Ribbon */}
      {book.is_featured && (
        <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>ফিচার্ড</span>
        </div>
      )}
      {book.is_rare && (
        <div className="absolute top-3 right-3 z-10 bg-indigo-900/90 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-amber-400/40">
          <Award className="w-3 h-3 text-amber-400" />
          <span>দুর্লভ</span>
        </div>
      )}

      {/* Image Thumbnail */}
      <div className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden flex items-center justify-center">
        <img
          src={primaryImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Condition pill at bottom-left of image */}
        <div className="absolute bottom-2 left-2 z-10">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shadow-sm ${
              conditionColor[book.condition] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {conditionLabel}
          </span>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
            {title}
          </h3>
          {authorName && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-medium">{authorName}</p>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-emerald-700">
                {formatPrice(book.price)}
              </span>
              {book.original_price && book.original_price > book.price && (
                <span className="text-xs text-gray-400 line-through">
                  ৳{book.original_price}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>{book.seller?.area || 'ঢাকা'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
