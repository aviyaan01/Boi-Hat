'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import bnDict from '../locales/bn.json';
import enDict from '../locales/en.json';

type Locale = 'bn' | 'en';

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, params?: Record<string, any>) => string;
  formatPrice: (price: number) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => BANGLA_DIGITS[parseInt(d, 10)]);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('bn'); // Bangla default per Section 14

  useEffect(() => {
    const saved = localStorage.getItem('boi_hat_locale') as Locale;
    if (saved === 'en' || saved === 'bn') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('boi_hat_locale', l);
  };

  const toggleLocale = () => {
    setLocale(locale === 'bn' ? 'en' : 'bn');
  };

  const t = (path: string, params?: Record<string, any>): string => {
    const dict = locale === 'bn' ? bnDict : enDict;
    const parts = path.split('.');
    let cur: any = dict;

    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in cur) {
        cur = cur[part];
      } else {
        return path; // fallback to key path
      }
    }

    if (typeof cur === 'string' && params) {
      let res = cur;
      for (const [key, val] of Object.entries(params)) {
        res = res.replace(new RegExp(`{${key}}`, 'g'), String(val));
      }
      return res;
    }

    return typeof cur === 'string' ? cur : path;
  };

  // Section 14: numbers default to Latin digits with a ৳ symbol for broad readability
  const formatPrice = (price: number): string => {
    return `৳${price}`;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t, formatPrice }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

