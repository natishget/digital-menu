'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAppDispatch } from '../../lib/store/hooks';
import { setRestaurantSettings } from '../../lib/store/slices/themeSlice';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';

interface AdminContextType {
  tables: any[];
  adminMenu: any[];
  staffUsers: any[];
  serviceModel: string;
  fastingAutoSchedule: boolean;
  loadingData: boolean;
  loadAllAdminData: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
  tables: [],
  adminMenu: [],
  staffUsers: [],
  serviceModel: 'SELF_SERVED',
  fastingAutoSchedule: true,
  loadingData: true,
  loadAllAdminData: async () => {},
});

export const useAdminData = () => useContext(AdminContext);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [tables, setTables] = useState<any[]>([]);
  const [adminMenu, setAdminMenu] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [serviceModel, setServiceModel] = useState('SELF_SERVED');
  const [fastingAutoSchedule, setFastingAutoSchedule] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

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
        setServiceModel(settingsRes.serviceModel || 'SELF_SERVED');
        setFastingAutoSchedule(settingsRes.fastingAutoSchedule ?? true);
        dispatch(
          setRestaurantSettings({
            name: settingsRes.name,
            serviceModel: settingsRes.serviceModel,
            themeConfig: settingsRes.themeConfig,
          }),
        );
      }

      setTables(tablesRes || []);
      setAdminMenu(menuRes || []);
      setStaffUsers(usersRes || []);
    } catch (err) {
      console.error('Error loading admin layout data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    loadAllAdminData();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        tables,
        adminMenu,
        staffUsers,
        serviceModel,
        fastingAutoSchedule,
        loadingData,
        loadAllAdminData,
      }}
    >
      <div className="h-screen bg-stone-950 text-stone-100 flex flex-col lg:flex-row font-sans overflow-hidden">
        <AdminSidebar
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AdminHeader onOpenSidebar={() => setMobileSidebarOpen(true)} />
          {children}
        </main>
      </div>
    </AdminContext.Provider>
  );
}
