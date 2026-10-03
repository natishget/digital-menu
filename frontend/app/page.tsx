'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, ArrowRight, Loader2, Utensils, Lock } from 'lucide-react';
import { api } from '../lib/api';

export default function Home() {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState<string>('/login');
  const [venueName, setVenueName] = useState<string>('Abyssinia Bistro');

  useEffect(() => {
    api
      .getSettings()
      .then((settings) => {
        if (settings?.name) {
          setVenueName(settings.name);
        }
      })
      .catch(() => {})
      .finally(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
          setTargetUrl('/admin');
          router.replace('/admin');
        } else {
          setTargetUrl('/login');
          router.replace('/login');
        }
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-stone-900/90 p-8 rounded-2xl border border-stone-800 shadow-2xl flex flex-col items-center text-center gap-6">
        <div className="w-14 h-14 rounded-xl bg-amber-600/90 text-white flex items-center justify-center shadow-lg shadow-amber-600/20">
          <Coffee className="w-7 h-7" />
        </div>

        <div>
          <h1 className="font-bold text-xl text-stone-100 tracking-tight">
            {venueName}
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-medium">
            Digital QR Menu & Kitchen Ordering System
          </p>
        </div>

        <div className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-300 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Connecting to digital dining portal...</span>
        </div>

        <div className="w-full pt-2 flex flex-col gap-2.5">
          <a
            href={targetUrl}
            className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <span>Staff Portal Login</span>
            <Lock className="w-4 h-4" />
          </a>

          <a
            href="/menu"
            className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>Browse Customer Digital Menu</span>
            <Utensils className="w-4 h-4 text-amber-500" />
          </a>
        </div>
      </div>
    </div>
  );
}
