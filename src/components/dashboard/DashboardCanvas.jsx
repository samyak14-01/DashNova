import React, { useRef, useCallback, useEffect, useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Lock } from 'lucide-react';
import WidgetCard from './WidgetCard';
import LiveCursors from './LiveCursors';
import { GRID_ROW_HEIGHT, GRID_GAP } from '@/lib/constants';
import { useDeviceType } from '@/hooks/useDeviceType';
import { throttle } from 'lodash';

function getGridCols(deviceType) {
  if (deviceType === 'mobile') return 4;
  if (deviceType === 'tablet') return 8;
  return 12;
}

const DashboardCanvas = memo(function DashboardCanvas({
  widgets,
  presences,
  onUpdateWidget,
  onDeleteWidget,
  onCursorMove,
  onAddWidget,
  canEdit,
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { deviceType, isMobile, isTouch } = useDeviceType();

  const GRID_COLS = getGridCols(deviceType);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveEditMode = isTouch ? (canEdit && editMode) : canEdit;

  const gridCellWidth = containerWidth > 0
    ? (containerWidth - (GRID_COLS - 1) * GRID_GAP) / GRID_COLS
    : 80;

  const normalizedWidgets = useMemo(() => widgets.map(w => ({
    ...w,
    x: Math.min(w.x || 0, GRID_COLS - 1),
    w: Math.min(w.w || 4, GRID_COLS),
  })), [widgets, GRID_COLS]);

  const canvasHeight = useMemo(() => {
    const maxRow = normalizedWidgets.reduce((max, w) => Math.max(max, (w.y || 0) + (w.h || 3)), 6);
    return (maxRow + 3) * (GRID_ROW_HEIGHT + GRID_GAP) + 80;
  }, [normalizedWidgets]);

  // Throttled cursor move — only fires every 80ms
  const handleMouseMove = useCallback(
    throttle((e) => {
      onCursorMove?.(e.clientX, e.clientY);
    }, 80),
    [onCursorMove]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const type = e.dataTransfer.getData('widget-type');
    if (type) onAddWidget?.(type);
  }, [onAddWidget]);

  return (
    <div className="relative">
      {/* Edit Mode Toggle — touch only */}
      {canEdit && isTouch && (
        <div className="flex justify-end mb-4 px-1">
          <button
            onClick={() => setEditMode(m => !m)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm border ${
              editMode
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {editMode ? <><Pencil className="w-4 h-4" />Edit Mode ON</> : <><Lock className="w-4 h-4" />Edit Mode OFF</>}
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-xl ${isDragOver ? 'ring-2 ring-primary/60 bg-primary/5' : ''}`}
        style={{ minHeight: canvasHeight, touchAction: effectiveEditMode ? 'none' : 'pan-y' }}
        onMouseMove={!isTouch ? handleMouseMove : undefined}
        onDragOver={canEdit ? handleDragOver : undefined}
        onDragLeave={canEdit ? handleDragLeave : undefined}
        onDrop={canEdit ? handleDrop : undefined}
      >
        {/* Dot grid background — pure CSS, zero JS cost */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px)',
            backgroundSize: `${gridCellWidth + GRID_GAP}px ${GRID_ROW_HEIGHT + GRID_GAP}px`,
          }}
        />

        {isDragOver && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <div className="bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold shadow-xl">
              Drop to add widget
            </div>
          </div>
        )}

        {normalizedWidgets.map(widget => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onUpdate={onUpdateWidget}
            onDelete={onDeleteWidget}
            canEdit={canEdit}
            editMode={effectiveEditMode}
            gridCellWidth={gridCellWidth}
            rowHeight={GRID_ROW_HEIGHT}
            gap={GRID_GAP}
            cols={GRID_COLS}
            isMobile={isMobile}
            isTouch={isTouch}
          />
        ))}

        {!isTouch && <LiveCursors presences={presences} />}

        {normalizedWidgets.length === 0 && !isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Empty Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                {isMobile ? 'Tap "Add Widget" in the menu above' : 'Drag from the library or click "Add Widget"'}
              </p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {canEdit && isTouch && editMode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground/90 text-background text-xs font-medium px-4 py-2 rounded-full shadow-lg pointer-events-none"
          >
            Long-press a widget to drag it
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default DashboardCanvas;