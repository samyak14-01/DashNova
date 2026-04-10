import React, { useState } from 'react';

export default function NoteWidget({ config, onUpdate, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(config?.content || '');

  const handleBlur = () => {
    setEditing(false);
    if (content !== config?.content) {
      onUpdate({ config: { ...config, content } });
    }
  };

  const bgColor = config?.color || '#fef3c7';

  if (editing && canEdit) {
    return (
      <div className="w-full h-full rounded-lg p-4" style={{ backgroundColor: bgColor }}>
        <textarea
          autoFocus
          value={content}
          onChange={e => setContent(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent resize-none focus:outline-none text-sm text-amber-900 leading-relaxed"
        />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full rounded-lg p-4 text-sm text-amber-900 leading-relaxed overflow-auto cursor-text"
      style={{ backgroundColor: bgColor }}
      onDoubleClick={() => canEdit && setEditing(true)}
    >
      {config?.content || 'Double-click to write a note...'}
    </div>
  );
}