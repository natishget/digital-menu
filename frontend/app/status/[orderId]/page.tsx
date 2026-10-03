'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Coffee,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { getSocket } from '../../providers';
import { api } from '../../../lib/api';
import { useAppSelector } from '../../../lib/store/hooks';
import { translations } from '../../../lib/i18n/translations';
import { formatOrderDateTime, getRelativeTimeAgo } from '../../../lib/formatTime';
import confetti from 'canvas-confetti';

const triggerConfetti = () => {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  } catch {
    // Ignore if canvas-confetti unavailable
  }
};

export default function OrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;
  const language = useAppSelector((state) => state.theme.language) || 'en';
  const t = translations[language] || translations.en;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const handleCustomerComplete = async () => {
    if (!orderId) return;
    setSubmittingComplete(true);
    try {
      await api.completeCustomerOrder(orderId);
      triggerConfetti();
      const updated = await api.getOrder(orderId);
      setOrder(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to complete order');
    } finally {
      setSubmittingComplete(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    api
      .getOrder(orderId)
      .then((res) => {
        setOrder(res);
        if (res.status === 'READY' || res.status === 'COMPLETED') {
          triggerConfetti();
        }
      })
      .catch((err) => setError('Order not found or access denied.'))
      .finally(() => setLoading(false));

    const socket = getSocket();
    socket.emit('join:order', { orderId });

    const handleStatusUpdated = (data: { orderId: string; status: string; order?: any }) => {
      if (data.orderId === orderId) {
        setOrder((prev: any) => {
          const updatedStatus = data.status;
          if (updatedStatus === 'READY' || updatedStatus === 'COMPLETED') {
            triggerConfetti();
          }
          return prev ? { ...prev, status: updatedStatus } : data.order;
        });
      }
    };

    socket.on('order:status_updated', handleStatusUpdated);

    return () => {
      socket.off('order:status_updated', handleStatusUpdated);
    };
  }, [orderId]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // Ignore if canvas-confetti unavailable
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
          <h2 className="text-lg font-bold text-stone-100">Order Not Found</h2>
          <p className="text-xs text-stone-400">{error}</p>
          <Link
            href="/menu"
            className="mt-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING_CASH_CONFIRMATION', label: 'Cash Confirmation', icon: Clock },
    { key: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Kitchen & Barista Preparing', icon: ChefHat },
    { key: 'READY', label: 'Ready for Pickup / Serving!', icon: Sparkles },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_CASH_CONFIRMATION':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center p-4 py-8 font-sans">
      <div className="max-w-md w-full flex flex-col gap-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/menu"
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Menu</span>
          </Link>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
            Order #{order.orderNumber}
          </span>
        </div>

        {/* Status Main Card */}
        <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400 flex items-center justify-center font-bold">
              <Coffee className="w-7 h-7" />
            </div>
            <h1 className="font-bold text-lg text-stone-100">
              Live Order Status
            </h1>
            {order.table ? (
              <p className="text-xs font-medium text-amber-400">
                Table #{order.table.number} ({order.table.name})
              </p>
            ) : (
              <p className="text-xs font-medium text-amber-400">
                Self-Served Order: {order.customerName || 'Guest'}
              </p>
            )}

            {order.createdAt && (
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-medium text-stone-300">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Ordered: {formatOrderDateTime(order.createdAt)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold ml-1">
                  {getRelativeTimeAgo(order.createdAt)}
                </span>
              </div>
            )}
          </div>

          {/* Progress Timeline */}
          <div className="flex flex-col gap-4 relative pl-4 border-l-2 border-stone-800 my-2">
            {steps.map((step, idx) => {
              const isPastOrCurrent = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-3 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all -ml-[21px] ${
                      isCurrent
                        ? 'bg-amber-600 text-white ring-4 ring-amber-950'
                        : isPastOrCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? 'text-amber-400 font-bold'
                          : isPastOrCurrent
                            ? 'text-stone-200'
                            : 'text-stone-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Current Status: <span className="text-amber-300 font-medium">{order.status}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Items Summary */}
          <div className="pt-4 border-t border-stone-800 flex flex-col gap-2.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-400">
              Ordered Items
            </h3>
            <div className="flex flex-col gap-2">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-300">
                    {item.quantity}x {item.historicalItemNameEn}
                  </span>
                  <span className="font-extrabold text-amber-400">{item.subtotal} ETB</span>
                </div>
              ))}
            </div>

            <div className="pt-3 mt-1 border-t border-stone-800 flex justify-between font-extrabold text-sm text-stone-100">
              <span>Total Paid</span>
              <span className="text-amber-400">{order.totalAmount} ETB</span>
            </div>
          </div>

          {/* Customer Order Completion Action */}
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <div className="pt-4 border-t border-stone-800">
              {order.status === 'READY' ? (
                <button
                  onClick={handleCustomerComplete}
                  disabled={submittingComplete}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingComplete ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.markReceivedBtn}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    disabled
                    className="w-full py-3.5 rounded-xl bg-stone-800 text-stone-500 font-semibold text-xs cursor-not-allowed flex items-center justify-center gap-2 border border-stone-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-stone-600" />
                    <span>{t.markReceivedBtn}</span>
                  </button>
                  <p className="text-[11px] text-center text-amber-500/90 font-medium px-2">
                    {t.waitingForReadyNotice}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
