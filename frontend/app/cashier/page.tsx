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
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAppDispatch } from '../../lib/store/hooks';
import { logout } from '../../lib/store/slices/authSlice';

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
      setQueue(queueRes);
      const tablesRes = await api.getTables();
      setTables(tablesRes);
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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="bg-[var(--color-surface)] border-b border-stone-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white font-bold shadow-lg">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Cashier Terminal</h1>
            <p className="text-xs text-stone-400">Payment Verification & Bill Settlement</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Cash Verification Queue (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Pending Cash Confirmation Queue ({pendingCashOrders.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-500 text-xs">Loading queue...</div>
          ) : pendingCashOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--color-surface)] border border-stone-800 text-center text-stone-500 text-xs">
              No pending cash payments requiring verification.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingCashOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-[var(--color-surface)] border border-stone-700 flex items-center justify-between gap-4 shadow-lg"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-white">
                        Order #{order.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-accent)] font-bold text-[10px] border border-[var(--color-primary)]/30">
                        {order.status}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 font-semibold">
                      {order.table
                        ? `Table #${order.table.number} (${order.table.name})`
                        : `Self-Served Pickup: ${order.customerName || 'Guest'}`}
                    </p>

                    <div className="flex flex-wrap gap-2 text-[11px] text-stone-400 mt-1">
                      {order.items?.map((item: any) => (
                        <span key={item.id} className="bg-stone-900 px-2 py-0.5 rounded">
                          {item.quantity}x {item.historicalItemNameEn}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className="font-black text-lg text-[var(--color-accent)]">
                      {order.totalAmount} ETB
                    </span>

                    <button
                      onClick={() => handleConfirmCashPayment(order.id)}
                      disabled={actionLoading === order.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Table Bill Settlement & QR Reset</span>
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {tables.map((tbl) => (
              <div
                key={tbl.id}
                className="p-4 rounded-2xl bg-[var(--color-surface)] border border-stone-700 flex items-center justify-between gap-3"
              >
                <div>
                  <h3 className="font-bold text-sm text-white">Table #{tbl.number}</h3>
                  <p className="text-xs text-stone-400">{tbl.name}</p>
                </div>

                <button
                  onClick={() => handleSettleTable(tbl.id)}
                  disabled={actionLoading === `table-${tbl.id}`}
                  className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading === `table-${tbl.id}` ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
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
