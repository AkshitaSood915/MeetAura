import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Volume1,
  Music,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function AudioPlayer({ 
  src, 
  title = 'Meeting Recording',
  initialDuration = 0,
  onTimeUpdate = null,
  onSeek = null 
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isAudioError, setIsAudioError] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const progressBarRef = useRef(null);

  // Sync with duration prop if provided
  useEffect(() => {
    if (initialDuration && initialDuration > 0) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.warn('Audio play error:', err);
        setIsAudioError(true);
      });
    }
  };

  // Handle Time Update
  const handleTimeUpdate = () => {
    if (!audioRef.current || isSeeking) return;
    const current = audioRef.current.currentTime;
    setCurrentTime(current);
    if (onTimeUpdate) {
      onTimeUpdate(current);
    }
  };

  // Handle Loaded Metadata
  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const d = audioRef.current.duration;
    if (d && !isNaN(d) && isFinite(d)) {
      setDuration(d);
    }
    setIsAudioError(false);
  };

  // Skip forward or backward
  const skip = (seconds) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration || 9999);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    if (onSeek) onSeek(newTime);
  };

  // Seek on progress bar click / drag
  const handleProgressClick = (e) => {
    if (!progressBarRef.current || !audioRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    if (onSeek) onSeek(targetTime);
  };

  // Hover over progress bar
  const handleMouseMove = (e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  // Volume change
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Change Playback Speed
  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  // Progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (isAudioError) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-rose-500/20 p-4 flex items-center justify-between gap-4 text-xs text-rose-300">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Audio stream unavailable or audio format unsupported.</span>
        </div>
        <button
          onClick={() => {
            setIsAudioError(false);
            if (audioRef.current) audioRef.current.load();
          }}
          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border border-rose-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-slate-800/80 p-4 sm:p-5 shadow-xl shadow-black/40 backdrop-blur-md">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          console.warn('HTML5 Audio error on source:', src);
          setIsAudioError(true);
        }}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isPlaying ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800/80 text-slate-400'
          }`}>
            <Music className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-medium text-white truncate">
              {title}
            </h4>
            <p className="text-[11px] text-slate-400">
              Original Meeting Audio Recording
            </p>
          </div>
        </div>

        {/* Animated Equalizer Waveform */}
        <div className="flex items-center gap-0.5 h-4 px-2 shrink-0">
          {[0.6, 1.2, 0.4, 1.4, 0.8, 1.6, 0.5, 1.0].map((h, i) => (
            <motion.span
              key={i}
              className={`w-0.5 rounded-full ${isPlaying ? 'bg-cyan-400' : 'bg-slate-700'}`}
              animate={isPlaying ? {
                height: ['3px', `${h * 10}px`, '3px'],
              } : { height: '3px' }}
              transition={isPlaying ? {
                duration: 0.6 + (i * 0.1),
                repeat: Infinity,
                ease: 'easeInOut'
              } : {}}
            />
          ))}
        </div>
      </div>

      {/* Scrubbable Progress Bar */}
      <div className="space-y-1 mb-3">
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative h-2 w-full bg-slate-800/80 hover:h-2.5 rounded-full cursor-pointer transition-all overflow-visible group"
        >
          {/* Filled Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Scrub Thumb Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md shadow-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-white shadow border border-slate-700 pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Timestamps Display */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        {/* Left: Playback Rate */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono font-medium border border-slate-700/50 transition-colors"
            title="Change Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Center: Main Controls (Skip Back, Play/Pause, Skip Forward) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => skip(-10)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skip(10)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Volume Slider */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-12 sm:w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            title="Volume"
          />
        </div>
      </div>
    </div>
  );
}
