'use client';

import React from 'react';
import { X } from 'lucide-react';
import { formatOrderDateTime } from '../../lib/formatTime';

interface OrderAuditModalProps {
  order: any;
  onClose: () => void;
}

export default function OrderAuditModal({ order, onClose }: OrderAuditModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="font-bold text-base text-white">
            Order Audit #{order.orderNumber}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between py-1 border-b border-stone-800/60">
            <span className="text-stone-400">Order ID:</span>
            <span className="font-mono text-stone-200">{order.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-800/60">
            <span className="text-stone-400">Created At:</span>
            <span className="font-semibold text-stone-200">{formatOrderDateTime(order.createdAt)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-800/60">
            <span className="text-stone-400">Service Mode:</span>
            <span className="font-semibold text-amber-400">{order.serviceModel}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-800/60">
            <span className="text-stone-400">Table / Guest:</span>
            <span className="font-semibold text-stone-200">
              {order.table ? `Table #${order.table.number}` : 'Self-Served'}
              {order.customerName ? ` (${order.customerName})` : ''}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-800/60">
            <span className="text-stone-400">Current Status:</span>
            <span className="font-bold text-emerald-400">{order.status}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">Line Items</h4>
          <div className="flex flex-col gap-1.5">
            {order.items?.map((i: any) => (
              <div key={i.id} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex justify-between text-xs">
                <div>
                  <p className="font-semibold text-stone-200">{i.quantity}x {i.historicalItemNameEn}</p>
                  <p className="text-[10px] text-stone-500">{i.historicalItemNameAm}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-400">{i.subtotal} ETB</p>
                  <p className="text-[10px] text-stone-500">{i.unitPrice} ETB each</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-stone-800 mt-2">
            <span className="font-bold text-xs text-stone-300">Total Order Amount:</span>
            <span className="font-extrabold text-base text-amber-400">{order.totalAmount} ETB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
