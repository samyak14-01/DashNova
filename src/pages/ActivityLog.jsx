const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Search, RefreshCw, Activity, Users, LogIn, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const EVENT_COLORS = {
  login: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  logout: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  widget_created: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  widget_deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  dashboard_created: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  dashboard_edited: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

function formatDuration(secs) {
  if (!secs) return '—';
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

function formatTime(iso) {
  if (!iso) return '—';
  try { return format(new Date(iso), 'MMM d, HH:mm:ss'); } catch { return iso; }
}

export default function ActivityLog() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { db.auth.me().then(setUser); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await db.entities.UserActivityLog.list('-created_date', 500);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // Real-time subscription
    const unsub = db.entities.UserActivityLog.subscribe((event) => {
      if (event.type === 'create') {
        setLogs(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setLogs(prev => prev.map(l => l.id === event.id ? { ...l, ...event.data } : l));
      }
    });
    return unsub;
  }, []);

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      (l.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || l.event_type === filter;
    return matchSearch && matchFilter;
  });

  const activeNow = logs.filter(l => l.event_type === 'login' && !l.logout_time);

  const handleExport = () => {
    const rows = filtered.map(l => ({
      'User ID': l.user_id || '',
      'Username': l.username || '',
      'Email': l.email || '',
      'Event': l.event_type || '',
      'Login Time': l.login_time ? formatTime(l.login_time) : '',
      'Logout Time': l.logout_time ? formatTime(l.logout_time) : '',
      'Session Duration': formatDuration(l.session_duration_seconds),
      'Details': l.details || '',
      'Logged At': formatTime(l.created_date),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');
    XLSX.writeFile(wb, `activity_logs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (user && user.role !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Unauthorized Access</h2>
          <p className="text-muted-foreground text-sm mb-4">Owner only feature — activity logs are restricted.</p>
          <Link to="/"><Button variant="outline">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon" className="rounded-full h-9 w-9"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold">Activity Logs</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleExport} className="gap-2">
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: logs.length, icon: Activity, color: 'text-primary' },
            { label: 'Active Sessions', value: activeNow.length, icon: Users, color: 'text-green-600' },
            { label: 'Logins', value: logs.filter(l => l.event_type === 'login').length, icon: LogIn, color: 'text-blue-600' },
            { label: 'Logouts', value: logs.filter(l => l.event_type === 'logout').length, icon: LogOut, color: 'text-slate-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border rounded-xl p-4 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search user..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'login', 'logout', 'widget_created', 'widget_deleted', 'dashboard_created', 'dashboard_edited'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-left font-medium">Login Time</th>
                  <th className="px-4 py-3 text-left font-medium">Logout Time</th>
                  <th className="px-4 py-3 text-left font-medium">Duration</th>
                  <th className="px-4 py-3 text-left font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="border-t">
                      {Array(6).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No logs found</td>
                  </tr>
                ) : filtered.map(log => (
                  <tr key={log.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{log.username || '—'}</p>
                        <p className="text-xs text-muted-foreground">{log.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${EVENT_COLORS[log.event_type] || 'bg-muted text-muted-foreground'}`}>
                        {log.event_type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatTime(log.login_time)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.logout_time ? formatTime(log.logout_time) : (
                        log.event_type === 'login' ? <span className="text-green-600 font-medium">● Active</span> : '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDuration(log.session_duration_seconds)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t text-xs text-muted-foreground bg-muted/30">
              Showing {filtered.length} of {logs.length} events
            </div>
          )}
        </div>
      </main>
    </div>
  );
}