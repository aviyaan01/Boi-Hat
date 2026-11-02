'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Zap, Crown, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { FeaturedPackage, AdPackage } from '@boi-hat/shared-types';
import { fetchApi } from '../lib/api';
import { useI18n } from '../lib/i18n';

interface BoostModalProps {
  bookId: string;
  bookTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BoostModal({
  bookId,
  bookTitle,
  isOpen,
  onClose,
  onSuccess,
}: BoostModalProps) {
  const router = useRouter();
  const { formatPrice } = useI18n();
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<FeaturedPackage>(
    FeaturedPackage.FEATURED_5D,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchApi('/ad-packages')
        .then((res) => {
          if (res.success && res.data) {
            setPackages(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBoost = async (payOnline: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi(`/books/${bookId}/feature`, {
        method: 'POST',
        body: JSON.stringify({
          package_type: selectedPackage,
          pay_now: payOnline,
        }),
      });

      if (res.success && res.data) {
        if (res.data.requires_payment && res.data.gateway_url) {
          // Redirect to checkout / mock gateway
          router.push(res.data.gateway_url);
        } else {
          // Instant activation
          if (onSuccess) onSuccess();
          onClose();
        }
      } else {
        setError(res.error?.message || 'বিজ্ঞাপন বুস্ট করতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      setError(err.message || 'নেটওয়ার্ক সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  const getPackageIcon = (id: FeaturedPackage) => {
    switch (id) {
      case FeaturedPackage.URGENT_3D:
        return <Zap className="w-5 h-5 text-rose-500" />;
      case FeaturedPackage.FEATURED_HOME_7D:
        return <Crown className="w-5 h-5 text-amber-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>লিস্টিং বুস্ট ও প্রমোশন</span>
          </div>
          <h2 className="text-xl font-bold">বিজ্ঞাপন ফিচার্ড করুন</h2>
          <p className="text-emerald-100 text-xs mt-1 line-clamp-1">
            বই: <span className="font-semibold text-white">{bookTitle}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-700 block">
              উপযুক্ত প্যাকেজ নির্বাচন করুন:
            </label>

            {packages.map((pkg) => {
              const isSelected = selectedPackage === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-white shadow-sm' : 'bg-gray-100'
                      }`}
                    >
                      {getPackageIcon(pkg.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{pkg.name_bn}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{pkg.description_bn}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-black text-emerald-800">
                      {formatPrice(pkg.price)}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-medium">
                      {pkg.duration_days} দিন মেয়াদি
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">কেন বিজ্ঞাপন বুস্ট করবেন?</p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                ফিচার্ড বিজ্ঞাপন ক্যাটাগরি ও সার্চ রেজাল্ট পেজের শীর্ষে দেখায়, যা সাধারণ বিজ্ঞাপনের চেয়ে
                ৫ গুণ বেশি ক্রেতার দৃষ্টি আকর্ষণ করে ও দ্রুত বিক্রিতে সাহায্য করে।
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2.5 justify-end">
          <button
            type="button"
            onClick={() => handleBoost(false)}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition active:scale-95"
          >
            ফ্রি টেস্ট অ্যাক্টিভেশন
          </button>
          <button
            type="button"
            onClick={() => handleBoost(true)}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <span>পেমেন্ট করুন ({formatPrice(packages.find((p) => p.id === selectedPackage)?.price || 35)})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
