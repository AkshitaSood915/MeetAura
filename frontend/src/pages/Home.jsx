import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  ArrowRight, 
  BrainCircuit, 
  AudioWaveform,
} from 'lucide-react';
import Button from '../components/Button';
import GlassCard from '../components/GlassCard';
import MeetingCard from '../components/MeetingCard';
import { MeetingCardSkeleton, StatsWidgetSkeleton } from '../components/ui/Skeleton';
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 sm:space-y-16">
      
      {/* 1. Hero Section */}
      <section className="text-center max-w-3xl mx-auto pt-4 sm:pt-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-violet-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI-powered meeting intelligence</span>
        </div>

        <h1 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
          Turn every meeting into <span className="text-gradient">momentum.</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          MeetAura listens, understands, and turns your conversations into clear decisions, key insights, and next steps.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            to="/upload"
            variant="primary"
            size="md"
            icon={Upload}
          >
            Upload Meeting
          </Button>
          <Button
            to="/meetings"
            variant="glass"
            size="md"
            icon={FileText}
          >
            View Meetings
          </Button>
        </div>
      </section>

      {/* 2. Workspace Statistics (Connected to Real Backend Data) */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {loading ? (
            <>
              <StatsWidgetSkeleton />
              <StatsWidgetSkeleton />
              <StatsWidgetSkeleton />
              <StatsWidgetSkeleton />
            </>
          ) : (
            <>
              <GlassCard className="p-4 sm:p-5 space-y-1 bg-slate-900/40">
                <span className="text-xs text-slate-400 font-medium">Meetings Captured</span>
                <p className="font-display font-bold text-2xl text-white">
                  {stats.totalMeetings}
                </p>
                <p className="text-[11px] text-slate-500">Recordings uploaded</p>
              </GlassCard>

              <GlassCard className="p-4 sm:p-5 space-y-1 bg-slate-900/40">
                <span className="text-xs text-slate-400 font-medium">Conversations Transcribed</span>
                <p className="font-display font-bold text-2xl text-cyan-400">
                  {stats.transcribedMeetings}
                </p>
                <p className="text-[11px] text-slate-500">Audio processed</p>
              </GlassCard>

              <GlassCard className="p-4 sm:p-5 space-y-1 bg-slate-900/40">
                <span className="text-xs text-slate-400 font-medium">Meeting Briefs</span>
                <p className="font-display font-bold text-2xl text-emerald-400">
                  {stats.completedMeetings}
                </p>
                <p className="text-[11px] text-slate-500">Summaries & decisions ready</p>
              </GlassCard>

              <GlassCard className="p-4 sm:p-5 space-y-1 bg-slate-900/40">
                <span className="text-xs text-slate-400 font-medium">Action Items</span>
                <p className="font-display font-bold text-2xl text-violet-400">
                  {stats.totalActionItems}
                </p>
                <p className="text-[11px] text-slate-500">Deliverables identified</p>
              </GlassCard>
            </>
          )}
        </div>
      </section>

      {/* 3. Recent Meetings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-white">
              Recent Meetings
            </h2>
            <p className="text-xs text-slate-400">
              Pick up where you left off.
            </p>
          </div>

          <Link
            to="/meetings"
            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
          </div>
        ) : recentMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentMeetings.map((meeting) => (
              <MeetingCard key={meeting._id || meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No meetings yet"
            description="Your next meeting brief will appear here once you upload an audio recording."
            actionLabel="Upload Meeting"
            actionTo="/upload"
          />
        )}
      </section>

      {/* 4. How MeetAura Works */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-lg mx-auto space-y-1">
          <h2 className="font-display font-semibold text-lg text-white">
            How MeetAura Works
          </h2>
          <p className="text-xs text-slate-400">
            From conversation to clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-5 space-y-2.5 bg-slate-900/30">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <AudioWaveform className="w-4 h-4" />
            </div>
            <h3 className="font-display font-medium text-sm text-white">
              1. Audio Recording
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload MP3, WAV, M4A, or MP4 recordings up to 100MB stored securely.
            </p>
          </GlassCard>

          <GlassCard className="p-5 space-y-2.5 bg-slate-900/30">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-display font-medium text-sm text-white">
              2. Transcription
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accurate chronological transcription preserving speakers and dialogue.
            </p>
          </GlassCard>

          <GlassCard className="p-5 space-y-2.5 bg-slate-900/30">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="font-display font-medium text-sm text-white">
              3. Meeting Brief & Tasks
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesized summary, key decisions, and prioritized deliverables.
            </p>
          </GlassCard>
        </div>
      </section>

    </div>
  );
}

export default Home;
