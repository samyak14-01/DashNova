const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileSpreadsheet, FileText, FileJson, Loader2, Shield } from 'lucide-react';
import { format } from 'date-fns';

const DATA_TYPES = [
  { id: 'activity', label: 'User Activity Logs' },
  { id: 'dashboards', label: 'Dashboards' },
  { id: 'widgets', label: 'Widgets' },
];

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataExport() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [selectedTypes, setSelectedTypes] = useState(['activity', 'dashboards', 'widgets']);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDashboard, setFilterDashboard] = useState('');
  const [dashboardList, setDashboardList] = useState([]);

  useEffect(() => {
    db.auth.me().then(setUser);
    db.entities.Dashboard.list('-created_date', 200).then(setDashboardList);
  }, []);

  const toggleType = (id) => {
    setSelectedTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const applyDateFilter = (rows, field = 'created_date') => {
    return rows.filter(r => {
      const ts = new Date(r[field] || r.created_date);
      if (dateFrom && ts < new Date(dateFrom)) return false;
      if (dateTo && ts > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const filename = `dash-nova-export-${today}`;

      // Fetch selected data in parallel
      const [activityLogs, dashboards, widgets] = await Promise.all([
        selectedTypes.includes('activity')
          ? db.entities.UserActivityLog.list('-created_date', 1000)
          : Promise.resolve([]),
        selectedTypes.includes('dashboards')
          ? db.entities.Dashboard.list('-created_date', 1000)
          : Promise.resolve([]),
        selectedTypes.includes('widgets')
          ? db.entities.Widget.list('-created_date', 2000)
          : Promise.resolve([]),
      ]);

      // Apply filters
      let filteredActivity = applyDateFilter(activityLogs, 'login_time');
      let filteredDashboards = applyDateFilter(dashboards);
      let filteredWidgets = applyDateFilter(widgets);

      if (filterUser.trim()) {
        const u = filterUser.trim().toLowerCase();
        filteredActivity = filteredActivity.filter(r => r.email?.toLowerCase().includes(u) || r.username?.toLowerCase().includes(u));
        filteredDashboards = filteredDashboards.filter(r => r.owner_email?.toLowerCase().includes(u));
        filteredWidgets = filteredWidgets.filter(r => r.last_edited_by?.toLowerCase().includes(u));
      }
      if (filterDashboard.trim()) {
        const d = filterDashboard.trim().toLowerCase();
        filteredWidgets = filteredWidgets.filter(r => r.dashboard_id?.toLowerCase().includes(d));
        filteredDashboards = filteredDashboards.filter(r => r.id?.toLowerCase().includes(d) || r.title?.toLowerCase().includes(d));
      }

      // Shape rows
      const activityRows = filteredActivity.map(r => ({
        'User ID': r.user_id || '',
        'Username': r.username || '',
        'Email': r.email || '',
        'Event Type': r.event_type || '',
        'Login Time': r.login_time || '',
        'Logout Time': r.logout_time || '',
        'Session Duration (s)': r.session_duration_seconds ?? '',
        'Details': r.details || '',
        'Timestamp': r.created_date || '',
      }));

      const dashboardRows = filteredDashboards.map(r => ({
        'Dashboard ID': r.id || '',
        'Name': r.title || '',
        'Description': r.description || '',
        'Created By': r.owner_email || '',
        'Created At': r.created_date || '',
        'Is Public': r.is_public ? 'Yes' : 'No',
        'Collaborators': (r.collaborators || []).map(c => `${c.email}(${c.role})`).join(', '),
      }));

      const widgetRows = filteredWidgets.map(r => ({
        'Widget ID': r.id || '',
        'Type': r.type || '',
        'Title': r.title || '',
        'Dashboard ID': r.dashboard_id || '',
        'Dashboard Name': dashboardList.find(d => d.id === r.dashboard_id)?.title || '',
        'X': r.x ?? '',
        'Y': r.y ?? '',
        'Width': r.w ?? '',
        'Height': r.h ?? '',
        'Last Edited By': r.last_edited_by || '',
        'Created At': r.created_date || '',
      }));

      if (exportFormat === 'xlsx') {
        const wb = XLSX.utils.book_new();
        if (selectedTypes.includes('activity')) {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activityRows), 'User Activity Logs');
        }
        if (selectedTypes.includes('dashboards')) {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dashboardRows), 'Dashboards');
        }
        if (selectedTypes.includes('widgets')) {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(widgetRows), 'Widgets');
        }
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        downloadBlob(new Blob([buf], { type: 'application/octet-stream' }), `${filename}.xlsx`);

      } else if (exportFormat === 'csv') {
        const allRows = [
          ...activityRows.map(r => ({ ...r, _sheet: 'Activity' })),
          ...dashboardRows.map(r => ({ ...r, _sheet: 'Dashboard' })),
          ...widgetRows.map(r => ({ ...r, _sheet: 'Widget' })),
        ];
        const ws = XLSX.utils.json_to_sheet(allRows);
        const csv = XLSX.utils.sheet_to_csv(ws);
        downloadBlob(new Blob([csv], { type: 'text/csv' }), `${filename}.csv`);

      } else if (exportFormat === 'json') {
        const data = {};
        if (selectedTypes.includes('activity')) data.activityLogs = activityRows;
        if (selectedTypes.includes('dashboards')) data.dashboards = dashboardRows;
        if (selectedTypes.includes('widgets')) data.widgets = widgetRows;
        const json = JSON.stringify(data, null, 2);
        downloadBlob(new Blob([json], { type: 'application/json' }), `${filename}.json`);
      }
    } finally {
      setLoading(false);
    }
  };

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
        <p className="text-muted-foreground text-sm">Owner only feature — data export is restricted.</p>
        <Link to="/"><Button variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-lg font-bold">Data Export</h1>
            <p className="text-xs text-muted-foreground">Export system data for backup, auditing, or analysis</p>
          </div>
          <Badge className="ml-auto bg-primary/10 text-primary">Owner Only</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Data Types */}
        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-semibold mb-4">1. Select Data to Export</h2>
          <div className="flex flex-wrap gap-3">
            {DATA_TYPES.map(dt => (
              <button
                key={dt.id}
                onClick={() => toggleType(dt.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  selectedTypes.includes(dt.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {dt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-semibold mb-4">2. Filters <span className="text-muted-foreground font-normal text-sm">(optional)</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">From Date</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">To Date</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Filter by User (email/name)</label>
              <Input placeholder="e.g. john@example.com" value={filterUser} onChange={e => setFilterUser(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Filter by Dashboard (name or ID)</label>
              <Input placeholder="e.g. Sales Dashboard" value={filterDashboard} onChange={e => setFilterDashboard(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Format */}
        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-semibold mb-4">3. Export Format</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet, desc: 'Multi-sheet, recommended' },
              { id: 'csv', label: 'CSV (.csv)', icon: FileText, desc: 'Universal, flat' },
              { id: 'json', label: 'JSON (.json)', icon: FileJson, desc: 'For developers' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setExportFormat(f.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                  exportFormat === f.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-background border-border hover:border-primary/40'
                }`}
              >
                <f.icon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Download */}
        <section className="bg-card rounded-xl border p-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Ready to export?</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              File will be named: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">dash-nova-export-{format(new Date(), 'yyyy-MM-dd')}.{exportFormat}</code>
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={loading || selectedTypes.length === 0}
            className="gap-2 min-w-[160px]"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</>
              : <><Download className="w-4 h-4" /> Download</>
            }
          </Button>
        </section>
      </main>
    </div>
  );
}