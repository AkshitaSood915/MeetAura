import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  HelpCircle, 
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { meetingApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const SUGGESTIONS = [
  'What were the key decisions made in this meeting?',
  'What tasks were assigned and who are the owners?',
  'What were the primary discussion topics?',
  'Were there any deadlines or milestones established?'
];

export default function AskMeetAura({ meetingId, transcriptAvailable = true }) {
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [error, setError] = useState(null);

  const handleAsk = async (queryText = null) => {
    const query = (queryText || question).trim();
    if (!query || isLoading) return;

    if (!transcriptAvailable) {
      toast.error('Please generate a meeting transcript first to ask questions.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const currentQ = query;
    setQuestion('');

    try {
      const data = await meetingApi.askMeetingQuestion(meetingId, currentQ);
      
      const newEntry = {
        id: Date.now(),
        question: currentQ,
        answer: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => [newEntry, ...prev]);
    } catch (err) {
      console.error('Ask MeetAura error:', err);
      setError(err.message || 'MeetAura could not answer your question. Please try again.');
      toast.error(err.message || 'Failed to get answer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      toast.success('Answer copied to clipboard!');
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white tracking-tight">
                Ask MeetAura
              </h3>
              <span className="text-[10px] font-semibold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                Transcript Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Query specific discussion points, decisions, and tasks from this recording.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Suggested Questions:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(sug)}
              disabled={isLoading || !transcriptAvailable}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-cyan-500/40 px-3 py-1.5 rounded-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30 rounded-xl p-1.5 transition-all">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={transcriptAvailable ? 'Ask anything about this meeting...' : 'Generate a transcript first to ask questions...'}
            disabled={isLoading || !transcriptAvailable}
            className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={!question.trim() || isLoading || !transcriptAvailable}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Ask</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 flex items-center gap-3"
        >
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 animate-pulse">
            <Bot className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-cyan-300">
              MeetAura is scanning the transcript...
            </p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Conversation Q&A History */}
      <div className="space-y-3">
        <AnimatePresence>
          {history.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3"
            >
              {/* Question */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-200">
                      {item.question}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Answer */}
              <div className="flex items-start gap-2.5 pl-2 border-l-2 border-cyan-500/40">
                <div className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {item.answer}
                  </p>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.answer, idx)}
                      className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/40 hover:bg-slate-800 transition-colors"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
