import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload as UploadIcon, 
  FileAudio, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  Radio,
  FileCheck
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { formatFileSize } from '../utils/formatters';
import { meetingApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const toast = useToast();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.aac', '.ogg', '.webm', '.flac'];
  const maxSizeBytes = 100 * 1024 * 1024; // 100 MB

  const validateFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return false;

    if (selectedFile.size === 0) {
      setError('The selected audio file is empty (0 bytes). Please select a valid meeting recording.');
      return false;
    }

    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setError(`Invalid format (${fileExt}). Supported audio formats: MP3, WAV, M4A, MP4, AAC, OGG, WEBM, FLAC.`);
      return false;
    }

    if (selectedFile.size > maxSizeBytes) {
      setError(`File size (${formatFileSize(selectedFile.size)}) exceeds the 100MB maximum upload limit.`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFile) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      if (!title.trim()) {
        const rawName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
        const cleanTitle = rawName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        setTitle(cleanTitle);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an audio recording to upload.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('audio', file);
      if (title.trim()) {
        formData.append('title', title.trim());
      }

      const response = await meetingApi.uploadMeetingAudio(formData);
      
      setSuccess(true);
      toast.success('Meeting recording uploaded successfully!');

      const meetingId = response.meeting?._id || response.meeting?.id;
      setTimeout(() => {
        if (meetingId) {
          navigate(`/meetings/${meetingId}`);
        } else {
          navigate('/meetings');
        }
      }, 1000);

    } catch (err) {
      console.error('Upload failed:', err);
      const errMsg = err.message || 'Failed to upload audio recording. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      
      {/* Visual Concept Hero */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Turn Conversations Into Clarity</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display"
        >
          Upload Meeting Audio
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed"
        >
          Upload your meeting or sync recording to generate structured transcripts, executive summaries, decisions, and interactive action items.
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Distinctive Central Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <GlassCard
            className={`relative p-8 sm:p-12 text-center transition-all duration-300 border-2 overflow-hidden ${
              isDragging 
                ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01] shadow-2xl shadow-cyan-500/10' 
                : file 
                ? 'border-emerald-500/40 bg-slate-900/70' 
                : 'border-dashed border-slate-700/80 hover:border-slate-500 bg-slate-900/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.mp4,audio/*,video/mp4"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  key="dropzone-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Subtle Audio Waveform Visual */}
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-cyan-500/10 blur-md"
                    />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-inner">
                      <Radio className="w-8 h-8 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-base sm:text-lg font-semibold text-white">
                      Drag and drop your audio recording
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400">
                      or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 focus:outline-none cursor-pointer"
                      >
                        browse files
                      </button>{' '}
                      from your computer
                    </p>
                  </div>

                  {/* Format Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400 font-mono">
                    {['MP3', 'WAV', 'M4A', 'MP4', 'AAC', 'OGG', 'WEBM', 'FLAC'].map((ext) => (
                      <span key={ext} className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300">
                        {ext}
                      </span>
                    ))}
                    <span className="text-slate-500 text-xs ml-1">• Up to 100 MB</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="file-ready"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                      <FileAudio className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-300">{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5" />
                          Ready for Processing
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* Meeting Title Input */}
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-5 sm:p-6 space-y-2.5 bg-slate-900/70 border border-slate-800">
              <label htmlFor="meeting-title" className="block text-xs font-semibold text-slate-300">
                Meeting Title
              </label>
              <input
                id="meeting-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sprint 14 Architecture Sync, Product Strategy Call..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all font-medium"
              />
              <p className="text-[11px] text-slate-500">
                Descriptive title to help you organize and search within your meeting workspace.
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs sm:text-sm text-rose-300"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Success Alert */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-300"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Meeting recording uploaded successfully! Initializing AI workspace...</span>
            </div>
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          </motion.div>
        )}

        {/* Action Controls */}
        {file && !success && (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="glass"
              size="md"
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={uploading}
              icon={UploadIcon}
              className="shadow-xl shadow-cyan-500/20"
            >
              {uploading ? 'Uploading Audio...' : 'Upload & Synthesize'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

export default Upload;
