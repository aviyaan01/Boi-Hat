'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { fetchApi } from '../../../lib/api';
import { ConversationThread, MessageItem } from '@boi-hat/shared-types';
import {
  MessageSquare,
  Send,
  BookOpen,
  User,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

function MessagesContent() {
  const { user, openAuthModal } = useAuth();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get('thread');

  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(threadParam);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load threads
  const loadThreads = async () => {
    const res = await fetchApi<ConversationThread[]>('/conversations');
    if (res.success && res.data) {
      setThreads(res.data);
      if (!activeThreadId && res.data.length > 0) {
        setActiveThreadId(res.data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadThreads();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Load messages for active thread
  useEffect(() => {
    async function loadThreadMessages() {
      if (!activeThreadId) return;
      const res = await fetchApi<MessageItem[]>(`/conversations/${activeThreadId}/messages`);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    }
    loadThreadMessages();
  }, [activeThreadId]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <MessageSquare className="w-16 h-16 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">মেসেজ দেখতে লগইন করুন</h2>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow"
        >
          লগইন / সাইনআপ
        </button>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !inputText.trim()) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    const res = await fetchApi(`/conversations/${activeThreadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: textToSend }),
    });

    setSending(false);
    if (res.success && res.data) {
      setMessages((prev) => [...prev, res.data]);
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        {/* Threads List Sidebar */}
        <div className="md:col-span-4 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>মেসেজ থ্রেড ({threads.length})</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {threads.map((t) => {
              const otherUser = t.buyer_id === user.id ? t.seller : t.buyer;
              const isActive = t.id === activeThreadId;

              return (
                <button
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`w-full p-4 text-left transition flex items-start gap-3 ${
                    isActive ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser?.name || 'User'}`}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover shrink-0 border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-xs text-gray-900 truncate">
                        {otherUser?.name || 'ব্যবহারকারী'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-800 truncate">
                      বই: {t.book?.title_bn || t.book?.title_en || 'বই'}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {t.last_message?.text || 'নতুন কথোপকথন...'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Messages Panel */}
        <div className="md:col-span-8 flex flex-col justify-between h-full bg-slate-50/40">
          {activeThread ? (
            <>
              {/* Header with Book preview */}
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 truncate max-w-md">
                      {activeThread.book?.title_bn || activeThread.book?.title_en}
                    </h3>
                    <p className="text-xs text-emerald-700 font-extrabold">
                      মূল্য: ৳{activeThread.book?.price}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/books/${activeThread.book?.id}`}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition"
                >
                  বইয়ের বিবরণ
                </Link>
              </div>

              {/* Messages timeline */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
                {messages.map((m) => {
                  const isMe = m.sender_id === user.id;

                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                        }`}
                      >
                        <p>{m.text}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 ${
                            isMe ? 'text-emerald-100' : 'text-gray-400'
                          }`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="মেসেজ লিখুন..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400 text-sm">
              কথোপকথন দেখতে বামপাশের থ্রেড নির্বাচন করুন
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-gray-500">লোড হচ্ছে...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
