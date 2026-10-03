'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  LayoutDashboard,
  QrCode,
  Utensils,
  Users,
  Palette,
  LogOut,
  Plus,
  Trash2,
  RotateCcw,
  Coffee,
  Leaf,
  Sliders,
  Check,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  X,
  Receipt,
  Download,
  UserPlus,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { logout } from '../../lib/store/slices/authSlice';
import { setRestaurantSettings } from '../../lib/store/slices/themeSlice';
import { formatOrderDateTime, getRelativeTimeAgo } from '../../lib/formatTime';

export default function AdminDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { venueName, serviceModel, themeConfig } = useAppSelector((state) => state.theme);
  const authUser = useAppSelector((state) => state.auth.user);

  const [activeSection, setActiveSection] = useState<
    'overview' | 'orders' | 'tables' | 'menu' | 'users' | 'settings'
  >('overview');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  // Menu Search & Category filter states
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

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

  const navItems = [
    { id: 'overview', label: 'Overview & Stats', icon: LayoutDashboard },
    { id: 'orders', label: 'All Orders & Search', icon: Receipt },
    { id: 'tables', label: 'Table Management', icon: QrCode },
    { id: 'menu', label: 'Menu & Categories', icon: Utensils },
    { id: 'users', label: 'Staff & Users', icon: Users },
    { id: 'settings', label: 'Settings & Theme', icon: Palette },
  ];

  return (
    <div className="h-screen bg-stone-950 text-stone-100 flex flex-col lg:flex-row font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-stone-900 border-r border-stone-800 flex flex-col justify-between shrink-0 p-4 transition-transform duration-200 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2 py-2 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/20">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-white leading-tight">Admin Console</h1>
                <p className="text-[11px] text-amber-400 font-semibold">{formVenueName}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((nav) => {
              const Icon = nav.icon;
              const isActive = activeSection === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveSection(nav.id as any);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-3 ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{nav.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Sign Out */}
        <div className="pt-4 border-t border-stone-800 flex flex-col gap-3">
          <div className="px-2">
            <p className="text-xs font-bold text-stone-200">
              {authUser?.name || 'Master Admin'}
            </p>
            <p className="text-[10px] text-amber-400 font-mono">
              {authUser?.username || 'admin'} ({authUser?.role || 'ADMIN'})
            </p>
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
            className="w-full py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-stone-800 mb-6">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-sm text-stone-100">{formVenueName} Admin</h2>
        </div>

        {/* Section 1: Overview & Stats */}
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Dashboard Overview</h2>
                <p className="text-xs text-stone-400">System status and venue performance metrics</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 font-semibold text-xs border border-amber-800">
                Mode: {formServiceModel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-medium text-stone-400">Venue Tables</p>
                  <p className="text-2xl font-black text-white mt-1">{tables.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-medium text-stone-400">Menu Categories</p>
                  <p className="text-2xl font-black text-white mt-1">{adminMenu.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-medium text-stone-400">Staff Accounts</p>
                  <p className="text-2xl font-black text-white mt-1">{staffUsers.length}</p>
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
                <button
                  onClick={() => setActiveSection('orders')}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Audit Orders</span>
                </button>

                <button
                  onClick={() => setActiveSection('tables')}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 flex items-center gap-2 shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Add Table & QR</span>
                </button>

                <button
                  onClick={() => setActiveSection('menu')}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>Add Menu Item</span>
                </button>

                <button
                  onClick={() => setActiveSection('users')}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 flex items-center gap-2 shadow-sm"
                >
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  <span>Create Staff User</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Manager Orders & Live Intelligence Console */}
        {activeSection === 'orders' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  <span>Orders Audit & Search Console</span>
                </h2>
                <p className="text-xs text-stone-400">
                  Search, filter, and audit active & historic customer orders
                </p>
              </div>

              <button
                onClick={loadManagerOrders}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-semibold text-xs flex items-center gap-1.5 border border-stone-800 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Performance Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400">Total Revenue</span>
                <span className="text-lg font-extrabold text-amber-400">{managerMetrics.totalRevenue || 0} ETB</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400">Total Orders</span>
                <span className="text-lg font-extrabold text-white">{managerMetrics.totalOrdersCount || 0}</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400">Active Queue</span>
                <span className="text-lg font-extrabold text-emerald-400">{managerMetrics.activeCount || 0}</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400">Completed</span>
                <span className="text-lg font-extrabold text-blue-400">{managerMetrics.completedCount || 0}</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400">Cancelled</span>
                <span className="text-lg font-extrabold text-red-400">{managerMetrics.cancelledCount || 0}</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-medium text-stone-400">Avg Ticket Value</span>
                <span className="text-lg font-extrabold text-purple-400">
                  {Number(managerMetrics.averageOrderValue || 0).toFixed(1)} ETB
                </span>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-amber-500" />
                  <span>Search & Filter Criteria</span>
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
                    className="text-[11px] font-semibold text-red-400 hover:underline"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                  <input
                    type="text"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    placeholder="Search Order #, Customer Name, Phone, Table, Dish..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
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

                <div>
                  <select
                    value={orderServiceModelFilter}
                    onChange={(e) => setOrderServiceModelFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="ALL">All Service Models</option>
                    <option value="SELF_SERVED">Self-Served</option>
                    <option value="WAITER_ASSISTED">Waiter-Assisted</option>
                  </select>
                </div>

                <div>
                  <select
                    value={orderPaymentMethodFilter}
                    onChange={(e) => setOrderPaymentMethodFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="CASH">CASH</option>
                    <option value="TELEBIRR">TELEBIRR</option>
                    <option value="CBE">CBE</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                  Order Audit Records ({managerOrders.length} Found)
                </h3>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-xs text-stone-500">Querying order log data...</div>
              ) : managerOrders.length === 0 ? (
                <div className="py-16 text-center text-xs text-stone-500">
                  No orders match the filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-bold border-b border-stone-800">
                      <tr>
                        <th className="py-3 px-3">Order #</th>
                        <th className="py-3 px-3">Timestamp</th>
                        <th className="py-3 px-3">Type / Customer</th>
                        <th className="py-3 px-3">Items Summary</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Payment</th>
                        <th className="py-3 px-3 text-right">Total (ETB)</th>
                        <th className="py-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                      {managerOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-stone-950/50 transition-colors">
                          <td className="py-3 px-3 font-extrabold text-white text-sm">
                            #{ord.orderNumber}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-stone-200">{formatOrderDateTime(ord.createdAt)}</span>
                              <span className="text-[10px] text-amber-500">{getRelativeTimeAgo(ord.createdAt)}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-amber-400">
                                {ord.table ? `Table #${ord.table.number}` : `Self-Served`}
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
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
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

                          <td className="py-3 px-3 text-right font-bold text-amber-400 text-sm">
                            {ord.totalAmount} ETB
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setSelectedOrderModal(ord)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] inline-flex items-center gap-1 shadow-sm"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Table Label / Zone</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                    placeholder="e.g. Table 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Mode Override (Optional)</label>
                  <select
                    value={newTableOverride}
                    onChange={(e) => setNewTableOverride(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                  >
                    <option value="">Default (Venue System setting)</option>
                    <option value="SELF_SERVED">Self-Served</option>
                    <option value="WAITER_ASSISTED">Waiter-Assisted</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
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
                        className="p-2 rounded-lg bg-stone-950 hover:bg-red-950 text-stone-400 hover:text-red-400 border border-stone-800 transition-colors"
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
                        className="w-full py-2 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
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
        )}

        {/* Section 4: Menu & Categories */}
        {activeSection === 'menu' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-stone-800 pb-4">
              <h2 className="text-xl font-bold text-white">Menu & Catalog Management</h2>
              <p className="text-xs text-stone-400">Manage categories, dishes, fasting tags, and fulfillment stations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Category Management Column (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Category</span>
                  </h3>

                  <form onSubmit={handleCreateCategory} className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">Category Name (English)</label>
                      <input
                        type="text"
                        value={newCatNameEn}
                        onChange={(e) => setNewCatNameEn(e.target.value)}
                        placeholder="e.g. Hot Drinks"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">Category Name (Amharic)</label>
                      <input
                        type="text"
                        value={newCatNameAm}
                        onChange={(e) => setNewCatNameAm(e.target.value)}
                        placeholder="e.g. ፍላጎት መጠጦች"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-colors"
                    >
                      Add Category
                    </button>
                  </form>
                </div>

                {/* Existing Categories List */}
                <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-3 shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 border-b border-stone-800 pb-2">
                    Active Categories ({adminMenu.length})
                  </h3>

                  <div className="flex flex-col gap-2">
                    {adminMenu.map((cat) => (
                      <div
                        key={cat.id}
                        className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-xs text-stone-100">{cat.nameEn}</p>
                          <p className="text-[11px] text-stone-400">{cat.nameAm}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Menu Items Management Column (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create New Menu Item</span>
                  </h3>

                  <form onSubmit={handleCreateMenuItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">Select Category</label>
                      <select
                        value={newItemCatId}
                        onChange={(e) => setNewItemCatId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                        required
                      >
                        {adminMenu.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameEn} ({c.nameAm})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">Fulfillment Station</label>
                      <select
                        value={newItemStation}
                        onChange={(e) => setNewItemStation(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                      >
                        <option value="KITCHEN">Kitchen Station</option>
                        <option value="BARISTA">Barista Station</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">Item Name (English)</label>
                      <input
                        type="text"
                        value={newItemNameEn}
                        onChange={(e) => setNewItemNameEn(e.target.value)}
                        placeholder="e.g. Ethiopian Special Macchiato"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">Item Name (Amharic)</label>
                      <input
                        type="text"
                        value={newItemNameAm}
                        onChange={(e) => setNewItemNameAm(e.target.value)}
                        placeholder="e.g. ኢትዮጵያ ስፔሻል ማኪያቶ"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">Price (ETB)</label>
                      <input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                        required
                      />
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-300">
                        <input
                          type="checkbox"
                          checked={newItemFasting}
                          onChange={(e) => setNewItemFasting(e.target.checked)}
                          className="w-4 h-4 accent-emerald-600 rounded"
                        />
                        <span>Fasting Friendly (የጾም)</span>
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-stone-300 mb-1">Food Composition & Description</label>
                      <textarea
                        value={newItemDescEn}
                        onChange={(e) => setNewItemDescEn(e.target.value)}
                        placeholder="Ingredients and prep notes..."
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-colors"
                      >
                        Create Menu Item
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Category & Menu Items Catalog View */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-500" />
                    <span>Menu Catalog & Items View</span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Browse menu items organized inside each category
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                    <input
                      type="text"
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      placeholder="Search items or categories..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600 w-48 sm:w-64"
                    />
                  </div>

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="ALL">All Categories ({adminMenu.length})</option>
                    {adminMenu.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameEn} ({cat.items?.length || 0})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {adminMenu.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  No categories created yet. Create a category above to start adding menu items.
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {adminMenu
                    .filter((cat) => selectedCategoryFilter === 'ALL' || cat.id === selectedCategoryFilter)
                    .map((category) => {
                      const matchingItems = (category.items || []).filter((item: any) => {
                        if (!menuSearchQuery) return true;
                        const q = menuSearchQuery.toLowerCase();
                        return (
                          item.nameEn?.toLowerCase().includes(q) ||
                          item.nameAm?.toLowerCase().includes(q) ||
                          category.nameEn?.toLowerCase().includes(q) ||
                          category.nameAm?.toLowerCase().includes(q)
                        );
                      });

                      if (menuSearchQuery && matchingItems.length === 0) {
                        return null;
                      }

                      return (
                        <div key={category.id} className="flex flex-col gap-3">
                          {/* Category Header */}
                          <div className="flex items-center justify-between bg-stone-950/80 px-4 py-3 rounded-xl border border-stone-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-bold text-xs">
                                <Utensils className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                  <span>{category.nameEn}</span>
                                  {category.nameAm && (
                                    <span className="text-xs text-stone-400 font-normal">({category.nameAm})</span>
                                  )}
                                </h4>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-semibold text-[11px] border border-stone-700">
                                {category.items?.length || 0} items
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-red-950 text-stone-400 hover:text-red-300 border border-stone-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Category</span>
                            </button>
                          </div>

                          {/* Items Grid inside Category */}
                          {matchingItems.length === 0 ? (
                            <div className="p-6 rounded-xl bg-stone-950/40 border border-dashed border-stone-800 text-center text-xs text-stone-500">
                              No menu items inside this category yet.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {matchingItems.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between gap-3 shadow-md hover:border-stone-700 transition-colors"
                                >
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h5 className="font-bold text-xs text-stone-100">{item.nameEn}</h5>
                                        <p className="text-[11px] text-stone-400 font-medium">{item.nameAm}</p>
                                      </div>
                                      <span className="font-black text-amber-400 text-sm whitespace-nowrap">
                                        {item.price} ETB
                                      </span>
                                    </div>

                                    {item.descriptionEn && (
                                      <p className="text-[11px] text-stone-400 line-clamp-2 mt-1">
                                        {item.descriptionEn}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 mt-auto">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border ${
                                          item.fulfillmentStation === 'BARISTA'
                                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                                            : 'bg-blue-950 text-blue-300 border-blue-800'
                                        }`}
                                      >
                                        {item.fulfillmentStation === 'BARISTA' ? (
                                          <Coffee className="w-3 h-3" />
                                        ) : (
                                          <Utensils className="w-3 h-3" />
                                        )}
                                        <span>{item.fulfillmentStation || 'KITCHEN'}</span>
                                      </span>

                                      {item.isFastingFriendly && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                                          <Leaf className="w-3 h-3" />
                                          <span>የጾም</span>
                                        </span>
                                      )}
                                    </div>

                                    <button
                                      onClick={() => handleDeleteMenuItem(item.id)}
                                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-900 transition-colors"
                                      title="Delete Item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 5: Staff & User Accounts */}
        {activeSection === 'users' && (
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Role Assignment</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-colors"
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
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-950 transition-colors"
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
        )}

        {/* Section 6: Settings & Theme Customizer */}
        {activeSection === 'settings' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-stone-800 pb-4">
              <h2 className="text-xl font-bold text-white">System Settings & Brand Customization</h2>
              <p className="text-xs text-stone-400">Configure operating service models, fasting auto-scheduler, and brand palette</p>
            </div>

            {savedSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs font-semibold">
                Venue settings and brand colors saved successfully!
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2">
                  Venue Operations Settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">Venue Brand Name</label>
                    <input
                      type="text"
                      value={formVenueName}
                      onChange={(e) => setFormVenueName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">Venue Service Operating Model</label>
                    <select
                      value={formServiceModel}
                      onChange={(e) => setFormServiceModel(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                    >
                      <option value="SELF_SERVED">Self-Served (Customer Orders Direct)</option>
                      <option value="WAITER_ASSISTED">Waiter-Assisted (Waiter Punches Orders)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-300">
                    <input
                      type="checkbox"
                      checked={fastingAutoSchedule}
                      onChange={(e) => setFastingAutoSchedule(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span>Automatic Fasting Calendar Engine (Wed & Fri Auto-Filter)</span>
                  </label>
                </div>
              </div>

              {/* Theme Colors Palette Customizer */}
              <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-4 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span>Dynamic Venue Brand Palette</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'primaryColor', label: 'Primary Brand Color' },
                    { key: 'secondaryColor', label: 'Secondary Color' },
                    { key: 'accentColor', label: 'Accent Color' },
                    { key: 'backgroundColor', label: 'Background Color' },
                    { key: 'surfaceColor', label: 'Surface Color' },
                    { key: 'textColor', label: 'Typography Color' },
                  ].map((clr) => (
                    <div key={clr.key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-stone-300">{clr.label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(colors as any)[clr.key] || '#d97706'}
                          onChange={(e) => handleColorChange(clr.key, e.target.value)}
                          className="w-9 h-9 rounded-lg border border-stone-800 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(colors as any)[clr.key] || '#d97706'}
                          onChange={(e) => handleColorChange(clr.key, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2 self-start"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save System Settings & Theme</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Order Audit Detail Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-base text-white">
                Order Audit #{selectedOrderModal.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Order ID:</span>
                <span className="font-mono text-stone-200">{selectedOrderModal.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Service Mode:</span>
                <span className="font-semibold text-amber-400">{selectedOrderModal.serviceModel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Table / Guest:</span>
                <span className="font-semibold text-stone-200">
                  {selectedOrderModal.table ? `Table #${selectedOrderModal.table.number}` : 'Self-Served'}
                  {selectedOrderModal.customerName ? ` (${selectedOrderModal.customerName})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Current Status:</span>
                <span className="font-bold text-emerald-400">{selectedOrderModal.status}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">Line Items</h4>
              <div className="flex flex-col gap-1.5">
                {selectedOrderModal.items?.map((i: any) => (
                  <div key={i.id} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex justify-between text-xs">
                    <div>
                      <p className="font-semibold text-stone-200">{i.quantity}x {i.historicalItemNameEn}</p>
                      <p className="text-[10px] text-stone-500">{i.historicalItemNameAm}</p>
                    </div>
                    <span className="font-extrabold text-amber-400">{i.subtotal} ETB</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-between font-extrabold text-sm text-stone-100">
              <span>Total Amount</span>
              <span className="text-amber-400">{selectedOrderModal.totalAmount} ETB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
