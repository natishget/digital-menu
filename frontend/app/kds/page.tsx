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
} from 'lucide-react';
import { api } from '../../lib/api';
import { getSocket } from '../providers';

export default function KdsPage() {
  const router = useRouter();
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
      setTickets(res);
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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5 note
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio autoplay restriction
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

  const calculateElapsedTimeMinutes = (createdAtStr: string) => {
    const elapsedMs = new Date().getTime() - new Date(createdAtStr).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  const getTimingColorClass = (mins: number) => {
    if (mins < 5) {
      return 'border-emerald-500 bg-emerald-950/20 text-emerald-300';
    } else if (mins <= 12) {
      return 'border-amber-500 bg-amber-950/20 text-amber-300';
    } else {
      return 'border-red-600 bg-red-950/30 text-red-300 animate-pulse';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col font-sans transition-colors duration-200">
      {/* Header Bar */}
      <header className="bg-[var(--color-surface)] border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg">
            <MonitorCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Kitchen Display System (KDS)</h1>
            <p className="text-xs text-stone-400">Station Order Queue & Timing Alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Station Switcher */}
          <div className="flex p-1 rounded-xl bg-stone-800 border border-stone-700 text-xs font-bold">
            <button
              onClick={() => setStation('KITCHEN')}
              className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                station === 'KITCHEN'
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen</span>
            </button>
            <button
              onClick={() => setStation('BARISTA')}
              className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                station === 'BARISTA'
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Barista</span>
            </button>
          </div>

          <button
            onClick={() => {
              playChimeSound();
              setAudioEnabled(true);
            }}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold ${
              audioEnabled
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{audioEnabled ? 'Audio Chime Enabled' : 'Enable Chime Audio'}</span>
          </button>

          <button
            onClick={loadTickets}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main KDS Grid */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="py-20 text-center text-stone-500 text-xs">Loading station tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="py-24 text-center text-stone-500 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            <p className="text-sm font-bold text-stone-300">All clear! No active station tickets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => {
              const elapsedMins = calculateElapsedTimeMinutes(ticket.createdAt);
              const timingClass = getTimingColorClass(elapsedMins);

              return (
                <div
                  key={ticket.id}
                  className={`rounded-3xl border-2 bg-stone-900 flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${timingClass}`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-white">
                        {ticket.ticketNumber}
                      </span>
                      <p className="text-xs font-bold text-[var(--color-accent)]">
                        Table #{ticket.order?.table?.number || '?'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedMins} mins</span>
                    </div>
                  </div>

                  {/* Card Items List */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    {ticket.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-white">
                            {item.quantity}x {item.historicalItemNameEn}
                          </span>
                        </div>
                        {item.itemModifiers?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.itemModifiers.map((m: any) => (
                              <span
                                key={m.id}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-900 text-[var(--color-accent)] border border-stone-700/60"
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
                  <div className="p-4 border-t border-stone-800 bg-stone-900 flex items-center gap-2">
                    {ticket.status === 'PENDING' ? (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'PREPARING')}
                        className="w-full py-3 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Preparation</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'READY')}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Station Ready</span>
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
