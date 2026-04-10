import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveCursors({ presences }) {
  // Filter out off-screen presences (initial state is -999)
  const visible = presences.filter(p => p.cursor_x > 0 && p.cursor_y > 0);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {visible.map(p => (
          <motion.div
            key={p.user_email}
            className="absolute top-0 left-0"
            animate={{ x: p.cursor_x, y: p.cursor_y }}
            transition={{ type: 'spring', damping: 25, stiffness: 400, mass: 0.5 }}
          >
            {/* Cursor SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}>
              <path
                d="M2 2L8 16L10.2 9.8L17 7.5L2 2Z"
                fill={p.color || '#6366f1'}
                stroke="white"
                strokeWidth="1.2"
              />
            </svg>
            {/* Name tag */}
            <div
              className="absolute top-4 left-3 px-2 py-0.5 rounded-full text-[11px] text-white font-semibold whitespace-nowrap shadow-md"
              style={{ backgroundColor: p.color || '#6366f1' }}
            >
              {p.user_name?.split(' ')[0] || p.user_email?.split('@')[0]}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}