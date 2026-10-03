'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Coffee, User, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { envConfig } from '../../lib/config';

const backendUrl = envConfig.apiUrl;

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(backendUrl + '/auth/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      setMessage({ type: 'success', text: `Admin user '${data.username || username}' registered successfully!` });
      setUsername('');
      setPassword('');
      setName('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error creating account' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/20">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Create Venue Admin Account</h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Register master credentials for venue setup
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl border text-xs text-center font-medium ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : 'bg-red-950/80 border-red-800 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Venue Administrator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-600"
              required
            />
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
                <span>Register Master Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-stone-800 text-center">
          <Link href="/login" className="text-xs font-medium text-amber-500 hover:underline">
            Already registered? Return to Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}