'use client';

import React from 'react';
import { useAdminData } from '../layout';
import UserManagementSection from '../../../components/admin/UserManagementSection';

export default function AdminUsersPage() {
  const { staffUsers, loadAllAdminData } = useAdminData();

  return (
    <UserManagementSection
      staffUsers={staffUsers}
      onRefresh={loadAllAdminData}
    />
  );
}
