const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback, useRef } from 'react';

import { throttle } from 'lodash';

const TYPING_TIMEOUT = 3000;

export function useChat(dashboardId, user, role) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimers = useRef({});

  useEffect(() => {
    if (!dashboardId) return;

    db.entities.ChatMessage
      .filter({ dashboard_id: dashboardId }, '-created_date', 50)
      .then(data => setMessages(data.filter(m => m.type !== 'typing' && m.text !== '__typing__').reverse()));

    const unsub = db.entities.ChatMessage.subscribe((event) => {
      if (event.data?.dashboard_id !== dashboardId) return;

      if (event.type === 'create') {
        if (event.data.type === 'typing') {
          const email = event.data.user_email;
          if (email === user?.email) return;

          setTypingUsers(prev => {
            if (!prev.find(u => u.email === email)) {
              return [...prev, { email, name: event.data.user_name }];
            }
            return prev;
          });

          clearTimeout(typingTimers.current[email]);
          typingTimers.current[email] = setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.email !== email));
          }, TYPING_TIMEOUT);
        } else {
          setMessages(prev => {
            if (prev.find(m => m.id === event.data.id)) return prev;
            return [...prev, event.data];
          });
          // Remove from typing when they send
          setTypingUsers(prev => prev.filter(u => u.email !== event.data.user_email));
        }
      }
    });

    return () => {
      unsub();
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, [dashboardId, user?.email]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !user) return;
    await db.entities.ChatMessage.create({
      dashboard_id: dashboardId,
      user_email: user.email,
      user_name: user.full_name || user.email.split('@')[0],
      user_role: role || 'viewer',
      text: text.trim(),
      type: 'message',
    });
  }, [dashboardId, user, role]);

  const sendTyping = useCallback(
    throttle(async () => {
      if (!user) return;
      await db.entities.ChatMessage.create({
        dashboard_id: dashboardId,
        user_email: user.email,
        user_name: user.full_name || user.email.split('@')[0],
        user_role: role || 'viewer',
        text: '__typing__',
        type: 'typing',
      });
    }, 2000),
    [dashboardId, user, role]
  );

  return { messages, typingUsers, sendMessage, sendTyping };
}