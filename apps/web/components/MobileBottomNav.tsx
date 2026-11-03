'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  PlusCircle,
  Package,
  Wallet,
  Store,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: 'হোম', href: '/', icon: Home },
    { label: 'বইসমূহ', href: '/books', icon: BookOpen },
    { label: 'বিজ্ঞাপন দিন', href: '/post-ad', icon: PlusCircle, highlight: true },
    { label: 'অর্ডার', href: '/orders', icon: Package },
    { label: 'ওয়ালেট', href: '/wallet', icon: Wallet },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition active:scale-95">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

