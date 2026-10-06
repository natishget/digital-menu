'use client';

import React from 'react';
import { useAdminData } from '../layout';
import TableManagementSection from '../../../components/admin/TableManagementSection';

export default function AdminTablesPage() {
  const { tables, loadAllAdminData } = useAdminData();

  return (
    <TableManagementSection
      tables={tables}
      onRefresh={loadAllAdminData}
    />
  );
}
