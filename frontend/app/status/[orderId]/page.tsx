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
  QrCode,
} from 'lucide-react';
import { getSocket } from '../../providers';
import { api } from '../../../lib/api';
import confetti from 'canvas-confetti';

export default function OrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!orderId) return;

    // Load initial order data
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

    // Connect to WebSocket room
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
      // Ignore if unavailable
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Order Not Found</h2>
        <p className="text-sm text-stone-600 mb-6">{error}</p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs"
        >
          Return Home
        </Link>
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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col items-center p-4 py-8 font-sans">
      <div className="max-w-md w-full flex flex-col gap-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Menu</span>
          </Link>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            Order #{order.orderNumber}
          </span>
        </div>

        {/* Status Card */}
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-stone-200 shadow-xl flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-md shadow-amber-600/20">
              <Coffee className="w-8 h-8" />
            </div>
            <h1 className="font-extrabold text-xl text-[var(--color-secondary)]">
              Live Order Status
            </h1>
            {order.table && (
              <p className="text-xs font-bold text-amber-700">
                Table #{order.table.number} ({order.table.name})
              </p>
            )}
          </div>

          {/* Progress Timeline */}
          <div className="flex flex-col gap-4 relative pl-4 border-l-2 border-stone-200 my-2">
            {steps.map((step, idx) => {
              const isPastOrCurrent = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-3 relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all -ml-[21px] ${
                      isCurrent
                        ? 'bg-amber-600 text-white shadow-md ring-4 ring-amber-100'
                        : isPastOrCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-amber-800 text-sm'
                          : isPastOrCurrent
                            ? 'text-stone-900'
                            : 'text-stone-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Live Status: {order.status}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Items Summary */}
          <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500">
              Ordered Items
            </h3>
            <div className="flex flex-col gap-2">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-800">
                    {item.quantity}x {item.historicalItemNameEn}
                  </span>
                  <span className="font-bold text-amber-800">{item.subtotal} ETB</span>
                </div>
              ))}
            </div>

            <div className="pt-2 mt-2 border-t border-stone-100 flex justify-between font-black text-sm text-stone-900">
              <span>Total Paid</span>
              <span className="text-amber-800">{order.totalAmount} ETB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
