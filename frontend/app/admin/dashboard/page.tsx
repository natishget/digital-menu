'use client';

import React from 'react';
import { useAdminData } from '../layout';
import OverviewSection from '../../../components/admin/OverviewSection';

export default function DashboardPage() {
  const { tables, adminMenu, staffUsers, fastingAutoSchedule, serviceModel } = useAdminData();

  return (
    <OverviewSection
      tablesCount={tables.length}
      categoriesCount={adminMenu.length}
      staffUsersCount={staffUsers.length}
      fastingAutoSchedule={fastingAutoSchedule}
      serviceModel={serviceModel}
    />
  );
}
