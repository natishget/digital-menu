'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';

interface TableManagementSectionProps {
  tables: any[];
  onRefresh: () => void;
}

export default function TableManagementSection({
  tables,
  onRefresh,
}: TableManagementSectionProps) {
  const [newTableNumber, setNewTableNumber] = useState<number>(tables.length + 1 || 1);
  const [newTableName, setNewTableName] = useState<string>(`Table ${tables.length + 1 || 1}`);
  const [newTableOverride, setNewTableOverride] = useState<string>('');

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchApi('/tables', {
        method: 'POST',
        body: JSON.stringify({
          number: newTableNumber,
          name: newTableName,
          serviceModelOverride: newTableOverride || undefined,
        }),
      });
      onRefresh();
      alert(`Table ${newTableNumber} created successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create table');
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.fetchApi(`/tables/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete table');
    }
  };

  const handleRotateQrToken = async (id: string) => {
    try {
      await api.rotateQrToken(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to rotate QR token');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-stone-800 pb-4">
        <h2 className="text-xl font-bold text-white">Table & QR Code Management</h2>
        <p className="text-xs text-stone-400">Configure venue tables, generate QR codes, and rotate tokens</p>
      </div>

      {/* Add Table Form */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-stone-800 pb-2">
          <Plus className="w-4 h-4" />
          <span>Add New Table</span>
        </h3>

        <form onSubmit={handleCreateTable} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Table Number</label>
            <input
              type="number"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Table Label / Zone</label>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
              placeholder="e.g. Table 1"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Mode Override (Optional)</label>
            <select
              value={newTableOverride}
              onChange={(e) => setNewTableOverride(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
            >
              <option value="">Default (Venue System setting)</option>
              <option value="SELF_SERVED">Self-Served</option>
              <option value="WAITER_ASSISTED">Waiter-Assisted</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Table</span>
          </button>
        </form>
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tables.map((tbl) => {
          const qrUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/menu?table_id=${tbl.id}&token=${tbl.currentQrToken}`
            : `/menu?table_id=${tbl.id}&token=${tbl.currentQrToken}`;

          return (
            <div
              key={tbl.id}
              className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between gap-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <h4 className="font-extrabold text-base text-white">Table #{tbl.number}</h4>
                  <p className="text-xs text-stone-400">{tbl.name}</p>
                </div>
                <button
                  onClick={() => handleDeleteTable(tbl.id)}
                  className="p-2 rounded-lg bg-stone-950 hover:bg-red-950 text-stone-400 hover:text-red-400 border border-stone-800 transition-colors cursor-pointer"
                  title="Delete Table"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl shadow-inner my-1">
                <QRCodeSVG value={qrUrl} size={150} level="H" />
                <span className="text-[10px] font-mono text-stone-600 font-semibold break-all text-center">
                  Token: {tbl.currentQrToken?.substring(0, 12)}...
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-stone-800">
                <button
                  onClick={() => handleRotateQrToken(tbl.id)}
                  className="w-full py-2 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rotate QR Session Token</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
