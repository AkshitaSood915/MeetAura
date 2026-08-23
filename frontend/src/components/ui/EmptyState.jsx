import React from 'react';
import { Sparkles, FileAudio, Search, ListTodo, Plus } from 'lucide-react';
import Button from '../Button';
import GlassCard from '../GlassCard';

export function EmptyState({
  icon: Icon = FileAudio,
  title = 'No records found',
  description = 'There are currently no items to display.',
  actionLabel,
  actionTo,
  onAction,
  className = ''
}) {
  return (
    <GlassCard className={`p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-5 bg-slate-900/60 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-aura-violet">
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="font-display font-semibold text-lg text-white">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel && (actionTo || onAction)) && (
        <Button
          to={actionTo}
          onClick={onAction}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          {actionLabel}
        </Button>
      )}
    </GlassCard>
  );
}

export default EmptyState;
