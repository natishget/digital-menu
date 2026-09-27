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
  Receipt,
  Search,
  Filter,
  Clock,
  DollarSign,
  ShoppingBag,
  Eye,
  X,
  ChevronRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { setRestaurantSettings } from '../../lib/store/slices/themeSlice';
import { logout } from '../../lib/store/slices/authSlice';
import { formatOrderDateTime, getRelativeTimeAgo } from '../../lib/formatTime';

export default function AdminDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { venueName, serviceModel, themeConfig } = useAppSelector((state) => state.theme);
  const authUser = useAppSelector((state) => state.auth.user);

  const [activeSection, setActiveSection] = useState<
    'overview' | 'orders' | 'tables' | 'menu' | 'users' | 'settings'
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

  // Manager Orders & Search States
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

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    loadAllAdminData();
    loadManagerOrders();
  }, []);

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
    if (activeSection === 'orders' || activeSection === 'overview') {
      loadManagerOrders();
    }
  }, [
    activeSection,
    orderSearchTerm,
    orderStatusFilter,
    orderServiceModelFilter,
    orderPaymentMethodFilter,
    orderDateRangeFilter,
  ]);

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
    <div className="h-screen bg-stone-900 text-stone-100 flex flex-col lg:flex-row font-sans overflow-hidden">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 lg:h-screen bg-stone-950 border-r border-stone-800 flex flex-col justify-between shrink-0 p-4 sticky top-0 z-30 overflow-y-auto">
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
              { id: 'orders', label: 'All Orders & Search', icon: Receipt },
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
      <main className="flex-1 h-screen overflow-y-auto p-6 lg:p-8">
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
                  onClick={() => setActiveSection('orders')}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Search & Audit All Orders</span>
                </button>

                <button
                  onClick={() => setActiveSection('tables')}
                  className="px-4 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Add Table & QR Token</span>
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

        {/* Section 2: Manager Orders & Live Intelligence Console */}
        {activeSection === 'orders' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-800 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Receipt className="w-6 h-6 text-amber-500" />
                  <span>Restaurant Orders Intelligence & Audit</span>
                </h2>
                <p className="text-xs text-stone-400">
                  Search, filter, analyze financial metrics, and audit live & past customer orders
                </p>
              </div>

              <button
                onClick={loadManagerOrders}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 border border-stone-700 self-start md:self-auto shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Refresh Live Queue</span>
              </button>
            </div>

            {/* Manager Performance Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-2xl bg-stone-800 border border-stone-700 flex flex-col gap-1 shadow-lg">
                <span className="text-[11px] font-semibold text-stone-400">Total Revenue</span>
                <span className="text-xl font-black text-amber-400">{managerMetrics.totalRevenue || 0} ETB</span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-800 border border-stone-700 flex flex-col gap-1 shadow-lg">
                <span className="text-[11px] font-semibold text-stone-400">Total Orders</span>
                <span className="text-xl font-black text-white">{managerMetrics.totalOrdersCount || 0}</span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-800 border border-stone-700 flex flex-col gap-1 shadow-lg">
                <span className="text-[11px] font-semibold text-stone-400">Active Queue</span>
                <span className="text-xl font-black text-emerald-400">{managerMetrics.activeCount || 0}</span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-800 border border-stone-700 flex flex-col gap-1 shadow-lg">
                <span className="text-[11px] font-semibold text-stone-400">Completed</span>
                <span className="text-xl font-black text-blue-400">{managerMetrics.completedCount || 0}</span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-800 border border-stone-700 flex flex-col gap-1 shadow-lg">
                <span className="text-[11px] font-semibold text-stone-400">Cancelled</span>
                <span className="text-xl font-black text-red-400">{managerMetrics.cancelledCount || 0}</span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-800 border border-stone-700 flex flex-col gap-1 shadow-lg">
                <span className="text-[11px] font-semibold text-stone-400">Avg Ticket Value</span>
                <span className="text-xl font-black text-purple-400">
                  {Number(managerMetrics.averageOrderValue || 0).toFixed(1)} ETB
                </span>
              </div>
            </div>

            {/* Search & Filter Controls Toolbar */}
            <div className="p-5 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-700 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-amber-500" />
                  <span>Search & Manager Filters</span>
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
                    className="text-[11px] font-bold text-red-400 hover:underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Live Search Input */}
                <div className="lg:col-span-2 relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    placeholder="Search Order #, Customer Name, Phone, Table, Dish..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-amber-500"
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

                {/* Service Model Filter */}
                <div>
                  <select
                    value={orderServiceModelFilter}
                    onChange={(e) => setOrderServiceModelFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ALL">All Service Models</option>
                    <option value="SELF_SERVED">Self-Served</option>
                    <option value="WAITER_ASSISTED">Waiter-Assisted</option>
                  </select>
                </div>

                {/* Payment Method Filter */}
                <div>
                  <select
                    value={orderPaymentMethodFilter}
                    onChange={(e) => setOrderPaymentMethodFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="CASH">CASH</option>
                    <option value="TELEBIRR">TELEBIRR</option>
                    <option value="CBE">CBE</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Records Table */}
            <div className="p-6 rounded-3xl bg-stone-800 border border-stone-700 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-700 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Order Audit Log ({managerOrders.length} Records)
                </h3>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-xs text-stone-400">Querying restaurant order records...</div>
              ) : managerOrders.length === 0 ? (
                <div className="py-16 text-center text-xs text-stone-400">
                  No orders found matching the specified filters or search criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-stone-900 text-stone-400 uppercase text-[10px] font-bold border-b border-stone-700">
                      <tr>
                        <th className="py-3 px-3">Order #</th>
                        <th className="py-3 px-3">Timestamp</th>
                        <th className="py-3 px-3">Type & Customer / Table</th>
                        <th className="py-3 px-3">Items Summary</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Payment</th>
                        <th className="py-3 px-3 text-right">Total (ETB)</th>
                        <th className="py-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-700/60">
                      {managerOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-stone-900/50 transition-colors">
                          <td className="py-3 px-3 font-extrabold text-white text-sm">
                            #{ord.orderNumber}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-stone-200">{formatOrderDateTime(ord.createdAt)}</span>
                              <span className="text-[10px] text-amber-400">{getRelativeTimeAgo(ord.createdAt)}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-amber-300">
                                {ord.table ? `Table #${ord.table.number}` : `Self-Served Pickup`}
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
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
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

                          <td className="py-3 px-3 text-right font-black text-amber-400 text-sm">
                            {ord.totalAmount} ETB
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setSelectedOrderModal(ord)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow"
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
          </div>
        )}

        {/* Section 3: Table Management & Visual QR Code Generator */}
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

                <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Food Composition / Description (English)
                    </label>
                    <textarea
                      value={newItemDescEn}
                      onChange={(e) => setNewItemDescEn(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                      placeholder="e.g. Composed of dark espresso, steamed milk, cinnamon..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      የቅንብር መግለጫ (አማርኛ)
                    </label>
                    <textarea
                      value={newItemDescAm}
                      onChange={(e) => setNewItemDescAm(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white"
                      placeholder="ለአብነት፡ ከተቀቀለ ፉል፡ ዘይት፡ ቲማቲም፡ ቃሪያ እና ሽንኩርት የተዘጋጀ..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:col-span-2 lg:col-span-3">
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
                          <div key={item.id} className="p-4 rounded-2xl bg-stone-900 border border-stone-700 flex flex-col justify-between gap-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-white">{item.nameEn}</span>
                                  {item.isFastingFriendly && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                                      የጾም
                                    </span>
                                  )}
                                </div>
                                <span className="font-extrabold text-xs text-amber-400">{item.price} ETB</span>
                              </div>
                              <span className="text-[10px] text-stone-400">{item.fulfillmentStation} Station</span>

                              {(item.descriptionEn || item.descriptionAm) && (
                                <p className="text-[11px] text-stone-400 mt-1 italic border-t border-stone-800/80 pt-1.5">
                                  <strong className="text-amber-500/90 not-italic">Composition: </strong>
                                  {item.descriptionEn || item.descriptionAm}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 text-[10px] font-semibold flex items-center gap-1 border border-red-800/50"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
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

      {/* Order Audit & Full Information Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-stone-900 border border-stone-700 rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-white">Order #{selectedOrderModal.orderNumber}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                    {selectedOrderModal.serviceModel}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                    {selectedOrderModal.status}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-stone-400 mt-0.5">ID: {selectedOrderModal.id}</p>
              </div>

              <button
                onClick={() => setSelectedOrderModal(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-xs text-stone-200">
              {/* Order Placement Timestamps */}
              <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-stone-400 block mb-0.5">Order Placed Timestamp</span>
                  <span className="font-extrabold text-amber-400 text-sm">
                    {formatOrderDateTime(selectedOrderModal.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-stone-400 block mb-0.5">Elapsed Time</span>
                  <span className="font-extrabold text-white text-sm">
                    {getRelativeTimeAgo(selectedOrderModal.createdAt)}
                  </span>
                </div>
              </div>

              {/* Customer & Venue Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 flex flex-col gap-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-amber-400 text-[10px] border-b border-stone-700 pb-1">
                    Customer Information
                  </h4>
                  <p><strong className="text-stone-400">Name: </strong>{selectedOrderModal.customerName || 'N/A (Guest)'}</p>
                  <p><strong className="text-stone-400">Phone: </strong>{selectedOrderModal.customerPhone || 'N/A'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 flex flex-col gap-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-amber-400 text-[10px] border-b border-stone-700 pb-1">
                    Venue / Table Session
                  </h4>
                  <p>
                    <strong className="text-stone-400">Table: </strong>
                    {selectedOrderModal.table ? `Table #${selectedOrderModal.table.number} (${selectedOrderModal.table.name})` : 'N/A (Self-Served)'}
                  </p>
                  <p><strong className="text-stone-400">Service Mode: </strong>{selectedOrderModal.serviceModel}</p>
                </div>
              </div>

              {/* Manager Quick Action Status Control */}
              <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 flex flex-col gap-2">
                <h4 className="font-bold uppercase tracking-wider text-amber-400 text-[10px]">
                  Manager Status Action Control
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={async () => {
                        try {
                          await api.updateOrderStatus(selectedOrderModal.id, st);
                          setSelectedOrderModal({ ...selectedOrderModal, status: st });
                          loadManagerOrders();
                        } catch (err: any) {
                          alert(err.message || 'Failed to update status');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition-all ${
                        selectedOrderModal.status === st
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                          : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-amber-500'
                      }`}
                    >
                      Set {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* KOT Station Tickets Routing */}
              {selectedOrderModal.kotTickets && selectedOrderModal.kotTickets.length > 0 && (
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 flex flex-col gap-2">
                  <h4 className="font-bold uppercase tracking-wider text-amber-400 text-[10px]">
                    KOT Station Tickets & Kitchen Routing
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedOrderModal.kotTickets.map((kot: any) => (
                      <div key={kot.id} className="p-2.5 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">{kot.station} Station</span>
                          <span className="text-[10px] text-stone-400">{kot.ticketNumber}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          {kot.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itemized Order Line Items */}
              <div className="flex flex-col gap-2">
                <h4 className="font-bold uppercase tracking-wider text-amber-400 text-[10px]">
                  Itemized Order Breakdown
                </h4>
                <div className="border border-stone-700 rounded-2xl overflow-hidden bg-stone-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900 text-stone-400 uppercase text-[10px] font-bold border-b border-stone-800">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">Station</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                      {selectedOrderModal.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="py-3 px-3">
                            <div>
                              <span className="font-bold text-white block">
                                {item.historicalItemNameEn} ({item.historicalItemNameAm})
                              </span>
                              {item.itemModifiers?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.itemModifiers.map((m: any) => (
                                    <span key={m.id} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-amber-400">
                                      + {m.historicalModifierNameEn} ({m.historicalPrice} ETB)
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-stone-400">{item.fulfillmentStation}</td>
                          <td className="py-3 px-3 text-center font-bold text-white">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-semibold text-stone-300">{item.historicalPrice} ETB</td>
                          <td className="py-3 px-3 text-right font-extrabold text-amber-400">{item.subtotal} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrderModal.notes && (
                <div className="p-3.5 rounded-2xl bg-stone-800 border border-stone-700">
                  <span className="font-bold text-amber-400 block mb-1 text-[10px] uppercase">Special Preparation Notes:</span>
                  <p className="text-stone-300 italic">{selectedOrderModal.notes}</p>
                </div>
              )}

              {/* Financial & Payment Summary */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col gap-2">
                <h4 className="font-bold uppercase tracking-wider text-amber-400 text-[10px] border-b border-stone-800 pb-1">
                  Financial & Payment Summary
                </h4>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Payment Method</span>
                  <span className="font-bold text-white">{selectedOrderModal.payments?.[0]?.paymentMethod || 'CASH'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Payment Status</span>
                  <span className="font-bold text-emerald-400">{selectedOrderModal.payments?.[0]?.status || 'COMPLETED'}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-stone-800">
                  <span className="text-white">Total Amount Paid</span>
                  <span className="text-amber-400">{selectedOrderModal.totalAmount} ETB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
