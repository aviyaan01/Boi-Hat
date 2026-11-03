'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import {
  CourierParcel,
  CourierParcelStatus,
  CourierProvider,
} from '@boi-hat/shared-types';

interface CourierTrackingModalProps {
  trackingId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export default function CourierTrackingModal({
  trackingId,
  isOpen,
  onClose,
  onStatusChange,
}: CourierTrackingModalProps) {
  const [parcel, setParcel] = useState<CourierParcel | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTracking = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<CourierParcel>(`/couriers/track/${trackingId}`);
      if (res.success && res.data) {
        setParcel(res.data);
      } else {
        setError(res.error?.message || 'ট্র্যাকিং তথ্য পাওয়া যায়নি');
      }
    } catch (e: any) {
      setError(e.message || 'নেটওয়ার্ক সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && trackingId) {
      loadTracking();
    }
  }, [isOpen, trackingId]);

  if (!isOpen) return null;

  const handleSimulateEvent = async (nextStatus: CourierParcelStatus) => {
    setSimulating(true);
    try {
      const res = await fetchApi<any>('/couriers/mock/simulate', {
        method: 'POST',
        body: JSON.stringify({
          tracking_id: trackingId,
          status: nextStatus,
          location: 'Dhaka Hub',
        }),
      });

      if (res.success) {
        await loadTracking();
        if (onStatusChange) onStatusChange();
      }
    } catch (e) {
      alert('সিমুলেশন ব্যর্থ হয়েছে');
    } finally {
      setSimulating(false);
    }
  };

  const getStatusStepIndex = (status: CourierParcelStatus) => {
    switch (status) {
      case CourierParcelStatus.PENDING_PICKUP:
        return 0;
      case CourierParcelStatus.PICKED_UP:
        return 1;
      case CourierParcelStatus.IN_TRANSIT:
        return 2;
      case CourierParcelStatus.OUT_FOR_DELIVERY:
        return 3;
      case CourierParcelStatus.DELIVERED:
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = parcel ? getStatusStepIndex(parcel.status) : 0;

  const steps = [
    { title: 'বুকিং গৃহীত', en: 'Booked' },
    { title: 'পিকআপ সম্পন্ন', en: 'Picked Up' },
    { title: 'ট্রানজিট হাবে', en: 'In Transit' },
    { title: 'ডেলিভারির পথে', en: 'Out for Delivery' },
    { title: 'ডেলিভার্ড', en: 'Delivered' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {parcel?.courier_provider || 'Pathao'} Courier
            </span>
            <span className="text-[11px] text-slate-300 font-mono">
              Consignment: {parcel?.consignment_id || '---'}
            </span>
          </div>

          <h2 className="text-xl font-bold flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>লাইভ পার্সেল ট্র্যাকিং</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            ট্র্যাকিং আইডি: <span className="text-white font-bold">{trackingId}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs text-gray-500">কুরিয়ার সার্ভার থেকে ট্র্যাকিং লোড হচ্ছে...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">
              {error}
            </div>
          ) : parcel ? (
            <>
              {/* Stepper Progress Bar */}
              <div className="relative pt-2 pb-4">
                <div className="flex items-center justify-between relative z-10">
                  {steps.map((st, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={idx} className="flex flex-col items-center text-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                            isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] mt-1.5 font-bold max-w-[60px] leading-tight ${
                            isCompleted ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {st.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Connecting Track Line */}
                <div className="absolute top-5 left-4 right-4 h-0.5 bg-gray-200 -z-0">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Recipient & COD Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">প্রাপক (Recipient):</span>
                  <p className="font-bold text-gray-800">{parcel.recipient_name}</p>
                  <p className="text-[11px] text-gray-500 line-clamp-1">{parcel.recipient_address}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">ক্যাশ অন ডেলিভারি:</span>
                  <p className="font-bold text-emerald-700 text-sm">
                    {parcel.amount_to_collect > 0 ? `৳${parcel.amount_to_collect}` : 'পরিশোধিত (৳০)'}
                  </p>
                  <span className="text-[10px] text-gray-400">ডেলিভারি ফি: ৳{parcel.delivery_fee}</span>
                </div>
              </div>

              {/* Event Timeline Log */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  টাইমলাইন হিস্টোরি (Timeline):
                </h3>
                <div className="space-y-4 border-l-2 border-emerald-500/40 ml-2.5 pl-4">
                  {parcel.timeline?.map((ev, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-gray-900">{ev.title_bn}</p>
                          <span className="text-[10px] text-gray-400">
                            {new Date(ev.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{ev.description}</p>
                        {ev.location && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{ev.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sandbox Simulator Controls (Section 12 Testing) */}
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>কুরিয়ার সিমুলেটর (ল্যাব / টেস্ট পরিবেশ):</span>
                </div>
                <p className="text-[11px] text-amber-800/80">
                  বাস্তব কুরিয়ার রাইডারের মতো পরবর্তী ধাপ সিমুলেট করে অর্ডার ও এসক্রো ট্রানজিশন পরীক্ষা করুন:
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={simulating || parcel.status === CourierParcelStatus.PICKED_UP}
                    onClick={() => handleSimulateEvent(CourierParcelStatus.PICKED_UP)}
                    className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-900 transition disabled:opacity-40"
                  >
                    পিকআপ
                  </button>

                  <button
                    type="button"
                    disabled={simulating || parcel.status === CourierParcelStatus.IN_TRANSIT}
                    onClick={() => handleSimulateEvent(CourierParcelStatus.IN_TRANSIT)}
                    className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-900 transition disabled:opacity-40"
                  >
                    ট্রানজিট
                  </button>

                  <button
                    type="button"
                    disabled={simulating || parcel.status === CourierParcelStatus.DELIVERED}
                    onClick={() => handleSimulateEvent(CourierParcelStatus.DELIVERED)}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition disabled:opacity-40 shadow-sm"
                  >
                    ডেলিভার্ড ✓
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

