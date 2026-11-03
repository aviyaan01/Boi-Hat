'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  Package,
  MapPin,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useI18n } from '../lib/i18n';
import {
  OrderDetail,
  CourierProvider,
  WeightBucket,
  PaymentStatus,
} from '@boi-hat/shared-types';

interface CourierBookingModalProps {
  order: OrderDetail;
  isOpen: boolean;
  onClose: () => void;
  onBooked?: (parcel: any) => void;
}

export default function CourierBookingModal({
  order,
  isOpen,
  onClose,
  onBooked,
}: CourierBookingModalProps) {
  const { formatPrice } = useI18n();

  const [provider, setProvider] = useState<CourierProvider>(CourierProvider.PATHAO);
  const [recipientName, setRecipientName] = useState(order.buyer?.name || 'ক্রেতা');
  const [recipientPhone, setRecipientPhone] = useState(order.buyer?.phone || '');
  const [recipientAddress, setRecipientAddress] = useState(order.delivery_address || '');
  const [city, setCity] = useState('Dhaka');
  const [weight, setWeight] = useState<WeightBucket>(
    order.book?.weight_bucket || WeightBucket.UNDER_300G,
  );
  const [estimatedFee, setEstimatedFee] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchApi<any>(`/couriers/estimate?city=${city}&weight=${weight}&provider=${provider}`)
        .then((res) => {
          if (res.success && res.data) {
            setEstimatedFee(res.data.delivery_fee);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, city, weight, provider]);

  if (!isOpen) return null;

  const codAmount = order.payment_status === PaymentStatus.PAID ? 0 : order.total_amount;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi<any>('/couriers/parcels', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.id,
          courier_provider: provider,
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          recipient_address: recipientAddress.trim(),
          recipient_city: city,
          item_weight: weight,
          amount_to_collect: codAmount,
        }),
      });

      if (res.success && res.data) {
        if (onBooked) onBooked(res.data);
        onClose();
      } else {
        setError(res.error?.message || 'কুরিয়ার বুকিং সম্পন্ন করা যায়নি');
      }
    } catch (err: any) {
      setError(err.message || 'নেটওয়ার্ক সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>লজিস্টিকস ও কুরিয়ার পার্সেল বুকিং</span>
          </div>
          <h2 className="text-xl font-bold">কুরিয়ার বুক করুন</h2>
          <p className="text-blue-100 text-xs mt-0.5">
            অর্ডার #{order.id.slice(0, 8)} • {order.book?.title_bn || order.book?.title_en}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleBooking} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              কুরিয়ার সার্ভিস নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider(CourierProvider.PATHAO)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-xs font-bold transition ${
                  provider === CourierProvider.PATHAO
                    ? 'border-red-500 bg-red-50/50 text-red-700 ring-2 ring-red-500/20 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black">
                  P
                </div>
                <span>পাঠাও (Pathao)</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider(CourierProvider.STEADFAST)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-xs font-bold transition ${
                  provider === CourierProvider.STEADFAST
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                  S
                </div>
                <span>স্টেডফাস্ট</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider(CourierProvider.REDX)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-xs font-bold transition ${
                  provider === CourierProvider.REDX
                    ? 'border-amber-500 bg-amber-50/50 text-amber-800 ring-2 ring-amber-500/20 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                  R
                </div>
                <span>রেডএক্স (RedX)</span>
              </button>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">প্রাপকের নাম:</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">ফোন নম্বর:</label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">ডেলিভারি ঠিকানা:</label>
              <textarea
                rows={2}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">শহর (City):</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Dhaka">ঢাকা (Dhaka)</option>
                  <option value="Chittagong">চট্টগ্রাম (Chittagong)</option>
                  <option value="Sylhet">সিলেট (Sylhet)</option>
                  <option value="Rajshahi">রাজশাহী (Rajshahi)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">ওজন (Weight):</label>
                <select
                  value={weight}
                  onChange={(e) => setWeight(e.target.value as WeightBucket)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={WeightBucket.UNDER_300G}>&lt;৩০০ গ্রাম</option>
                  <option value={WeightBucket.BETWEEN_300G_1KG}>৩০০ গ্রাম - ১ কেজি</option>
                  <option value={WeightBucket.OVER_1KG}>১+ কেজি</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & COD Notice */}
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-gray-500 block">ক্যাশ অন ডেলিভারি কালেকশন:</span>
              <span className="font-extrabold text-gray-900 text-sm">
                {codAmount > 0 ? formatPrice(codAmount) : '৳০ (অনলাইনে পরিশোধিত)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">আনুমানিক কুরিয়ার চার্জ:</span>
              <span className="font-extrabold text-blue-800 text-sm">
                {formatPrice(estimatedFee)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'বুকিং তৈরি হচ্ছে...' : 'পার্সেল বুকিং নিশ্চিত করুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
            >
              বাতিল
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

