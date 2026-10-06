'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useAppSelector } from '../../lib/store/hooks';

interface AdminHeaderProps {
  onOpenSidebar: () => void;
}

export default function AdminHeader({ onOpenSidebar }: AdminHeaderProps) {
  const { venueName } = useAppSelector((state) => state.theme);

  return (
    <div className="lg:hidden flex items-center justify-between pb-4 border-b border-stone-800 mb-6">
      <button
        onClick={onOpenSidebar}
        className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 hover:text-white"
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <h2 className="font-bold text-sm text-stone-100">{venueName || 'Digital Menu'} Admin</h2>
    </div>
  );
}
