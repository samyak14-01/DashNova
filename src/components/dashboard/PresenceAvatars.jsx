import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Pencil, Eye } from 'lucide-react';

const ROLE_CONFIG = {
  admin:  { label: 'Admin',  Icon: Crown,  color: 'text-primary',          bg: 'bg-primary/10' },
  editor: { label: 'Editor', Icon: Pencil, color: 'text-accent',           bg: 'bg-accent/10' },
  viewer: { label: 'Viewer', Icon: Eye,    color: 'text-muted-foreground',  bg: 'bg-muted' },
};

function RolePill({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.viewer;
  const RoleIcon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
      <RoleIcon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

export default function PresenceAvatars({ presences, myColor, userName, myRole }) {
  const total = presences.length + 1;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-3">
        <div className="flex items-center -space-x-2">
          {/* Current user */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-background relative z-10 cursor-default"
                style={{ backgroundColor: myColor }}
              >
                {(userName || 'Y')[0].toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-background" />
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex flex-col items-center gap-1">
              <span className="font-medium">{userName} (You)</span>
              {myRole && <RolePill role={myRole} />}
            </TooltipContent>
          </Tooltip>

          <AnimatePresence>
            {presences.map((p, i) => (
              <Tooltip key={p.user_email}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0, x: 10 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, x: 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-background relative cursor-default"
                    style={{ backgroundColor: p.color || '#6366f1', zIndex: 9 - i }}
                  >
                    {(p.user_name || p.user_email || '?')[0].toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-background" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex flex-col items-center gap-1">
                  <span className="font-medium">{p.user_name || p.user_email}</span>
                  {p.role && <RolePill role={p.role} />}
                </TooltipContent>
              </Tooltip>
            ))}
          </AnimatePresence>
        </div>

        {total > 1 && (
          <motion.div
            key={total}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{total} online</span>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}