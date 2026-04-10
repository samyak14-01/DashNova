import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricWidget({ config }) {
  const trendUp = config?.trendUp !== false;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {config?.label || 'Metric'}
      </p>
      <p className="text-3xl font-bold tracking-tight">{config?.value || '0'}</p>
      {config?.trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {config.trend}
        </div>
      )}
    </div>
  );
}