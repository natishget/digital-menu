'use client';

import React from 'react';
import Link from 'next/link';
import {
  QrCode,
  Utensils,
  Users,
  Leaf,
  Receipt,
  Plus,
  UserPlus,
} from 'lucide-react';

interface OverviewSectionProps {
  tablesCount: number;
  categoriesCount: number;
  staffUsersCount: number;
  fastingAutoSchedule: boolean;
  serviceModel: string;
}

export default function OverviewSection({
  tablesCount,
  categoriesCount,
  staffUsersCount,
  fastingAutoSchedule,
  serviceModel,
}: OverviewSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Dashboard Overview</h2>
          <p className="text-xs text-stone-400">System status and venue performance metrics</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 font-semibold text-xs border border-amber-800">
          Mode: {serviceModel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-stone-400">Venue Tables</p>
            <p className="text-2xl font-black text-white mt-1">{tablesCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-stone-400">Menu Categories</p>
            <p className="text-2xl font-black text-white mt-1">{categoriesCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-stone-400">Staff Accounts</p>
            <p className="text-2xl font-black text-white mt-1">{staffUsersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-medium text-stone-400">Fasting Engine</p>
            <p className="text-xs font-bold text-emerald-400 mt-2">
              {fastingAutoSchedule ? 'Auto Scheduled' : 'Manual'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
        <h3 className="font-bold text-xs text-stone-200 uppercase tracking-wider border-b border-stone-800 pb-2">
          Quick Action Shortcuts
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/orders"
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Audit Orders</span>
          </Link>

          <Link
            href="/admin/tables"
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Add Table & QR</span>
          </Link>

          <Link
            href="/admin/menu"
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            <span>Add Menu Item</span>
          </Link>

          <Link
            href="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4 text-purple-400" />
            <span>Create Staff User</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
