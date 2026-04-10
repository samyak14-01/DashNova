const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useRef, useCallback } from 'react';

const HEARTBEAT_INTERVAL = 30_000;   // 30s
const IDLE_TIMEOUT      = 3 * 60_000; // 3 min
const EXPIRE_TIMEOUT    = 2 * 60_000; // 2 min without heartbeat = expired

export function useSessionPresence(user) {
  const sessionIdRef  = useRef(null);
  const idleTimerRef  = useRef(null);
  const heartbeatRef  = useRef(null);
  const isIdleRef     = useRef(false);

  const now = () => new Date().toISOString();

  // ── upsert helper ──────────────────────────────────────────────────────────
  const upsert = useCallback(async (patch) => {
    if (!user?.id) return;
    try {
      if (sessionIdRef.current) {
        await db.entities.UserSession.update(sessionIdRef.current, patch);
      } else {
        const existing = await db.entities.UserSession.filter({ user_id: user.id });
        if (existing.length > 0) {
          sessionIdRef.current = existing[0].id;
          await db.entities.UserSession.update(sessionIdRef.current, patch);
        } else {
          const created = await db.entities.UserSession.create({
            user_id: user.id,
            email: user.email,
            username: user.full_name || user.email,
            login_time: now(),
            last_heartbeat: now(),
            status: 'active',
            current_page: window.location.pathname,
            ...patch,
          });
          sessionIdRef.current = created.id;
        }
      }
    } catch (e) {
      // Silently ignore – presence is best-effort
    }
  }, [user]);

  // ── heartbeat ──────────────────────────────────────────────────────────────
  const sendHeartbeat = useCallback(() => {
    upsert({
      last_heartbeat: now(),
      status: isIdleRef.current ? 'idle' : 'active',
      current_page: window.location.pathname,
    });
  }, [upsert]);

  // ── idle detection ─────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    if (isIdleRef.current) {
      isIdleRef.current = false;
      upsert({ status: 'active', last_heartbeat: now() });
    }
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true;
      upsert({ status: 'idle', last_heartbeat: now() });
    }, IDLE_TIMEOUT);
  }, [upsert]);

  // ── go offline ─────────────────────────────────────────────────────────────
  const goOffline = useCallback(() => {
    upsert({ status: 'offline', logout_time: now() });
  }, [upsert]);

  // ── mount / unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // Start session
    upsert({ status: 'active', login_time: now(), last_heartbeat: now() });

    // Heartbeat loop
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Activity listeners for idle reset
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    // Browser close / tab close
    const handleUnload = () => {
      // Use sendBeacon for reliability on unload
      const id = sessionIdRef.current;
      if (id) {
        const payload = JSON.stringify({ status: 'offline', logout_time: now() });
        // Best-effort: update via normal call (sendBeacon not available for SDK)
        navigator.sendBeacon?.(`/api/noop`, payload); // no-op, just to flush
        upsert({ status: 'offline', logout_time: now() });
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    // Visibility change → idle when hidden
    const handleVisibility = () => {
      if (document.hidden) {
        isIdleRef.current = true;
        upsert({ status: 'idle', last_heartbeat: now() });
      } else {
        isIdleRef.current = false;
        upsert({ status: 'active', last_heartbeat: now() });
        resetIdleTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(heartbeatRef.current);
      clearTimeout(idleTimerRef.current);
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      goOffline();
    };
  }, [user?.id]);

  return { sessionId: sessionIdRef.current };
}