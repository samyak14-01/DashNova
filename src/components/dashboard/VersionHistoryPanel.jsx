import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, RotateCcw, Pencil, Check, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function VersionHistoryPanel({ open, onClose, versions, loading, onRestore, onName, onDeleteVersion }) {
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    if (!open) { setPreview(null); setEditingId(null); }
  }, [open]);

  const handleRestore = async (version) => {
    setRestoring(version.id);
    await onRestore(version);
    setRestoring(null);
    onClose();
  };

  const handleNameSave = async (vId) => {
    await onName(vId, labelDraft);
    setEditingId(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l shadow-2xl z-50 flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Version History</h2>
                <span className="text-xs text-muted-foreground">({versions.length})</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="border-b bg-muted/50 px-5 py-3 text-xs text-muted-foreground overflow-hidden"
                >
                  <div className="font-semibold text-foreground mb-1">Preview — {preview.length} widget{preview.length !== 1 ? 's' : ''}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.slice(0, 8).map((w, i) => (
                      <span key={i} className="bg-background border rounded px-2 py-0.5 text-[10px]">{w.title || w.type}</span>
                    ))}
                    {preview.length > 8 && <span className="text-muted-foreground">+{preview.length - 8} more</span>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array(5).fill(0).map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
                  <Clock className="w-10 h-10 opacity-30" />
                  <p className="text-sm">No versions saved yet.</p>
                  <p className="text-xs text-center">Versions are recorded automatically when you add, edit, or delete widgets.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {versions.map((v) => {
                    const snap = (() => { try { return JSON.parse(v.widgets_snapshot); } catch { return []; } })();
                    return (
                      <div key={v.id} className="px-5 py-3 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {editingId === v.id ? (
                              <div className="flex items-center gap-1 mb-1">
                                <Input
                                  autoFocus
                                  value={labelDraft}
                                  onChange={e => setLabelDraft(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleNameSave(v.id); if (e.key === 'Escape') setEditingId(null); }}
                                  className="h-7 text-xs flex-1"
                                  placeholder="Name this version…"
                                />
                                <button onClick={() => handleNameSave(v.id)} className="text-emerald-500 p-1"><Check className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-sm font-medium text-foreground truncate">{v.label || v.action || 'Change'}</span>
                                {!v.label && (
                                  <button onClick={() => { setEditingId(v.id); setLabelDraft(''); }} className="text-muted-foreground hover:text-foreground">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span>{v.user_name || v.user_email}</span>
                              <span>·</span>
                              <span>{timeAgo(v.created_date)}</span>
                              <span>·</span>
                              <span>{snap.length} widget{snap.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                              title="Preview"
                              onClick={() => setPreview(prev => prev === snap ? null : snap)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                              title="Restore this version"
                              onClick={() => handleRestore(v)}
                              disabled={restoring === v.id}
                            >
                              {restoring === v.id
                                ? <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                : <RotateCcw className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => onDeleteVersion(v.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}