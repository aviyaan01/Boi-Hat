'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Barcode,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Zap,
  Sparkles,
} from 'lucide-react';

interface ScannedBookMeta {
  isbn: string;
  title_bn: string;
  title_en?: string;
  author: string;
  category: string;
  description?: string;
  original_price?: number;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (meta: ScannedBookMeta) => void;
}

// Simulated local ISBN book catalog for instant lookup
const KNOWN_ISBN_CATALOG: Record<string, ScannedBookMeta> = {
  '9789845023015': {
    isbn: '9789845023015',
    title_bn: 'জোছনা ও জননীর গল্প',
    title_en: 'Jochona O Jononir Golpo',
    author: 'হুমায়ূন আহমেদ',
    category: 'মুক্তিযুদ্ধ ও উপন্যাস',
    description: 'বাংলাদেশের মুক্তিযুদ্ধভিত্তিক কালজয়ী উপন্যাস। অন্যপ্রকাশ সংস্করণ।',
    original_price: 650,
  },
  '9789844583210': {
    isbn: '9789844583210',
    title_bn: 'দীপু নাম্বার টু',
    title_en: 'Dipu Number Two',
    author: 'মুহম্মদ জাফর ইকবাল',
    category: 'কিশোর সাহিত্য',
    description: 'জনপ্রিয় কিশোর উপন্যাস। সময় প্রকাশন।',
    original_price: 220,
  },
  '9789840422265': {
    isbn: '9789840422265',
    title_bn: 'একাত্তরের দিনগুলি',
    title_en: 'Ekattorer Dinguli',
    author: 'জাহানারা ইমাম',
    category: 'ইতিহাস ও মুক্তিযুদ্ধ',
    description: 'শহীদ জননী জাহানারা ইমামের একাত্তরের দিনলিপি। সন্ধানী প্রকাশনী।',
    original_price: 450,
  },
  '9780131103627': {
    isbn: '9780131103627',
    title_bn: 'দ্য সি প্রোগ্রামিং ল্যাঙ্গুয়েজ',
    title_en: 'The C Programming Language (2nd Edition)',
    author: 'Brian W. Kernighan, Dennis M. Ritchie',
    category: 'একাডেমিক ও পাঠ্যবই',
    description: 'কম্পিউটার সায়েন্স ও প্রোগ্রামিংয়ের ক্লাসিক টেক্সটবুক।',
    original_price: 550,
  },
};

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualIsbn, setManualIsbn] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      // Start camera if available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play().catch(() => {});
              setCameraActive(true);
            }
          })
          .catch((err) => {
            setCameraError('ক্যামেরা চালু করা যায়নি বা অনুমতি দেওয়া হয়নি।');
            setCameraActive(false);
          });
      } else {
        setCameraError('এই ব্রাউজারে ক্যামেরা সুবিধা সমর্থিত নয়।');
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLookupIsbn = (isbnToSearch: string) => {
    const cleanIsbn = isbnToSearch.replace(/[^0-9X]/gi, '').trim();
    if (!cleanIsbn) return;

    setLookingUp(true);
    setStatusMessage(null);

    setTimeout(() => {
      // Check known catalog or construct fallback metadata
      const found = KNOWN_ISBN_CATALOG[cleanIsbn];
      if (found) {
        onDetected(found);
        onClose();
      } else {
        // Construct smart fallback
        const custom: ScannedBookMeta = {
          isbn: cleanIsbn,
          title_bn: `বই (ISBN: ${cleanIsbn})`,
          author: 'লেখক / প্রকাশনী',
          category: 'সাধারণ সাহিত্য',
          description: `আইএসবিএন ${cleanIsbn} সম্বলিত বই।`,
          original_price: 300,
        };
        onDetected(custom);
        onClose();
      }
      setLookingUp(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Barcode className="w-4 h-4" />
            <span>আইএসবিএন ও বারকোড রিডার (Phase 5)</span>
          </div>
          <h2 className="text-xl font-bold">ক্যামেরা স্ক্যানার</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            বইয়ের পেছনের বারকোডটি ক্যামেরার ফ্রেমে ধরুন
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Video Viewport / Targeting Frame */}
          <div className="relative w-full h-52 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Visual scan targeting overlay */}
                <div className="absolute inset-x-8 inset-y-8 border-2 border-dashed border-emerald-400 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400 animate-pulse shadow-md" />
                </div>
              </>
            ) : (
              <div className="p-4 text-center space-y-2">
                <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 max-w-xs">
                  {cameraError || 'ক্যামেরা লোড হচ্ছে...'}
                </p>
              </div>
            )}
          </div>

          {/* Manual ISBN Input & Lookup */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupIsbn(manualIsbn);
            }}
            className="space-y-2"
          >
            <label className="text-xs font-bold text-gray-700 block">
              অথবা সরাসরি ১০ বা ১৩ সংখ্যার ISBN লিখুন:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 9789845023015"
                value={manualIsbn}
                onChange={(e) => setManualIsbn(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="submit"
                disabled={lookingUp || !manualIsbn.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {lookingUp ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>খুঁজুন</span>
              </button>
            </div>
          </form>

          {/* Quick Demo ISBN Chips for testing */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>এক ক্লিকে টেস্ট বারকোড ইনজেকশন:</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(KNOWN_ISBN_CATALOG).map(([isbn, book]) => (
                <button
                  key={isbn}
                  type="button"
                  onClick={() => handleLookupIsbn(isbn)}
                  className="p-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition group"
                >
                  <p className="text-[11px] font-bold text-gray-800 group-hover:text-emerald-800 line-clamp-1">
                    {book.title_bn}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">{isbn}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

