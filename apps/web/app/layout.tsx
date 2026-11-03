import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { I18nProvider } from '../lib/i18n';
import { AuthProvider } from '../lib/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';

export const metadata: Metadata = {
  title: 'Boi-Hat বই হাট - Used & Rare Book Marketplace Bangladesh',
  description: 'A two-sided marketplace for used and rare books in Dhaka, Bangladesh with Cash on Delivery and 48-hour buyer protection.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="min-h-screen flex flex-col bg-slate-50 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <I18nProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
