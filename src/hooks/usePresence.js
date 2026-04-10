const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback, useRef } from 'react';

import { CURSOR_COLORS } from '@/lib/constants';
import { throttle } from 'lodash';

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

const STALE_THRESHOLD_MS = 30000;
const HEARTBEAT_MS = 15000;      // reduced from 8s → 15s
const CURSOR_THROTTLE_MS = 300;  // reduced from 80ms → 300ms

export function usePresence(dashboardId, user, role) {
  const [presences, setPresences] = useState([]);
  const presenceIdRef = useRef(null);
  const heartbeatRef = useRef(null);
  const staleCleanupRef = useRef(null);
  const unmountedRef = useRef(false);

  const color = CURSOR_COLORS[Math.abs(hashCode(user?.email || '')) % CURSOR_COLORS.length];

  useEffect(() => {
    if (!dashboardId || !user) return;
    unmountedRef.current = false;

    const init = async () => {
      // Remove stale own records
      try {
        const existing = await db.entities.UserPresence.filter({
          dashboard_id: dashboardId,
          user_email: user.email,
        });
        await Promise.all(existing.map(p => db.entities.UserPresence.delete(p.id).catch(() => {})));
      } catch (_) {}

      if (unmountedRef.current) return;

      const presence = await db.entities.UserPresence.create({
        dashboard_id: dashboardId,
        user_email: user.email,
        user_name: user.full_name || user.email,
        cursor_x: -999,
        cursor_y: -999,
        color,
        role: role || 'viewer',
        last_active: new Date().toISOString(),
      });
      presenceIdRef.current = presence.id;

      // Heartbeat — guard against stale id after unmount
      heartbeatRef.current = setInterval(() => {
        if (presenceIdRef.current && !unmountedRef.current) {
          db.entities.UserPresence.update(presenceIdRef.current, {
            last_active: new Date().toISOString(),
          }).catch(() => {});
        }
      }, HEARTBEAT_MS);

      // Periodically prune stale presences from local state
      staleCleanupRef.current = setInterval(() => {
        setPresences(prev =>
          prev.filter(p => new Date() - new Date(p.last_active) < STALE_THRESHOLD_MS)
        );
      }, 8000);
    };

    init();

    const unsubscribe = db.entities.UserPresence.subscribe((event) => {
      if (event.type === 'create' && event.data?.dashboard_id === dashboardId) {
        setPresences(prev => [...prev.filter(p => p.user_email !== event.data.user_email), event.data]);
      } else if (event.type === 'update' && event.data?.dashboard_id === dashboardId) {
        setPresences(prev => prev.map(p => p.id === event.id ? event.data : p));
      } else if (event.type === 'delete') {
        setPresences(prev => prev.filter(p => p.id !== event.id));
      }
    });

    // Load current presences, filtering stale ones
    db.entities.UserPresence.filter({ dashboard_id: dashboardId }).then(data => {
      if (unmountedRef.current) return;
      const fresh = data.filter(p =>
        p.user_email !== user.email &&
        new Date() - new Date(p.last_active) < STALE_THRESHOLD_MS
      );
      setPresences(fresh);
    }).catch(() => {});

    return () => {
      unmountedRef.current = true;
      unsubscribe();
      clearInterval(heartbeatRef.current);
      clearInterval(staleCleanupRef.current);
      const idToDelete = presenceIdRef.current;
      presenceIdRef.current = null;
      if (idToDelete) {
        db.entities.UserPresence.delete(idToDelete).catch(() => {});
      }
    };
  }, [dashboardId, user?.email]);

  // Throttled cursor update — guarded against post-unmount calls
  const updateCursor = useCallback(
    throttle((x, y) => {
      if (presenceIdRef.current && !unmountedRef.current) {
        db.entities.UserPresence.update(presenceIdRef.current, {
          cursor_x: Math.round(x),
          cursor_y: Math.round(y),
          last_active: new Date().toISOString(),
        }).catch(() => {});
      }
    }, CURSOR_THROTTLE_MS),
    []
  );

  const otherPresences = presences.filter(p => p.user_email !== user?.email);

  return { presences: otherPresences, updateCursor, myColor: color };
}