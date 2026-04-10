import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from '@/pages/Home';
import DashboardEditor from '@/pages/DashboardEditor';
import ActivityLog from '@/pages/ActivityLog';
import DataExport from '@/pages/DataExport';
import ActiveSessions from '@/pages/ActiveSessions';
import PageNotFound from '@/lib/PageNotFound';

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const pageTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] };

export default function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ minHeight: '100dvh' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard/:id" element={<DashboardEditor />} />
          <Route path="/activity-log" element={<ActivityLog />} />
          <Route path="/data-export" element={<DataExport />} />
          <Route path="/active-sessions" element={<ActiveSessions />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}