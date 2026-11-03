'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Smartphone,
  Lock,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { useI18n } from '../../../lib/i18n';

function MockGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatPrice } = useI18n();

  const tranId = searchParams.get('tran_id') || `BH-TXN-${Date.now()}`;
  const amount = Number(searchParams.get('amount')) || 100;
  const orderId = searchParams.get('order_id');
  const bookId = searchParams.get('book_id');
  const adPackage = searchParams.get('ad_package');

  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [phone, setPhone] = useState('01711111111');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleComplete = async (status: 'paid' | 'failed' | 'cancelled') => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetchApi('/payments/mock/complete', {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: tranId,
          status,
        }),
      });

      if (status === 'paid') {
        setStatusMessage({ type: 'success', text: 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে! রিডাইরেক্ট করা হচ্ছে...' });
        setTimeout(() => {
          if (adPackage || bookId) {
            router.push('/dashboard?payment=success');
          } else {
            router.push('/orders?payment=success');
          }
        }, 1200);
      } else if (status === 'cancelled') {
        setStatusMessage({ type: 'error', text: 'পেমেন্ট বাতিল করা হয়েছে।' });
        setTimeout(() => {
          router.push('/orders?payment=cancelled');
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: 'পেমেন্ট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' });
        setLoading(false);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'নেটওয়ার্ক সমস্যা' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-extrabold text-lg tracking-tight">বই-হাট</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                SSLCommerz Sandbox
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">নিরাপদ অনলাইন পেমেন্ট গেটওয়ে</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">মোট প্রদেয়</span>
            <span className="text-xl font-black text-emerald-400">{formatPrice(amount)}</span>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-700">লেনদেন আইডি: </span>
            <span className="font-mono text-[11px] text-slate-500">{tranId}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SSL 256-Bit</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 space-y-5">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              পেমেন্ট মাধ্যম বেছে নিন:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-xs font-bold transition ${
                  paymentMethod === 'bkash'
                    ? 'border-[#E2136E] bg-[#E2136E]/5 text-[#E2136E] shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-[#E2136E] text-white flex items-center justify-center font-black text-[10px]">
                  b
                </div>
                <span>বিকাশ</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('nagad')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-xs font-bold transition ${
                  paymentMethod === 'nagad'
                    ? 'border-[#F7941D] bg-[#F7941D]/5 text-[#F7941D] shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-[#F7941D] text-white flex items-center justify-center font-black text-[10px]">
                  ন
                </div>
                <span>নগদ</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-xs font-bold transition ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>কার্ড / ভিসা</span>
              </button>
            </div>
          </div>

          {/* Simulated Input Form */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                {paymentMethod === 'card' ? 'কার্ড নম্বর (সিমুলেটেড)' : 'মোবাইল নম্বর'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                {paymentMethod === 'card' ? 'CVV / PIN' : 'পিন (PIN - যে কোনো ৪ সংখ্যা)'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-widest"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleComplete('paid')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>পেমেন্ট নিশ্চিত করুন ({formatPrice(amount)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleComplete('cancelled')}
                className="py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleComplete('failed')}
                className="py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition"
              >
                ব্যর্থ সিমুলেট করুন
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 p-3 text-center border-t border-slate-200 text-[10px] text-slate-500">
          এটি একটি স্যান্ডবক্স সিমুলেশন পরিবেশ। আপনার কোনো আসল টাকা কর্তন হবে না।
        </div>
      </div>
    </div>
  );
}

export default function MockGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          লোড হচ্ছে...
        </div>
      }
    >
      <MockGatewayContent />
    </Suspense>
  );
}

