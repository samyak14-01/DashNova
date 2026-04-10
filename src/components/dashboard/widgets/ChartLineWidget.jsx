import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { RefreshCw } from 'lucide-react';

const AUTO_REFRESH_MS = 5000;

function randomize(data) {
  return data.map(d => ({
    ...d,
    value: Math.max(5, Math.round(d.value * (0.75 + Math.random() * 0.5))),
  }));
}

export default function ChartLineWidget({ config }) {
  const lineColor = config?.color || 'hsl(262, 83%, 58%)';
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
    if (config?.fromImport) return;
    timerRef.current = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [config?.fromImport]);

  useEffect(() => {
    setData(config?.data || []);
  }, [config?.data]);

  return (
    <div className="w-full h-full flex flex-col p-2 gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-muted-foreground">Live data</span>
        <button
          onClick={refresh}
          className={`text-muted-foreground hover:text-primary transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2.5}
              fill="url(#lineGrad)"
              dot={{ fill: lineColor, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}