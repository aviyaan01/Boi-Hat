'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { fetchApi } from '../../../lib/api';
import { OrderDetail, OrderStatus, PaymentStatus } from '@boi-hat/shared-types';
import CourierBookingModal from '../../../components/CourierBookingModal';
import CourierTrackingModal from '../../../components/CourierTrackingModal';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ShieldAlert,
  AlertCircle,
  MapPin,
  ExternalLink,
  Star,
  CreditCard,
  X,
} from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const { locale, t, formatPrice } = useI18n();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingModalOrder, setBookingModalOrder] = useState<OrderDetail | null>(null);
  const [trackingModalId, setTrackingModalId] = useState<string | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderDetail | null>(null);
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [disputeModalOrder, setDisputeModalOrder] = useState<OrderDetail | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Review modal state
  const [reviewModalOrder, setReviewModalOrder] = useState<OrderDetail | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const res = await fetchApi<OrderDetail[]>('/orders/my');
    if (res.success && res.data) {
      setOrders(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-16 h-16 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">আপনার অর্ডার দেখতে লগইন করুন</h2>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow"
        >
          লগইন / সাইনআপ
        </button>
      </div>
    );
  }

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, trackingId?: string) => {
    const res = await fetchApi(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, courier_tracking_id: trackingId }),
    });
    if (res.success) {
      loadOrders();
      setTrackingModalOrder(null);
      setTrackingIdInput('');
    } else {
      alert(res.error?.message || 'Status update failed');
    }
  };

  const handlePayOnline = async (order: OrderDetail) => {
    try {
      const res = await fetchApi<any>('/payments/init', {
        method: 'POST',
        body: JSON.stringify({
          amount: order.total_amount,
          order_id: order.id,
        }),
      });

      if (res.success && res.data?.gateway_url) {
        router.push(res.data.gateway_url);
      } else {
        alert(res.error?.message || 'Payment initiation failed');
      }
    } catch (e: any) {
      alert(e.message || 'Payment initiation error');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder) return;
    setReviewLoading(true);
    setReviewError(null);

    try {
      const res = await fetchApi(`/orders/${reviewModalOrder.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.success) {
        setReviewModalOrder(null);
        setComment('');
        setRating(5);
        await loadOrders();
      } else {
        setReviewError(res.error?.message || 'রিভিউ জমা দেওয়া সম্ভব হয়নি');
      }
    } catch (err: any) {
      setReviewError(err.message || 'নেটওয়ার্ক সমস্যা');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalOrder || !disputeReason.trim()) return;

    const res = await fetchApi(`/orders/${disputeModalOrder.id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason: disputeReason.trim() }),
    });

    if (res.success) {
      alert('বিরোধ সফলভাবে জমা হয়েছে। এডমিন টিম খতিয়ে দেখছে।');
      setDisputeModalOrder(null);
      setDisputeReason('');
      loadOrders();
    } else {
      alert(res.error?.message || 'Failed to submit dispute');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
          <Package className="w-7 h-7 text-emerald-600" />
          <span>{t('app.my_orders')} ({orders.length})</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          ক্যাশ অন ডেলিভারি অর্ডারের অবস্থা এবং কুরিয়ার ট্র্যাকিং পর্যবেক্ষণ করুন
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-4">
          <Package className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">এখনো কোনো অর্ডার করেননি</h3>
          <Link
            href="/books"
            className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            বই ব্রাউজ করুন
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isSeller = order.seller_id === user.id;
            const isBuyer = order.buyer_id === user.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-500">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        order.order_status === OrderStatus.DELIVERED
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.order_status === OrderStatus.SHIPPED
                          ? 'bg-blue-100 text-blue-800'
                          : order.order_status === OrderStatus.CONFIRMED
                          ? 'bg-indigo-100 text-indigo-800'
                          : order.order_status === OrderStatus.DISPUTED
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.order_status}
                    </span>
                    {isSeller && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                        বিক্রেতা ভিউ (Seller)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Content row */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        order.book?.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80'
                      }
                      alt={order.book?.title_bn || 'Book'}
                      className="w-16 h-20 object-cover rounded-xl border border-gray-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {order.book?.title_bn || order.book?.title_en}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ডেলিভারি ঠিকানা: {order.delivery_address}
                      </p>
                      {order.courier_tracking_id && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setTrackingModalId(order.courier_tracking_id!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-mono font-bold transition group active:scale-95 shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition" />
                            <span>
                              {order.courier_provider?.toUpperCase() || 'COURIER'}: {order.courier_tracking_id}
                            </span>
                            <span className="text-[10px] bg-blue-200/80 text-blue-900 px-1.5 py-0.5 rounded font-sans font-semibold">
                              লাইভ ট্র্যাকিং ↗
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-emerald-700 block">
                      {formatPrice(order.total_amount)}
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      পেমেন্ট: {order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'SSLCommerz'}
                    </span>
                  </div>
                </div>

                {/* Status progression actions */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    {order.order_status === OrderStatus.DELIVERED ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        ডেলিভারি সম্পন্ন হয়েছে
                      </span>
                    ) : order.order_status === OrderStatus.SHIPPED ? (
                      <span className="text-blue-700 font-medium flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        কুরিয়ারের মাধ্যমে পৌঁছানোর পথে
                      </span>
                    ) : (
                      <span>অর্ডার প্রসেসিং চলছে</span>
                    )}
                  </div>

                  {/* Seller Action Controls */}
                  {isSeller && (
                    <div className="flex items-center gap-2">
                      {order.order_status === OrderStatus.PENDING && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, OrderStatus.CONFIRMED)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                        >
                          অর্ডার নিশ্চিত করুন (Confirm)
                        </button>
                      )}
                      {order.order_status === OrderStatus.CONFIRMED && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setBookingModalOrder(order)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 active:scale-95"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>কুরিয়ার বুক করুন (Pathao/Steadfast)</span>
                          </button>
                          <button
                            onClick={() => setTrackingModalOrder(order)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                            title="কুরিয়ার ট্র্যাকিং নম্বর ম্যানুয়ালি ইনপুট করুন"
                          >
                            ম্যানুয়াল ট্র্যাকিং
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Buyer Action Controls */}
                  {isBuyer && (
                    <div className="flex items-center gap-2">
                      {order.payment_status === PaymentStatus.PENDING && (
                        <button
                          onClick={() => handlePayOnline(order)}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>অনলাইন পেমেন্ট করুন</span>
                        </button>
                      )}

                      {order.order_status === OrderStatus.SHIPPED && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, OrderStatus.DELIVERED)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1 active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>বই হাতে পেয়েছি (Mark Delivered)</span>
                        </button>
                      )}

                      {order.order_status === OrderStatus.DELIVERED && (
                        <>
                          {(order as any).review ? (
                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-xs text-amber-900">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span className="font-bold">
                                রেটিং: {(order as any).review.rating}/5
                              </span>
                              {(order as any).review.comment && (
                                <span className="text-[11px] text-gray-500 line-clamp-1 italic">
                                  &quot;{(order as any).review.comment}&quot;
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewModalOrder(order)}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span>রিভিউ দিন (Review)</span>
                            </button>
                          )}

                          <button
                            onClick={() => setDisputeModalOrder(order)}
                            className="px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>সমস্যা জানাচ্ছি (Raise Dispute)</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Courier Tracking ID Input Modal (Section 10.2: Manual courier handoff) */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>কুরিয়ার ট্র্যাকিং নম্বর দিন</span>
            </h3>
            <p className="text-xs text-gray-500">
              পাঠাও / রেডএক্স / স্টেডফাস্ট কুরিয়ারে বুকিং করে প্রাপ্ত ট্র্যাকিং নম্বরটি লিখুন:
            </p>
            <input
              type="text"
              placeholder="e.g. PT-DHK-99281"
              value={trackingIdInput}
              onChange={(e) => setTrackingIdInput(e.target.value)}
              className="w-full p-2.5 text-xs font-mono rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 uppercase font-bold"
            />
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleUpdateStatus(
                    trackingModalOrder.id,
                    OrderStatus.SHIPPED,
                    trackingIdInput || 'MANUAL-TRACK-101',
                  )
                }
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                শিপমেন্ট নিশ্চিত করুন
              </button>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raise Dispute Modal (Section 8.3 & 10.2: 48h buyer protection) */}
      {disputeModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleRaiseDispute}
            className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>৪৮ ঘণ্টা বায়ার প্রটেকশন বিরোধ (Dispute)</span>
            </h3>
            <p className="text-xs text-gray-500">
              বইটির পাতা ছেঁড়া, বর্ণনার সাথে অসঙ্গতি বা অন্য কোনো সমস্যা বিস্তারিত লিখুন:
            </p>
            <textarea
              required
              rows={3}
              placeholder="সমস্যার বিবরণ লিখুন..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow"
              >
                বিরোধ দাখিল করুন
              </button>
              <button
                type="button"
                onClick={() => setDisputeModalOrder(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Review Modal (Section 5 & 8) */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleReviewSubmit}
            className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>বই ও বিক্রেতার সার্ভিস রেটিং</span>
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalOrder(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {reviewError}
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-2">আপনার রেটিং নির্বাচন করুন (১ - ৫ স্টার):</p>
              <div className="flex items-center justify-center gap-2 py-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-500'
                          : 'fill-gray-200 text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center mt-1">
                <span className="text-xs font-bold text-amber-800">
                  {rating === 5
                    ? 'অসাধারণ (৫/৫)'
                    : rating === 4
                    ? 'ভালো (৪/৫)'
                    : rating === 3
                    ? 'মোটামুটি (৩/৫)'
                    : rating === 2
                    ? 'সন্তোষজনক নয় (২/৫)'
                    : 'খারাপ (১/৫)'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                আপনার মতামত / রিভিউ (ঐচ্ছিক):
              </label>
              <textarea
                rows={3}
                placeholder="বইটির অবস্থা ও বিক্রেতার সার্ভিস সম্পর্কে লিখুন..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={reviewLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {reviewLoading ? 'জমা দেওয়া হচ্ছে...' : 'রিভিউ সাবমিট করুন'}
              </button>
              <button
                type="button"
                onClick={() => setReviewModalOrder(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Native Courier Booking Modal (Pathao, Steadfast, RedX) */}
      {bookingModalOrder && (
        <CourierBookingModal
          isOpen={!!bookingModalOrder}
          order={bookingModalOrder}
          onClose={() => setBookingModalOrder(null)}
          onBooked={() => {
            loadOrders();
          }}
        />
      )}

      {/* Courier Live Tracking & Sandbox Simulation Modal */}
      {trackingModalId && (
        <CourierTrackingModal
          isOpen={!!trackingModalId}
          trackingId={trackingModalId}
          onClose={() => setTrackingModalId(null)}
          onStatusChange={() => {
            loadOrders();
          }}
        />
      )}
    </div>
  );
}

