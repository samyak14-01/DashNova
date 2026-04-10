const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, LayoutDashboard, Search, LogOut, ChevronDown, Trash2, Activity, Download, Users } from 'lucide-react';
import { useSessionPresence } from '@/hooks/useSessionPresence';
import { Link } from 'react-router-dom';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import GlobalTrashPanel from '@/components/home/GlobalTrashPanel';
import ThemePicker from '@/components/dashboard/ThemePicker';
import { motion } from 'framer-motion';
import DashboardCard from '@/components/home/DashboardCard';
import DeleteAccountDialog from '@/components/home/DeleteAccountDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Home() {
  const [user, setUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { recordLogout, logEvent } = useActivityLogger(user);
  useSessionPresence(user);

  useEffect(() => {
    db.auth.me().then(setUser);
  }, []);

  const { data: dashboards = [], isLoading } = useQuery({
    queryKey: ['dashboards'],
    queryFn: () => db.entities.Dashboard.list('-updated_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Dashboard.create(data),
    onSuccess: (created) => {
      logEvent('dashboard_created', `"${created?.title || 'Untitled'}"`);
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      setCreateOpen(false);
      setTitle('');
      setDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, dashboard }) => {
      await db.entities.TrashedItem.create({
        item_type: 'dashboard',
        item_name: dashboard.title || 'Untitled Dashboard',
        deleted_by_email: user?.email || '',
        deleted_by_name: user?.full_name || user?.email || '',
        data_snapshot: JSON.stringify(dashboard),
      });
      await db.entities.Dashboard.delete(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboards'] }),
  });

  const handleCreate = () => {
    if (!title.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      owner_email: user?.email,
      collaborators: [],
      is_public: false,
    });
  };

  const myDashboards = dashboards.filter(d => d.owner_email === user?.email);
  const sharedDashboards = dashboards.filter(d =>
    d.owner_email !== user?.email &&
    (d.collaborators || []).some(c => c.email === user?.email)
  );

  const filterDashboards = (list) =>
    list.filter(d => d.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30" style={{ paddingTop: 'var(--safe-area-top)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Dash Nova</span>
          </div>
          <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setTrashOpen(true)} title="Trash">
            <Trash2 className="w-4 h-4" />
          </Button>
          <ThemePicker />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                {user && (
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {user.full_name || user.email}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {user?.role === 'owner' && (
                <>
                  <Link to="/activity-log">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Activity className="w-4 h-4" />
                      Activity Logs
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/active-sessions">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Users className="w-4 h-4" />
                      Active Sessions
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/data-export">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Download className="w-4 h-4" />
                      Export Data
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={async () => { await recordLogout(); db.auth.logout(); }} className="gap-2 cursor-pointer">
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-1 py-0.5">
                <DeleteAccountDialog />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search dashboards..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Dashboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Dashboard title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="h-20"
                />
                <Button onClick={handleCreate} className="w-full" disabled={!title.trim()}>
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* My Dashboards */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            My Dashboards
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filterDashboards(myDashboards).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filterDashboards(myDashboards).map((d, i) => (
                <DashboardCard key={d.id} dashboard={d} isOwner index={i} onDelete={id => deleteMutation.mutate({ id, dashboard: d })} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 border-2 border-dashed rounded-2xl"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">No dashboards yet</h3>
              <p className="text-sm text-muted-foreground">Create your first dashboard to get started</p>
            </motion.div>
          )}
        </section>

        {/* Shared with me */}
        {filterDashboards(sharedDashboards).length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Shared with me
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filterDashboards(sharedDashboards).map((d, i) => (
                <DashboardCard key={d.id} dashboard={d} isOwner={false} index={i} onDelete={() => {}} />
              ))}
            </div>
          </section>
        )}
      </main>

      <GlobalTrashPanel
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        onRestored={() => queryClient.invalidateQueries({ queryKey: ['dashboards'] })}
      />
    </div>
  );
}