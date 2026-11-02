'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '../../../../lib/i18n';
import { useAuth } from '../../../../lib/auth';
import { fetchApi } from '../../../../lib/api';
import { BookDetail, BookCondition, OrderStatus, PaymentMethod } from '@boi-hat/shared-types';
import {
  ShieldCheck,
  Truck,
  MessageSquare,
  ShoppingBag,
  Award,
  Sparkles,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Share2,
} from 'lucide-react';

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { locale, t, formatPrice } = useI18n();
  const { user, openAuthModal } = useAuth();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.area ? `${user.area}, Dhaka` : '');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [offerText, setOfferText] = useState('');
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  useEffect(() => {
    async function loadBook() {
      if (!id) return;
      const res = await fetchApi<BookDetail>(`/books/${id}`);
      if (res.success && res.data) {
        setBook(res.data);
        if (res.data.images?.length > 0) {
          setSelectedImage(res.data.images[0].url);
        }
      }
      setLoading(false);
    }
    loadBook();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-800">বইটি খুঁজে পাওয়া যায়নি</h2>
        <Link href="/books" className="mt-4 inline-block text-sm text-emerald-600 font-semibold hover:underline">
          ← সব বই দেখুন
        </Link>
      </div>
    );
  }

  const title = locale === 'bn' ? book.title_bn : book.title_en || book.title_bn;
  const authorName = locale === 'bn' ? book.author?.name_bn || book.author?.name_en : book.author?.name_en || book.author?.name_bn;

  const handleStartChat = async (prefilledMsg?: string) => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (user.id === book.seller_id) {
      alert('এটি আপনার নিজের দেওয়া বিজ্ঞাপন।');
      return;
    }

    const res = await fetchApi<{ id: string }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        book_id: book.id,
        initial_message: prefilledMsg || `আসসালামু আলাইকুম! "${title}" বইটি কি এখনো উপলব্ধ আছে?`,
      }),
    });

    if (res.success && res.data) {
      router.push(`/messages?thread=${res.data.id}`);
    } else {
      alert(res.error?.message || 'চ্যাট শুরু করা যায়নি');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    if (!deliveryAddress.trim()) {
      alert('অনুগ্রহ করে পূর্ণ ডেলিভারি ঠিকানা লিখুন');
      return;
    }

    setPlacingOrder(true);
    const res = await fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify({
        book_id: book.id,
        delivery_address: deliveryAddress.trim(),
        payment_method: PaymentMethod.COD,
      }),
    });
    setPlacingOrder(false);

    if (res.success && res.data) {
      setOrderSuccess(res.data);
    } else {
      alert(res.error?.message || 'অর্ডার সম্পন্ন করা যায়নি');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-emerald-700">বই হাট</Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <Link href="/books" className="hover:text-emerald-700">বইসমূহ</Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-900 font-semibold truncate max-w-xs">{title}</span>
      </nav>

      {/* Main Book Detail Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery (Section 15: min 3 photos, responsive) */}
        <div className="md:col-span-5 space-y-4">
          <div className="aspect-[3/4] w-full bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg relative flex items-center justify-center">
            <img
              src={selectedImage || book.images?.[0]?.url}
              alt={title}
              className="w-full h-full object-cover"
            />
            {book.is_rare && (
              <div className="absolute top-4 left-4 bg-indigo-950/90 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/50 shadow flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>যাচাইকৃত দুর্লভ সংস্করণ (Verified Rare)</span>
              </div>
            )}
          </div>

          {/* Thumbnails row (front, back, spine, pages) */}
          <div className="grid grid-cols-4 gap-2">
            {book.images?.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setSelectedImage(img.url)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                  selectedImage === img.url ? 'border-emerald-600 scale-95 shadow-sm' : 'border-gray-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Dhaka Delivery & Protection Pill */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>{t('book_detail.delivery_estimate')}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>{t('book_detail.cod_guarantee')}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Book Details & Actions */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {t(`condition.${book.condition}`)}
              </span>
              <span className="text-xs text-gray-500">
                ওজন: {book.weight_bucket === 'under_300g' ? '<৩০০ গ্রাম' : book.weight_bucket === 'between_300g_1kg' ? '৩০০ গ্রাম - ১ কেজি' : '১+ কেজি'}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">ভিউ: {book.view_count}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {title}
            </h1>

            {authorName && (
              <p className="text-base text-gray-600 mt-1 font-medium">
                লেখক: <span className="text-emerald-800 font-bold">{authorName}</span>
              </p>
            )}

            {book.publisher && (
              <p className="text-xs text-gray-500 mt-0.5">
                প্রকাশনী: {locale === 'bn' ? book.publisher.name_bn : book.publisher.name_en}
              </p>
            )}
          </div>

          {/* Pricing Box */}
          <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm flex items-baseline justify-between">
            <div>
              <span className="text-xs text-gray-500 block">বিক্রয় মূল্য (Price)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700">
                  {formatPrice(book.price)}
                </span>
                {book.original_price && book.original_price > book.price && (
                  <span className="text-sm text-gray-400 line-through">
                    ৳{book.original_price}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-emerald-700 font-bold block">
                ডেলিভারি চার্জ: ৳৬০ (ঢাকা)
              </span>
              <span className="text-[11px] text-gray-400">ক্যাশ অন ডেলিভারি</span>
            </div>
          </div>

          {/* Rare Details Box (Section 8.3) */}
          {book.is_rare && book.rare_details && (
            <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>সংগ্রাহক বিবরণ ও সত্যতা (Authenticity & Provenance)</span>
              </div>
              <p className="text-xs text-amber-900/80">
                <strong>মুদ্রণ ও বাঁধাই অবস্থা:</strong> {book.rare_details.printing_condition_notes || 'অক্ষত মূল বাঁধাই।'}
              </p>
              {book.rare_details.provenance && (
                <p className="text-xs text-amber-900/80">
                  <strong>উৎস / প্রোভেন্যান্স:</strong> {book.rare_details.provenance}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900">বইয়ের বিবরণ (Description)</h3>
            <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-white p-4 rounded-2xl border border-gray-200">
              {book.description}
            </div>
          </div>

          {/* Seller Profile Summary Card */}
          {book.seller && (
            <div className="p-4 rounded-3xl bg-white border border-gray-200 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <img
                  src={book.seller.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${book.seller.name}`}
                  alt={book.seller.name || 'Seller'}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    {book.seller.name || 'বিক্রেতা'}
                    {book.shop && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                        ভেরিফায়েড শপ
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center text-amber-500 font-semibold gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-current" /> {book.seller.rating_avg || '5.0'} ({book.seller.rating_count} রিভিউ)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-gray-500">
                      <MapPin className="w-3 h-3" /> {book.seller.area || 'ঢাকা'}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href={`/seller/${book.seller.id}`}
                className="text-xs font-semibold text-emerald-700 hover:underline px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 shrink-0"
              >
                প্রোফাইল দেখুন
              </Link>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                if (!user) openAuthModal();
                else setOrderModalOpen(true);
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2 text-base"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{t('book_detail.buy_cod')}</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStartChat()}
                className="py-3 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-semibold rounded-2xl transition flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>{t('book_detail.chat_seller')}</span>
              </button>

              <button
                onClick={() => {
                  if (!user) openAuthModal();
                  else setOfferModalOpen(true);
                }}
                className="py-3 px-4 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-semibold rounded-2xl transition flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{t('book_detail.make_offer')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cash On Delivery Checkout Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>{t('order.checkout_title')}</span>
              </h3>
              <button onClick={() => setOrderModalOpen(false)}>✕</button>
            </div>

            {orderSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900">
                    {t('order.order_placed_success')}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    অর্ডার নম্বর: {orderSuccess.id}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">বইয়ের মূল্য:</span>
                    <span className="font-bold">৳{orderSuccess.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ডেলিভারি চার্জ:</span>
                    <span className="font-bold">৳{orderSuccess.delivery_fee}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 text-sm font-black text-emerald-800">
                    <span>সর্বমোট (COD):</span>
                    <span>৳{orderSuccess.total_amount}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/orders"
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow transition"
                  >
                    আমার অর্ডারসমূহ দেখুন
                  </Link>
                  <button
                    onClick={() => {
                      setOrderModalOpen(false);
                      setOrderSuccess(null);
                    }}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="p-6 space-y-4 text-xs sm:text-sm">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                  <span className="text-gray-500 block text-[11px]">নির্বাচিত বই:</span>
                  <span className="font-bold text-gray-900 block truncate">{title}</span>
                  <div className="flex justify-between text-xs text-gray-700 pt-1">
                    <span>বইয়ের মূল্য: ৳{book.price}</span>
                    <span>ডেলিভারি: ৳৬০</span>
                  </div>
                  <div className="text-emerald-800 font-extrabold text-sm border-t border-gray-200 pt-1">
                    সর্বমোট পরিশোধযোগ্য: ৳{book.price + 60}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('order.shipping_address')}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={t('order.address_placeholder')}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs flex items-center gap-2 border border-amber-200">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-amber-700" />
                  <span>কুরিয়ার থেকে বই বুঝে পেয়ে মূল্য পরিশোধ করুন। ৪৮ ঘণ্টা বায়ার প্রটেকশন প্রযোজ্য।</span>
                </div>

                <button
                  type="submit"
                  disabled={placingOrder}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {placingOrder ? 'অর্ডার তৈরি হচ্ছে...' : t('order.place_order')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Make an Offer Modal (Section 8.3) */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-900">দরদাম করুন (Make an Offer)</h3>
            <p className="text-xs text-gray-500">
              বিক্রেতার সাথে সরাসরি চ্যাটে আপনার প্রস্তাবিত মূল্য পাঠান:
            </p>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-gray-500">৳</span>
              <input
                type="number"
                placeholder="প্রস্তাবিত মূল্য (যেমন: ৳১৫০)"
                value={offerText}
                onChange={(e) => setOfferText(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOfferModalOpen(false);
                  handleStartChat(`আসসালামু আলাইকুম! আমি এই বইটি ৳${offerText} দিয়ে কিনতে আগ্রহী। অনুগ্রহ করে জানাবেন বিবেচনা করা সম্ভব কি না।`);
                }}
                disabled={!offerText}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
              >
                প্রস্তাব পাঠান
              </button>
              <button
                onClick={() => setOfferModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

