import React from 'react';

export default function ImageWidget({ config }) {
  return (
    <div className="w-full h-full overflow-hidden rounded-lg">
      {config?.url ? (
        <img
          src={config.url}
          alt={config.alt || 'Widget image'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          No image set
        </div>
      )}
    </div>
  );
}