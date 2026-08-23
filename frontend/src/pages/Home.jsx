import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle2, 
  ListTodo, 
  ArrowRight, 
  BrainCircuit, 
  ShieldCheck, 
  Clock, 
  AudioWaveform,
  Calendar,
  Layers
} from 'lucide-react';
import Button from '../components/Button';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import MeetingCard from '../components/MeetingCard';
import { Skeleton, MeetingCardSkeleton, StatsWidgetSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { meetingApi } from '../services/api';

export function Home() {
  const [stats, setStats] = useState({
    totalMeetings: 0,
    transcribedMeetings: 0,
    completedMeetings: 0,
    totalActionItems: 0
  });
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [statsData, meetingsData] = await Promise.all([
          meetingApi.getMeetingStats().catch(() => ({ totalMeetings: 0, transcribedMeetings: 0, completedMeetings: 0, totalActionItems: 0 })),
          meetingApi.getMeetings().catch(() => [])
        ]);

        setStats(statsData);
        setRecentMeetings((meetingsData || []).slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 py-6 sm:py-10">
      
      {/* 1. Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-10 space-y-6">
        {/* Glow Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-violet-500/20 text-xs text-violet-300 backdrop-blur-md shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5 text-aura-cyan animate-pulse" />
          <span>Next-Generation AI Meeting Intelligence</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-tight sm:leading-none"
        >
          Turn conversations into{' '}
          <span className="text-gradient">clear next steps.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
        >
          Upload your audio recordings, transcribe conversations with Gemini 2.5, and instantly generate executive summaries, key decisions, and prioritized tasks.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          <Button
            to="/upload"
            variant="primary"
            size="lg"
            icon={Upload}
            className="w-full sm:w-auto shadow-xl shadow-violet-500/20"
          >
            Upload Meeting
          </Button>
          <Button
            to="/meetings"
            variant="glass"
            size="lg"
            icon={FileText}
            className="w-full sm:w-auto"
          >
            View Workspace
          </Button>
        </motion.div>
      </section>

      {/* 2. Real Workspace Statistics (Live MongoDB Metrics) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            <>
              <StatsWidgetSkeleton />
              <StatsWidgetSkeleton />
              <StatsWidgetSkeleton />
              <StatsWidgetSkeleton />
            </>
          ) : (
            <>
              <GlassCard className="p-5 sm:p-6 space-y-1 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">Total Meetings</span>
                <p className="font-display font-bold text-2xl sm:text-3xl text-white">
                  {stats.totalMeetings}
                </p>
                <p className="text-[11px] text-slate-500">Audio recordings uploaded</p>
              </GlassCard>

              <GlassCard className="p-5 sm:p-6 space-y-1 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">Transcriptions</span>
                <p className="font-display font-bold text-2xl sm:text-3xl text-aura-cyan">
                  {stats.transcribedMeetings}
                </p>
                <p className="text-[11px] text-slate-500">Gemini 2.5 audio processed</p>
              </GlassCard>

              <GlassCard className="p-5 sm:p-6 space-y-1 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">Analyzed Meetings</span>
                <p className="font-display font-bold text-2xl sm:text-3xl text-emerald-400">
                  {stats.completedMeetings}
                </p>
                <p className="text-[11px] text-slate-500">Summaries & decisions synthesized</p>
              </GlassCard>

              <GlassCard className="p-5 sm:p-6 space-y-1 bg-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">Action Items</span>
                <p className="font-display font-bold text-2xl sm:text-3xl text-aura-violet">
                  {stats.totalActionItems}
                </p>
                <p className="text-[11px] text-slate-500">Deliverables tracked with owners</p>
              </GlassCard>
            </>
          )}
        </div>
      </section>

      {/* 3. Recent Meetings Workspace Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
              Recent Meetings
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Pick up where you left off or review recent meeting intelligence.
            </p>
          </div>

          <Link
            to="/meetings"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-aura-cyan hover:text-cyan-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
          </div>
        ) : recentMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentMeetings.map((meeting) => (
              <MeetingCard key={meeting._id || meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No meetings uploaded yet"
            description="Upload your first audio file to start generating automated transcripts, summaries, and action items."
            actionLabel="Upload First Meeting"
            actionTo="/upload"
          />
        )}
      </section>

      {/* 4. AI Pipeline Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-display font-bold text-2xl text-white">
            End-to-End AI Workflow
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered with Gemini 2.5 Flash for low latency and high accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6 space-y-3 bg-slate-900/40">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <AudioWaveform className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-base text-white">
              1. Secure Audio Upload
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Support for MP3, WAV, M4A, and MP4 formats up to 100MB with isolated server disk storage.
            </p>
          </GlassCard>

          <GlassCard className="p-6 space-y-3 bg-slate-900/40">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-aura-violet">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-base text-white">
              2. Gemini Audio Transcription
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-accuracy speaker-attributed transcription preserving chronological dialogue.
            </p>
          </GlassCard>

          <GlassCard className="p-6 space-y-3 bg-slate-900/40">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-aura-cyan">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-base text-white">
              3. Structured Intelligence
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Executive summaries, consensus decisions, and task assignments with assignees and deadlines.
            </p>
          </GlassCard>
        </div>
      </section>

    </div>
  );
}

export default Home;
