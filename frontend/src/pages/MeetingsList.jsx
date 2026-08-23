import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  FileAudio
} from 'lucide-react';
import Button from '../components/Button';
import MeetingCard from '../components/MeetingCard';
import DeleteModal from '../components/DeleteModal';
import { MeetingCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { meetingApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export function MeetingsList() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter & Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Delete modal state
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await meetingApi.getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error('Failed to load meetings:', err);
      setError(err.message || 'Failed to load meetings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!meetingToDelete) return;

    try {
      setIsDeleting(true);
      const targetId = meetingToDelete._id || meetingToDelete.id;
      await meetingApi.deleteMeeting(targetId);
      setMeetings(prev => prev.filter(m => (m._id || m.id) !== targetId));
      toast.success(`Meeting "${meetingToDelete.title}" was deleted.`);
      setMeetingToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete meeting.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAndSortedMeetings = useMemo(() => {
    return meetings
      .filter((meeting) => {
        if (statusFilter !== 'all') {
          if (meeting.status !== statusFilter) return false;
        }

        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase();
          const titleMatch = (meeting.title || '').toLowerCase().includes(term);
          const fileMatch = (meeting.originalFileName || '').toLowerCase().includes(term);
          return titleMatch || fileMatch;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (sortBy === 'alphabetical') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [meetings, searchTerm, statusFilter, sortBy]);

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'analyzing', label: 'Analyzing' },
    { key: 'transcribed', label: 'Transcript Ready' },
    { key: 'transcribing', label: 'Transcribing' },
    { key: 'uploaded', label: 'Uploaded' },
    { key: 'failed', label: 'Failed' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            Your meeting intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Every recording, insight, decision, and next step — in one place.
          </p>
        </div>

        <Button
          to="/upload"
          variant="primary"
          size="sm"
          icon={Plus}
          className="shrink-0"
        >
          Upload Meeting
        </Button>
      </div>

      {/* Sleek Filter & Search Bar */}
      <div className="space-y-3 pb-2">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your meetings..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 w-full md:w-auto justify-end text-xs text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-700 transition-colors cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="alphabetical">A–Z</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meetings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
        </div>
      ) : filteredAndSortedMeetings.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 px-0.5">
            Showing {filteredAndSortedMeetings.length} of {meetings.length} meetings
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedMeetings.map((meeting) => (
              <MeetingCard
                key={meeting._id || meeting.id}
                meeting={meeting}
                onDelete={(m) => setMeetingToDelete(m)}
              />
            ))}
          </div>
        </div>
      ) : searchTerm.trim() !== '' || statusFilter !== 'all' ? (
        <EmptyState
          icon={Search}
          title="No meetings match your criteria"
          description="Try changing your search term or selecting another filter tab."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchTerm('');
            setStatusFilter('all');
          }}
        />
      ) : (
        <EmptyState
          icon={FileAudio}
          title="Your meeting workspace is empty"
          description="Upload an audio recording to start extracting AI transcripts, summaries, decisions, and action items."
          actionLabel="Upload Meeting"
          actionTo="/upload"
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(meetingToDelete)}
        title={meetingToDelete?.title || 'Meeting'}
        isDeleting={isDeleting}
        onClose={() => setMeetingToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

    </div>
  );
}

export default MeetingsList;
