'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function Home() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(true);
  const [targetUrl, setTargetUrl] = useState<string>('/login');
  const [venueName, setVenueName] = useState<string>('Digital Restaurant');

  useEffect(() => {
    // 1. Fetch venue settings to check for website redirect or venue title
    api
      .getSettings()
      .then((settings) => {
        if (settings?.name) {
          setVenueName(settings.name);
        }
      })
      .catch(() => {})
      .finally(() => {
        // 2. Perform authentication check
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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-[var(--color-surface)] p-8 rounded-3xl border border-amber-950/20 shadow-2xl flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
          <Coffee className="w-8 h-8" />
        </div>

        <div>
          <h1 className="font-extrabold text-xl text-[var(--color-secondary)] tracking-tight">
            {venueName}
          </h1>
          <p className="text-xs text-amber-700/80 mt-1 font-medium">
            Digital Ordering System
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-900/10 border border-amber-800/20 text-xs text-amber-700 font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span>Redirecting to authentication portal...</span>
        </div>

        <a
          href={targetUrl}
          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Continue to Portal</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
