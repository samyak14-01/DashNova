import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Trash2, Plus } from 'lucide-react';

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#22c55e', '#14b8a6', '#3b82f6', '#eab308',
];

const CHART_TYPES = [
  { type: 'chart_bar', label: 'Bar Chart' },
  { type: 'chart_line', label: 'Line Chart' },
  { type: 'chart_pie', label: 'Pie Chart' },
];

const NOTE_COLORS = [
  { label: 'Yellow', value: '#fef3c7' },
  { label: 'Blue', value: '#dbeafe' },
  { label: 'Green', value: '#dcfce7' },
  { label: 'Pink', value: '#fce7f3' },
  { label: 'Purple', value: '#ede9fe' },
  { label: 'Orange', value: '#ffedd5' },
];

function ChartPreview({ type, data, color }) {
  const fill = color || '#6366f1';
  if (type === 'chart_bar') return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Bar dataKey="value" fill={fill} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
  if (type === 'chart_line') return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="value" stroke={fill} strokeWidth={2} fill={fill + '33'} dot={{ fill, r: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
  if (type === 'chart_pie') return (
    <ResponsiveContainer width="100%" height={140}>
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius="30%" outerRadius="60%" paddingAngle={3} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 10 }} iconSize={7} />
      </PieChart>
    </ResponsiveContainer>
  );
  return null;
}

export default function WidgetEditModal({ widget, open, onClose, onSave }) {
  const isChart = ['chart_bar', 'chart_line', 'chart_pie'].includes(widget?.type);
  const isMetric = widget?.type === 'metric';
  const isText = widget?.type === 'text';
  const isNote = widget?.type === 'note';

  const [title, setTitle] = useState(widget?.title || '');
  const [widgetType, setWidgetType] = useState(widget?.type || 'chart_bar');
  const [color, setColor] = useState(widget?.config?.color || '#6366f1');
  const [data, setData] = useState(
    widget?.config?.data ? widget.config.data.map(d => ({ ...d })) : []
  );
  const [metricValue, setMetricValue] = useState(widget?.config?.value || '');
  const [metricLabel, setMetricLabel] = useState(widget?.config?.label || '');
  const [metricTrend, setMetricTrend] = useState(widget?.config?.trend || '');
  const [metricTrendUp, setMetricTrendUp] = useState(widget?.config?.trendUp !== false);
  const [textContent, setTextContent] = useState(widget?.config?.content || '');
  const [noteColor, setNoteColor] = useState(widget?.config?.color || '#fef3c7');

  const updateRow = (i, field, val) => {
    setData(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: field === 'value' ? (Number(val) || 0) : val } : r));
  };
  const addRow = () => setData(prev => [...prev, { name: 'New', value: 0 }]);
  const removeRow = (i) => setData(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const newConfig = isChart
      ? { ...widget.config, data, color }
      : isMetric
      ? { value: metricValue, label: metricLabel, trend: metricTrend, trendUp: metricTrendUp }
      : isText
      ? { ...widget.config, content: textContent }
      : isNote
      ? { ...widget.config, content: textContent, color: noteColor }
      : widget.config;

    onSave({
      title,
      type: widgetType,
      config: newConfig,
    });
    onClose();
  };

  if (!widget) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Widget Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Widget title" />
          </div>

          <Tabs defaultValue={isChart ? 'data' : 'content'}>
            <TabsList className="w-full">
              {isChart && <TabsTrigger value="data" className="flex-1">Data</TabsTrigger>}
              {isChart && <TabsTrigger value="type" className="flex-1">Chart Type</TabsTrigger>}
              {isChart && <TabsTrigger value="style" className="flex-1">Style</TabsTrigger>}
              {(isText || isNote || isMetric) && <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>}
              {isNote && <TabsTrigger value="style" className="flex-1">Style</TabsTrigger>}
            </TabsList>

            {/* DATA TAB */}
            {isChart && (
              <TabsContent value="data" className="space-y-3 mt-4">
                <ChartPreview type={widgetType} data={data} color={color} />
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {data.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={row.name}
                        onChange={e => updateRow(i, 'name', e.target.value)}
                        placeholder="Label"
                        className="h-8 text-xs flex-1"
                      />
                      <Input
                        type="number"
                        value={row.value}
                        onChange={e => updateRow(i, 'value', e.target.value)}
                        placeholder="Value"
                        className="h-8 text-xs w-24"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeRow(i)}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5 w-full">
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </Button>
              </TabsContent>
            )}

            {/* TYPE TAB */}
            {isChart && (
              <TabsContent value="type" className="mt-4">
                <div className="grid grid-cols-3 gap-3">
                  {CHART_TYPES.map(ct => (
                    <button
                      key={ct.type}
                      onClick={() => setWidgetType(ct.type)}
                      className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        widgetType === ct.type
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/40 text-muted-foreground'
                      }`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <ChartPreview type={widgetType} data={data} color={color} />
                </div>
              </TabsContent>
            )}

            {/* STYLE TAB (charts) */}
            {isChart && (
              <TabsContent value="style" className="mt-4 space-y-3">
                <label className="text-xs font-medium text-muted-foreground block">Bar / Line Color</label>
                <div className="flex gap-2 flex-wrap">
                  {CHART_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent" title="Custom color" />
                </div>
                <div className="mt-2">
                  <ChartPreview type={widgetType} data={data} color={color} />
                </div>
              </TabsContent>
            )}

            {/* CONTENT TAB (text/note/metric) */}
            {(isText || isNote) && (
              <TabsContent value="content" className="mt-4">
                <textarea
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  placeholder="Enter content..."
                  className="w-full h-40 p-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                />
              </TabsContent>
            )}

            {isNote && (
              <TabsContent value="style" className="mt-4 space-y-3">
                <label className="text-xs font-medium text-muted-foreground block">Note Color</label>
                <div className="flex gap-2 flex-wrap">
                  {NOTE_COLORS.map(nc => (
                    <button
                      key={nc.value}
                      onClick={() => setNoteColor(nc.value)}
                      className={`w-9 h-9 rounded-lg border-2 transition-all text-[9px] font-medium ${noteColor === nc.value ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: nc.value }}
                      title={nc.label}
                    />
                  ))}
                </div>
              </TabsContent>
            )}

            {isMetric && (
              <TabsContent value="content" className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Label</label>
                  <Input value={metricLabel} onChange={e => setMetricLabel(e.target.value)} placeholder="e.g. Total Users" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Value</label>
                  <Input value={metricValue} onChange={e => setMetricValue(e.target.value)} placeholder="e.g. 1,234" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Trend</label>
                  <Input value={metricTrend} onChange={e => setMetricTrend(e.target.value)} placeholder="e.g. +12.5%" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-muted-foreground">Trend Direction</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMetricTrendUp(true)}
                      className={`px-3 py-1 rounded text-xs font-medium border transition-all ${metricTrendUp ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'border-border text-muted-foreground'}`}
                    >↑ Up</button>
                    <button
                      onClick={() => setMetricTrendUp(false)}
                      className={`px-3 py-1 rounded text-xs font-medium border transition-all ${!metricTrendUp ? 'bg-rose-50 border-rose-400 text-rose-700' : 'border-border text-muted-foreground'}`}
                    >↓ Down</button>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}