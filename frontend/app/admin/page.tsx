'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  QrCode,
  Utensils,
  Users,
  Palette,
  Sliders,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Check,
  LogOut,
  Coffee,
  Globe,
  Leaf,
  ChefHat,
  CreditCard,
  UserPlus,
  ShieldCheck,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { setRestaurantSettings } from '../../lib/store/slices/themeSlice';
import { logout } from '../../lib/store/slices/authSlice';

export default function AdminDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { venueName, serviceModel, themeConfig } = useAppSelector((state) => state.theme);
  const authUser = useAppSelector((state) => state.auth.user);

  const [activeSection, setActiveSection] = useState<
    'overview' | 'tables' | 'menu' | 'users' | 'settings'
  >('overview');

  // Overview stats
  const [tables, setTables] = useState<any[]>([]);
  const [adminMenu, setAdminMenu] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Settings & Theme states
  const [formVenueName, setFormVenueName] = useState(venueName);
  const [formServiceModel, setFormServiceModel] = useState(serviceModel);
  const [fastingAutoSchedule, setFastingAutoSchedule] = useState(true);
  const [colors, setColors] = useState({
    primaryColor: themeConfig?.primaryColor || '#d97706',
    secondaryColor: themeConfig?.secondaryColor || '#78350f',
    accentColor: themeConfig?.accentColor || '#f59e0b',
    backgroundColor: themeConfig?.backgroundColor || '#1c1917',
    surfaceColor: themeConfig?.surfaceColor || '#292524',
    textColor: themeConfig?.textColor || '#fafaf9',
  });

  const handleColorChange = (key: string, val: string) => {
    const updated = { ...colors, [key]: val };
    setColors(updated);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (key === 'primaryColor') root.style.setProperty('--color-primary', val);
      if (key === 'secondaryColor') root.style.setProperty('--color-secondary', val);
      if (key === 'accentColor') root.style.setProperty('--color-accent', val);
      if (key === 'backgroundColor') root.style.setProperty('--color-bg', val);
      if (key === 'surfaceColor') root.style.setProperty('--color-surface', val);
      if (key === 'textColor') root.style.setProperty('--color-text', val);
    }
  };

  // Table form states
  const [newTableNumber, setNewTableNumber] = useState<number>(1);
  const [newTableName, setNewTableName] = useState<string>('Table 1');
  const [newTableOverride, setNewTableOverride] = useState<string>('');

  // Category form states
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameAm, setNewCatNameAm] = useState('');

  // Menu Item form states
  const [newItemCatId, setNewItemCatId] = useState('');
  const [newItemNameEn, setNewItemNameEn] = useState('');
  const [newItemNameAm, setNewItemNameAm] = useState('');
  const [newItemDescEn, setNewItemDescEn] = useState('');
  const [newItemDescAm, setNewItemDescAm] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(120);
  const [newItemFasting, setNewItemFasting] = useState(false);
  const [newItemStation, setNewItemStation] = useState<'KITCHEN' | 'BARISTA'>('KITCHEN');

  // Staff User form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN_STAFF' | 'BARISTA'>('WAITER');
  const [newPin, setNewPin] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoadingData(true);
    try {
      const [settingsRes, tablesRes, menuRes, usersRes] = await Promise.all([
        api.getSettings().catch(() => null),
        api.getTables().catch(() => []),
        api.getAdminMenu().catch(() => []),
        api.fetchApi('/users').catch(() => []),
      ]);

      if (settingsRes) {
        setFormVenueName(settingsRes.name);
        setFormServiceModel(settingsRes.serviceModel);
        setFastingAutoSchedule(settingsRes.fastingAutoSchedule);
        if (settingsRes.themeConfig) setColors(settingsRes.themeConfig);
      }

      setTables(tablesRes || []);
      setAdminMenu(menuRes || []);
      setStaffUsers(usersRes || []);

      if (tablesRes && tablesRes.length > 0) {
        setNewTableNumber(tablesRes.length + 1);
        setNewTableName(`Table ${tablesRes.length + 1}`);
      }
      if (menuRes && menuRes.length > 0 && !newItemCatId) {
        setNewItemCatId(menuRes[0].id);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updateSettings({
        name: formVenueName,
        serviceModel: formServiceModel,
        fastingAutoSchedule,
        themeConfig: colors,
      });

      dispatch(
        setRestaurantSettings({
          name: updated.name,
          serviceModel: updated.serviceModel,
          themeConfig: updated.themeConfig,
        }),
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

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
      await loadAllAdminData();
      alert(`Table ${newTableNumber} created successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create table');
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.fetchApi(`/tables/${id}`, { method: 'DELETE' });
      await loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete table');
    }
  };

  const handleRotateQrToken = async (id: string) => {
    try {
      await api.rotateQrToken(id);
      await loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to rotate QR token');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameEn) return;
    try {
      await api.fetchApi('/menu/categories', {
        method: 'POST',
        body: JSON.stringify({
          nameEn: newCatNameEn,
          nameAm: newCatNameAm || newCatNameEn,
          sortOrder: adminMenu.length + 1,
        }),
      });
      setNewCatNameEn('');
      setNewCatNameAm('');
      await loadAllAdminData();
      alert('Category created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete category and all its menu items?')) return;
    try {
      await api.fetchApi(`/menu/categories/${id}`, { method: 'DELETE' });
      await loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemNameEn || !newItemCatId) return;
    try {
      await api.fetchApi('/menu/items', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: newItemCatId,
          nameEn: newItemNameEn,
          nameAm: newItemNameAm || newItemNameEn,
          descriptionEn: newItemDescEn,
          descriptionAm: newItemDescAm || newItemDescEn,
          price: Number(newItemPrice),
          isFastingFriendly: newItemFasting,
          fulfillmentStation: newItemStation,
        }),
      });
      setNewItemNameEn('');
      setNewItemNameAm('');
      setNewItemDescEn('');
      setNewItemDescAm('');
      await loadAllAdminData();
      alert('Menu Item created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to add menu item');
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await api.fetchApi(`/menu/items/${id}`, { method: 'DELETE' });
      await loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

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
      await loadAllAdminData();
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
      await loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff user');
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col lg:flex-row font-sans">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-stone-950 border-r border-stone-800 flex flex-col justify-between shrink-0 p-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-lg shadow-amber-600/30">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white leading-tight">Admin Console</h1>
              <p className="text-[11px] text-amber-400 font-semibold">{formVenueName}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {[
              { id: 'overview', label: 'Overview & Stats', icon: LayoutDashboard },
              { id: 'tables', label: 'Table Management', icon: QrCode },
              { id: 'menu', label: 'Menu & Categories', icon: Utensils },
              { id: 'users', label: 'Staff & Users', icon: Users },
              { id: 'settings', label: 'Settings & Theme', icon: Palette },
            ].map((nav) => {
              const Icon = nav.icon;
              const isActive = activeSection === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveSection(nav.id as any)}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{nav.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-4 border-t border-stone-800 flex flex-col gap-3">
          <div className="px-2">
            <p className="text-xs font-bold text-stone-200">
              {authUser?.name || 'Natnael (Master Admin)'}
            </p>
            <p className="text-[10px] text-amber-400 font-mono">natishget (ADMIN)</p>
          </div>

          <button
            onClick={() => {
              dispatch(logout());
              if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
              }
              router.push('/login');
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Section 1: Overview & Stats */}
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Dashboard Overview</h2>
                <p className="text-xs text-stone-400">System status and venue metrics</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 font-bold text-xs border border-amber-800">
                Mode: {formServiceModel}
              </span>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-3xl bg-stone-800 border border-stone-700 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-semibold text-stone-400">Venue Tables</p>
                  <p className="text-3xl font-black text-white mt-1">{tables.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-stone-800 border border-stone-700 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-semibold text-stone-400">Menu Categories</p>
                  <p className="text-3xl font-black text-white mt-1">{adminMenu.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Utensils className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-stone-800 border border-stone-700 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-semibold text-stone-400">Staff Accounts</p>
                  <p className="text-3xl font-black text-white mt-1">{staffUsers.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-stone-800 border border-stone-700 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-semibold text-stone-400">Fasting Engine</p>
                  <p className="text-sm font-bold text-emerald-400 mt-2">
                    {fastingAutoSchedule ? 'Auto Scheduled' : 'Manual'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Leaf className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <h3 className="font-bold text-sm text-white border-b border-stone-700 pb-2">
                Quick Setup Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveSection('tables')}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Add New Table & QR Token</span>
                </button>

                <button
                  onClick={() => setActiveSection('menu')}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Menu Category & Item</span>
                </button>

                <button
                  onClick={() => setActiveSection('users')}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Staff Account</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Table Management & Visual QR Code Generator */}
        {activeSection === 'tables' && (
          <div className="flex flex-col gap-8">
            <div className="border-b border-stone-800 pb-4">
              <h2 className="text-xl font-extrabold text-white">Table & QR Code Management</h2>
              <p className="text-xs text-stone-400">Add tables, view visual QR codes, and rotate tokens</p>
            </div>

            {/* Add Table Form */}
            <div className="p-6 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-stone-700 pb-2">
                <Plus className="w-4 h-4" />
                <span>Add New Restaurant Table</span>
              </h3>

              <form onSubmit={handleCreateTable} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Table Number</label>
                  <input
                    type="number"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Table Name / Zone</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    placeholder="e.g. Table 1 (Indoor)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Service Override</label>
                  <select
                    value={newTableOverride}
                    onChange={(e) => setNewTableOverride(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                  >
                    <option value="">Default (Inherit Venue Mode)</option>
                    <option value="SELF_SERVED">Self-Served Mode</option>
                    <option value="WAITER_ASSISTED">Waiter-Assisted Mode</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
                >
                  + Create Table
                </button>
              </form>
            </div>

            {/* Visual QR Badges Grid */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2">
                Venue Tables & Visual QR Code Badges ({tables.length})
              </h3>

              {tables.length === 0 ? (
                <div className="p-8 rounded-3xl bg-stone-800 border border-stone-700 text-center text-xs text-stone-400">
                  No tables created yet. Use the form above to add your first venue table.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tables.map((tbl) => {
                    const qrUrl = `http://localhost:3000/menu?table_id=${tbl.id}&token=${tbl.qrToken}`;
                    return (
                      <div
                        key={tbl.id}
                        className="p-5 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col items-center text-center gap-4 shadow-xl"
                      >
                        <div className="w-full flex items-center justify-between border-b border-stone-700 pb-3">
                          <div className="text-left">
                            <h4 className="font-extrabold text-base text-white">Table #{tbl.number}</h4>
                            <p className="text-xs text-stone-400">{tbl.name}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                            {tbl.serviceModelOverride || 'Default'}
                          </span>
                        </div>

                        {/* Visual SVG QR Code */}
                        <div className="p-4 bg-white rounded-2xl shadow-inner border border-stone-300 flex items-center justify-center">
                          <QRCodeSVG value={qrUrl} size={150} level="H" includeMargin={true} />
                        </div>

                        <div className="w-full flex flex-col gap-2">
                          <p className="text-[10px] font-mono text-stone-400 truncate bg-stone-900 px-2 py-1 rounded-lg">
                            {qrUrl}
                          </p>

                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <a
                              href={qrUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Test</span>
                            </a>

                            <button
                              onClick={() => handleRotateQrToken(tbl.id)}
                              className="py-2 px-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-[11px] flex items-center justify-center gap-1 border border-stone-600"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Rotate</span>
                            </button>

                            <button
                              onClick={() => handleDeleteTable(tbl.id)}
                              className="py-2 px-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 font-bold text-[11px] flex items-center justify-center gap-1 border border-red-800"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Menu & Categories Management */}
        {activeSection === 'menu' && (
          <div className="flex flex-col gap-8">
            <div className="border-b border-stone-800 pb-4">
              <h2 className="text-xl font-extrabold text-white">Menu & Category Management</h2>
              <p className="text-xs text-stone-400">Create categories, dishes, prices in ETB & station routing</p>
            </div>

            {/* Create Category Form */}
            <div className="p-6 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-700 pb-2">
                1. Add New Category
              </h3>

              <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Category Name (English)</label>
                  <input
                    type="text"
                    value={newCatNameEn}
                    onChange={(e) => setNewCatNameEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    placeholder="e.g. Hot Drinks"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Category Name (Amharic - አማርኛ)</label>
                  <input
                    type="text"
                    value={newCatNameAm}
                    onChange={(e) => setNewCatNameAm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    placeholder="ለአብነት፡ የሞቅ መጠጦች"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
                >
                  + Add Category
                </button>
              </form>
            </div>

            {/* Create Menu Item Form */}
            <div className="p-6 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-700 pb-2">
                2. Add New Menu Item
              </h3>

              <form onSubmit={handleCreateMenuItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Select Category</label>
                  <select
                    value={newItemCatId}
                    onChange={(e) => setNewItemCatId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    required
                  >
                    {adminMenu.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameEn} ({cat.nameAm})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Item Name (English)</label>
                  <input
                    type="text"
                    value={newItemNameEn}
                    onChange={(e) => setNewItemNameEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    placeholder="e.g. Special Ethiopian Coffee"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Item Name (Amharic)</label>
                  <input
                    type="text"
                    value={newItemNameAm}
                    onChange={(e) => setNewItemNameAm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    placeholder="ለአብነት፡ ልዩ የሀበሻ ቡና"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Price in ETB</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Fulfillment Station</label>
                  <select
                    value={newItemStation}
                    onChange={(e: any) => setNewItemStation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                  >
                    <option value="KITCHEN">Kitchen (Food items)</option>
                    <option value="BARISTA">Barista (Drinks & Coffee)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="itemFastingCheck"
                    checked={newItemFasting}
                    onChange={(e) => setNewItemFasting(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                  <label htmlFor="itemFastingCheck" className="text-xs text-stone-300 font-semibold cursor-pointer">
                    Is Fasting Friendly (የጾም)?
                  </label>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
                  >
                    + Save Menu Item
                  </button>
                </div>
              </form>
            </div>

            {/* Menu Catalog Listing */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2">
                Active Menu Catalog ({adminMenu.length} Categories)
              </h3>

              {adminMenu.length === 0 ? (
                <div className="p-8 rounded-3xl bg-stone-800 border border-stone-700 text-center text-xs text-stone-400">
                  No menu categories added yet. Add a category and menu items above.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {adminMenu.map((cat) => (
                    <div key={cat.id} className="p-5 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-stone-700 pb-2">
                        <h4 className="font-bold text-base text-amber-400">
                          {cat.nameEn} ({cat.nameAm})
                        </h4>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-950 text-red-300 border border-red-800 font-bold text-[10px]"
                        >
                          Delete Category
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cat.items?.map((item: any) => (
                          <div key={item.id} className="p-3 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">{item.nameEn}</span>
                                {item.isFastingFriendly && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                                    የጾም
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-stone-400">{item.fulfillmentStation} Station</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-xs text-amber-400">{item.price} ETB</span>
                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Staff & User Management */}
        {activeSection === 'users' && (
          <div className="flex flex-col gap-8">
            <div className="border-b border-stone-800 pb-4">
              <h2 className="text-xl font-extrabold text-white">User & Staff Management</h2>
              <p className="text-xs text-stone-400">Create staff accounts, assign roles & set Waiter PINs</p>
            </div>

            {/* Create Staff Form */}
            <div className="p-6 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-700 pb-2 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Create New Staff Account</span>
              </h3>

              <form onSubmit={handleCreateStaffUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    placeholder="e.g. cashier1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    placeholder="password123"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                    placeholder="e.g. Abebe Bikila"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Assign System Role</label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                  >
                    <option value="WAITER">WAITER (POS Access)</option>
                    <option value="CASHIER">CASHIER (Terminal Access)</option>
                    <option value="KITCHEN_STAFF">KITCHEN_STAFF (KDS Access)</option>
                    <option value="BARISTA">BARISTA (KDS Access)</option>
                    <option value="MANAGER">MANAGER (Full Management)</option>
                    <option value="ADMIN">ADMIN (Full Admin Control)</option>
                  </select>
                </div>

                {newRole === 'WAITER' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      4-Digit Waiter PIN (optional)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-amber-400 font-mono text-center tracking-[0.5em]"
                      placeholder="1234"
                    />
                  </div>
                )}

                <div className="sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-colors"
                  >
                    + Create Staff Account
                  </button>
                </div>
              </form>
            </div>

            {/* Staff List */}
            <div className="p-6 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-700 pb-2">
                Active Staff Accounts ({staffUsers.length})
              </h3>

              <div className="flex flex-col gap-3">
                {staffUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{user.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Username: <span className="font-mono text-stone-200">{user.username}</span> {user.hasPin && '• (PIN Configured)'}
                      </p>
                    </div>

                    {user.username !== 'natishget' && (
                      <button
                        onClick={() => handleDeleteStaffUser(user.id, user.username)}
                        className="p-2 rounded-xl bg-red-950 text-red-300 border border-red-800 hover:bg-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Settings & Dynamic Brand Theme */}
        {activeSection === 'settings' && (
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
            <div className="border-b border-stone-800 pb-4">
              <h2 className="text-xl font-extrabold text-white">Settings & Dynamic Brand Theme</h2>
              <p className="text-xs text-stone-400">Configure restaurant rules and customize CSS brand variables</p>
            </div>

            {savedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Settings and Dynamic Theme updated successfully!</span>
              </div>
            )}

            {/* General Settings */}
            <div className="p-6 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-700 pb-2">
                Venue Settings & Service Model
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={formVenueName}
                    onChange={(e) => setFormVenueName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Global Service Model Mode
                  </label>
                  <select
                    value={formServiceModel}
                    onChange={(e: any) => setFormServiceModel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="SELF_SERVED">A) Self-Served (Customer QR Orders Direct)</option>
                    <option value="WAITER_ASSISTED">B) Waiter-Assisted (Read-Only Menu for Customer)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="fastingCheck"
                  checked={fastingAutoSchedule}
                  onChange={(e) => setFastingAutoSchedule(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-600"
                />
                <label htmlFor="fastingCheck" className="text-xs text-stone-300 cursor-pointer font-semibold">
                  Auto-Schedule Orthodox Fasting Mode on Wednesdays, Fridays, and Abiy Tsom
                </label>
              </div>
            </div>

            {/* Dynamic Color Customizer */}
            <div className="p-6 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-700 pb-2">
                Dynamic Brand Theme Customizer
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'primaryColor', label: 'Primary Brand Color' },
                  { key: 'secondaryColor', label: 'Secondary Header Color' },
                  { key: 'accentColor', label: 'Accent Highlight Color' },
                  { key: 'backgroundColor', label: 'Page Background' },
                  { key: 'surfaceColor', label: 'Card Surface Color' },
                  { key: 'textColor', label: 'Main Text Color' },
                ].map((item) => (
                  <div key={item.key} className="p-3 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-xs font-semibold text-stone-200">{item.label}</span>
                      <span className="text-[10px] font-mono text-stone-400">{(colors as any)[item.key]}</span>
                    </div>

                    <input
                      type="color"
                      value={(colors as any)[item.key]}
                      onChange={(e) => handleColorChange(item.key, e.target.value)}
                      className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Restaurant Settings & Apply Dynamic Theme</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
