'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { fetchApi } from '../lib/api';
import { X, Phone, KeyRound, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginWithToken } = useAuth();
  const { t } = useI18n();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleRequestOtp = async (inputPhone?: string) => {
    const targetPhone = inputPhone || phone;
    if (!targetPhone) {
      setError('অনুগ্রহ করে মোবাইল নম্বর লিখুন (Please enter phone number)');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetchApi<{ dev_otp?: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone: targetPhone }),
    });

    setLoading(false);
    if (res.success && res.data) {
      setPhone(targetPhone);
      setDevOtp(res.data.dev_otp || null);
      setStep('otp');
    } else {
      setError(res.error?.message || 'Failed to send OTP code');
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code) {
      setError('অনুগ্রহ করে ৬ সংখ্যার ওটিপি কোড দিন');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetchApi<{ accessToken: string; user: any }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });

    setLoading(false);
    if (res.success && res.data) {
      loginWithToken(res.data.accessToken, res.data.user);
      // Reset state
      setStep('phone');
      setPhone('');
      setOtpCode('');
      setDevOtp(null);
    } else {
      setError(res.error?.message || 'Invalid or expired OTP code');
    }
  };

  const handleQuickDemo = (demoPhone: string) => {
    setPhone(demoPhone);
    handleRequestOtp(demoPhone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              {step === 'phone' ? t('auth.login_title') : t('auth.enter_otp')}
            </h3>
            <p className="text-xs text-emerald-100 mt-1">
              {step === 'phone' ? 'বই হাটে স্বাগতম! পাসওয়ার্ড ছাড়া সহজ লগইন' : `${phone} নম্বরে কোড পাঠানো হয়েছে`}
            </p>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'phone' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  মোবাইল নম্বর (Phone Number)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 font-medium text-lg"
                  />
                </div>
              </div>

              <button
                onClick={() => handleRequestOtp()}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'পাঠানো হচ্ছে...' : t('auth.send_otp')}
              </button>

              {/* Demo Accounts Quick Login */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                  ⚡ টেস্ট করার জন্য ডেমো একাউন্ট (Quick Demo Accounts)
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleQuickDemo('01700000000')}
                    className="text-left px-3 py-2 text-xs bg-gray-50 hover:bg-emerald-50 rounded-lg border border-gray-200 flex justify-between items-center transition"
                  >
                    <span className="font-medium text-gray-800">এডমিন একাউন্ট (Admin)</span>
                    <span className="text-gray-500 font-mono">01700000000</span>
                  </button>
                  <button
                    onClick={() => handleQuickDemo('01711111111')}
                    className="text-left px-3 py-2 text-xs bg-gray-50 hover:bg-emerald-50 rounded-lg border border-gray-200 flex justify-between items-center transition"
                  >
                    <span className="font-medium text-gray-800">বিক্রেতা (Seller - Tanvir)</span>
                    <span className="text-gray-500 font-mono">01711111111</span>
                  </button>
                  <button
                    onClick={() => handleQuickDemo('01733333333')}
                    className="text-left px-3 py-2 text-xs bg-gray-50 hover:bg-emerald-50 rounded-lg border border-gray-200 flex justify-between items-center transition"
                  >
                    <span className="font-medium text-gray-800">ক্রেতা (Buyer - Sabbir)</span>
                    <span className="text-gray-500 font-mono">01733333333</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {devOtp && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-center justify-between">
                  <div>
                    <span className="font-semibold block text-xs uppercase text-amber-700">
                      🛠️ {t('auth.dev_mode_hint')}
                    </span>
                    <span className="text-lg font-mono font-bold tracking-widest">{devOtp}</span>
                  </div>
                  <button
                    onClick={() => {
                      setOtpCode(devOtp);
                      handleVerifyOtp(devOtp);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    অটো-ফিল ও লগইন
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ৬-সংখ্যার কোড দিন (Enter 6-digit Code)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 font-mono text-xl tracking-widest text-center font-bold"
                  />
                </div>
              </div>

              <button
                onClick={() => handleVerifyOtp()}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'যাচাই করা হচ্ছে...' : t('auth.verify_otp')}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep('phone')}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  ← নম্বর পরিবর্তন করুন
                </button>
                <button
                  onClick={() => handleRequestOtp()}
                  className="text-xs text-emerald-600 font-semibold hover:underline"
                >
                  পুনরায় ওটিপি পাঠান
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
