import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trash2, CheckCircle2, ListTodo } from 'lucide-react';
import GlassCard from './GlassCard';
import Badge from './Badge';
import { formatDate } from '../utils/formatters';

export function MeetingCard({
  meeting,
  onDelete,
}) {
  const {
    _id,
    id = _id,
    title = 'Untitled Meeting',
    originalFileName,
    createdAt = new Date().toISOString(),
    status = 'uploaded',
    summary = '',
    transcript = '',
    decisions = [],
    actionItems = []
  } = meeting || {};

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(meeting);
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'analyzing':
        return 'Analyzing';
      case 'transcribed':
        return 'Transcript Ready';
      case 'transcribing':
        return 'Transcribing';
      case 'failed':
        return 'Failed';
      case 'uploaded':
      default:
        return 'Uploaded';
    }
  };

  const getSecondaryStatusText = () => {
    switch (status) {
      case 'uploaded':
        return 'Ready to analyze';
      case 'transcribing':
        return 'Transcribing conversation...';
      case 'analyzing':
        return 'Finding key moments...';
      case 'transcribed':
        return 'Transcript ready to review';
      case 'completed':
        return 'Meeting brief ready';
      case 'failed':
      default:
        return "Analysis couldn't be completed";
    }
  };

  return (
    <Link to={`/meetings/${id}`} className="block focus:outline-none group">
      <GlassCard interactive className="h-full flex flex-col justify-between p-5 space-y-4 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition-all">
        <div className="space-y-2">
          {/* Status Badge and Title */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-semibold text-base text-white group-hover:text-violet-300 transition-colors line-clamp-1 flex-1">
              {title}
            </h3>
            <Badge variant={status} dot>
              {getStatusLabel()}
            </Badge>
          </div>

          {/* Date & Filename (Quieter metadata) */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{formatDate(createdAt)}</span>
            <span className="text-slate-600">•</span>
            <span className="truncate max-w-[140px] text-slate-400">{originalFileName}</span>
          </div>

          {/* Content / Consistent Status Secondary Text */}
          {status === 'completed' && summary ? (
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pt-1">
              {summary}
            </p>
          ) : status === 'transcribed' && transcript ? (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed italic pt-1">
              "{transcript.slice(0, 90)}..."
            </p>
          ) : (
            <p className={`text-xs pt-1 ${status === 'failed' ? 'text-rose-400' : 'text-slate-400 italic'}`}>
              {getSecondaryStatusText()}
            </p>
          )}
        </div>

        {/* Footer Meta & Natural CTA */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleDeleteClick}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete meeting"
            aria-label="Delete meeting"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-3">
            {status === 'completed' && (
              <>
                {decisions && decisions.length > 0 && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{decisions.length}</span>
                  </span>
                )}
                {actionItems && actionItems.length > 0 && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <ListTodo className="w-3 h-3 text-cyan-400" />
                    <span>{actionItems.length}</span>
                  </span>
                )}
              </>
            )}

            <span className="text-violet-400 font-medium group-hover:text-violet-300 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-0.5">
              <span>Open meeting</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export default MeetingCard;
