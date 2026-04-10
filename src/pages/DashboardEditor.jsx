const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardCanvas from '@/components/dashboard/DashboardCanvas';
import WidgetLibrary from '@/components/dashboard/WidgetLibrary';
import ChatPanel from '@/components/dashboard/ChatPanel';
import { useWidgets } from '@/hooks/useWidgets';
import { usePresence } from '@/hooks/usePresence';
import { useDashboardRole, canUserEdit } from '@/hooks/useDashboardRole';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import VersionHistoryPanel from '@/components/dashboard/VersionHistoryPanel';
import TrashPanel from '@/components/dashboard/TrashPanel';
import { useActivityLogger } from '@/hooks/useActivityLogger';

export default function DashboardEditor() {
  const dashboardId = window.location.pathname.split('/dashboard/')[1];
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser);
  }, []);

  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: async () => {
      const list = await db.entities.Dashboard.filter({ id: dashboardId });
      return list[0] || null;
    },
    enabled: !!dashboardId,
  });

  // Subscribe to dashboard changes
  useEffect(() => {
    if (!dashboardId) return;
    const unsub = db.entities.Dashboard.subscribe((event) => {
      if (event.id === dashboardId && (event.type === 'update' || event.type === 'create')) {
        queryClient.setQueryData(['dashboard', dashboardId], event.data);
      }
    });
    return unsub;
  }, [dashboardId, queryClient]);

  const { widgets, isLoading: widgetsLoading, addWidget, updateWidget, deleteWidget } = useWidgets(dashboardId);
  const { versions, loading: versionsLoading, fetchVersions, recordVersion, nameVersion, deleteVersion } = useVersionHistory(dashboardId, user);
  const { logEvent } = useActivityLogger(user);
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [trashPanelOpen, setTrashPanelOpen] = useState(false);
  const role = useDashboardRole(dashboard, user?.email);
  const { presences, updateCursor, myColor } = usePresence(dashboardId, user, role);

  const canEdit = canUserEdit(role);

  const handleUpdateDashboard = useCallback(async (data) => {
    if (!dashboardId) return;
    await db.entities.Dashboard.update(dashboardId, data);
    queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] });
  }, [dashboardId, queryClient]);

  const handleDeleteWidget = useCallback(async (widgetId) => {
    const w = widgets.find(w => w.id === widgetId);
    await deleteWidget(widgetId, user);
    logEvent('widget_deleted', `"${w?.title || w?.type || 'Widget'}" on dashboard ${dashboard?.title || dashboardId}`);
  }, [deleteWidget, user, widgets, logEvent, dashboard?.title, dashboardId]);

  const handleRestoreVersion = useCallback(async (version) => {
    try {
      const snap = JSON.parse(version.widgets_snapshot);
      // Soft-delete all current widgets
      await Promise.all(widgets.map(w => db.entities.Widget.update(w.id, { trashed: true, trashed_at: new Date().toISOString() })));
      // Restore snapshotted widgets
      await Promise.all(snap.map(w => {
        const { id, created_date, updated_date, ...rest } = w;
        return db.entities.Widget.create({ ...rest, trashed: false, trashed_at: null });
      }));
      queryClient.invalidateQueries({ queryKey: ['widgets', dashboardId] });
    } catch (e) {
      console.error('Restore failed', e);
    }
  }, [widgets, dashboardId, queryClient]);

  const handleOpenVersions = () => {
    fetchVersions();
    setVersionPanelOpen(true);
  };

  const handleAddWidget = useCallback(async (type, overrides) => {
    await addWidget(type, overrides || user?.email, overrides ? user?.email : undefined);
    await recordVersion(widgets, `Widget added`);
    logEvent('widget_created', `Type: ${type} on dashboard ${dashboard?.title || dashboardId}`);
  }, [addWidget, user?.email, recordVersion, widgets, logEvent, dashboard?.title, dashboardId]);

  const handleUpdateWidget = useCallback(async (widgetId, data) => {
    const isLayout = Object.keys(data).every(k => ['x','y','w','h'].includes(k));
    if (!isLayout) {
      const w = widgets.find(w => w.id === widgetId);
      const name = w?.title || w?.type || 'Widget';
      await recordVersion(widgets, `"${name}" edited`);
    }
    await updateWidget(widgetId, data, user?.email);
  }, [updateWidget, user?.email, recordVersion, widgets]);

  if (dashboardLoading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Dashboard not found</h2>
          <p className="text-muted-foreground text-sm">It may have been deleted or you don't have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        dashboard={dashboard}
        role={role}
        presences={presences}
        myColor={myColor}
        userName={user?.full_name || user?.email}
        onUpdateDashboard={handleUpdateDashboard}
        onAddWidget={handleAddWidget}
        onOpenVersionHistory={handleOpenVersions}
        onOpenTrash={() => setTrashPanelOpen(true)}
      />

      <div className="flex gap-4 p-3 sm:p-6">
        {/* Widget Library Sidebar */}
        {canEdit && (
          <WidgetLibrary onAddWidget={handleAddWidget} canEdit={canEdit} />
        )}

        {/* Dashboard Canvas */}
        <div className="flex-1 min-w-0">
          <DashboardCanvas
            widgets={widgets}
            presences={presences}
            onUpdateWidget={handleUpdateWidget}
            onDeleteWidget={handleDeleteWidget}
            onCursorMove={updateCursor}
            onAddWidget={handleAddWidget}
            canEdit={canEdit}
          />
        </div>
      </div>

      <VersionHistoryPanel
        open={versionPanelOpen}
        onClose={() => setVersionPanelOpen(false)}
        versions={versions}
        loading={versionsLoading}
        onRestore={handleRestoreVersion}
        onName={nameVersion}
        onDeleteVersion={deleteVersion}
      />
      <TrashPanel
        open={trashPanelOpen}
        onClose={() => setTrashPanelOpen(false)}
        dashboardId={dashboardId}
        user={user}
        onWidgetRestored={() => {}}
      />

      {/* Chat */}
      <ChatPanel
        dashboardId={dashboardId}
        user={user}
        role={role}
        presences={presences}
      />
    </div>
  );
}