const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback } from 'react';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Shield, Search, RefreshCw, Users, Activity, Clock, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const EXPIRE_MINUTES = 2;

function deriveStatus(session) {
  if (!session.last_heartbeat) return session.status || 'offline';
  const minsAgo = (Date.now() - new Date(session.last_heartbeat).getTime()) / 60000;
  if (minsAgo > EXPIRE_MINUTES) return 'expired';
  return session.status || 'active';
}

const STATUS_CONFIG = {
  active:  { label: 'Active',   dot: 'bg-green-500',  badge: 'bg-green-500/10 text-green-600' },
  idle:    { label: 'Idle',     dot: 'bg-yellow-400', badge: 'bg-yellow-400/10 text-yellow-600' },
  offline: { label: 'Offline',  dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-500' },
  expired: { label: 'Expired',  dot: 'bg-red-400',    badge: 'bg-red-500/10 text-red-500' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export default function ActiveSessions() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const data = await db.entities.UserSession.list('-last_heartbeat', 200);
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    db.auth.me().then(setUser);
    fetchSessions();

    // Real-time updates
    const unsub = db.entities.UserSession.subscribe((event) => {
      if (event.type === 'create') {
        setSessions(prev => {
          if (prev.find(s => s.id === event.data.id)) return prev;
          return [event.data, ...prev];
        });
      } else if (event.type === 'update') {
        setSessions(prev => prev.map(s => s.id === event.id ? { ...s, ...event.data } : s));
      } else if (event.type === 'delete') {
        setSessions(prev => prev.filter(s => s.id !== event.id));
      }
    });
    return unsub;
  }, [fetchSessions]);

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (user.role !== 'owner') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-sm text-muted-foreground">Owner only feature — active sessions are restricted.</p>
        <Link to="/"><Button variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  const enriched = sessions.map(s => ({ ...s, _derived: deriveStatus(s) }));

  const filtered = enriched.filter(s => {
    const matchSearch = !search || s.username?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s._derived === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    active:  enriched.filter(s => s._derived === 'active').length,
    idle:    enriched.filter(s => s._derived === 'idle').length,
    offline: enriched.filter(s => s._derived === 'offline' || s._derived === 'expired').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-lg font-bold">Active Sessions</h1>
            <p className="text-xs text-muted-foreground">Real-time user presence tracking</p>
          </div>
          <Badge className="ml-auto bg-primary/10 text-primary">Owner Only</Badge>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={fetchSessions}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Now', value: counts.active, icon: Wifi, color: 'text-green-600', bg: 'bg-green-500/10' },
            { label: 'Idle', value: counts.idle, icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-400/10' },
            { label: 'Offline / Expired', value: counts.offline, icon: WifiOff, color: 'text-gray-500', bg: 'bg-muted' },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl border p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'idle', 'offline', 'expired'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                  filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {f === 'all' ? `All (${enriched.length})` : f}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-card rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array(5).fill(0).map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">No sessions found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Last Heartbeat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Login Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Page</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(s => {
                  const cfg = STATUS_CONFIG[s._derived] || STATUS_CONFIG.offline;
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${s._derived === 'active' ? 'animate-pulse' : ''}`} />
                          <div>
                            <p className="font-medium">{s.username || s.email}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          {timeAgo(s.last_heartbeat)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{timeAgo(s.login_time)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.current_page || '/'}</code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}