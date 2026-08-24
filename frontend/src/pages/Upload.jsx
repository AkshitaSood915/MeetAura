import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload as UploadIcon,
  FileAudio,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
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

  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.mp4'];
  const maxSizeBytes = 100 * 1024 * 1024; // 100 MB

  const validateFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return false;

    const fileExt =
      '.' + selectedFile.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setError(
        `Unsupported format (${fileExt}). Please select an MP3, WAV, M4A, or MP4 file.`
      );
      return false;
    }

    if (selectedFile.size > maxSizeBytes) {
      setError(
        `File size (${formatFileSize(
          selectedFile.size
        )}) exceeds the 100MB limit.`
      );
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFile) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);

      if (!title.trim()) {
        const rawName =
          selectedFile.name.substring(
            0,
            selectedFile.name.lastIndexOf('.')
          ) || selectedFile.name;

        const cleanTitle = rawName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

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

      const response =
        await meetingApi.uploadMeetingAudio(formData);

      setSuccess(true);
      toast.success(
        'Audio uploaded successfully. Opening workspace...'
      );

      const meetingId =
        response.meeting?._id || response.meeting?.id;

      setTimeout(() => {
        if (meetingId) {
          navigate(`/meetings/${meetingId}`);
        } else {
          navigate('/meetings');
        }
      }, 1000);

    } catch (err) {
      console.error('Upload failed:', err);

      const errMsg =
        err.message ||
        'Failed to upload audio recording. Please try again.';

      setError(errMsg);
      toast.error(errMsg);

    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
          Bring the conversation. We'll find what matters.
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Drop a meeting recording here and MeetAura will turn it
          into a clear, actionable brief.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Drag & Drop Card */}
        <GlassCard
          glow={isDragging}
          className={`p-10 sm:p-12 text-center transition-all duration-200 border-2 min-h-[300px] flex items-center justify-center ${
            isDragging
              ? 'border-violet-500/80 bg-violet-950/20 scale-[1.005]'
              : file
              ? 'border-emerald-500/40 bg-slate-900/60'
              : 'border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30'
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
                className="space-y-4"
              >

                {/* Upload Icon */}
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto">
                  <UploadIcon className="w-7 h-7" />
                </div>

                {/* Main Text */}
                <div className="space-y-1">

                  <p className="text-base sm:text-lg font-semibold text-white">
                    Drop your recording here
                  </p>

                  <p className="text-sm sm:text-base text-slate-400">
                    or{' '}
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 focus:outline-none"
                    >
                      browse files
                    </button>{' '}
                    from your device
                  </p>

                </div>

                {/* Supported Formats */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-500">
                  <span>MP3</span>
                  <span>•</span>
                  <span>WAV</span>
                  <span>•</span>
                  <span>M4A</span>
                  <span>•</span>
                  <span>MP4</span>
                  <span>•</span>
                  <span>Up to 100 MB</span>
                </div>

              </motion.div>

            ) : (

              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center justify-between gap-4 w-full"
              >

                <div className="flex items-center gap-3 min-w-0">

                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileAudio className="w-5 h-5" />
                  </div>

                  <div className="text-left min-w-0">

                    <p className="text-xs sm:text-sm font-medium text-white truncate">
                      {file.name}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatFileSize(file.size)} ·{' '}
                      <span className="text-emerald-400">
                        Ready to upload
                      </span>
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-2 shrink-0">

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded hover:bg-slate-800 transition-colors"
                  >
                    Change
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove file"
                    aria-label="Remove selected file"
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
          <GlassCard className="p-5 space-y-2">

            <label
              htmlFor="meeting-title"
              className="block text-xs font-medium text-slate-300"
            >
              Meeting Title
            </label>

            <input
              id="meeting-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product Strategy Sync, Sprint Review..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
            />

          </GlassCard>
        )}

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-300"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Success Alert */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs text-emerald-300"
          >

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Audio uploaded successfully. Opening workspace...
              </span>
            </div>

            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />

          </motion.div>
        )}

        {/* Submit CTA */}
        {file && !success && (
          <div className="flex justify-end gap-2.5 pt-1">

            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={uploading}
              icon={UploadIcon}
            >
              {uploading
                ? 'Uploading Audio...'
                : 'Upload Recording'}
            </Button>

          </div>
        )}

      </form>
    </div>
  );
}

export default Upload;