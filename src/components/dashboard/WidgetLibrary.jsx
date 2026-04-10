const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, Type, StickyNote, Hash, Image, ChevronLeft, ChevronRight, GripVertical, RefreshCw } from 'lucide-react';

const TYPE_META = {
  chart_bar:  { label: 'Bar Chart',    icon: BarChart3,   color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40',       desc: 'Compare values' },
  chart_line: { label: 'Line Chart',   icon: TrendingUp,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', desc: 'Track trends' },
  chart_pie:  { label: 'Pie Chart',    icon: PieChart,    color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/40',   desc: 'Show proportions' },
  metric:     { label: 'Metric Card',  icon: Hash,        color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/40',   desc: 'Key numbers' },
  text:       { label: 'Text Block',   icon: Type,        color: 'text-slate-500',   bg: 'bg-slate-50 dark:bg-slate-800/40',     desc: 'Headings or body' },
  note:       { label: 'Sticky Note',  icon: StickyNote,  color: 'text-yellow-500',  bg: 'bg-yellow-50 dark:bg-yellow-950/40',   desc: 'Quick reminders' },
  image:      { label: 'Image',        icon: Image,       color: 'text-pink-500',    bg: 'bg-pink-50 dark:bg-pink-950/40',       desc: 'Add visuals' },
};

// Ordered list of all types
const ALL_TYPES = Object.keys(TYPE_META);

export default function WidgetLibrary({ onAddWidget, canEdit }) {
  const [open, setOpen] = useState(true);
  // usageCount: how many times each type has been used globally
  const [usageCounts, setUsageCounts] = useState({});

  // Subscribe globally to all widget creations
  useEffect(() => {
    // Initial count fetch
    db.entities.Widget.list('-created_date', 200).then(all => {
      const counts = {};
      all.forEach(w => { counts[w.type] = (counts[w.type] || 0) + 1; });
      setUsageCounts(counts);
    });

    const unsub = db.entities.Widget.subscribe((event) => {
      if (event.type === 'create' && event.data?.type) {
        setUsageCounts(prev => ({
          ...prev,
          [event.data.type]: (prev[event.data.type] || 0) + 1,
        }));
      }
      if (event.type === 'delete' && event.data?.type) {
        setUsageCounts(prev => ({
          ...prev,
          [event.data.type]: Math.max(0, (prev[event.data.type] || 1) - 1),
        }));
      }
    });

    return unsub;
  }, []);

  if (!canEdit) return null;

  // Sort by usage, most used first
  const sortedTypes = [...ALL_TYPES].sort((a, b) => (usageCounts[b] || 0) - (usageCounts[a] || 0));

  return (
    <div className="relative flex-shrink-0 hidden md:flex">
      {/* Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-card border border-border shadow flex items-center justify-center hover:bg-muted transition-colors"
        title={open ? 'Collapse library' : 'Expand library'}
      >
        {open ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="w-[200px] bg-card border border-border rounded-xl shadow-md p-3 mr-2 h-full max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Widget Library
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {sortedTypes.map(type => {
                  const meta = TYPE_META[type];
                  const Icon = meta.icon;
                  const count = usageCounts[type] || 0;
                  return (
                    <div
                      key={type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('widget-type', type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => onAddWidget(type)}
                      className="group flex items-center gap-2.5 p-2 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-all select-none"
                    >
                      <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground leading-tight">{meta.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{meta.desc}</p>
                      </div>
                      {count > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 flex-shrink-0">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-3 px-1">
                Click or drag to add
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}