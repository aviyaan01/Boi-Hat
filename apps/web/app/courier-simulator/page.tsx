'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Zap,
  CheckCircle2,
  Package,
  Search,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import {
  CourierParcel,
  CourierParcelStatus,
  CourierProvider,
} from '@boi-hat/shared-types';

export default function CourierSimulatorPage() {
  const { formatPrice } = useI18n();

  const [trackingId, setTrackingId] = useState('PT-DHK-99281');
  const [parcel, setParcel] = useState<CourierParcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [webhookLog, setWebhookLog] = useState<any[]>([]);

  const handleLookup = async (idToSearch = trackingId) => {
    if (!idToSearch.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetchApi<CourierParcel>(`/couriers/track/${idToSearch.trim()}`);
      if (res.success && res.data) {
        setParcel(res.data);
      } else {
        setMessage({
          type: 'error',
          text: res.error?.message || 'কুরিয়ার পার্সেল পাওয়া যায়নি',
        });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'নেটওয়ার্ক সমস্যা' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLookup('PT-DHK-99281');
  }, []);

  const handleSimulateStatus = async (status: CourierParcelStatus) => {
    if (!parcel) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetchApi<any>('/couriers/mock/simulate', {
        method: 'POST',
        body: JSON.stringify({
          tracking_id: parcel.tracking_id,
          status,
          location: 'Dhaka Central Hub',
        }),
      });

      if (res.success && res.data) {
        setParcel(res.data.parcel);
        setWebhookLog((prev) => [
          {
            time: new Date().toLocaleTimeString(),
            status,
            tracking_id: parcel.tracking_id,
            result: res.data.message,
          },
          ...prev,
        ]);
        setMessage({
          type: 'success',
          text: `স্ট্যাটাস সফলভাবে পরিবর্তিত হয়েছে: ${status}. সংশ্লিষ্ট অর্ডার ও এসক্রো আপডেট হয়েছে!`,
        });
      } else {
        setMessage({
          type: 'error',
          text: res.error?.message || 'সিমুলেশন ব্যর্থ হয়েছে',
        });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'ত্রুটি ঘটেছে' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStepProgress = (status: CourierParcelStatus) => {
    switch (status) {
      case CourierParcelStatus.PENDING_PICKUP:
        return 20;
      case CourierParcelStatus.PICKED_UP:
        return 40;
      case CourierParcelStatus.IN_TRANSIT:
        return 60;
      case CourierParcelStatus.OUT_FOR_DELIVERY:
        return 80;
      case CourierParcelStatus.DELIVERED:
        return 100;
      default:
        return 20;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>লজিস্টিকস ও স্বয়ংক্রিয় এসক্রো সিমুলেটর (Phase 4)</span>
          </div>
          <h1 className="text-3xl font-black">কুরিয়ার ওয়েবহুক ও লাইভ ট্র্যাকিং ল্যাব</h1>
          <p className="text-blue-200 text-sm mt-1 max-w-xl">
            পাঠাও, স্টেডফাস্ট ও রেডএক্স কুরিয়ারের রিয়েল-টাইম ওয়েবহুক ইভেন্ট টেস্ট করুন এবং কীভাবে
            ডেলিভারি সম্পন্ন হলে ৪৮ ঘণ্টা বায়ার প্রটেকশন এসক্রো স্বয়ংক্রিয়ভাবে সক্রিয় হয় তা পর্যবেক্ষণ করুন।
          </p>
        </div>
        <Link
          href="/orders"
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start shrink-0"
        >
          <span>আমার অর্ডারসমূহে যান</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Search & Lookup Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="ট্র্যাকিং আইডি লিখুন (e.g. PT-DHK-99281, SF-1002)..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>ট্র্যাকিং খুঁজুন</span>
          </button>
        </form>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Tracking Details + Simulator Controls */}
      {parcel ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Live Stepper & Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xl">
                    {parcel.courier_provider === CourierProvider.PATHAO
                      ? 'P'
                      : parcel.courier_provider === CourierProvider.STEADFAST
                      ? 'S'
                      : 'R'}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span>{parcel.courier_provider.toUpperCase()} COURIER</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                        {parcel.tracking_id}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 font-mono">
                      Consignment ID: {parcel.consignment_id} • Order #{parcel.order_id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                    parcel.status === CourierParcelStatus.DELIVERED
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {parcel.status}
                </span>
              </div>

              {/* Progress Stepper Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                  <span>বুকিং গৃহীত</span>
                  <span>পিকআপ</span>
                  <span>ট্রানজিট হাব</span>
                  <span>ডেলিভারির পথে</span>
                  <span>ডেলিভার্ড সম্পন্ন</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${getStepProgress(parcel.status)}%` }}
                  />
                </div>
              </div>

              {/* Delivery info metadata cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[11px] text-gray-400 block font-semibold">প্রাপক (Recipient):</span>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">{parcel.recipient_name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{parcel.recipient_phone}</p>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                    {parcel.recipient_address}, {parcel.recipient_city}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[11px] text-gray-400 block font-semibold">ক্যাশ অন ডেলিভারি (COD):</span>
                  <p className="text-base font-black text-emerald-700 mt-0.5">
                    {parcel.amount_to_collect > 0
                      ? formatPrice(parcel.amount_to_collect)
                      : '৳০ (অনলাইন পেইড)'}
                  </p>
                  <span className="text-[11px] text-gray-400 block mt-1">
                    ডেলিভারি ফি: {formatPrice(parcel.delivery_fee)}
                  </span>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
                  <span className="text-[11px] text-emerald-800 block font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>এসক্রো নিরাপত্তা অবস্থা:</span>
                  </span>
                  <p className="text-xs font-bold text-emerald-900 mt-1">
                    {parcel.status === CourierParcelStatus.DELIVERED
                      ? '৪৮ ঘণ্টা বায়ার প্রটেকশন উইন্ডো রানিং'
                      : 'ডেলিভারির পর ৪৮ ঘণ্টা চালু হবে'}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-1">
                    ডেলিভারি নিশ্চিত হলে টাকা বিক্রেতার ওয়ালেট পেন্ডিং-এ জমা হয়।
                  </p>
                </div>
              </div>

              {/* Timeline Events */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>লাইভ ইভেন্ট হিস্টোরি (Timeline):</span>
                </h3>
                <div className="space-y-4 border-l-2 border-blue-500/30 ml-2 pl-4">
                  {parcel.timeline?.map((ev, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-gray-900">{ev.title_bn}</p>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(ev.timestamp).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{ev.description}</p>
                      {ev.location && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{ev.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Webhook Simulation Controls */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Zap className="w-5 h-5 text-amber-600" />
                <span>কুরিয়ার ওয়েবহুক ইভেন্ট টেস্ট</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                বাস্তব পাঠাও / স্টেডফাস্ট সার্ভার যে ওয়েবহুক রিকোয়েস্ট পাঠাতো, এই বাটনগুলো দিয়ে হুবহু সেই
                কল সিমুলেট করুন:
              </p>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoading || parcel.status === CourierParcelStatus.PICKED_UP}
                  onClick={() => handleSimulateStatus(CourierParcelStatus.PICKED_UP)}
                  className="w-full py-2.5 px-4 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition flex items-center justify-between disabled:opacity-40"
                >
                  <span>১. রাইডার পিকআপ (Picked Up)</span>
                  <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded font-mono">
                    Order → SHIPPED
                  </span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading || parcel.status === CourierParcelStatus.IN_TRANSIT}
                  onClick={() => handleSimulateStatus(CourierParcelStatus.IN_TRANSIT)}
                  className="w-full py-2.5 px-4 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition flex items-center justify-between disabled:opacity-40"
                >
                  <span>২. ট্রানজিট হাব (In Transit)</span>
                  <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded font-mono">
                    Hub Sort
                  </span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading || parcel.status === CourierParcelStatus.OUT_FOR_DELIVERY}
                  onClick={() => handleSimulateStatus(CourierParcelStatus.OUT_FOR_DELIVERY)}
                  className="w-full py-2.5 px-4 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition flex items-center justify-between disabled:opacity-40"
                >
                  <span>৩. ডেলিভারির উদ্দেশ্যে রওনা (Out for Delivery)</span>
                  <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded font-mono">
                    Last Mile
                  </span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading || parcel.status === CourierParcelStatus.DELIVERED}
                  onClick={() => handleSimulateStatus(CourierParcelStatus.DELIVERED)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-between shadow-md active:scale-95 disabled:opacity-40"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>৪. ডেলিভারি সম্পন্ন (Delivered)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-800/60 px-2 py-0.5 rounded text-white font-mono">
                    Escrow Trigger!
                  </span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading || parcel.status === CourierParcelStatus.RETURNED}
                  onClick={() => handleSimulateStatus(CourierParcelStatus.RETURNED)}
                  className="w-full py-2 px-4 bg-white hover:bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold transition flex items-center justify-between disabled:opacity-40"
                >
                  <span>৫. রিটার্ন / আনডেলিভার্ড (Returned)</span>
                  <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono">
                    Fail Safe
                  </span>
                </button>
              </div>
            </div>

            {/* Webhook Activity Log */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                ওয়েবহুক অ্যাক্টিভিটি কনসোল ({webhookLog.length})
              </h3>
              {webhookLog.length === 0 ? (
                <p className="text-xs text-gray-400 italic">এখনো কোনো সিমুলেশন চালানো হয়নি...</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-[11px]">
                  {webhookLog.map((log, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between text-gray-400 text-[10px]">
                        <span>{log.time}</span>
                        <span className="font-bold text-blue-600">{log.status}</span>
                      </div>
                      <p className="text-gray-800 font-semibold mt-0.5">{log.result}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800">কোনো পার্সেল লোড করা হয়নি</h3>
          <p className="text-xs text-gray-400 mt-1">উপরে ট্র্যাকিং আইডি দিয়ে সার্চ করুন</p>
        </div>
      )}
    </div>
  );
}

