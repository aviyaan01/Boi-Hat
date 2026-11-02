'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import {
  BookOpen,
  Search,
  MapPin,
  Globe,
  PlusCircle,
  User,
  MessageSquare,
  Package,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Heart,
  Bell,
  Sparkles,
} from 'lucide-react';
import AuthModal from './AuthModal';
import OnboardingModal from './OnboardingModal';
import { fetchApi } from '../lib/api';

export default function Navbar() {
  const router = useRouter();
  const { user, openAuthModal, logout } = useAuth();
  const { locale, toggleLocale, t } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      if (!user) return;
      const res = await fetchApi<any[]>('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    }
    loadNotifications();
  }, [user]);

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/books?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/books');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                  {locale === 'bn' ? 'বই হাট' : 'Boi-Hat'}
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                    ঢাকা
                  </span>
                </span>
                <span className="text-[10px] text-gray-500 -mt-1 hidden sm:inline">
                  {t('app.tagline')}
                </span>
              </div>
            </Link>

            {/* Search Bar with Banglish Support */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 max-w-xl relative hidden md:block"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('app.search_placeholder')}
                  className="w-full pl-10 pr-24 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 shadow-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold shadow-sm transition"
                >
                  {t('app.search_button')}
                </button>
              </div>
            </form>

            {/* Actions & Navigation */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <button
                onClick={toggleLocale}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 rounded-full border border-gray-200 transition"
                title="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>{locale === 'bn' ? 'English' : 'বাংলা'}</span>
              </button>

              {/* Wishlist Button (Phase 2) */}
              <Link
                href="/wishlist"
                className="p-2 text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded-full transition relative"
                title="My Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Notifications Popover (Phase 2) */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-full transition relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 divide-y divide-gray-100">
                      <div className="px-4 pb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">বিজ্ঞপ্তি (Notifications)</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">{unreadNotifCount} টি নতুন</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400">কোনো নতুন বিজ্ঞপ্তি নেই</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3 hover:bg-gray-50 transition text-xs">
                              <p className="font-bold text-gray-900">{n.title}</p>
                              <p className="text-gray-600 text-[11px] mt-0.5">{n.body}</p>
                              <span className="text-[9px] text-gray-400 mt-1 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sell a Book Button */}
              <Link
                href="/post-ad"
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-full text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden xs:inline">{t('app.sell_book')}</span>
              </Link>

              {/* User Menu / Login */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition border border-gray-200"
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.phone}`}
                      alt={user.name || user.phone}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user.name || 'সম্মানিত ব্যবহারকারী'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono truncate">{user.phone}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-emerald-100 text-emerald-800">
                          {user.role}
                        </span>
                      </div>

                      <Link
                        href="/messages"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span>{t('app.messages')}</span>
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Package className="w-4 h-4 text-emerald-600" />
                        <span>{t('app.my_orders')}</span>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>{t('app.my_listings')}</span>
                      </Link>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setOnboardingOpen(true);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>পছন্দ পরিবর্তন করুন (Preferences)</span>
                      </button>

                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 font-semibold"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                          <span>{t('app.admin_panel')}</span>
                        </Link>
                      )}

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('app.logout')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-emerald-700 hover:bg-gray-100 rounded-full transition"
                >
                  <User className="w-4 h-4" />
                  <span>{t('app.login')}</span>
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 md:hidden"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('app.search_placeholder')}
                  className="w-full pl-10 pr-20 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 text-white rounded-full text-xs font-semibold"
                >
                  {t('app.search_button')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2">
            <Link
              href="/books"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-gray-800"
            >
              {t('app.all_categories')}
            </Link>
            <Link
              href="/books?is_rare=true"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-amber-700"
            >
              দুর্লভ ও সংগ্রাহক বই (Rare & Vintage)
            </Link>
            {user && (
              <>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm text-gray-800"
                >
                  {t('app.messages')}
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm text-gray-800"
                >
                  {t('app.my_orders')}
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm text-gray-800"
                >
                  {t('app.my_listings')}
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Onboarding Preferences Modal (Section 9.1) */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => {
          // Refresh page or trigger feed reload
          window.location.reload();
        }}
      />
    </>
  );
}

