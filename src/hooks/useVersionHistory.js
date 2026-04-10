const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useCallback, useRef } from 'react';

const MAX_AUTO_VERSIONS = 50;
const RECORD_COOLDOWN = 5000; // max 1 version per 5s

export function useVersionHistory(dashboardId, user) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastRecordRef = useRef(0);

  const fetchVersions = useCallback(async () => {
    if (!dashboardId) return;
    setLoading(true);
    const data = await db.entities.DashboardVersion.filter(
      { dashboard_id: dashboardId },
      '-created_date',
      MAX_AUTO_VERSIONS
    );
    setVersions(data);
    setLoading(false);
  }, [dashboardId]);

  const recordVersion = useCallback(async (widgets, action) => {
    if (!dashboardId || !widgets) return;
    const now = Date.now();
    if (now - lastRecordRef.current < RECORD_COOLDOWN) return;
    lastRecordRef.current = now;
    try {
      await db.entities.DashboardVersion.create({
        dashboard_id: dashboardId,
        action,
        user_email: user?.email || '',
        user_name: user?.full_name || user?.email || 'Unknown',
        widgets_snapshot: JSON.stringify(widgets),
        is_auto: true,
      });
    } catch (e) {
      // Non-critical
    }
  }, [dashboardId, user]);

  const nameVersion = useCallback(async (versionId, label) => {
    await db.entities.DashboardVersion.update(versionId, { label, is_auto: false });
    setVersions(prev => prev.map(v => v.id === versionId ? { ...v, label, is_auto: false } : v));
  }, []);

  const deleteVersion = useCallback(async (versionId) => {
    await db.entities.DashboardVersion.delete(versionId);
    setVersions(prev => prev.filter(v => v.id !== versionId));
  }, []);

  return { versions, loading, fetchVersions, recordVersion, nameVersion, deleteVersion };
}