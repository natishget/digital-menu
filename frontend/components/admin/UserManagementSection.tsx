'use client';

import React, { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';

interface UserManagementSectionProps {
  staffUsers: any[];
  onRefresh: () => void;
}

export default function UserManagementSection({
  staffUsers,
  onRefresh,
}: UserManagementSectionProps) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<
    'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN_STAFF' | 'BARISTA'
  >('WAITER');
  const [newPin, setNewPin] = useState('');

  const handleCreateStaffUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newFullName) return;
    try {
      await api.fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim() || 'password123',
          name: newFullName.trim(),
          role: newRole,
          pin: newPin.trim() || undefined,
        }),
      });
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewPin('');
      onRefresh();
      alert(`Staff user '${newUsername}' created successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create staff user');
    }
  };

  const handleDeleteStaffUser = async (id: string, username: string) => {
    if (username === 'natishget') {
      alert('Master Admin account cannot be deleted');
      return;
    }
    if (!confirm(`Delete staff account '${username}'?`)) return;
    try {
      await api.fetchApi(`/users/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff user');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-stone-800 pb-4">
        <h2 className="text-xl font-bold text-white">Staff Account Management</h2>
        <p className="text-xs text-stone-400">Manage system roles (Admin, Manager, Cashier, Waiter, Kitchen, Barista)</p>
      </div>

      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <span>Create Staff Account</span>
        </h3>

        <form onSubmit={handleCreateStaffUser} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Full Name</label>
            <input
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Abebe Bikila"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. abebe"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Defaults to password123"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Role Assignment</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
            >
              <option value="WAITER">WAITER</option>
              <option value="CASHIER">CASHIER</option>
              <option value="KITCHEN_STAFF">KITCHEN_STAFF</option>
              <option value="BARISTA">BARISTA</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Waiter 4-Digit PIN</label>
            <input
              type="text"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="e.g. 1234"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>

      {/* Staff Users Table */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 border-b border-stone-800 pb-2">
          Active Staff Roster ({staffUsers.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-bold border-b border-stone-800">
              <tr>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Username</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">PIN Code</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {staffUsers.map((u) => (
                <tr key={u.id} className="hover:bg-stone-950/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-stone-400">{u.username}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-amber-400">
                    {u.pin ? u.pin : '—'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDeleteStaffUser(u.id, u.username)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-950 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
