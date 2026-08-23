import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';

export function MainLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen flex flex-col bg-background selection:bg-violet-500/30 selection:text-white overflow-hidden font-sans">
      {/* Background Ambient Glow Elements */}
      <div className="fixed top-0 left-1/4 w-96 h-96 ambient-glow-violet opacity-50 -translate-y-1/2 pointer-events-none" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[500px] ambient-glow-blue opacity-40 pointer-events-none" />
      <div className="fixed bottom-10 left-1/3 w-80 h-80 ambient-glow-violet opacity-30 pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* App Header */}
      <Header />

      {/* Main Page Area with Route Transitions */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* App Footer */}
      <Footer />
    </div>
  );
}

export default MainLayout;
