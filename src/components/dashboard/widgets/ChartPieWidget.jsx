import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RefreshCw } from 'lucide-react';

const AUTO_REFRESH_MS = 5000;
const COLORS = [
  'hsl(243, 75%, 59%)',
  'hsl(262, 83%, 58%)',
  'hsl(173, 58%, 39%)',
  'hsl(43, 74%, 66%)',
  'hsl(12, 76%, 61%)',
];

function randomize(data) {
  return data.map(d => ({
    ...d,
    value: Math.max(20, Math.round(d.value * (0.7 + Math.random() * 0.6))),
  }));
}

export default function ChartPieWidget({ config }) {
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
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius="35%"
              outerRadius="65%"
              paddingAngle={3}
              dataKey="value"
              isAnimationActive
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}