'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Utensils,
  Coffee,
  CreditCard,
  MonitorCheck,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Globe,
  Leaf,
  UserCheck,
  Sliders,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../lib/store/hooks';
import { setLanguage, toggleFastingFilter } from '../lib/store/slices/themeSlice';
import { translations } from '../lib/i18n/translations';
import { api } from '../lib/api';

export default function Home() {
  const dispatch = useAppDispatch();
  const { language, isFastingOnly, venueName, serviceModel } = useAppSelector(
    (state) => state.theme,
  );
  const t = translations[language];

  const [demoQrLink, setDemoQrLink] = useState('/menu?table_id=1&token=tbl1-tok-8f92a4e1');

  useEffect(() => {
    // Fetch active tables to construct precise Table 1 demo link
    api
      .getTables()
      .then((tables) => {
        if (tables && tables.length > 0) {
          const t1 = tables[0];
          setDemoQrLink(`/menu?table_id=${t1.id}&token=${t1.qrToken}`);
        }
      })
      .catch((err) => console.error('Error loading demo tables:', err));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col font-sans">
      {/* Top Staff Quick Portal Bar */}
      <div className="bg-stone-900 text-stone-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-stone-300">Quick Staff Portals & One-Click Demo Access:</span>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <Link href="/login" className="hover:text-amber-400 transition-colors flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-amber-400" />
            <span>Staff Login</span>
          </Link>
          <span className="text-stone-700">|</span>
          <Link href="/waiter" className="hover:text-blue-400 transition-colors flex items-center gap-1">
            <Utensils className="w-3 h-3 text-blue-400" />
            <span>Waiter POS (PIN 1234)</span>
          </Link>
          <span className="text-stone-700">|</span>
          <Link href="/cashier" className="hover:text-purple-400 transition-colors flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-purple-400" />
            <span>Cashier View</span>
          </Link>
          <span className="text-stone-700">|</span>
          <Link href="/kds" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            <MonitorCheck className="w-3 h-3 text-emerald-400" />
            <span>KDS Display</span>
          </Link>
          <span className="text-stone-700">|</span>
          <Link href="/admin" className="hover:text-amber-400 transition-colors flex items-center gap-1">
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>Admin Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-amber-950/10 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/30">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-tight text-[var(--color-secondary)]">
                {t.venueTitle}
              </h1>
              <p className="text-xs text-amber-700/80 font-medium">
                {t.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher Button */}
            <button
              onClick={() => dispatch(setLanguage(language === 'en' ? 'am' : 'en'))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors border border-amber-300/60"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.languageToggle}</span>
            </button>

            {/* Fasting Toggle Button */}
            <button
              onClick={() => dispatch(toggleFastingFilter())}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                isFastingOnly
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>{t.fastingFilter}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col gap-10">
        {/* Banner Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 text-white p-8 md:p-12 shadow-xl">
          <div className="relative z-10 max-w-2xl flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-medium backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cloud-Based Ethiopian Dining System</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Cloud QR Digital Menu & KOT Station Engine
            </h2>
            <p className="text-amber-100/90 text-sm md:text-base leading-relaxed">
              Experience seamless self-service QR ordering, instant KOT ticket splitting for Barista & Kitchen, fast Waiter tablet PIN ordering, and live WebSockets status updates.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link
                href={demoQrLink}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2 group"
              >
                <QrCode className="w-5 h-5" />
                <span>Simulate Customer Table 1 QR Scan</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <Utensils className="w-96 h-96" />
          </div>
        </section>

        {/* Portal Cards Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-[var(--color-secondary)]">
              Operational Access Portals
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              Active Mode: {serviceModel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Customer Portal */}
            <Link
              href={demoQrLink}
              className="group p-5 rounded-2xl bg-[var(--color-surface)] border border-amber-950/10 hover:border-amber-500/50 hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-amber-600 group-hover:underline">
                  Open Customer Menu &rarr;
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[var(--color-text)]">
                  Customer QR Menu
                </h4>
                <p className="text-xs text-amber-900/70 mt-1">
                  Bilingual menu, Ethiopian modifiers, fasting filter, cart & checkout.
                </p>
              </div>
            </Link>

            {/* Waiter Portal */}
            <Link
              href="/waiter"
              className="group p-5 rounded-2xl bg-[var(--color-surface)] border border-amber-950/10 hover:border-amber-500/50 hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-blue-600 group-hover:underline">
                  Staff POS (PIN 1234) &rarr;
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[var(--color-text)]">
                  Waiter Tablet POS
                </h4>
                <p className="text-xs text-amber-900/70 mt-1">
                  4-digit PIN login, table selector, and quick item order punching.
                </p>
              </div>
            </Link>

            {/* KDS Portal */}
            <Link
              href="/kds"
              className="group p-5 rounded-2xl bg-[var(--color-surface)] border border-amber-950/10 hover:border-amber-500/50 hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MonitorCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-emerald-600 group-hover:underline">
                  Open KDS &rarr;
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[var(--color-text)]">
                  Kitchen & Barista KDS
                </h4>
                <p className="text-xs text-amber-900/70 mt-1">
                  Station ticket queues, color-coded timing indicators, audio chimes.
                </p>
              </div>
            </Link>

            {/* Cashier & Admin Portals */}
            <Link
              href="/cashier"
              className="group p-5 rounded-2xl bg-[var(--color-surface)] border border-amber-950/10 hover:border-amber-500/50 hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-purple-600 group-hover:underline">
                  Cashier View &rarr;
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[var(--color-text)]">
                  Cashier & Table Bills
                </h4>
                <p className="text-xs text-amber-900/70 mt-1">
                  Cash payments confirmation queue and table session settlement.
                </p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
