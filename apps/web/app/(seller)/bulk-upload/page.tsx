'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  BookOpen,
  Store,
  Layers,
  Info,
  RefreshCw,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import {
  BulkImportPreviewResponse,
  BulkImportRow,
  BulkImportResult,
} from '@boi-hat/shared-types';

export default function BulkUploadPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const { formatPrice } = useI18n();

  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BulkImportPreviewResponse | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Store className="w-16 h-16 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">মার্চেন্ট বাল্ক আপলোড করতে লগইন করুন</h2>
        <p className="text-xs text-gray-500">
          নীলক্ষেত ও বাংলাবাজার বুকশপের শত শত বই এক ক্লিকে ইনভেন্টরিতে যুক্ত করতে বিক্রেতা একাউন্টে লগইন করুন।
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow"
        >
          লগইন / সাইনআপ
        </button>
      </div>
    );
  }

  const handleDownloadTemplate = () => {
    const headers = [
      'isbn',
      'title_bn',
      'title_en',
      'author',
      'category',
      'condition',
      'original_price',
      'sale_price',
      'stock_quantity',
      'shelf_location',
      'description',
    ].join(',');

    const row1 = [
      '9789845023015',
      'জোছনা ও জননীর গল্প',
      'Jochona O Jononir Golpo',
      'হুমায়ূন আহমেদ',
      'উপন্যাস',
      'GOOD',
      '650',
      '380',
      '3',
      'তাক-A1',
      'চমৎকার সংরক্ষিত কপি',
    ].join(',');

    const row2 = [
      '9789844583210',
      'দীপু নাম্বার টু',
      'Dipu Number Two',
      'মুহম্মদ জাফর ইকবাল',
      'কিশোর সাহিত্য',
      'LIKE_NEW',
      '220',
      '140',
      '5',
      'তাক-B3',
      'নতুন মতো পাতা',
    ].join(',');

    const row3 = [
      '9780131103627',
      'সি প্রোগ্রামিং ল্যাঙ্গুয়েজ',
      'C Programming Language',
      'Brian Kernighan',
      'একাডেমিক ও পাঠ্যবই',
      'ACCEPTABLE',
      '450',
      '210',
      '2',
      'CS-02',
      'কিছু দাগানো রয়েছে',
    ].join(',');

    const blob = new Blob([`${headers}\n${row1}\n${row2}\n${row3}\n`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'boi_hat_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      await parseCsv(text);
    };
    reader.readAsText(file, 'utf-8');
  };

  const parseCsv = async (content: string) => {
    if (!content.trim()) return;
    setParsing(true);
    setErrorMessage(null);

    try {
      const res = await fetchApi<BulkImportPreviewResponse>('/merchants/inventory/csv-preview', {
        method: 'POST',
        body: JSON.stringify({ csv: content }),
      });

      if (res.success && res.data) {
        setPreviewData(res.data);
      } else {
        setErrorMessage(res.error?.message || 'সিএসভি ফাইল পার্স করা সম্ভব হয়নি');
        setPreviewData(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'নেটওয়ার্ক সমস্যা');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.valid_rows === 0) return;
    setImporting(true);
    setErrorMessage(null);

    const validItems = previewData.items
      .filter((i) => i.is_valid)
      .map((i) => ({
        isbn: i.isbn,
        title_bn: i.title_bn,
        title_en: i.title_en,
        author: i.author,
        category: i.category,
        condition: i.condition,
        price: i.sale_price,
        original_price: i.original_price,
        stock_count: i.stock_quantity,
        shelf_location: i.shelf_location,
        description: i.description,
      }));

    try {
      const res = await fetchApi<BulkImportResult>('/merchants/inventory/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ items: validItems }),
      });

      if (res.success && res.data) {
        setImportResult(res.data);
        setPreviewData(null);
        setCsvContent('');
        setFileName(null);
      } else {
        setErrorMessage(res.error?.message || 'বাল্ক আপলোড সম্পন্ন হয়নি');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'ইম্পোর্ট করতে সমস্যা হয়েছে');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>নীলক্ষেত ও বাংলাবাজার মার্চেন্ট পোর্টাল (Phase 5)</span>
          </div>
          <h1 className="text-3xl font-black">বাল্ক সিএসভি ইনভেন্টরি আপলোড</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            এক ফাইলে শত শত বইয়ের স্টক সরাসরি আপলোড করুন। আইএসবিএন, বইয়ের নাম, দাম এবং তাকের নম্বর
            স্বয়ংক্রিয়ভাবে ক্যাটালগে অন্তর্ভুক্ত হবে।
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-300" />
          <span>নমুনা CSV টেমপ্লেট ডাউনলোড</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-gray-300 hover:border-emerald-500 transition text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-900">
            {fileName ? `ফাইল নির্বাচিত: ${fileName}` : 'আপনার ইনভেন্টরি CSV ফাইল নির্বাচন করুন'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            UTF-8 এনকোডিং যুক্ত .csv ফাইল সমর্থনযোগ্য (বইয়ের নাম, লেখক, দাম, অবস্থা)
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <label className="cursor-pointer px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition active:scale-95">
            <span>ফাইল ব্রাউজ করুন</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
          >
            টেমপ্লেট দেখুন
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 flex items-center gap-2 font-semibold">
          <XCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Successful Import Banner */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-base">ইনভেন্টরি আমদানি সফল হয়েছে!</h3>
              <p className="text-xs text-emerald-800">{importResult.message}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
            >
              আমার সব বই দেখুন (Dashboard)
            </Link>
            <button
              onClick={() => {
                setImportResult(null);
                setPreviewData(null);
              }}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              আরও ফাইল আপলোড করুন
            </button>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {parsing ? (
        <div className="py-12 text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-semibold">সিএসভি তথ্য বিশ্লেষণ করা হচ্ছে...</p>
        </div>
      ) : previewData ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>ফাইল প্রিভিউ ও ভ্যালিডেশন</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                মোট সারি: {previewData.total_rows} • সঠিক: {previewData.valid_rows} • অসঙ্গতি:{' '}
                {previewData.invalid_rows}
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={importing || previewData.valid_rows === 0}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>আমদানি চলছে...</span>
                </>
              ) : (
                <>
                  <span>{previewData.valid_rows}টি বই আমদানি নিশ্চিত করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-3 px-3">নং</th>
                  <th className="py-3 px-3">স্ট্যাটাস</th>
                  <th className="py-3 px-3">বইয়ের নাম (Title)</th>
                  <th className="py-3 px-3">লেখক</th>
                  <th className="py-3 px-3">বিভাগ</th>
                  <th className="py-3 px-3">অবস্থা</th>
                  <th className="py-3 px-3">বিক্রয় মূল্য</th>
                  <th className="py-3 px-3">কপি</th>
                  <th className="py-3 px-3">তাক নম্বর</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewData.items.map((row) => (
                  <tr
                    key={row.row_number}
                    className={`hover:bg-gray-50/80 transition ${
                      !row.is_valid ? 'bg-red-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-gray-400">#{row.row_number}</td>
                    <td className="py-3 px-3">
                      {row.is_valid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>সঠিক</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          <span>ভুল</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-gray-900">{row.title_bn}</p>
                      {row.isbn && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          ISBN: {row.isbn}
                        </span>
                      )}
                      {row.errors.length > 0 && (
                        <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                          {row.errors.join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-700">{row.author}</td>
                    <td className="py-3 px-3 text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px]">
                        {row.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[10px]">
                        {row.condition}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700 font-mono">
                      {formatPrice(row.sale_price)}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-700">{row.stock_quantity}টি</td>
                    <td className="py-3 px-3 font-mono text-gray-500">
                      {row.shelf_location || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
