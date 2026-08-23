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
  BrainCircuit,
  Radio,
  CheckSquare,
  ShieldCheck
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import DeleteModal from '../components/DeleteModal';
import AudioPlayer from '../components/AudioPlayer';
import AskMeetAura from '../components/AskMeetAura';
import ProcessingView from '../components/ProcessingView';
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
  
  // Workspace Tabs: 'insights' | 'actions' | 'transcript' | 'ask'
  const [activeTab, setActiveTab] = useState('insights');

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
        setActiveTab('insights');
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

  // Handle Stage 3 Transcription
  const handleTranscribe = async (force = false) => {
    if (isTranscribing || isAnalyzing) return;

    try {
      setIsTranscribing(true);
      setOpError('');
      setMeeting(prev => ({ ...prev, status: 'transcribing' }));

      const result = await meetingApi.transcribeMeeting(id, force);
      if (result.meeting) {
        setMeeting(result.meeting);
        toast.success('Gemini audio transcription completed!');
        // Automatically proceed to analyze if transcript generated
        if (result.meeting.transcript && result.meeting.status === 'transcribed') {
          handleAnalyze(false);
        }
      } else {
        await fetchMeetingDetails();
      }
    } catch (err) {
      console.error('Transcription error:', err);
      const errMsg = err.message || 'Transcription failed. Please try again.';
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

      const result = await meetingApi.analyzeMeeting(id, force);
      if (result.meeting) {
        setMeeting(result.meeting);
        toast.success('AI meeting insights synthesized!');
        setActiveTab('insights');
      } else {
        await fetchMeetingDetails();
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const errMsg = err.message || 'Meeting analysis failed. Please try again.';
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
      toast.success('Transcript copied to clipboard!');
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

  // Toggle Action Item completion with optimistic UI and MongoDB persistence
  const handleToggleActionItem = async (index) => {
    if (!meeting?.actionItems || !meeting.actionItems[index]) return;
    const currentCompleted = Boolean(meeting.actionItems[index].completed);
    const updatedStatus = !currentCompleted;

    // Optimistic UI update
    setMeeting(prev => {
      if (!prev || !prev.actionItems) return prev;
      const updatedItems = [...prev.actionItems];
      updatedItems[index] = { ...updatedItems[index], completed: updatedStatus };
      return { ...prev, actionItems: updatedItems };
    });

    try {
      await meetingApi.toggleActionItem(id, index, updatedStatus);
      toast.success(updatedStatus ? 'Action item marked as done' : 'Action item marked as pending');
    } catch (err) {
      console.error('Failed to toggle action item:', err);
      // Rollback on error
      setMeeting(prev => {
        if (!prev || !prev.actionItems) return prev;
        const updatedItems = [...prev.actionItems];
        updatedItems[index] = { ...updatedItems[index], completed: currentCompleted };
        return { ...prev, actionItems: updatedItems };
      });
      toast.error('Failed to update action item status');
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <MeetingDetailsSkeleton />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-6">
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
    filePath,
    createdAt = new Date().toISOString(),
    status = 'uploaded',
    fileSize = 0,
    mimeType = '',
    duration = 0,
    transcript = '',
    summary = '',
    keyPoints = [],
    decisions = [],
    actionItems = [],
    errorMessage = '',
  } = meeting;

  const currentStatus = isAnalyzing ? 'analyzing' : isTranscribing ? 'transcribing' : status;
  const audioSrc = filePath ? (filePath.startsWith('http') ? filePath : `/uploads/${filePath}`) : '';

  const getStatusDisplayLabel = () => {
    switch (currentStatus) {
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

  // If the meeting is still purely uploaded or in initial processing without any transcript/summary yet:
  const isInitialProcessing = (currentStatus === 'uploaded' || currentStatus === 'transcribing' || currentStatus === 'analyzing' || currentStatus === 'failed') && !transcript && !summary;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
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
              Analyze Meeting
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
              Re-analyze
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Title & Metadata Header */}
      <div className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={currentStatus} dot>
            {getStatusDisplayLabel()}
          </Badge>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            {formatDate(createdAt)}
          </span>
          {fileSize > 0 && (
            <>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <FileAudio className="w-3 h-3 text-slate-500" />
                {originalFileName} ({formatFileSize(fileSize)})
              </span>
            </>
          )}
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
          {title}
        </h1>
      </div>

      {/* 3. INITIAL PROCESSING STATE VIEW */}
      {isInitialProcessing ? (
        <ProcessingView
          status={currentStatus}
          errorMessage={opError || errorMessage}
          title={title}
          onRetry={() => {
            if (transcript) handleAnalyze(true);
            else handleTranscribe(true);
          }}
        />
      ) : (
        <>
          {/* 4. Segmented Workspace Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Insights & Summary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'actions'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 text-violet-400" />
              <span>Action Items</span>
              {actionItems && actionItems.length > 0 && (
                <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-violet-500/30 font-mono">
                  {actionItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transcript')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'transcript'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Transcript & Audio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ask')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'ask'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ask MeetAura</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                AI
              </span>
            </button>
          </div>

          {/* TAB 1: AI INSIGHTS & SUMMARY */}
          {activeTab === 'insights' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Clean HTML5 Audio Player */}
              {audioSrc && (
                <AudioPlayer
                  src={audioSrc}
                  title={title}
                  initialDuration={duration}
                />
              )}

              {/* 1. Executive Summary */}
              <GlassCard className="p-6 sm:p-7 space-y-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-white">
                      Executive Summary
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    Grounded AI
                  </span>
                </div>

                {summary ? (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {summary}
                  </p>
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No summary generated yet. Click "Analyze Meeting" above to generate insights.
                  </div>
                )}
              </GlassCard>

              {/* 2. Key Discussion Points & Confirmed Decisions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Key Discussion Points */}
                <GlassCard className="p-6 space-y-4 bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-sm text-white">
                        Key Discussion Points
                      </h3>
                    </div>
                    {keyPoints && keyPoints.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {keyPoints.length} points
                      </span>
                    )}
                  </div>

                  {keyPoints && keyPoints.length > 0 ? (
                    <ul className="space-y-2.5">
                      {keyPoints.map((point, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 leading-snug"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                          <span>{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-4">
                      {status === 'completed' ? 'No key discussion points identified in this recording.' : 'Discussion points will appear after AI analysis.'}
                    </p>
                  )}
                </GlassCard>

                {/* Confirmed Decisions */}
                <GlassCard className="p-6 space-y-4 bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-sm text-white">
                        Confirmed Decisions
                      </h3>
                    </div>
                    {decisions && decisions.length > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {decisions.length} Confirmed
                      </span>
                    )}
                  </div>

                  {decisions && decisions.length > 0 ? (
                    <ul className="space-y-2.5">
                      {decisions.map((decision, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5 text-xs sm:text-sm text-emerald-100 leading-snug"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{decision}</span>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-6 text-center space-y-1">
                      <p className="text-xs text-slate-400 font-medium">
                        No explicit decisions were detected.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Decisions are strictly recorded only when participants explicitly confirm consensus.
                      </p>
                    </div>
                  )}
                </GlassCard>

              </div>
            </motion.div>
          )}

          {/* TAB 2: ACTION ITEMS */}
          {activeTab === 'actions' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-white">
                    Action Items & Deliverables
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tasks parsed from conversation with assigned owners and target deadlines.
                  </p>
                </div>

                {actionItems && actionItems.length > 0 && (
                  <Badge variant="cyan">
                    {actionItems.filter(i => i.completed).length} / {actionItems.length} Done
                  </Badge>
                )}
              </div>

              {actionItems && actionItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {actionItems.map((item, idx) => {
                    const isDone = Boolean(item.completed);
                    return (
                      <GlassCard 
                        key={idx} 
                        className={`p-4 sm:p-5 space-y-3.5 transition-all ${
                          isDone 
                            ? 'bg-slate-900/30 border-emerald-500/20 opacity-80' 
                            : 'bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className={`text-xs sm:text-sm font-medium leading-snug ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                            {item.task}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleToggleActionItem(idx)}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                              isDone
                                ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20'
                            }`}
                            title="Click to toggle status"
                          >
                            {isDone ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Completed</span>
                              </>
                            ) : (
                              <span>Pending</span>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <span className={item.owner ? 'text-slate-200' : 'text-slate-500 italic'}>
                              {item.owner || 'Not specified'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 font-mono">
                            <Hourglass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className={item.deadline ? 'text-slate-200' : 'text-slate-500 italic'}>
                              {item.deadline || 'Not specified'}
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
                    {status === 'completed' ? 'No actionable tasks detected in this meeting.' : 'Action items will appear after AI analysis.'}
                  </p>
                </GlassCard>
              )}
            </motion.div>
          )}

          {/* TAB 3: FULL TRANSCRIPT & AUDIO */}
          {activeTab === 'transcript' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Audio Player in Transcript Tab */}
              {audioSrc && (
                <AudioPlayer
                  src={audioSrc}
                  title={title}
                  initialDuration={duration}
                />
              )}

              {/* Transcript Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search keywords in transcript..."
                    className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {searchTerm && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-cyan-400">
                      {matchCount} match{matchCount === 1 ? '' : 'es'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    disabled={!transcript}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-700/60 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Transcript</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Transcript Paragraphs */}
              {transcript ? (
                <GlassCard className="p-6 sm:p-8 space-y-4 max-h-[600px] overflow-y-auto font-sans leading-relaxed">
                  {filteredLines.length > 0 ? (
                    filteredLines.map((line, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300 py-1 border-b border-slate-800/40 last:border-0">
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5 select-none">
                          {idx + 1}
                        </span>
                        <p className="flex-1 whitespace-pre-wrap leading-relaxed">
                          {line}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No transcript segments matching "{searchTerm}".
                    </div>
                  )}
                </GlassCard>
              ) : (
                <GlassCard className="p-10 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs sm:text-sm text-slate-400 font-medium">
                    Transcript not generated yet.
                  </p>
                </GlassCard>
              )}
            </motion.div>
          )}

          {/* TAB 4: ASK MEETAURA */}
          {activeTab === 'ask' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AskMeetAura
                meetingId={id}
                transcriptAvailable={Boolean(transcript)}
              />
            </motion.div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteMeeting}
        isLoading={isDeleting}
        meetingTitle={title}
      />
    </div>
  );
}

export default MeetingDetails;
