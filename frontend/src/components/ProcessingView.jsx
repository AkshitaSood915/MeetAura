import React from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Circle, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  Radio,
  FileAudio
} from 'lucide-react';
import { motion } from 'framer-motion';
import Button from './Button';

/**
 * ProcessingView Component
 * Renders an AI pipeline processing status card with multi-stage indicators
 */
export default function ProcessingView({ 
  status = 'transcribing', 
  errorMessage = '', 
  onRetry = null,
  title = 'Meeting Audio'
}) {
  const isFailed = status === 'failed';

  // Stages definition
  const stages = [
    {
      id: 'received',
      label: 'Audio received',
      desc: 'Uploaded and verified audio stream',
      isComplete: true,
      isActive: false
    },
    {
      id: 'transcribing',
      label: 'Transcribing conversation',
      desc: 'Gemini AI speech recognition & speaker alignment',
      isComplete: ['transcribed', 'analyzing', 'completed'].includes(status),
      isActive: status === 'transcribing'
    },
    {
      id: 'understanding',
      label: 'Understanding key moments',
      desc: 'Filtering discussion points and detecting consensus',
      isComplete: ['completed'].includes(status),
      isActive: status === 'analyzing'
    },
    {
      id: 'brief',
      label: 'Preparing meeting brief',
      desc: 'Synthesizing executive summary, decisions & action items',
      isComplete: ['completed'].includes(status),
      isActive: status === 'analyzing'
    }
  ];

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950/95 border border-slate-800/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6">
      {/* Top Animated Orb / Icon */}
      <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
        {!isFailed ? (
          <>
            {/* Glowing Pulse Rings */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md"
            />
            <motion.div
              animate={{ scale: [1.1, 1.5, 1.1], opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-violet-500/20 blur-lg"
            />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
          </>
        ) : (
          <div className="relative w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Main Status Heading */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-cyan-400">
          {!isFailed ? 'MEETAURA IS LISTENING' : 'PROCESSING ENCOUNTERED AN ISSUE'}
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {!isFailed ? 'Synthesizing Meeting Insights' : "We couldn't analyze this meeting."}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto truncate">
          {title}
        </p>
      </div>

      {/* Animated Waveform Visualizer */}
      {!isFailed && (
        <div className="flex items-center justify-center gap-1.5 h-8 py-1">
          {[0.4, 0.9, 1.4, 0.7, 1.8, 1.1, 0.5, 1.6, 0.8, 1.3, 0.6, 1.0].map((h, i) => (
            <motion.span
              key={i}
              className="w-1 rounded-full bg-gradient-to-t from-cyan-500 to-violet-500"
              animate={{
                height: ['6px', `${h * 16}px`, '6px'],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.8 + (i * 0.08),
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      )}

      {/* Stages List */}
      <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 space-y-3.5 text-left">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {stage.isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : stage.isActive ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : (
                <Circle className="w-4 h-4 text-slate-700" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${
                  stage.isComplete 
                    ? 'text-slate-200' 
                    : stage.isActive 
                      ? 'text-cyan-300' 
                      : 'text-slate-500'
                }`}>
                  {stage.label}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {stage.isComplete ? 'Done' : stage.isActive ? 'In Progress' : 'Pending'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {stage.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Failure Message & Action */}
      {isFailed && (
        <div className="space-y-4 pt-2">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-left leading-relaxed">
              {errorMessage}
            </div>
          )}
          {onRetry && (
            <Button
              variant="primary"
              size="md"
              onClick={onRetry}
              icon={RotateCcw}
              className="w-full justify-center"
            >
              Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
