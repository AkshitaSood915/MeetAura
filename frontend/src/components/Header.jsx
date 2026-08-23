import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, History, UploadCloud, Menu, X } from 'lucide-react';
import Button from './Button';
import { checkApiHealth } from '../services/api';

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-aura-indigo via-aura-violet to-aura-cyan p-0.5 shadow-md shadow-indigo-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-aura-violet group-hover:rotate-12 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base tracking-tight text-white">
                MeetAura
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/70 px-2 py-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-slate-800 rounded-lg shadow-sm"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {link.icon && <link.icon className="w-3.5 h-3.5" />}
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Action & API status indicator */}
          <div className="hidden md:flex items-center gap-3">
            <div 
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400"
              title={apiStatus === 'ok' ? 'API Service Connected' : apiStatus === 'offline' ? 'API Offline' : 'Checking...'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'ok' ? 'bg-emerald-400' : apiStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-[11px] font-medium text-slate-300">
                {apiStatus === 'ok' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Connecting'}
              </span>
            </div>

            <Button to="/upload" variant="primary" size="sm" icon={UploadCloud}>
              Upload
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
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
            className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    {link.icon && <link.icon className="w-4 h-4 text-violet-400" />}
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-2">
                <Button to="/upload" variant="primary" size="sm" className="w-full" onClick={() => setMobileMenuOpen(false)} icon={UploadCloud}>
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
