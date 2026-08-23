import React from 'react';
import { cn } from '../utils/formatters';

export function GlassCard({
  children,
  className,
  interactive = false,
  glow = false,
  ...props
}) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 shadow-lg shadow-black/20 transition-all duration-200',
        interactive && 'hover:bg-slate-900/80 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/30 cursor-pointer',
        glow && 'border-violet-500/20 shadow-violet-500/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;
