import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

const AUTO_REFRESH_MS = 5000;

function randomize(data) {
  return data.map(d => ({
    ...d,
    value: Math.max(50, Math.round(d.value * (0.8 + Math.random() * 0.4))),
  }));
}

export default function ChartBarWidget({ config, canEdit }) {
  const [data, setData] = useState(config?.data || []);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setData(prev => randomize(prev));
      setRefreshing(false);
    }, 300);
  };

  useEffect(() => {
    if (config?.fromImport) return; // don't auto-randomize imported data
    timerRef.current = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [config?.fromImport]);

  useEffect(() => {
    setData(config?.data || []);
  }, [config?.data]);

  return (
    <div className="w-full h-full flex flex-col p-2 gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-muted-foreground">Auto-refreshes every 5s</span>
        <button
          onClick={refresh}
          className={`text-muted-foreground hover:text-primary transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: 12,
              }}
              cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
            />
            <Bar dataKey="value" fill={config?.color || 'hsl(var(--primary))'} radius={[4, 4, 0, 0]} isAnimationActive />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}