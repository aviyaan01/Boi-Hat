'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { fetchApi } from '../../../lib/api';
import { OrderDetail, OrderStatus, PaymentStatus } from '@boi-hat/shared-types';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ShieldAlert,
  AlertCircle,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export default function OrdersPage() {
  const { user, openAuthModal } = useAuth();
  const { locale, t, formatPrice } = useI18n();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderDetail | null>(null);
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [disputeModalOrder, setDisputeModalOrder] = useState<OrderDetail | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

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
                        <p className="text-xs text-emerald-700 font-mono mt-1 font-semibold flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          ট্র্যাকিং আইডি: {order.courier_tracking_id} ({order.courier_provider})
                        </p>
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
                        <button
                          onClick={() => setTrackingModalOrder(order)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>কুরিয়ার ট্র্যাকিং দিন ও পাঠান (Ship)</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Buyer Action Controls */}
                  {isBuyer && (
                    <div className="flex items-center gap-2">
                      {order.order_status === OrderStatus.SHIPPED && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, OrderStatus.DELIVERED)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>বই হাতে পেয়েছি (Mark Delivered)</span>
                        </button>
                      )}

                      {order.order_status === OrderStatus.DELIVERED && (
                        <button
                          onClick={() => setDisputeModalOrder(order)}
                          className="px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>সমস্যা জানাচ্ছি (Raise Dispute)</span>
                        </button>
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
    </div>
  );
}

