import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Crown, Pencil, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { format, isToday, isYesterday } from 'date-fns';

const ROLE_STYLES = {
  admin: { label: 'Admin', color: 'text-primary', icon: Crown },
  editor: { label: 'Editor', color: 'text-accent', icon: Pencil },
  viewer: { label: 'Viewer', color: 'text-muted-foreground', icon: Eye },
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
  return format(d, 'MMM d, HH:mm');
}

function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function hashColor(str) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#14b8a6','#3b82f6','#f43f5e'];
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

export default function ChatPanel({ dashboardId, user, role, presences }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const prevCountRef = useRef(0);
  const { messages, typingUsers, sendMessage, sendTyping } = useChat(dashboardId, user, role);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(0);
    } else {
      const newCount = messages.length - prevCountRef.current;
      if (newCount > 0 && prevCountRef.current > 0) setUnread(c => c + newCount);
    }
    prevCountRef.current = messages.length;
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onlineUsers = presences?.filter(p => p.user_email !== user?.email) || [];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); setUnread(0); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-96 h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Dashboard Chat</span>
                {onlineUsers.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {onlineUsers.length + 1} online
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Online users strip */}
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-1.5 px-4 py-2 border-b bg-muted/30 overflow-x-auto flex-shrink-0">
                <span className="text-xs text-muted-foreground flex-shrink-0">Online:</span>
                {onlineUsers.map(p => (
                  <div key={p.user_email} className="flex items-center gap-1 bg-card rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {(p.user_name || p.user_email.split('@')[0]).split(' ')[0]}
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet. Say hi!</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.user_email === user?.email;
                const prevMsg = messages[i - 1];
                const isSameUser = prevMsg?.user_email === msg.user_email;
                const roleInfo = ROLE_STYLES[msg.user_role] || ROLE_STYLES.viewer;
                const RoleIcon = roleInfo.icon;
                const color = hashColor(msg.user_email);
                const name = msg.user_name || msg.user_email.split('@')[0];

                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isSameUser && !isMe ? (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ background: color }}
                      >
                        {getInitials(name)}
                      </div>
                    ) : (
                      <div className="w-7 flex-shrink-0" />
                    )}
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      {!isSameUser && !isMe && (
                        <div className="flex items-center gap-1 px-1">
                          <span className="text-xs font-semibold text-foreground">{name}</span>
                          <RoleIcon className={`w-3 h-3 ${roleInfo.color}`} />
                        </div>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted text-foreground rounded-tl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">
                        {formatTime(msg.created_date)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 items-center bg-muted rounded-2xl px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {typingUsers.map(u => u.name || u.email.split('@')[0]).join(', ')} typing
                    </span>
                    <div className="flex gap-0.5 ml-1">
                      {[0,1,2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-card">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={e => { setInput(e.target.value); sendTyping(); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 resize-none bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  style={{ maxHeight: 96, overflowY: 'auto' }}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h-10 w-10 rounded-xl flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}