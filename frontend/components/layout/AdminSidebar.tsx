'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  QrCode,
  Utensils,
  Users,
  Palette,
  LogOut,
  Coffee,
  X,
  Receipt,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { logout } from '../../lib/store/slices/authSlice';

interface AdminSidebarProps {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({
  mobileSidebarOpen,
  setMobileSidebarOpen,
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { venueName } = useAppSelector((state) => state.theme);
  const authUser = useAppSelector((state) => state.auth.user);

  const navItems = [
    { href: '/admin/dashboard', label: 'Overview & Stats', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'All Orders & Search', icon: Receipt },
    { href: '/admin/tables', label: 'Table Management', icon: QrCode },
    { href: '/admin/menu', label: 'Menu & Categories', icon: Utensils },
    { href: '/admin/users', label: 'Staff & Users', icon: Users },
    { href: '/admin/settings', label: 'Settings & Theme', icon: Palette },
  ];

  const handleLogout = () => {
    dispatch(logout());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    router.push('/login');
  };

  return (
    <>
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
                <p className="text-[11px] text-amber-400 font-semibold">{venueName || 'Digital Menu'}</p>
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
              // Matches exact route or root /admin redirecting to dashboard
              const isActive =
                pathname === nav.href ||
                (pathname === '/admin' && nav.href === '/admin/dashboard');

              return (
                <Link
                  key={nav.href}
                  href={nav.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-3 ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{nav.label}</span>
                </Link>
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
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
