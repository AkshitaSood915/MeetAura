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
  HardDrive,
  ShieldCheck,
  Music,
  ArrowRight
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
      setError('The selected audio file is empty (0 bytes). Please choose a valid audio file.');
      return false;
    }

    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setError(`Invalid format (${fileExt}). Please select an MP3, WAV, M4A, MP4, AAC, OGG, WEBM, or FLAC file.`);
      return false;
    }

    if (selectedFile.size > maxSizeBytes) {
      setError(`File size (${formatFileSize(selectedFile.size)}) exceeds the 100MB maximum limit.`);
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
      setError('Please select an audio file to upload.');
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
      toast.success('Meeting uploaded successfully!');

      const meetingId = response.meeting?._id || response.meeting?.id;
      setTimeout(() => {
        if (meetingId) {
          navigate(`/meetings/${meetingId}`);
        } else {
          navigate('/meetings');
        }
      }, 1200);

    } catch (err) {
      console.error('Upload failed:', err);
      const errMsg = err.message || 'Failed to upload audio. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="indigo" dot className="mb-2">
          Audio Upload Pipeline
        </Badge>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
          Upload Meeting Audio
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Upload your conversation recording to store securely and prepare for Gemini AI transcription and synthesis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Drag & Drop Card */}
        <GlassCard
          glow={isDragging}
          className={`p-8 sm:p-12 text-center transition-all duration-300 border-2 ${
            isDragging 
              ? 'border-aura-violet bg-violet-950/20 scale-[1.01]' 
              : file 
              ? 'border-emerald-500/40 bg-slate-900/60' 
              : 'border-dashed border-slate-700/80 hover:border-slate-500 bg-slate-900/40'
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
                key="empty-dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="w-16 h-16 rounded-3xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-aura-violet mx-auto shadow-inner">
                  <UploadIcon className="w-8 h-8 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-base font-semibold text-white">
                    Drop your meeting audio here
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-aura-cyan hover:text-cyan-300 font-medium underline underline-offset-2 focus:outline-none"
                    >
                      browse files
                    </button>{' '}
                    from your device
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
                  <span className="bg-slate-950/60 px-2.5 py-1 rounded-full border border-white/5">MP3</span>
                  <span className="bg-slate-950/60 px-2.5 py-1 rounded-full border border-white/5">WAV</span>
                  <span className="bg-slate-950/60 px-2.5 py-1 rounded-full border border-white/5">M4A</span>
                  <span className="bg-slate-950/60 px-2.5 py-1 rounded-full border border-white/5">AAC</span>
                  <span className="bg-slate-950/60 px-2.5 py-1 rounded-full border border-white/5">OGG</span>
                  <span className="bg-slate-950/60 px-2.5 py-1 rounded-full border border-white/5">WEBM</span>
                  <span className="bg-slate-950/60 px-2.5 py-1 rounded-full border border-white/5">FLAC</span>
                  <span className="text-slate-500">• Max 100 MB</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-5 rounded-2xl bg-slate-950/60 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileAudio className="w-6 h-6" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">Ready to upload</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Meeting Title Input */}
        {file && (
          <GlassCard className="p-6 space-y-3 bg-slate-900/60">
            <label htmlFor="meeting-title" className="block text-xs font-semibold text-slate-300">
              Meeting Title
            </label>
            <input
              id="meeting-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Product Sync, Sprint Planning..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500">
              Give your meeting a descriptive title to organize your intelligence workspace.
            </p>
          </GlassCard>
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
              <span>Meeting audio uploaded successfully! Redirecting to workspace...</span>
            </div>
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          </motion.div>
        )}

        {/* Submit CTA */}
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
              className="shadow-xl shadow-violet-500/20"
            >
              {uploading ? 'Uploading Audio...' : 'Upload Meeting'}
            </Button>
          </div>
        )}
      </form>

    </div>
  );
}

export default Upload;
