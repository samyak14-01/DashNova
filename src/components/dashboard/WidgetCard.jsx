import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, MoreVertical, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import ChartBarWidget from './widgets/ChartBarWidget';
import ChartLineWidget from './widgets/ChartLineWidget';
import ChartPieWidget from './widgets/ChartPieWidget';
import TextWidget from './widgets/TextWidget';
import NoteWidget from './widgets/NoteWidget';
import MetricWidget from './widgets/MetricWidget';
import ImageWidget from './widgets/ImageWidget';
import WidgetEditModal from './WidgetEditModal';
import MobileWidgetMenu from './MobileWidgetMenu';

const WIDGET_RENDERERS = {
  chart_bar: ChartBarWidget,
  chart_line: ChartLineWidget,
  chart_pie: ChartPieWidget,
  text: TextWidget,
  note: NoteWidget,
  metric: MetricWidget,
  image: ImageWidget,
};

const HEADER_H = 44;
const LONG_PRESS_MS = 350;

function getXY(e) {
  if (e.touches?.[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (e.changedTouches?.[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function snap(value, step) {
  return Math.round(value / step) * step;
}

const WidgetCard = memo(function WidgetCard({
  widget, onUpdate, onDelete, canEdit, editMode,
  gridCellWidth, rowHeight, gap, cols, isMobile, isTouch,
}) {
  const [hovered, setHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(widget.title || '');

  const cardRef = useRef(null);
  // Keep a mutable snapshot of current position — updated via DOM, not state
  const posRef = useRef({ x: widget.x, y: widget.y, w: widget.w, h: widget.h });
  const longPressTimer = useRef(null);
  const touchMoved = useRef(false);
  const didLongPress = useRef(false);

  const interactable = canEdit && editMode;

  // Sync posRef from props only when not interacting
  const isInteracting = useRef(false);
  useEffect(() => {
    if (!isInteracting.current) {
      posRef.current = { x: widget.x, y: widget.y, w: widget.w, h: widget.h };
      applyPosToDOM(posRef.current);
    }
  }, [widget.x, widget.y, widget.w, widget.h]);

  useEffect(() => {
    if (!editingTitle) setTitleDraft(widget.title || '');
  }, [widget.title, editingTitle]);

  // Apply position to DOM directly — zero React overhead
  const applyPosToDOM = useCallback((pos) => {
    const el = cardRef.current;
    if (!el) return;
    const cellStep = gridCellWidth + gap;
    const rowStep = rowHeight + gap;
    el.style.left = `${pos.x * cellStep}px`;
    el.style.top = `${pos.y * rowStep}px`;
    el.style.width = `${pos.w * gridCellWidth + (pos.w - 1) * gap}px`;
    el.style.height = `${pos.h * rowHeight + (pos.h - 1) * gap}px`;
  }, [gridCellWidth, rowHeight, gap]);

  // ── Drag ──────────────────────────────────────────────────────
  const startDrag = useCallback((e) => {
    if (!interactable) return;
    e.preventDefault();
    isInteracting.current = true;
    setIsActive(true);

    const { x: sx, y: sy } = getXY(e);
    const orig = { ...posRef.current };

    const onMove = (me) => {
      me.preventDefault?.();
      const { x, y } = getXY(me);
      const nx = Math.max(0, Math.min(cols - orig.w, Math.round(orig.x + (x - sx) / (gridCellWidth + gap))));
      const ny = Math.max(0, Math.round(orig.y + (y - sy) / (rowHeight + gap)));
      posRef.current = { ...orig, x: nx, y: ny };
      applyPosToDOM(posRef.current);
    };

    const onEnd = (me) => {
      cleanup();
      isInteracting.current = false;
      setIsActive(false);
      const { x, y } = getXY(me);
      const nx = Math.max(0, Math.min(cols - orig.w, Math.round(orig.x + (x - sx) / (gridCellWidth + gap))));
      const ny = Math.max(0, Math.round(orig.y + (y - sy) / (rowHeight + gap)));
      posRef.current = { ...orig, x: nx, y: ny };
      applyPosToDOM(posRef.current);
      if (nx !== widget.x || ny !== widget.y) onUpdate(widget.id, { x: nx, y: ny });
    };

    const cleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove, { passive: false });
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }, [interactable, cols, gridCellWidth, rowHeight, gap, onUpdate, widget.id, widget.x, widget.y, applyPosToDOM]);

  // ── Touch long-press ──────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (!interactable) return;
    didLongPress.current = false;
    touchMoved.current = false;
    const startE = e;
    longPressTimer.current = setTimeout(() => {
      if (!touchMoved.current) {
        didLongPress.current = true;
        if (navigator.vibrate) navigator.vibrate(30);
        startDrag(startE);
      }
    }, LONG_PRESS_MS);
  }, [interactable, startDrag]);

  const handleTouchMove = useCallback(() => {
    if (!didLongPress.current) {
      touchMoved.current = true;
      clearTimeout(longPressTimer.current);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  // ── Resize ────────────────────────────────────────────────────
  const startResize = useCallback((e) => {
    if (!interactable) return;
    e.preventDefault();
    e.stopPropagation();
    isInteracting.current = true;
    setIsActive(true);

    const { x: sx, y: sy } = getXY(e);
    const orig = { ...posRef.current };

    const onMove = (me) => {
      me.preventDefault?.();
      const { x, y } = getXY(me);
      const nw = Math.max(2, Math.min(cols - orig.x, orig.w + Math.round((x - sx) / (gridCellWidth + gap))));
      const nh = Math.max(2, orig.h + Math.round((y - sy) / (rowHeight + gap)));
      posRef.current = { ...orig, w: nw, h: nh };
      applyPosToDOM(posRef.current);
    };

    const onEnd = (me) => {
      cleanup();
      isInteracting.current = false;
      setIsActive(false);
      const { x, y } = getXY(me);
      const nw = Math.max(2, Math.min(cols - orig.x, orig.w + Math.round((x - sx) / (gridCellWidth + gap))));
      const nh = Math.max(2, orig.h + Math.round((y - sy) / (rowHeight + gap)));
      posRef.current = { ...orig, w: nw, h: nh };
      applyPosToDOM(posRef.current);
      if (nw !== widget.w || nh !== widget.h) onUpdate(widget.id, { w: nw, h: nh });
    };

    const cleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove, { passive: false });
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }, [interactable, cols, gridCellWidth, rowHeight, gap, onUpdate, widget.id, widget.w, widget.h, applyPosToDOM]);

  const handleTitleSave = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== widget.title) onUpdate(widget.id, { title: titleDraft.trim() });
  };

  const Renderer = WIDGET_RENDERERS[widget.type];
  const isNote = widget.type === 'note';
  const showHandles = interactable && (hovered || isTouch);

  // Initial inline style — position only, no transition during interaction
  const initStyle = {
    position: 'absolute',
    left: widget.x * (gridCellWidth + gap),
    top: widget.y * (rowHeight + gap),
    width: widget.w * gridCellWidth + (widget.w - 1) * gap,
    height: widget.h * rowHeight + (widget.h - 1) * gap,
    zIndex: isActive ? 100 : (widget.z_index || 1),
    touchAction: interactable ? 'none' : 'auto',
    willChange: 'transform',
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`rounded-xl border select-none ${
          isNote ? '' : 'bg-card'
        } ${isActive
          ? 'shadow-2xl ring-2 ring-primary/50 opacity-90'
          : hovered && interactable
          ? 'shadow-xl ring-2 ring-primary/20'
          : 'shadow-sm'
        }`}
        style={initStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Header */}
        {!isNote && (
          <div className="flex items-center justify-between px-3 border-b" style={{ height: HEADER_H }}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {interactable && !isTouch && (
                <div
                  className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0 p-1 -ml-1"
                  onMouseDown={startDrag}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="5" cy="4" r="1.3"/><circle cx="11" cy="4" r="1.3"/>
                    <circle cx="5" cy="8" r="1.3"/><circle cx="11" cy="8" r="1.3"/>
                    <circle cx="5" cy="12" r="1.3"/><circle cx="11" cy="12" r="1.3"/>
                  </svg>
                </div>
              )}
              {editingTitle && canEdit ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input
                    autoFocus
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false); }}
                    className="h-8 text-sm px-2 flex-1 min-w-0"
                  />
                  <button onClick={handleTitleSave} className="text-emerald-500 p-1"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingTitle(false)} className="text-muted-foreground p-1"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <span
                  className={`text-sm font-semibold text-foreground truncate ${canEdit ? 'cursor-text' : ''}`}
                  onDoubleClick={() => !isTouch && canEdit && setEditingTitle(true)}
                >
                  {widget.title}
                </span>
              )}
            </div>

            {canEdit && (
              isMobile ? (
                <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => setMobileMenuOpen(true)}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={`h-7 w-7 flex-shrink-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => setEditModalOpen(true)} className="gap-2 cursor-pointer">
                      <Pencil className="w-4 h-4" /> Edit Widget
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingTitle(true)} className="gap-2 cursor-pointer">
                      <Check className="w-4 h-4" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4" /> Delete Widget
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </div>
        )}

        {/* Note controls */}
        {isNote && interactable && (
          <div
            className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1"
            style={{ opacity: hovered || isTouch ? 1 : 0, transition: 'opacity 0.15s' }}
          >
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/10"
              onClick={() => isMobile ? setMobileMenuOpen(true) : setEditModalOpen(true)}>
              <Pencil className="w-3.5 h-3.5 text-amber-800" />
            </Button>
            {!isTouch && (
              <div className="cursor-grab p-1.5 rounded bg-black/10" onMouseDown={startDrag}>
                <svg className="w-3.5 h-3.5 text-amber-800" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="4" r="1.3"/><circle cx="11" cy="4" r="1.3"/>
                  <circle cx="5" cy="8" r="1.3"/><circle cx="11" cy="8" r="1.3"/>
                  <circle cx="5" cy="12" r="1.3"/><circle cx="11" cy="12" r="1.3"/>
                </svg>
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/10" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="w-3.5 h-3.5 text-amber-800" />
            </Button>
          </div>
        )}

        {/* Touch long-press zone */}
        {interactable && isTouch && (
          <div
            className="absolute inset-0 z-0"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            style={{ touchAction: 'none' }}
          />
        )}

        {/* Content */}
        <div
          className="overflow-hidden relative z-[1]"
          style={{ height: isNote ? '100%' : `calc(100% - ${HEADER_H}px)` }}
        >
          {Renderer && (
            <Renderer config={widget.config} onUpdate={(d) => onUpdate(widget.id, d)} canEdit={canEdit} />
          )}
        </div>

        {/* Resize handle */}
        {showHandles && (
          <div
            className={`absolute bottom-0 right-0 cursor-se-resize z-20 flex items-end justify-end ${isTouch ? 'w-10 h-10 pb-2 pr-2' : 'w-6 h-6 pb-1 pr-1'}`}
            onMouseDown={startResize}
            onTouchStart={startResize}
          >
            <svg className={`${isTouch ? 'w-4 h-4' : 'w-3 h-3'} text-muted-foreground/50 hover:text-primary/70`} viewBox="0 0 12 12" fill="currentColor">
              <path d="M11 11H7V9H9V7H11V11ZM11 5H9V3H11V5Z" />
            </svg>
          </div>
        )}

        {/* Last-edited tooltip */}
        <AnimatePresence>
          {widget.last_edited_by && hovered && !isActive && !isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute -bottom-6 left-0 text-[10px] text-muted-foreground whitespace-nowrap pointer-events-none z-50"
            >
              ✏️ {widget.last_edited_by.split('@')[0]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MobileWidgetMenu
        widget={widget}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onEdit={() => setEditModalOpen(true)}
        onRename={() => setEditingTitle(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />
      <WidgetEditModal
        widget={widget}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={(changes) => onUpdate(widget.id, changes)}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Widget</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{widget.title}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(widget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export default WidgetCard;