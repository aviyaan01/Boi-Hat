'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import { fetchApi } from '../../../lib/api';
import { BookDetail, CategoryNode, Role, BookStatus } from '@boi-hat/shared-types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FolderTree,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, openAuthModal } = useAuth();

  const [metrics, setMetrics] = useState<any>({
    totalUsers: 4,
    totalListings: 195,
    totalOrders: 1,
    gmv: 240,
    totalShops: 3,
  });
  const [categoriesTree, setCategoriesTree] = useState<CategoryNode[]>([]);
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [metRes, catRes] = await Promise.all([
      fetchApi('/admin/metrics'),
      fetchApi<CategoryNode[]>('/categories/tree'),
    ]);

    if (metRes.success && metRes.data) setMetrics(metRes.data);
    if (catRes.success && catRes.data) setCategoriesTree(catRes.data);
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.role === Role.ADMIN) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user || user.role !== Role.ADMIN) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">এডমিন অনুমোদন প্রয়োজন</h2>
        <p className="text-xs text-gray-500">
          এই পাতাটি কেবল প্ল্যাটফর্ম এডমিনদের জন্য নির্ধারিত।
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow"
        >
          এডমিন একাউন্টে লগইন করুন (+8801700000000)
        </button>
      </div>
    );
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameBn || !newCatNameEn) return;

    const res = await fetchApi('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({
        name_bn: newCatNameBn,
        name_en: newCatNameEn,
        parent_id: newCatParent || undefined,
      }),
    });

    if (res.success) {
      setNewCatNameBn('');
      setNewCatNameEn('');
      setNewCatParent('');
      loadData();
    } else {
      alert(res.error?.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('ক্যাটাগরি মুছে ফেলতে চান?')) return;
    const res = await fetchApi(`/admin/categories/${catId}`, { method: 'DELETE' });
    if (res.success) {
      loadData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-emerald-600" />
          <span>এডমিন কন্ট্রোল প্যানেল (Boi-Hat Admin)</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          ক্যাটাগরি ট্রির লাইভ ব্যবস্থাপনা এবং সামগ্রিক মার্কেটপ্লেস পরিসংখ্যান
        </p>
      </div>

      {/* Metrics Dashboard Cards (Section 13) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block">মোট বিজ্ঞাপিত বই</span>
            <span className="text-2xl font-black text-gray-900">{metrics.totalListings}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block">নিবন্ধিত ব্যবহারকারী</span>
            <span className="text-2xl font-black text-gray-900">{metrics.totalUsers}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block">মোট অর্ডার</span>
            <span className="text-2xl font-black text-gray-900">{metrics.totalOrders}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block">মোট জিএমভি (GMV)</span>
            <span className="text-2xl font-black text-emerald-700">৳{metrics.gmv}</span>
          </div>
        </div>
      </div>

      {/* Category Manager (CRUD UI without redeploy per Section 8.1 & 13) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-600" />
            <span>৩-স্তরের ক্যাটাগরি ম্যানেজার (Category Hierarchy Manager)</span>
          </h2>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
          <span className="text-xs font-bold text-gray-700 block">নতুন ক্যাটাগরি যুক্ত করুন:</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              placeholder="নাম (বাংলা) যেমন: আইন ও সংবিধান"
              value={newCatNameBn}
              onChange={(e) => setNewCatNameBn(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-gray-300"
            />
            <input
              type="text"
              required
              placeholder="Name (English) e.g. Law & Constitution"
              value={newCatNameEn}
              onChange={(e) => setNewCatNameEn(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-gray-300"
            />
            <select
              value={newCatParent}
              onChange={(e) => setNewCatParent(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-gray-300 bg-white"
            >
              <option value="">মূল ক্যাটাগরি (Level 1)</option>
              {categoriesTree.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_bn} ({c.name_en})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>যুক্ত করুন</span>
            </button>
          </div>
        </form>

        {/* Existing Category Tree View */}
        <div className="space-y-3">
          {categoriesTree.map((cat) => (
            <div key={cat.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">
                  {cat.name_bn} <span className="text-gray-400 font-normal">({cat.name_en})</span>
                </span>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {cat.children && (
                <div className="pl-4 space-y-1.5 border-l-2 border-emerald-300 ml-2">
                  {cat.children.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between text-xs text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                      <span>{sub.name_bn} ({sub.name_en})</span>
                      <button
                        onClick={() => handleDeleteCategory(sub.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
