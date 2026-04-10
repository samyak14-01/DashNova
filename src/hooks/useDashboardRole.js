import { useMemo } from 'react';

/**
 * Returns the effective role for a user on a dashboard.
 * Owner is always 'admin'. Collaborators get their assigned role.
 * Anyone else is 'viewer'.
 */
export function useDashboardRole(dashboard, userEmail) {
  return useMemo(() => {
    if (!dashboard || !userEmail) return 'viewer';
    if (dashboard.owner_email === userEmail) return 'admin';
    const collab = (dashboard.collaborators || []).find(
      c => c.email?.toLowerCase() === userEmail?.toLowerCase()
    );
    return collab?.role || 'viewer';
  }, [dashboard, userEmail]);
}

export function canUserEdit(role) {
  return role === 'admin' || role === 'editor';
}

export function canUserAdmin(role) {
  return role === 'admin';
}