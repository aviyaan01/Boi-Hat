'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  Smartphone,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { fetchApi } from '../../../lib/api';
import {
  WalletSummary,
  PayoutMethod,
  PayoutStatus,
} from '@boi-hat/shared-types';

export default function SellerWalletPage() {
  const { user, openAuthModal } = useAuth();
  const { formatPrice } = useI18n();

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [releaseMessage, setReleaseMessage] = useState<string | null>(null);

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>(PayoutMethod.BKASH);
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const loadWallet = async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetchApi<WalletSummary>('/wallet');
    if (res.success && res.data) {
      setWallet(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadWallet();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleReleaseCheck = async () => {
    setReleasing(true);
    setReleaseMessage(null);
    try {
      const res = await fetchApi<any>('/wallet/release-pending', { method: 'POST' });
      if (res.success && res.data) {
        if (res.data.releasedCount > 0) {
          setReleaseMessage(
            `সফল! ${res.data.releasedCount}টি অর্ডারের মোট ${formatPrice(res.data.releasedAmount)} মূল ব্যালেন্সে যুক্ত হয়েছে।`,
          );
        } else {
          setReleaseMessage('বর্তমানে রিলিজযোগ্য কোনো পেন্ডিং এসক্রো ব্যালেন্স নেই (৪৮ ঘণ্টার মধ্যে আছে)।');
        }
        await loadWallet();
      }
    } catch (e: any) {
      setReleaseMessage('রিলিজ চেক করতে সমস্যা হয়েছে।');
    } finally {
      setReleasing(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      setPayoutError('সর্বনিম্ন উত্তোলন পরিমাণ ১০০ টাকা');
      setPayoutLoading(false);
      return;
    }

    if (!accountNumber.trim()) {
      setPayoutError('অ্যাকাউন্ট নম্বর আবশ্যক');
      setPayoutLoading(false);
      return;
    }

    try {
      const res = await fetchApi('/wallet/payout-request', {
        method: 'POST',
        body: JSON.stringify({
          amount: numAmount,
          method: payoutMethod,
          account_number: accountNumber.trim(),
          bank_name: payoutMethod === PayoutMethod.BANK ? bankName.trim() : undefined,
          branch_name: payoutMethod === PayoutMethod.BANK ? branchName.trim() : undefined,
        }),
      });

      if (res.success) {
        setIsPayoutModalOpen(false);
        setAmount('');
        setAccountNumber('');
        setBankName('');
        setBranchName('');
        await loadWallet();
      } else {
        setPayoutError(res.error?.message || 'উত্তোলন অনুরোধ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setPayoutError(err.message || 'নেটওয়ার্ক সমস্যা');
    } finally {
      setPayoutLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Wallet className="w-16 h-16 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">ওয়ালেট দেখতে লগইন করুন</h2>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow"
        >
          লগইন / সাইনআপ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-emerald-700">
              ড্যাশবোর্ড
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-800 font-semibold">বিক্রেতা ওয়ালেট</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5">
            <Wallet className="w-8 h-8 text-emerald-600" />
            <span>বিক্রেতা ওয়ালেট ও উপার্জন</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            আপনার বই বিক্রির আয়, বায়ার প্রোটেকশন এসক্রো স্ট্যাটাস ও টাকা উত্তোলন করুন
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReleaseCheck}
            disabled={releasing}
            className="px-4 py-2.5 rounded-2xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="৪৮ ঘণ্টার মেয়াদ উত্তীর্ণ অর্ডার চেক করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${releasing ? 'animate-spin' : ''}`} />
            <span>এসক্রো রিলিজ চেক</span>
          </button>

          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition flex items-center gap-2 text-xs active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>টাকা উত্তোলন করুন</span>
          </button>
        </div>
      </div>

      {releaseMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{releaseMessage}</span>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-700/20 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                উত্তোলনযোগ্য ব্যালেন্স
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black">
              {formatPrice(wallet?.available_balance || 0)}
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-emerald-100">
            <span>তাৎক্ষণিক উত্তোলনযোগ্য</span>
            <span className="font-semibold text-white">bKash / ব্যাংক</span>
          </div>
        </div>

        {/* Pending Escrow Balance */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>পেন্ডিং এসক্রো ব্যালেন্স</span>
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                ৪৮ ঘণ্টা প্রোটেকশন
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-gray-900">
              {formatPrice(wallet?.pending_balance || 0)}
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-100 text-[11px] text-gray-500">
            ডেলিভারির পর ক্রেতার কোনো অভিযোগ না থাকলে ব্যালেন্সে যোগ হবে
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                মোট উত্তোলিত অর্থ
              </span>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-gray-800">
              {formatPrice(wallet?.total_withdrawn || 0)}
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-100 text-[11px] text-gray-500">
            আপনার অ্যাকাউন্টে সফলভাবে পরিশোধিত মোট অঙ্ক
          </div>
        </div>
      </div>

      {/* Escrow Rule Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-blue-950">
            ৪৮ ঘণ্টার বায়ার প্রোটেকশন এসক্রো পলিসি
          </h3>
          <p className="text-xs text-blue-900/80 mt-1 leading-relaxed">
            ক্রেতার অর্ডার ডেলিভারি হওয়ার পর ৪৮ ঘণ্টা পর্যন্ত অর্থ পেন্ডিং অবস্থায় সংরক্ষিত থাকে। এই সময়ের মধ্যে
            ভুল বই বা পাতা ছেঁড়া নিয়ে কোনো অভিযোগ উত্থাপিত না হলে স্বয়ংক্রিয়ভাবে অর্থ আপনার উত্তোলনযোগ্য ব্যালেন্সে যোগ হবে।
          </p>
        </div>
      </div>

      {/* Tables Section: Transactions & Payout Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transaction History */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>লেনদেন বিবরণী (Ledger)</span>
            </h2>
            <span className="text-xs text-gray-400">{wallet?.transactions.length || 0}টি এন্ট্রি</span>
          </div>

          <div className="overflow-x-auto flex-1">
            {wallet?.transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">এখনো কোনো লেনদেন হয়নি</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">বিবরণ</th>
                    <th className="py-3 px-4 font-semibold">ধরন</th>
                    <th className="py-3 px-4 font-semibold text-right">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {wallet?.transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{t.description}</p>
                        <span className="text-[10px] text-gray-400">
                          {new Date(t.created_at).toLocaleDateString('bn-BD', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.type === 'credit_available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.type === 'credit_pending'
                              ? 'bg-amber-100 text-amber-800'
                              : t.type === 'withdrawal'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {t.type === 'credit_available'
                            ? 'জমা'
                            : t.type === 'credit_pending'
                            ? 'পেন্ডিং'
                            : t.type === 'withdrawal'
                            ? 'উত্তোলন'
                            : t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black">
                        <span
                          className={
                            t.type === 'withdrawal' ? 'text-purple-700' : 'text-emerald-700'
                          }
                        >
                          {t.type === 'withdrawal' ? '-' : '+'}
                          {formatPrice(t.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payout Requests */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>উত্তোলন অনুরোধের তালিকা (Payouts)</span>
            </h2>
            <span className="text-xs text-gray-400">{wallet?.payout_requests.length || 0}টি অনুরোধ</span>
          </div>

          <div className="overflow-x-auto flex-1">
            {wallet?.payout_requests.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">কোনো উত্তোলন অনুরোধ করা হয়নি</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">অ্যাকাউন্ট</th>
                    <th className="py-3 px-4 font-semibold">পরিমাণ</th>
                    <th className="py-3 px-4 font-semibold text-right">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {wallet?.payout_requests.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-gray-800">
                          {p.method === PayoutMethod.BKASH ? (
                            <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                          ) : (
                            <Building className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span className="capitalize">{p.method.toUpperCase()}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                          {p.account_number}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-black text-gray-900">
                        {formatPrice(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === PayoutStatus.PAID
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === PayoutStatus.PROCESSING
                              ? 'bg-blue-100 text-blue-800'
                              : p.status === PayoutStatus.REJECTED
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status === PayoutStatus.PAID
                            ? 'পরিশোধিত'
                            : p.status === PayoutStatus.PROCESSING
                            ? 'প্রক্রিয়াধীন'
                            : p.status === PayoutStatus.REJECTED
                            ? 'প্রত্যাখ্যাত'
                            : 'পেন্ডিং'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Payout Request Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">টাকা উত্তোলন অনুরোধ</h3>
                <p className="text-emerald-100 text-xs">
                  উপলব্ধ ব্যালেন্স: {formatPrice(wallet?.available_balance || 0)}
                </p>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-6 space-y-4">
              {payoutError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payoutError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  উত্তোলনের মাধ্যম:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod(PayoutMethod.BKASH)}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition ${
                      payoutMethod === PayoutMethod.BKASH
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>bKash (বিকাশ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMethod(PayoutMethod.BANK)}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition ${
                      payoutMethod === PayoutMethod.BANK
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>ব্যাংক একাউন্ট</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  উত্তোলনের পরিমাণ (৳):
                </label>
                <input
                  type="number"
                  placeholder="সর্বনিম্ন ১০০ টাকা"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={100}
                  max={wallet?.available_balance || 0}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {payoutMethod === PayoutMethod.BKASH
                    ? 'বিকাশ পার্সোনাল নম্বর:'
                    : 'ব্যাংক অ্যাকাউন্ট নম্বর:'}
                </label>
                <input
                  type="text"
                  placeholder={
                    payoutMethod === PayoutMethod.BKASH ? '01XXXXXXXXX' : 'অ্যাকাউন্ট নম্বর দিন'
                  }
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {payoutMethod === PayoutMethod.BANK && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ব্যাংকের নাম:
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: Islami Bank, DBBL, Brac Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      শাখা (Branch):
                    </label>
                    <input
                      type="text"
                      placeholder="শাখার নাম"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {payoutLoading ? 'অনুরোধ পাঠানো হচ্ছে...' : 'উত্তোলন কনফার্ম করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
