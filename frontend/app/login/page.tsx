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
  CheckCircle2,
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
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/20">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Staff Authorization Portal</h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Access Venue Operations & KOT Systems
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-stone-950 rounded-xl border border-stone-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('username')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'username' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Staff Account</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'pin' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Waiter PIN</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {activeTab === 'username' ? (
          <form onSubmit={handleUsernameLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/50"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/50"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5 text-center">
                Enter 4-Digit Waiter Access PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-[0.8em] font-mono py-3 rounded-xl bg-stone-950 border border-stone-800 text-amber-400 placeholder-stone-700 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full mt-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
        )}

        {/* Security Footer Note */}
        <div className="pt-2 border-t border-stone-800/80 flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500/80" />
          <span>Role-Based Access Control Enabled</span>
        </div>
      </div>
    </div>
  );
}
