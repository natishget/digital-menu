'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  Clock,
  CheckCircle2,
  Hourglass,
  ArrowLeft,
  Globe,
  Radio,
  ChefHat,
  Search,
  Sparkles,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { getSocket } from '../../providers';
import { useAppDispatch, useAppSelector } from '../../../lib/store/hooks';
import { setLanguage } from '../../../lib/store/slices/themeSlice';
import { translations } from '../../../lib/i18n/translations';
import { getRelativeTimeAgo } from '../../../lib/formatTime';

function ChickenQueueContent() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const urlOrderId = searchParams.get('orderId') || '';

  const { language, venueName } = useAppSelector((state) => state.theme);
  const t = translations[language] || translations.en;

  const [activeOrderId, setActiveOrderId] = useState<string>(urlOrderId);
  const [inputOrderId, setInputOrderId] = useState<string>('');
  const [queueData, setQueueData] = useState<any>({
    totalActive: 0,
    cookingCount: 0,
    waitingCount: 0,
    readyCount: 0,
    currentCustomerStatus: null,
    cooking: [],
    waiting: [],
    ready: [],
    all: [],
  });
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // If user has a recent order stored in localStorage and no url param, pick it up
  useEffect(() => {
    if (!activeOrderId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('lastPlacedOrderId');
      if (stored) {
        setActiveOrderId(stored);
      }
    }
  }, [activeOrderId]);

  const loadQueue = async () => {
    try {
      const data = await api.getChickenQueue(activeOrderId || undefined);
      setQueueData(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load chicken queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();

    const socket = getSocket();
    setSocketConnected(socket.connected);

    socket.emit('join:chicken_queue');

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    const handleQueueUpdated = () => {
      loadQueue();
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('chicken_queue:updated', handleQueueUpdated);
    socket.on('chicken_queue:updated_global', handleQueueUpdated);
    socket.on('kot:ticket_updated_global', handleQueueUpdated);
    socket.on('order:status_updated_global', handleQueueUpdated);

    // Fallback periodic refresh every 12 seconds
    const interval = setInterval(loadQueue, 12000);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('chicken_queue:updated', handleQueueUpdated);
      socket.off('chicken_queue:updated_global', handleQueueUpdated);
      socket.off('kot:ticket_updated_global', handleQueueUpdated);
      socket.off('order:status_updated_global', handleQueueUpdated);
      clearInterval(interval);
    };
  }, [activeOrderId]);

  const handleManualOrderFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputOrderId.trim()) {
      setActiveOrderId(inputOrderId.trim());
    }
  };

  const currentStatus = queueData.currentCustomerStatus;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
              title={t.backToMenu}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-red-600/90 text-white flex items-center justify-center font-bold shadow-md shadow-red-600/30">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base text-stone-100 tracking-wide">
                  {language === 'am' ? 'ወርፋ' : 'Chicken Orders ("ወርፋ")'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                  {venueName}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {language === 'am'
                  ? 'ቀጥታ ማብሰያ እና መጠባበቂያ ወርፋ'
                  : 'Live Cooking & Waiting Queue'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live connection badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-medium text-stone-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{socketConnected ? 'Live' : 'Polling'}</span>
            </div>

            {/* Language toggle */}
            <button
              onClick={() => dispatch(setLanguage(language === 'en' ? 'am' : 'en'))}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-800 text-stone-200 border border-stone-700 hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.languageToggle}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-6">
        {/* Customer Order Highlighting Banner (if order identified) */}
        {currentStatus && currentStatus.found && (
          <div
            className={`p-5 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
              currentStatus.status === 'PREPARING'
                ? 'bg-linear-to-r from-red-950/80 via-amber-950/80 to-stone-900 border-red-700 shadow-red-950/50'
                : currentStatus.status === 'READY'
                  ? 'bg-linear-to-r from-emerald-950/80 via-teal-950/80 to-stone-900 border-emerald-700 shadow-emerald-950/50'
                  : 'bg-linear-to-r from-amber-950/80 via-stone-900 to-stone-900 border-amber-700 shadow-amber-950/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    currentStatus.status === 'PREPARING'
                      ? 'bg-red-600 text-white animate-bounce'
                      : currentStatus.status === 'READY'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                  }`}
                >
                  {currentStatus.status === 'PREPARING' ? (
                    <Flame className="w-7 h-7" />
                  ) : currentStatus.status === 'READY' ? (
                    <Sparkles className="w-7 h-7" />
                  ) : (
                    <Hourglass className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-950/70 border border-stone-700 text-amber-300">
                      {language === 'am' ? 'የእርስዎ ትዕዛዝ' : 'Your Order'}: #{currentStatus.orderNumber}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      {currentStatus.ticketNumber}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold mt-1 text-white">
                    {currentStatus.status === 'PREPARING' && (
                      <span className="text-red-400">
                        {language === 'am'
                          ? '🔥 የእርስዎ ትዕዛዝ አሁን በማብሰል ላይ ነው!'
                          : '🔥 Your Order is NOW COOKING!'}
                      </span>
                    )}
                    {currentStatus.status === 'PENDING' && (
                      <span className="text-amber-300">
                        {language === 'am'
                          ? `⏳ በወርፋው ውስጥ ${currentStatus.positionInLine}ኛ ደረጃ ላይ ነዎት!`
                          : `⏳ You are #${currentStatus.positionInLine} in line!`}
                      </span>
                    )}
                    {currentStatus.status === 'READY' && (
                      <span className="text-emerald-400">
                        {language === 'am'
                          ? '🎉 ትዕዛዝዎ ተዘጋጅቷል! መውሰድ ይችላሉ!'
                          : '🎉 Your Order is READY for Pickup!'}
                      </span>
                    )}
                  </h2>

                  <p className="text-xs text-stone-300 mt-1">
                    {currentStatus.status === 'PREPARING' &&
                      (language === 'am'
                        ? 'ምግብዎ በኩሽና ማብሰያ ክፍል እየተዘጋጀ ነው። በቅርቡ ዝግጁ ይሆናል!'
                        : 'Your order is actively sizzling in the kitchen fryer/grill. Almost ready!')}
                    {currentStatus.status === 'PENDING' &&
                      (language === 'am'
                        ? `ከእርስዎ በፊት ${currentStatus.ordersAhead} ትዕዛዝ${currentStatus.ordersAhead === 1 ? '' : 'ዎች'} በወርፋ ላይ ይገኛሉ።`
                        : `There ${currentStatus.ordersAhead === 1 ? 'is' : 'are'} ${currentStatus.ordersAhead} order${
                            currentStatus.ordersAhead === 1 ? '' : 's'
                          } ahead of you in the queue.`)}
                    {currentStatus.status === 'READY' &&
                      (language === 'am'
                        ? 'ትዕዛዝዎ ተዘጋጅቶ በመጠባበቂያ ጠረጴዛው ላይ ዝግጁ ነው። እባክዎ ይውሰዱ!'
                        : 'Your order is hot and ready at the service counter. Enjoy!')}
                  </p>

                  {/* Customer Item Summary */}
                  {currentStatus.items && currentStatus.items.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {currentStatus.items.map((item: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-stone-900/80 border border-stone-700 text-[11px] font-medium text-stone-200"
                        >
                          {item.quantity}x{' '}
                          {language === 'am' ? item.itemNameAm : item.itemNameEn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {urlOrderId && (
                <div className="shrink-0 flex sm:flex-col items-center gap-2">
                  <Link
                    href={`/status/${urlOrderId}`}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 border border-stone-700 transition-colors"
                  >
                    {language === 'am' ? 'የትዕዛዝ ሁኔታ ገጽ' : 'Order Status Page'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Queue Overview Metric Counters */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Cooking Count */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-red-950/80 shadow-md flex items-center justify-between">
            <div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>{language === 'am' ? 'በማብሰል ላይ' : 'Now Cooking'}</span>
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-white mt-1">
                {queueData.cookingCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900 flex items-center justify-center text-red-400 font-bold">
              🔥
            </div>
          </div>

          {/* Waiting Count */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-amber-950/80 shadow-md flex items-center justify-between">
            <div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'am' ? 'በወርፋ ላይ' : 'Waiting in Line'}</span>
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-white mt-1">
                {queueData.waitingCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-900 flex items-center justify-center text-amber-400 font-bold">
              ⏳
            </div>
          </div>

          {/* Ready Count */}
          <div className="p-4 rounded-2xl bg-stone-900 border border-emerald-950/80 shadow-md flex items-center justify-between">
            <div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'am' ? 'ለመውሰድ ዝግጁ' : 'Ready'}</span>
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-white mt-1">
                {queueData.readyCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-900 flex items-center justify-center text-emerald-400 font-bold">
              ✅
            </div>
          </div>
        </div>

        {/* 3-Column Werefa Board (TV and Mobile Friendly) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* COLUMN 1: NOW COOKING */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-red-600/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-100">
                    {language === 'am' ? 'በማብሰል ላይ' : 'Now Cooking'}
                  </h3>
                  <span className="text-[10px] text-stone-400">
                    {language === 'am' ? 'በኩሽና ውስጥ እየተዘጋጀ' : 'Active on the grill / fryer'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-950 text-red-300 border border-red-800">
                {queueData.cooking.length}
              </span>
            </div>

            {queueData.cooking.length === 0 ? (
              <div className="p-8 rounded-2xl bg-stone-900/50 border border-dashed border-stone-800 text-center flex flex-col items-center justify-center gap-2 text-stone-500">
                <ChefHat className="w-8 h-8 opacity-40" />
                <p className="text-xs">
                  {language === 'am' ? 'በአሁኑ ሰዓት በማብሰል ላይ ያለ የለም' : 'No orders cooking right now'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {queueData.cooking.map((ticket: any) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    type="COOKING"
                    language={language}
                  />
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 2: WAITING IN LINE (THE WEREFA) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-amber-600/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Hourglass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-100">
                    {language === 'am' ? 'በወርፋ ላይ (መጠባበቂያ)' : 'Waiting in Line ("ወርፋ")'}
                  </h3>
                  <span className="text-[10px] text-stone-400">
                    {language === 'am' ? 'ቅደም ተከተል በወርፋ' : 'Ordered sequence'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-950 text-amber-300 border border-amber-800">
                {queueData.waiting.length}
              </span>
            </div>

            {queueData.waiting.length === 0 ? (
              <div className="p-8 rounded-2xl bg-stone-900/50 border border-dashed border-stone-800 text-center flex flex-col items-center justify-center gap-2 text-stone-500">
                <Clock className="w-8 h-8 opacity-40" />
                <p className="text-xs">
                  {language === 'am' ? 'በወርፋ ላይ የሚጠብቅ የለም' : 'Queue is currently empty'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {queueData.waiting.map((ticket: any) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    type="WAITING"
                    language={language}
                  />
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 3: READY FOR PICKUP */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-emerald-600/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-100">
                    {language === 'am' ? 'ለመውሰድ ዝግጁ' : 'Ready for Pickup'}
                  </h3>
                  <span className="text-[10px] text-stone-400">
                    {language === 'am' ? 'በካውንተር ዝግጁ' : 'Collect at counter'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {queueData.ready.length}
              </span>
            </div>

            {queueData.ready.length === 0 ? (
              <div className="p-8 rounded-2xl bg-stone-900/50 border border-dashed border-stone-800 text-center flex flex-col items-center justify-center gap-2 text-stone-500">
                <Sparkles className="w-8 h-8 opacity-40" />
                <p className="text-xs">
                  {language === 'am' ? 'ለመውሰድ የተዘጋጀ የለም' : 'No orders awaiting pickup'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {queueData.ready.map((ticket: any) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    type="READY"
                    language={language}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Find My Order Lookup Helper if user is just browsing */}
        {(!currentStatus || !currentStatus.found) && (
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-800 text-amber-400 flex items-center justify-center font-bold">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-200">
                  {language === 'am'
                    ? 'ትዕዛዝዎን በወርፋው ውስጥ ማድመቅ ይፈልጋሉ?'
                    : 'Want to highlight your exact spot in the queue?'}
                </p>
                <p className="text-[11px] text-stone-400">
                  {language === 'am'
                    ? 'የትዕዛዝ መለያዎን (Order ID) በማስገባት የእርስዎን ትዕዛዝ ያግኙ።'
                    : 'Enter your Order ID or scan directly from your table receipt.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleManualOrderFilter} className="flex items-center gap-2">
              <input
                type="text"
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value)}
                placeholder="e.g. order UUID"
                className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-600"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'am' ? 'አድምቅ' : 'Track'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

// Individual Order Card Component with Strict Privacy (No customer name, no phone, no prices)
function TicketCard({
  ticket,
  type,
  language,
}: {
  ticket: any;
  type: 'COOKING' | 'WAITING' | 'READY';
  language: string;
}) {
  const isMine = ticket.isCurrentCustomer;

  return (
    <div
      className={`p-4 rounded-xl border transition-all flex flex-col gap-2.5 relative ${
        isMine
          ? 'bg-stone-900 border-amber-500 shadow-lg shadow-amber-950/60 ring-2 ring-amber-500/50'
          : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 shadow-sm'
      }`}
    >
      {/* Current Customer Callout Badge */}
      {isMine && (
        <div className="absolute -top-2.5 right-3 bg-linear-to-r from-amber-500 to-amber-600 text-stone-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
          <span>⭐</span>
          <span>{language === 'am' ? 'የእርስዎ ትዕዛዝ' : 'YOUR ORDER'}</span>
        </div>
      )}

      {/* Card Header: Order Number and Queue Position */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-white">
            #{ticket.orderNumber}
          </span>
          <span className="text-[10px] font-mono text-stone-400 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
            {ticket.ticketNumber}
          </span>
        </div>

        {type === 'WAITING' && ticket.positionInLine && (
          <span
            className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
              isMine
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}
          >
            {language === 'am'
              ? `${ticket.positionInLine}ኛ በወርፋ`
              : `#${ticket.positionInLine} in line`}
          </span>
        )}

        {type === 'COOKING' && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-400 animate-pulse" />
            <span>{language === 'am' ? 'በማብሰል ላይ' : 'Cooking'}</span>
          </span>
        )}

        {type === 'READY' && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{language === 'am' ? 'ዝግጁ' : 'Ready'}</span>
          </span>
        )}
      </div>

      {/* Ordered Chicken Food Items (Only food item names & quantity, no customer details!) */}
      <div className="flex flex-col gap-1 pt-1 border-t border-stone-800/80">
        {ticket.items.map((item: any, idx: number) => (
          <div key={idx} className="flex items-start justify-between text-xs text-stone-200">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="font-bold text-amber-400">{item.quantity}x</span>
              <span>{language === 'am' ? item.itemNameAm : item.itemNameEn}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Elapsed Timing Badge */}
      <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-stone-500" />
          <span>{getRelativeTimeAgo(ticket.createdAt)}</span>
        </span>
        {isMine && (
          <span className="text-amber-400 font-bold">
            {type === 'COOKING'
              ? language === 'am'
                ? 'በቅርቡ ይደርሳል'
                : 'Finishing soon'
              : type === 'WAITING'
                ? language === 'am'
                  ? 'ተራዎን ይጠብቁ'
                  : 'Waiting turn'
                : language === 'am'
                  ? 'ወዲያውኑ ይውሰዱ'
                  : 'Ready for pickup'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ChickenQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
          <div className="text-center flex flex-col items-center gap-3">
            <Flame className="w-8 h-8 text-red-500 animate-spin" />
            <p className="text-xs text-stone-400">Loading Chicken Orders Werefa...</p>
          </div>
        </div>
      }
    >
      <ChickenQueueContent />
    </Suspense>
  );
}

