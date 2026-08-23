import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, History, UploadCloud, Menu, X, Activity } from 'lucide-react';
import Button from './Button';
import { checkApiHealth } from '../services/api';

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking'); // 'ok' | 'offline' | 'checking'

  useEffect(() => {
    let mounted = true;
    checkApiHealth().then((res) => {
      if (mounted) {
        setApiStatus(res.status === 'ok' ? 'ok' : 'offline');
      }
    });
    return () => { mounted = false; };
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Upload', path: '/upload', icon: UploadCloud },
    { name: 'Meetings', path: '/meetings', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-aura-indigo via-aura-violet to-aura-cyan p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-aura-violet group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-slate-200 group-hover:to-aura-cyan transition-all">
                  MeetAura
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 tracking-wider">
                  AI
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal hidden sm:inline-block">
                AI Meeting Summarizer
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-white/10 rounded-xl border border-white/10 shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Action & API status indicator */}
          <div className="hidden md:flex items-center gap-4">
            <div 
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/5 text-slate-400"
              title={apiStatus === 'ok' ? 'API Service Connected' : apiStatus === 'offline' ? 'API Service Offline' : 'Checking API Service...'}
            >
              <span className={`w-2 h-2 rounded-full ${apiStatus === 'ok' ? 'bg-emerald-400 animate-pulse' : apiStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-[11px] font-medium text-slate-300">
                {apiStatus === 'ok' ? 'API Active' : apiStatus === 'offline' ? 'API Standby' : 'Connecting'}
              </span>
            </div>

            <Button to="/upload" variant="primary" size="sm" icon={UploadCloud}>
              Upload Meeting
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/10 bg-slate-950/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-violet-600/20 text-white border border-violet-500/30' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {link.icon && <link.icon className="w-4 h-4 text-violet-400" />}
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-2">
                <Button to="/upload" variant="primary" size="md" className="w-full" onClick={() => setMobileMenuOpen(false)} icon={UploadCloud}>
                  Upload Meeting
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
