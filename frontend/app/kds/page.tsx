'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MonitorCheck,
  ChefHat,
  Coffee,
  Clock,
  CheckCircle2,
  Play,
  Volume2,
  RefreshCw,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { api } from '../../lib/api';
import { getSocket } from '../providers';
import { useAppDispatch } from '../../lib/store/hooks';
import { logout } from '../../lib/store/slices/authSlice';
import { formatOrderTime, getRelativeTimeAgo } from '../../lib/formatTime';

export default function KdsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [station, setStation] = useState<'KITCHEN' | 'BARISTA'>('KITCHEN');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    loadTickets();

    const socket = getSocket();
    socket.emit('join:station', { station });

    const handleTicketUpdated = (ticket: any) => {
      if (ticket.station === station) {
        playChimeSound();
        loadTickets();
      }
    };

    socket.on('kot:ticket_updated', handleTicketUpdated);
    socket.on('kot:ticket_updated_global', loadTickets);

    return () => {
      socket.off('kot:ticket_updated', handleTicketUpdated);
      socket.off('kot:ticket_updated_global', loadTickets);
    };
  }, [station]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.getStationTickets(station);
      setTickets(res || []);
    } catch (err) {
      console.error('Error loading KDS tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const playChimeSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio autoplay restriction handling
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await api.updateKotTicketStatus(ticketId, newStatus);
      await loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    }
  };

  const handleCompleteOrderFromKot = async (ticketId: string) => {
    try {
      await api.completeOrderFromKot(ticketId);
      await loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to complete order');
    }
  };

  const calculateElapsedTimeMinutes = (createdAtStr: string) => {
    const elapsedMs = new Date().getTime() - new Date(createdAtStr).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  const getTimingColorClass = (mins: number) => {
    if (mins < 5) {
      return 'border-emerald-700/80 bg-stone-900 text-emerald-300';
    } else if (mins <= 12) {
      return 'border-amber-600/80 bg-stone-900 text-amber-300';
    } else {
      return 'border-red-600 bg-stone-900 text-red-300 animate-pulse';
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
            <MonitorCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Kitchen Display System (KDS)</h1>
            <p className="text-xs text-stone-400">Station Order Queue & Timing Alerts</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Station Switcher */}
          <div className="flex p-1 rounded-xl bg-stone-950 border border-stone-800 text-xs font-semibold">
            <button
              onClick={() => setStation('KITCHEN')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                station === 'KITCHEN'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen</span>
            </button>
            <button
              onClick={() => setStation('BARISTA')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                station === 'BARISTA'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Barista</span>
            </button>
          </div>

          <button
            onClick={() => {
              playChimeSound();
              setAudioEnabled(true);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              audioEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>{audioEnabled ? 'Audio On' : 'Enable Audio'}</span>
          </button>

          <button
            onClick={loadTickets}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 transition-colors"
            title="Refresh Station Queue"
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
            className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main KDS Grid */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="py-20 text-center text-stone-500 text-xs font-medium">Loading station tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="py-24 text-center text-stone-500 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-xs font-bold text-stone-300">Station Queue Clear</p>
            <p className="text-xs text-stone-500">No active preparation tickets currently assigned to {station.toLowerCase()} station.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tickets.map((ticket) => {
              const elapsedMins = calculateElapsedTimeMinutes(ticket.createdAt);
              const timingClass = getTimingColorClass(elapsedMins);

              return (
                <div
                  key={ticket.id}
                  className={`rounded-2xl border-2 bg-stone-900 flex flex-col justify-between overflow-hidden shadow-xl transition-all ${timingClass}`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-white">
                        {ticket.ticketNumber}
                      </span>
                      <p className="text-xs font-semibold text-amber-400 mt-0.5">
                        {ticket.order?.table
                          ? `Table #${ticket.order.table.number}`
                          : `Self-Served: ${ticket.order?.customerName || 'Guest'}`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-200">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{formatOrderTime(ticket.createdAt) || `${elapsedMins}m`}</span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        ({getRelativeTimeAgo(ticket.createdAt)})
                      </span>
                    </div>
                  </div>

                  {/* Card Items List */}
                  <div className="p-4 flex-1 flex flex-col gap-2.5">
                    {ticket.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-stone-100">
                            {item.quantity}x {item.historicalItemNameEn}
                          </span>
                        </div>
                        {item.itemModifiers?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.itemModifiers.map((m: any) => (
                              <span
                                key={m.id}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-900 text-amber-400 border border-stone-800"
                              >
                                {m.historicalModifierNameEn}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center gap-2">
                    {ticket.status === 'PENDING' ? (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'PREPARING')}
                        className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Preparation</span>
                      </button>
                    ) : ticket.status === 'PREPARING' ? (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'READY')}
                        className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Station Ready</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompleteOrderFromKot(ticket.id)}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Order Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
