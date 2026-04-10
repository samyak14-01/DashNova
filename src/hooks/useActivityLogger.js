const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useRef, useCallback } from 'react';

// Generates a simple unique session ID
function genSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useActivityLogger(user) {
  const sessionIdRef = useRef(null);
  const logEntryIdRef = useRef(null);
  const loginTimeRef = useRef(null);

  // Log a system event (widget/dashboard actions) — can be called externally
  const logEvent = useCallback(async (eventType, details = '') => {
    if (!user) return;
    // Fire-and-forget, non-blocking
    db.entities.UserActivityLog.create({
      user_id: user.id || user.email,
      username: user.full_name || user.email,
      email: user.email,
      session_id: sessionIdRef.current || genSessionId(),
      event_type: eventType,
      login_time: new Date().toISOString(),
      details,
    }).catch(() => {}); // silently ignore logging errors
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Prevent duplicate sessions on React strict-mode double mount
    const existingSession = sessionStorage.getItem('dash_nova_session');
    if (existingSession) {
      const { sessionId, logId } = JSON.parse(existingSession);
      sessionIdRef.current = sessionId;
      logEntryIdRef.current = logId;
      loginTimeRef.current = new Date();
      return;
    }

    const sessionId = genSessionId();
    sessionIdRef.current = sessionId;
    loginTimeRef.current = new Date();

    // Create login entry async (non-blocking)
    db.entities.UserActivityLog.create({
      user_id: user.id || user.email,
      username: user.full_name || user.email,
      email: user.email,
      session_id: sessionId,
      event_type: 'login',
      login_time: new Date().toISOString(),
    }).then(entry => {
      logEntryIdRef.current = entry.id;
      sessionStorage.setItem('dash_nova_session', JSON.stringify({ sessionId, logId: entry.id }));
    }).catch(() => {});

    // On tab/browser close — update logout time
    const handleUnload = () => {
      const id = logEntryIdRef.current;
      if (!id) return;
      const duration = Math.round((Date.now() - loginTimeRef.current.getTime()) / 1000);
      // Use sendBeacon for reliable unload logging
      const payload = JSON.stringify({
        logout_time: new Date().toISOString(),
        session_duration_seconds: duration,
        event_type: 'logout',
      });
      // Fallback to sync XHR on unload since fetch/async won't fire
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/entity/UserActivityLog/${id}/update`, false); // sync
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
      } catch {
        // Best effort — update via base44 as backup
        db.entities.UserActivityLog.update(id, {
          logout_time: new Date().toISOString(),
          session_duration_seconds: duration,
          event_type: 'logout',
        }).catch(() => {});
      }
      sessionStorage.removeItem('dash_nova_session');
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user]);

  // Call this on explicit logout button click
  const recordLogout = useCallback(async () => {
    const id = logEntryIdRef.current;
    if (!id || !loginTimeRef.current) return;
    const duration = Math.round((Date.now() - loginTimeRef.current.getTime()) / 1000);
    sessionStorage.removeItem('dash_nova_session');
    await db.entities.UserActivityLog.update(id, {
      logout_time: new Date().toISOString(),
      session_duration_seconds: duration,
      event_type: 'logout',
    }).catch(() => {});
  }, []);

  return { logEvent, recordLogout };
}