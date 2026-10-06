'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  RotateCcw,
  Filter,
  Search,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatOrderDateTime, getRelativeTimeAgo } from '../../lib/formatTime';
import OrderAuditModal from './OrderAuditModal';

export default function OrdersAuditSection() {
  const [managerOrders, setManagerOrders] = useState<any[]>([]);
  const [managerMetrics, setManagerMetrics] = useState<any>({
    totalOrdersCount: 0,
    totalRevenue: 0,
    completedCount: 0,
    activeCount: 0,
    cancelledCount: 0,
    averageOrderValue: 0,
  });

  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderServiceModelFilter, setOrderServiceModelFilter] = useState('ALL');
  const [orderPaymentMethodFilter, setOrderPaymentMethodFilter] = useState('ALL');
  const [orderDateRangeFilter, setOrderDateRangeFilter] = useState('all');
  const [selectedOrderModal, setSelectedOrderModal] = useState<any | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadManagerOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getManagerOrders({
        search: orderSearchTerm,
        status: orderStatusFilter,
        serviceModel: orderServiceModelFilter,
        paymentMethod: orderPaymentMethodFilter,
        dateRange: orderDateRangeFilter,
      });
      if (res) {
        setManagerOrders(res.orders || []);
        setManagerMetrics(res.metrics || {});
      }
    } catch (err) {
      console.error('Error fetching manager orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadManagerOrders();
  }, [
    orderSearchTerm,
    orderStatusFilter,
    orderServiceModelFilter,
    orderPaymentMethodFilter,
    orderDateRangeFilter,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <span>Orders Audit & Search Console</span>
          </h2>
          <p className="text-xs text-stone-400">
            Search, filter, and audit active & historic customer orders
          </p>
        </div>

        <button
          onClick={loadManagerOrders}
          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-semibold text-xs flex items-center gap-1.5 border border-stone-800 shadow-sm cursor-pointer transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Performance Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-medium text-stone-400">Total Revenue</span>
          <span className="text-lg font-extrabold text-amber-400">{managerMetrics.totalRevenue || 0} ETB</span>
        </div>

        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-medium text-stone-400">Total Orders</span>
          <span className="text-lg font-extrabold text-white">{managerMetrics.totalOrdersCount || 0}</span>
        </div>

        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-medium text-stone-400">Active Queue</span>
          <span className="text-lg font-extrabold text-emerald-400">{managerMetrics.activeCount || 0}</span>
        </div>

        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-medium text-stone-400">Completed</span>
          <span className="text-lg font-extrabold text-blue-400">{managerMetrics.completedCount || 0}</span>
        </div>

        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-medium text-stone-400">Cancelled</span>
          <span className="text-lg font-extrabold text-red-400">{managerMetrics.cancelledCount || 0}</span>
        </div>

        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-medium text-stone-400">Avg Ticket Value</span>
          <span className="text-lg font-extrabold text-purple-400">
            {Number(managerMetrics.averageOrderValue || 0).toFixed(1)} ETB
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>Search & Filter Criteria</span>
          </h3>

          {(orderSearchTerm || orderStatusFilter !== 'ALL' || orderServiceModelFilter !== 'ALL' || orderPaymentMethodFilter !== 'ALL' || orderDateRangeFilter !== 'all') && (
            <button
              onClick={() => {
                setOrderSearchTerm('');
                setOrderStatusFilter('ALL');
                setOrderServiceModelFilter('ALL');
                setOrderPaymentMethodFilter('ALL');
                setOrderDateRangeFilter('all');
              }}
              className="text-[11px] font-semibold text-red-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
            <input
              type="text"
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              placeholder="Search Order #, Customer Name, Phone, Table, Dish..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PENDING_CASH_CONFIRMATION">PENDING CASH</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PREPARING">PREPARING</option>
              <option value="READY">READY</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <select
              value={orderServiceModelFilter}
              onChange={(e) => setOrderServiceModelFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
            >
              <option value="ALL">All Service Models</option>
              <option value="SELF_SERVED">Self-Served</option>
              <option value="WAITER_ASSISTED">Waiter-Assisted</option>
            </select>
          </div>

          <div>
            <select
              value={orderPaymentMethodFilter}
              onChange={(e) => setOrderPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">CASH</option>
              <option value="TELEBIRR">TELEBIRR</option>
              <option value="CBE">CBE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
            Order Audit Records ({managerOrders.length} Found)
          </h3>
        </div>

        {loadingOrders ? (
          <div className="py-12 text-center text-xs text-stone-500">Querying order log data...</div>
        ) : managerOrders.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-500">
            No orders match the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-bold border-b border-stone-800">
                <tr>
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Type / Customer</th>
                  <th className="py-3 px-3">Items Summary</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Total (ETB)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {managerOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-950/50 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-white text-sm">
                      #{ord.orderNumber}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-stone-200">{formatOrderDateTime(ord.createdAt)}</span>
                        <span className="text-[10px] text-amber-500">{getRelativeTimeAgo(ord.createdAt)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-amber-400">
                          {ord.table ? `Table #${ord.table.number}` : `Self-Served`}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {ord.customerName ? `Name: ${ord.customerName}` : 'Guest'}
                          {ord.customerPhone ? ` • ${ord.customerPhone}` : ''}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="max-w-xs truncate text-[11px] text-stone-300">
                        {ord.items?.map((i: any) => `${i.quantity}x ${i.historicalItemNameEn}`).join(', ')}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : ord.status === 'CANCELLED'
                              ? 'bg-red-950 text-red-300 border-red-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[11px] font-semibold text-stone-300">
                        {ord.payments?.[0]?.paymentMethod || 'CASH'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-amber-400 text-sm">
                      {ord.totalAmount} ETB
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedOrderModal(ord)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] inline-flex items-center gap-1 shadow-sm cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Audit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderModal && (
        <OrderAuditModal
          order={selectedOrderModal}
          onClose={() => setSelectedOrderModal(null)}
        />
      )}
    </div>
  );
}
