import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';

export function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
      <GlassCard glow className="p-8 sm:p-14 text-center max-w-lg w-full space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-aura-violet mx-auto">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-aura-cyan uppercase tracking-widest">
            404 Error
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button to="/meetings" variant="primary" size="md" icon={ArrowLeft}>
            Back to Meetings
          </Button>
          <Button to="/" variant="glass" size="md">
            Go to Dashboard
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

export default NotFound;
