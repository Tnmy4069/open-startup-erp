'use client';

import { useApp } from '@/context/AppContext';

/**
 * Client-side permission hook — mirrors the server-side permission matrix
 * in src/lib/permissions.ts
 */
export function usePermissions() {
  const { role } = useApp();

  return {
    role,
    canCreate: ['Super Admin', 'Co-Founder', 'Founder', 'Committee Member'].includes(role),
    canEdit: ['Super Admin', 'Co-Founder', 'Founder'].includes(role),
    canDelete: role === 'Super Admin',
    canEditSettings: ['Super Admin', 'Co-Founder'].includes(role),
    canManageUsers: role === 'Super Admin',
  };
}
