'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Coffee,
  KeyRound,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  Utensils,
  CreditCard,
  ChefHat,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch } from '../../lib/store/hooks';
import { setCredentials } from '../../lib/store/slices/authSlice';
import { api } from '../../lib/api';

export default function StaffLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<'username' | 'pin'>('username');

  // Username login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // PIN login state
  const [pin, setPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeLogin = async (u: string, p: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.login({ username: u, password: p });
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
      }
      dispatch(setCredentials(res));

      const role = res.user.role;
      if (role === 'KITCHEN_STAFF' || role === 'BARISTA') {
        router.push('/kds');
      } else if (role === 'CASHIER') {
        router.push('/cashier');
      } else if (role === 'WAITER') {
        router.push('/waiter');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameLogin = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(username, password);
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.waiterPinLogin({ pin });
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
      }
      dispatch(setCredentials(res));
      router.push('/waiter');
    } catch (err: any) {
      setError(err.message || 'Invalid Waiter 4-Digit PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center p-4 font-sans transition-colors duration-200">
      <div className="max-w-xl w-full bg-[var(--color-surface)] p-8 rounded-3xl border border-stone-700 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg">
            <Coffee className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Staff Portal Authorization</h1>
          <p className="text-xs text-stone-400">
            Digital Menu & KOT Station Login
          </p>
        </div>

        {/* Staff Authorization Info Banner */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-[var(--color-primary)]/40 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-accent)]">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Personnel Access Only</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Sign in with your assigned staff or administrator credentials to access Table Management, Menu Catalog, Staff POS, Cashier, and KDS displays.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-stone-900 rounded-xl border border-stone-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'pin' ? 'bg-[var(--color-primary)] text-white shadow-xs' : 'text-stone-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Waiter 4-Digit PIN Access</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('username')}
            className={`py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'username' ? 'bg-[var(--color-primary)] text-white shadow-xs' : 'text-stone-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Username & Password</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {activeTab === 'pin' ? (
          <form onSubmit={handlePinLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                Enter 4-Digit Waiter PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-3xl tracking-[1em] font-mono py-3 rounded-xl bg-stone-900 border border-stone-700 text-[var(--color-accent)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Waiter POS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUsernameLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
