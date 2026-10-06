'use client';

import React from 'react';
import { useAdminData } from '../layout';
import MenuManagementSection from '../../../components/admin/MenuManagementSection';

export default function AdminMenuPage() {
  const { adminMenu, loadAllAdminData } = useAdminData();

  return (
    <MenuManagementSection
      adminMenu={adminMenu}
      onRefresh={loadAllAdminData}
    />
  );
}
