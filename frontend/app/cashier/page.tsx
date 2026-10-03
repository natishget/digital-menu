'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAppDispatch } from '../../lib/store/hooks';
import { logout } from '../../lib/store/slices/authSlice';
import { formatOrderTime, getRelativeTimeAgo } from '../../lib/formatTime';

export default function CashierPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [queue, setQueue] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const queueRes = await api.getCashierQueue();
      setQueue(queueRes || []);
      const tablesRes = await api.getTables();
      setTables(tablesRes || []);
    } catch (err) {
      console.error('Error loading cashier data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCashPayment = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.confirmCashierPayment(orderId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSettleTable = async (tableId: string) => {
    if (!confirm('Settle all active orders for this table and rotate QR token?')) return;
    setActionLoading(`table-${tableId}`);
    try {
      await api.settleTableBill(tableId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to settle table');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCashOrders = queue.filter(
    (o) => o.status === 'PENDING_CASH_CONFIRMATION' || o.status === 'PENDING',
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold shadow-md">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Cashier Terminal</h1>
            <p className="text-xs text-stone-400">Payment Verification & Bill Settlement</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              dispatch(logout());
              if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
              }
              router.push('/login');
            }}
            className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Cash Verification Queue (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Cash Confirmation Queue ({pendingCashOrders.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-500 text-xs font-medium">Loading queue...</div>
          ) : pendingCashOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center text-stone-500 text-xs font-medium">
              No pending cash payments requiring verification.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingCashOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-white">
                        Order #{order.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 font-bold text-[10px] border border-amber-800">
                        {order.status}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 font-semibold">
                      {order.table
                        ? `Table #${order.table.number} (${order.table.name})`
                        : `Self-Served Pickup: ${order.customerName || 'Guest'}`}
                    </p>

                    {order.createdAt && (
                      <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Ordered: {formatOrderTime(order.createdAt)} ({getRelativeTimeAgo(order.createdAt)})</span>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 text-[11px] text-stone-400 mt-1">
                      {order.items?.map((item: any) => (
                        <span key={item.id} className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                          {item.quantity}x {item.historicalItemNameEn}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-800 gap-3">
                    <span className="font-extrabold text-lg text-amber-400">
                      {order.totalAmount} ETB
                    </span>

                    <button
                      onClick={() => handleConfirmCashPayment(order.id)}
                      disabled={actionLoading === order.id}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actionLoading === order.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Payment Received</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Table Settlement Section (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Table Bill Settlement & QR Reset</span>
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {tables.map((tbl) => (
              <div
                key={tbl.id}
                className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-3"
              >
                <div>
                  <h3 className="font-bold text-sm text-white">Table #{tbl.number}</h3>
                  <p className="text-xs text-stone-400">{tbl.name}</p>
                </div>

                <button
                  onClick={() => handleSettleTable(tbl.id)}
                  disabled={actionLoading === `table-${tbl.id}`}
                  className="px-3.5 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading === `table-${tbl.id}` ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
                      <span>Settle & Reset QR</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
