import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Type, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileWidgetMenu({ widget, open, onClose, onEdit, onRename, onDelete }) {
  if (!widget) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl pb-safe"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Title */}
            <div className="px-5 pb-3 border-b">
              <p className="text-xs text-muted-foreground">Widget</p>
              <p className="font-semibold text-sm truncate">{widget.title || 'Untitled'}</p>
            </div>

            {/* Actions */}
            <div className="px-4 pt-3 space-y-1">
              <button
                onClick={() => { onEdit(); onClose(); }}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-muted active:bg-muted/80 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Pencil className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Edit Widget</p>
                  <p className="text-xs text-muted-foreground">Change data, type, and style</p>
                </div>
              </button>

              <button
                onClick={() => { onRename(); onClose(); }}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-muted active:bg-muted/80 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Type className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Rename</p>
                  <p className="text-xs text-muted-foreground">Change the widget title</p>
                </div>
              </button>

              <button
                onClick={() => { onDelete(); onClose(); }}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-destructive/10 active:bg-destructive/20 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Widget</p>
                  <p className="text-xs text-muted-foreground">Remove from dashboard</p>
                </div>
              </button>
            </div>

            <div className="px-4 pt-3">
              <Button variant="outline" className="w-full" onClick={onClose}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}