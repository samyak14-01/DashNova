const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

import { DEFAULT_WIDGET_CONFIGS } from '@/lib/constants';

export function useWidgets(dashboardId) {
  const [widgets, setWidgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Map of widgetId → timestamp of last local write.
  // We use this to ignore the echo of OUR OWN update only.
  // Remote updates (different last_edited_by or newer updated_date) always apply.
  const localWriteRef = useRef({});

  useEffect(() => {
    if (!dashboardId) return;

    setIsLoading(true);
    db.entities.Widget.filter({ dashboard_id: dashboardId }).then(data => {
      setWidgets(data.filter(w => !w.trashed));
      setIsLoading(false);
    });

    const unsubscribe = db.entities.Widget.subscribe((event) => {
      if (event.type === 'create' && event.data?.dashboard_id === dashboardId) {
        setWidgets(prev => {
          if (prev.find(w => w.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
        return;
      }

      if (event.type === 'update' && event.data?.dashboard_id === dashboardId) {
        const localWriteTs = localWriteRef.current[event.id];
        if (localWriteTs && (Date.now() - localWriteTs) < 2000) return;
        setWidgets(prev => prev.map(w => w.id === event.id ? { ...w, ...event.data } : w));
        return;
      }

      if (event.type === 'delete') {
        setWidgets(prev => prev.filter(w => w.id !== event.id));
      }
    });

    return () => {
      unsubscribe();
      localWriteRef.current = {};
    };
  }, [dashboardId]);

  const addWidget = useCallback(async (type, userEmailOrOverrides, maybeEmail) => {
    // Support two call signatures:
    //   addWidget(type, userEmail)
    //   addWidget(type, { title, config }, userEmail)  ← from Excel import
    let overrides = {};
    let userEmail;
    if (typeof userEmailOrOverrides === 'string' || userEmailOrOverrides == null) {
      userEmail = userEmailOrOverrides;
    } else {
      overrides = userEmailOrOverrides;
      userEmail = maybeEmail;
    }

    const maxY = widgets.reduce((max, w) => Math.max(max, (w.y || 0) + (w.h || 3)), 0);
    const newWidget = await db.entities.Widget.create({
      dashboard_id: dashboardId,
      type,
      title: overrides.title || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      x: 0,
      y: maxY,
      w: type === 'metric' ? 3 : 6,
      h: type === 'metric' ? 2 : 4,
      config: overrides.config || DEFAULT_WIDGET_CONFIGS[type] || {},
      last_edited_by: userEmail,
      z_index: 1,
    });
    return newWidget;
  }, [dashboardId, widgets]);

  // Debounced map: widgetId → debounced save fn
  const debouncedSaveRef = useRef({});

  const updateWidget = useCallback((widgetId, patch, userEmail) => {
    const fullPatch = { ...patch, last_edited_by: userEmail };

    // Optimistic local update immediately
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...fullPatch } : w));
    localWriteRef.current[widgetId] = Date.now();

    // Create a per-widget debounced save if not already present
    if (!debouncedSaveRef.current[widgetId]) {
      debouncedSaveRef.current[widgetId] = debounce(async (id, data) => {
        await db.entities.Widget.update(id, data);
        setTimeout(() => { delete localWriteRef.current[id]; }, 2500);
      }, 400);
    }

    debouncedSaveRef.current[widgetId](widgetId, fullPatch);
  }, []);

  const deleteWidget = useCallback(async (widgetId, user) => {
    const widget = widgets.find(w => w.id === widgetId);
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    // Save to trash before deleting
    if (widget) {
      await db.entities.TrashedItem.create({
        item_type: 'widget',
        item_name: widget.title || widget.type || 'Widget',
        deleted_by_email: user?.email || '',
        deleted_by_name: user?.full_name || user?.email || '',
        dashboard_id: dashboardId,
        data_snapshot: JSON.stringify(widget),
      });
    }
    await db.entities.Widget.delete(widgetId);
  }, [widgets, dashboardId]);

  return { widgets, isLoading, addWidget, updateWidget, deleteWidget };
}