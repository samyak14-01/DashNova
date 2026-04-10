import React, { useState } from 'react';

export default function TextWidget({ config, onUpdate, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(config?.content || '');

  const handleBlur = () => {
    setEditing(false);
    if (content !== config?.content) {
      onUpdate({ config: { ...config, content } });
    }
  };

  if (editing && canEdit) {
    return (
      <textarea
        autoFocus
        value={content}
        onChange={e => setContent(e.target.value)}
        onBlur={handleBlur}
        className="w-full h-full p-4 bg-transparent resize-none focus:outline-none text-sm leading-relaxed"
      />
    );
  }

  return (
    <div
      className="w-full h-full p-4 text-sm leading-relaxed overflow-auto cursor-text"
      onDoubleClick={() => canEdit && setEditing(true)}
    >
      {config?.content || 'Double-click to edit...'}
    </div>
  );
}