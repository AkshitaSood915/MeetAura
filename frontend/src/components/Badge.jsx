import React from 'react';
import { cn } from '../utils/formatters';

const badgeVariants = {
  // Processing status variants (calm & legible)
  completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-medium',
  analyzing: 'bg-violet-500/15 text-violet-300 border-violet-500/30 animate-pulse font-medium',
  transcribed: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 font-medium',
  transcribing: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 animate-pulse font-medium',
  uploaded: 'bg-slate-800 text-slate-300 border-slate-700 font-medium',
  failed: 'bg-rose-500/10 text-rose-300 border-rose-500/20 font-medium',
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/20 font-medium',
  
  // Theme variants
  cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  default: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
};

export function Badge({
  children,
  variant = 'default',
  className,
  dot = false,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border tracking-tight',
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'completed' && 'bg-emerald-400',
            variant === 'analyzing' && 'bg-violet-400 animate-ping',
            variant === 'transcribed' && 'bg-cyan-400',
            variant === 'transcribing' && 'bg-indigo-400 animate-ping',
            variant === 'uploaded' && 'bg-slate-400',
            variant === 'failed' && 'bg-rose-400',
            ['cyan', 'violet', 'indigo', 'default'].includes(variant) && 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
