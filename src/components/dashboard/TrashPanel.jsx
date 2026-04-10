const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, X, Inbox, AlertCircle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TrashPanel({ open, onClose, dashboardId, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [working, setWorking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !dashboardId) return;
    setLoading(true);
    setError(null);
    db.entities.TrashedItem.filter({ item_type: 'widget', dashboard_id: dashboardId }, '-created_date', 50)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open, dashboardId]);

  const handleRestore = useCallback(async (item) => {
    setWorking(item.id);
    setError(null);

    // Optimistic: remove from trash list immediately
    setItems(prev => prev.filter(i => i.id !== item.id));

    try {
      const data = JSON.parse(item.data_snapshot);
      const { id: _id, created_date: _cd, updated_date: _ud, ...rest } = data;

      // Create widget + delete trash entry concurrently
      await Promise.all([
        db.entities.Widget.create({ ...rest, dashboard_id: dashboardId }),
        db.entities.TrashedItem.delete(item.id),
      ]);
      // Widget appears via real-time subscription in useWidgets — no full reload needed
    } catch (e) {
      // Rollback: re-add item to list
      setItems(prev => [item, ...prev]);
      setError('Restore failed. Please try again.');
    } finally {
      setWorking(null);
    }
  }, [dashboardId]);

  const handlePermanentDelete = useCallback(async (item) => {
    setWorking(item.id);
    // Optimistic
    setItems(prev => prev.filter(i => i.id !== item.id));
    setConfirmDelete(null);
    try {
      await db.entities.TrashedItem.delete(item.id);
    } catch {
      setItems(prev => [item, ...prev]);
      setError('Delete failed. Please try again.');
    } finally {
      setWorking(null);
    }
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">Widget Trash</h2>
                {items.length > 0 && (
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {error && (
              <div className="mx-4 mt-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Inbox className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No deleted widgets</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Deleted widgets will appear here</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 30, transition: { duration: 0.15 } }}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.item_name || 'Unnamed Widget'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.deleted_by_name || item.deleted_by_email} · {timeAgo(item.created_date)}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Button
                          size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs"
                          onClick={() => handleRestore(item)}
                          disabled={working === item.id}
                        >
                          {working === item.id
                            ? <div className="w-3 h-3 border border-primary/40 border-t-primary rounded-full animate-spin" />
                            : <RotateCcw className="w-3 h-3" />}
                          Restore
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelete(item)}
                          disabled={working === item.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Permanently Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove "{confirmDelete?.item_name}". This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handlePermanentDelete(confirmDelete)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}