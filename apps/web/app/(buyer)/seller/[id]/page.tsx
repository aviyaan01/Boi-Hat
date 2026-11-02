'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '../../../../lib/i18n';
import { fetchApi } from '../../../../lib/api';
import BookCard from '../../../../components/BookCard';
import { BookDetail } from '@boi-hat/shared-types';
import { Star, MapPin, Calendar, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PublicSellerProfilePage() {
  const { id } = useParams();
  const { locale, t } = useI18n();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSeller() {
      if (!id) return;
      const res = await fetchApi<any>(`/users/${id}/public`);
      if (res.success && res.data) {
        setProfile(res.data);
      }
      setLoading(false);
    }
    loadSeller();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-800">বিক্রেতার প্রোফাইল পাওয়া যায়নি</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Seller Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`}
          alt={profile.name || 'Seller'}
          className="w-24 h-24 rounded-full object-cover border-4 border-emerald-50 shadow-md"
        />

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">{profile.name || 'বিক্রেতা'}</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 w-fit mx-auto sm:mx-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ভেরিফায়েড বিক্রেতা
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-4 h-4 fill-current" />
              {profile.rating_avg || '5.0'} ({profile.rating_count} রিভিউ)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {profile.area || 'ঢাকা'}, {profile.city || 'Dhaka'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-gray-400" />
              {profile.active_listings_count} টি সক্রিয় বই
            </span>
          </div>
        </div>
      </div>

      {/* Seller's Active Listings */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-900">
          এই বিক্রেতার সকল বই ({profile.active_listings_count})
        </h2>

        {profile.listings && profile.listings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {profile.listings.map((book: BookDetail) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">এই মুহূর্তে কোনো সক্রিয় বিজ্ঞাপন নেই।</p>
        )}
      </div>

      {/* Customer Reviews Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          <span>ক্রেতাদের রিভিউ ({profile.reviews?.length || 0})</span>
        </h2>

        {profile.reviews && profile.reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.reviews.map((rev: any) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        rev.reviewer?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${rev.reviewer?.name}`
                      }
                      alt={rev.reviewer?.name || 'Buyer'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-xs text-gray-900">
                        {rev.reviewer?.name || 'ক্রেতা'}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(rev.created_at).toLocaleDateString('bn-BD', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-gray-700 leading-relaxed">&quot;{rev.comment}&quot;</p>
                )}
                {rev.order?.book && (
                  <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-50">
                    বই:{' '}
                    <span className="text-gray-600 font-medium">
                      {rev.order.book.title_bn || rev.order.book.title_en}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">এই বিক্রেতার এখনো কোনো রিভিউ নেই।</p>
        )}
      </div>
    </div>
  );
}

