import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  ListTodo, 
  FileText, 
  Sparkles, 
  MessageSquare, 
  FileAudio, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  HardDrive, 
  Copy, 
  Check, 
  Search, 
  RefreshCw, 
  User, 
  Hourglass, 
  CheckCircle,
  CheckSquare,
  Square
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import DeleteModal from '../components/DeleteModal';
import { MeetingDetailsSkeleton } from '../components/ui/Skeleton';
import { formatDate, formatFileSize } from '../utils/formatters';
import { meetingApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Workspace Tab State: 'insights' | 'actions' | 'transcript'
  const [activeTab, setActiveTab] = useState('insights');

  // Interactive Task Completion Toggle State (Local UX enhancement)
  const [completedTasks, setCompletedTasks] = useState({});

  // AI Operations State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [opError, setOpError] = useState('');
  
  // Transcript UI state
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await meetingApi.getMeetingById(id);
      setMeeting(data);
      
      if (data && data.status === 'uploaded') {
        setActiveTab('transcript');
      }
    } catch (err) {
      console.error('Error loading meeting details:', err);
      setError(err.message || 'Failed to load meeting details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMeetingDetails();
    }
  }, [id]);

  const toggleTaskCompletion = (idx) => {
    setCompletedTasks(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Handle Stage 3 Transcription
  const handleTranscribe = async (force = false) => {
    if (isTranscribing || isAnalyzing) return;

    try {
      setIsTranscribing(true);
      setOpError('');
      setMeeting(prev => ({ ...prev, status: 'transcribing' }));
      setActiveTab('transcript');

      const result = await meetingApi.transcribeMeeting(id, force);
      if (result.meeting) {
        setMeeting(result.meeting);
        toast.success('Conversation transcribed successfully.');
      } else {
        await fetchMeetingDetails();
      }
    } catch (err) {
      console.error('Transcription error:', err);
      const errMsg = err.message || 'Transcription could not be completed. Please try again.';
      setOpError(errMsg);
      toast.error(errMsg);
      setMeeting(prev => ({ ...prev, status: 'failed', errorMessage: errMsg }));
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handle Stage 4 AI Meeting Analysis
  const handleAnalyze = async (force = false) => {
    if (isAnalyzing || isTranscribing) return;

    try {
      setIsAnalyzing(true);
      setOpError('');
      setMeeting(prev => ({ ...prev, status: 'analyzing' }));
      setActiveTab('insights');

      const result = await meetingApi.analyzeMeeting(id, force);
      if (result.meeting) {
        setMeeting(result.meeting);
        toast.success('Meeting brief & next steps synthesized.');
      } else {
        await fetchMeetingDetails();
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const errMsg = err.message || 'Meeting synthesis could not be completed. Please try again.';
      setOpError(errMsg);
      toast.error(errMsg);
      setMeeting(prev => ({ ...prev, status: 'failed', errorMessage: errMsg }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!meeting?.transcript) return;
    
    navigator.clipboard.writeText(meeting.transcript).then(() => {
      setCopied(true);
      toast.success('Conversation copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDeleteMeeting = async () => {
    try {
      setIsDeleting(true);
      await meetingApi.deleteMeeting(id);
      toast.success('Meeting permanently deleted.');
      navigate('/meetings');
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      toast.error(err.message || 'Failed to delete meeting.');
      setIsDeleting(false);
    }
  };

  const transcriptLines = useMemo(() => {
    if (!meeting?.transcript) return [];
    return meeting.transcript.split('\n').filter(line => line.trim().length > 0);
  }, [meeting?.transcript]);

  const { filteredLines, matchCount } = useMemo(() => {
    if (!searchTerm.trim()) {
      return { filteredLines: transcriptLines, matchCount: 0 };
    }
    const term = searchTerm.toLowerCase().trim();
    const matched = transcriptLines.filter(line => line.toLowerCase().includes(term));
    return { filteredLines: matched, matchCount: matched.length };
  }, [transcriptLines, searchTerm]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <MeetingDetailsSkeleton />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <Link
          to="/meetings"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Meetings</span>
        </Link>

        <GlassCard className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-semibold text-lg text-white">
              Meeting Not Found
            </h2>
            <p className="text-xs text-slate-400 max-w-sm">
              {error || 'The requested meeting record does not exist or has been removed.'}
            </p>
          </div>
          <Button to="/meetings" variant="primary" size="sm">
            Return to Workspace
          </Button>
        </GlassCard>
      </div>
    );
  }

  const {
    title = 'Untitled Meeting',
    originalFileName,
    createdAt = new Date().toISOString(),
    status = 'uploaded',
    fileSize = 0,
    transcript = '',
    summary = '',
    keyPoints = [],
    decisions = [],
    actionItems = [],
    errorMessage = '',
  } = meeting;

  const currentStatus = isAnalyzing ? 'analyzing' : isTranscribing ? 'transcribing' : status;

  const getStatusDisplayLabel = () => {
    switch (currentStatus) {
      case 'completed':
        return 'Brief Ready';
      case 'analyzing':
        return 'Synthesizing';
      case 'transcribed':
        return 'Transcribed';
      case 'transcribing':
        return 'Transcribing';
      case 'failed':
        return 'Needs Attention';
      case 'uploaded':
      default:
        return 'Uploaded';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <Link
          to="/meetings"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Meetings</span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {currentStatus === 'uploaded' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleTranscribe(false)}
              isLoading={isTranscribing}
              icon={Sparkles}
            >
              Generate Transcript
            </Button>
          )}

          {currentStatus === 'transcribed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAnalyze(false)}
              isLoading={isAnalyzing}
              icon={Sparkles}
            >
              Generate Meeting Brief
            </Button>
          )}

          {currentStatus === 'completed' && (
            <Button
              variant="glass"
              size="sm"
              onClick={() => handleAnalyze(true)}
              isLoading={isAnalyzing}
              icon={RefreshCw}
            >
              Re-synthesize
            </Button>
          )}

          {currentStatus === 'failed' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (transcript) handleAnalyze(true);
                else handleTranscribe(true);
              }}
              isLoading={isTranscribing || isAnalyzing}
              icon={RefreshCw}
            >
              Retry
            </Button>
          )}

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete meeting"
            aria-label="Delete meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Compact Title & Metadata Header */}
      <div className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={currentStatus} dot>
            {getStatusDisplayLabel()}
          </Badge>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            {formatDate(createdAt)}
          </span>
          {fileSize > 0 && (
            <>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <FileAudio className="w-3 h-3 text-slate-500" />
                {originalFileName} ({formatFileSize(fileSize)})
              </span>
            </>
          )}
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
          {title}
        </h1>

        {/* Polished contextual processing feedback */}
        <AnimatePresence>
          {currentStatus === 'transcribing' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-200 flex items-center gap-2.5 mt-2"
            >
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
              <span>MeetAura is listening · Transcribing dialogue with speaker recognition...</span>
            </motion.div>
          )}

          {currentStatus === 'analyzing' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-200 flex items-center gap-2.5 mt-2"
            >
              <Loader2 className="w-4 h-4 text-aura-cyan animate-spin shrink-0" />
              <span>Turning your conversation into a meeting brief · Extracting what mattered and next steps...</span>
            </motion.div>
          )}

          {currentStatus === 'failed' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between gap-2.5 mt-2"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{opError || errorMessage || "We couldn't process this meeting. Please try again."}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (transcript) handleAnalyze(true);
                  else handleTranscribe(true);
                }}
                className="text-xs font-semibold text-rose-300 hover:text-white underline underline-offset-2"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Clean Workspace Segmented Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'insights'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Meeting Brief</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'actions'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5 text-cyan-400" />
          <span>What happens next</span>
          {actionItems && actionItems.length > 0 && (
            <span className="text-[10px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-500/20 font-semibold">
              {actionItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'transcript'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>The conversation</span>
        </button>
      </div>

      {/* 4. Tab Content Panes */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: MEETING BRIEF (The big picture, What mattered, What was decided) */}
        {activeTab === 'insights' && (
          <motion.div
            key="tab-insights"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* The Big Picture (Executive Summary) */}
            <GlassCard className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  The big picture
                </h2>
                {status === 'completed' && (
                  <span className="text-[11px] text-slate-500">Synthesized by MeetAura</span>
                )}
              </div>

              {status === 'completed' && summary ? (
                <p className="text-sm text-slate-200 leading-relaxed">
                  {summary}
                </p>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    {status === 'transcribed' 
                      ? 'Transcript is ready. Click "Generate Meeting Brief" to uncover the big picture.' 
                      : 'Meeting brief is not available yet.'}
                  </p>
                  {status === 'transcribed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAnalyze(false)}
                      icon={Sparkles}
                    >
                      Generate Meeting Brief
                    </Button>
                  )}
                </div>
              )}
            </GlassCard>

            {/* 2-Column: What Mattered (Key Points) & What Was Decided (Decisions) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* What Mattered */}
              <GlassCard className="p-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  What mattered
                </h3>

                {status === 'completed' && keyPoints && keyPoints.length > 0 ? (
                  <ul className="space-y-2.5">
                    {keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    {status === 'completed' ? 'No discussion points identified.' : 'Key discussion points will appear after analysis.'}
                  </p>
                )}
              </GlassCard>

              {/* What Was Decided */}
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    What was decided
                  </h3>
                  {status === 'completed' && (
                    <span className="text-[11px] text-slate-500">{decisions.length} recorded</span>
                  )}
                </div>

                {status === 'completed' && decisions && decisions.length > 0 ? (
                  <div className="space-y-2">
                    {decisions.map((decision, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/40 border border-emerald-500/15 flex items-start gap-2.5"
                      >
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                          {typeof decision === 'string' ? decision : decision.text || JSON.stringify(decision)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    {status === 'completed' ? 'No explicit decisions were captured from this meeting.' : 'Decisions will appear after analysis.'}
                  </p>
                )}
              </GlassCard>

            </div>
          </motion.div>
        )}

        {/* TAB 2: WHAT HAPPENS NEXT (Action Items) */}
        {activeTab === 'actions' && (
          <motion.div
            key="tab-actions"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold text-base text-white">
                  What happens next
                </h2>
                <p className="text-xs text-slate-400">
                  Actionable follow-ups with identified assignees and due dates.
                </p>
              </div>

              {actionItems && actionItems.length > 0 && (
                <Badge variant="cyan">
                  {actionItems.length} {actionItems.length === 1 ? 'Deliverable' : 'Deliverables'}
                </Badge>
              )}
            </div>

            {status === 'completed' && actionItems && actionItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {actionItems.map((item, idx) => {
                  const isDone = Boolean(completedTasks[idx]);
                  return (
                    <GlassCard 
                      key={idx} 
                      className={`p-4 space-y-3 transition-all cursor-pointer ${
                        isDone ? 'bg-slate-950/40 border-slate-800 opacity-60' : 'bg-slate-900/40 hover:border-slate-700'
                      }`}
                      onClick={() => toggleTaskCompletion(idx)}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none shrink-0"
                          aria-label={isDone ? 'Mark task pending' : 'Mark task completed'}
                        >
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <p className={`text-xs sm:text-sm font-medium leading-snug flex-1 transition-all ${
                          isDone ? 'line-through text-slate-400' : 'text-white'
                        }`}>
                          {item.task}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-violet-400 shrink-0" />
                          <span className={item.owner ? 'text-slate-300' : 'text-slate-500 italic'}>
                            {item.owner || 'Not specified'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Hourglass className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className={item.deadline ? 'text-slate-300' : 'text-slate-500 italic'}>
                            {item.deadline ? `Due ${item.deadline}` : 'No deadline'}
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            ) : (
              <GlassCard className="p-10 text-center space-y-2">
                <ListTodo className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  {status === 'completed' ? 'No follow-ups detected in this meeting.' : 'Action items will appear after analysis.'}
                </p>
                {status === 'transcribed' && (
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAnalyze(false)}
                      icon={Sparkles}
                    >
                      Generate Meeting Brief
                    </Button>
                  </div>
                )}
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* TAB 3: THE CONVERSATION (Full Transcript) */}
        {activeTab === 'transcript' && (
          <motion.div
            key="tab-transcript"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Search & Copy Bar */}
            {transcript && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search dialogue..."
                    className="w-full pl-8 pr-16 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                  />
                  {searchTerm.trim() !== '' && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                      {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                    </span>
                  )}
                </div>

                <Button
                  variant="glass"
                  size="sm"
                  onClick={handleCopyTranscript}
                  icon={copied ? Check : Copy}
                >
                  {copied ? 'Copied ✓' : 'Copy Conversation'}
                </Button>
              </div>
            )}

            {/* Transcript Scroll Area */}
            {transcript ? (
              <GlassCard className="p-6 max-h-[550px] overflow-y-auto space-y-3">
                {filteredLines.length > 0 ? (
                  filteredLines.map((line, idx) => {
                    const speakerMatch = line.match(/^([^:]+):\s*(.*)$/);

                    if (speakerMatch) {
                      const speakerName = speakerMatch[1];
                      const dialogue = speakerMatch[2];

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2 py-1.5 border-b border-slate-800/40 last:border-0">
                          <span className="text-xs font-semibold text-violet-300 sm:w-28 shrink-0">
                            {speakerName}:
                          </span>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed flex-1">
                            {dialogue}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <p key={idx} className="text-xs sm:text-sm text-slate-200 leading-relaxed py-1">
                        {line}
                      </p>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 py-8 text-center">
                    No matching dialogue found for "{searchTerm}".
                  </p>
                )}
              </GlassCard>
            ) : (
              <GlassCard className="p-12 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Transcript not generated yet.
                </p>
                {currentStatus === 'uploaded' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleTranscribe(false)}
                    icon={Sparkles}
                  >
                    Generate Transcript
                  </Button>
                )}
              </GlassCard>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title={title}
        isDeleting={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteMeeting}
      />

    </div>
  );
}

export default MeetingDetails;
