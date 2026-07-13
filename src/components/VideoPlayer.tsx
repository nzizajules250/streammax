import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Movie, UserProfile, SubtitleSettings } from '../types';
import { getMuxPlaybackUrl } from '../lib/mux';
import {
  ArrowLeft, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2,
  Settings, Sparkles, Sliders, Monitor, Globe, Eye
} from 'lucide-react';

interface VideoPlayerProps {
  movie: Movie;
  profile: UserProfile;
  isPremium: boolean;
  onClose: () => void;
  onSubscribeTrigger?: () => void;
  onAuthRequired?: () => void;
}

// ---------------------------------------------------------------------------
// Source detection
// ---------------------------------------------------------------------------

type SourceType = 'youtube' | 'vimeo' | 'hls' | 'direct';

interface ParsedSource {
  type: SourceType;
  id?: string;      
  url: string;     
}

function parseVideoSource(rawUrl: string): ParsedSource {
  const url = rawUrl.trim();

  // YouTube: watch?v=, youtu.be/, embed/, shorts/, live/
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return { type: 'youtube', id: ytMatch[1], url };
  }

  // Vimeo: vimeo.com/12345678, player.vimeo.com/video/12345678
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1], url };
  }

  // HLS stream
  if (url.includes('.m3u8')) {
    return { type: 'hls', url };
  }

  // Fallback: treat as a direct playable file (.mp4, .webm, etc.)
  return { type: 'direct', url };
}

// ---------------------------------------------------------------------------
// Dynamic script loader (used for YouTube IFrame API + Vimeo Player SDK)
// ---------------------------------------------------------------------------

function loadScriptOnce(src: string, globalCheck: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (globalCheck()) return resolve();
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    Vimeo: any;
  }
}

export default function VideoPlayer({ movie, profile, isPremium, onClose, onSubscribeTrigger, onAuthRequired }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const vimeoContainerRef = useRef<HTMLDivElement>(null);

  const ytPlayerRef = useRef<any>(null);
  const vimeoPlayerRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);

  // Resolve the source up front. If movie.videoUrl is set, detect its type.
  // Otherwise fall back to Mux (treated as an HLS-style direct source).
  const resolvedUrl = movie.videoUrl || getMuxPlaybackUrl(movie.muxPlaybackId);
  const source = parseVideoSource(resolvedUrl);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

  // Playback settings
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState<'4K' | '1080p' | '720p' | 'Auto'>('Auto');
  const [hardwareAcc, setHardwareAcc] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Custom subtitle settings
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    language: 'en',
    size: 'medium',
    color: 'white',
    opacity: 50,
  });

  // Trailer mode handling: limits non-premium users to 15 seconds
  const isTrailerMode = !isPremium;
  const [trailerLimitReached, setTrailerLimitReached] = useState(false);

  // Embeds (YouTube/Vimeo) manage their own video decoding/quality, so those
  // controls are meaningless there. Only show them for direct/hls sources.
  const supportsQualityControls = source.type === 'direct' || source.type === 'hls';

  // -------------------------------------------------------------------------
  // Unified control functions — each dispatches to whichever backend is active
  // -------------------------------------------------------------------------

  const play = useCallback(() => {
    if (source.type === 'youtube') ytPlayerRef.current?.playVideo();
    else if (source.type === 'vimeo') vimeoPlayerRef.current?.play();
    else videoRef.current?.play().catch(console.error);
    setIsPlaying(true);
  }, [source.type]);

  const pause = useCallback(() => {
    if (source.type === 'youtube') ytPlayerRef.current?.pauseVideo();
    else if (source.type === 'vimeo') vimeoPlayerRef.current?.pause();
    else videoRef.current?.pause();
    setIsPlaying(false);
  }, [source.type]);

  const handlePlayPause = () => {
    if (trailerLimitReached) return;
    if (isPlaying) pause();
    else play();
  };

  const seekTo = useCallback((seconds: number) => {
    if (source.type === 'youtube') ytPlayerRef.current?.seekTo(seconds, true);
    else if (source.type === 'vimeo') vimeoPlayerRef.current?.setCurrentTime(seconds);
    else if (videoRef.current) videoRef.current.currentTime = seconds;
  }, [source.type]);

  const handleSeek = (percentage: number) => {
    if (isTrailerMode) return; // Lock seeking for trailers
    if (!duration) return;
    const target = (percentage / 100) * duration;
    seekTo(target);
    setProgress(percentage);
  };

  const handleSkip = (seconds: number) => {
    if (isTrailerMode) return; // Lock skipping for trailers
    const target = Math.max(0, Math.min(duration || 0, currentTime + seconds));
    seekTo(target);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setIsMuted(value === 0);
    if (source.type === 'youtube') {
      ytPlayerRef.current?.setVolume(value * 100);
      if (value === 0) ytPlayerRef.current?.mute(); else ytPlayerRef.current?.unMute();
    } else if (source.type === 'vimeo') {
      vimeoPlayerRef.current?.setVolume(value);
    } else if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (source.type === 'youtube') {
      if (nextMute) ytPlayerRef.current?.mute(); else ytPlayerRef.current?.unMute();
    } else if (source.type === 'vimeo') {
      vimeoPlayerRef.current?.setMuted(nextMute);
    } else if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (source.type === 'youtube') ytPlayerRef.current?.setPlaybackRate(speed);
    else if (source.type === 'vimeo') vimeoPlayerRef.current?.setPlaybackRate(speed);
    else if (videoRef.current) videoRef.current.playbackRate = speed;
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Trailer cutoff — shared across all backends, driven by the unified currentTime
  useEffect(() => {
    if (isTrailerMode && currentTime >= 15 && !trailerLimitReached) {
      pause();
      setTrailerLimitReached(true);
      setShowControls(true);
    }
  }, [currentTime, isTrailerMode, trailerLimitReached, pause]);

  // -------------------------------------------------------------------------
  // Backend init: YouTube
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (source.type !== 'youtube' || !ytContainerRef.current) return;
    let cancelled = false;
    let poll: ReturnType<typeof setInterval>;

    loadScriptOnce('https://www.youtube.com/iframe_api', () => !!window.YT?.Player).then(() => {
      const create = () => {
        if (cancelled || !ytContainerRef.current) return;
        ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
          videoId: source.id,
          playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
          events: {
            onReady: (e: any) => {
              setPlayerReady(true);
              setDuration(e.target.getDuration());
              e.target.playVideo();
            },
            onStateChange: (e: any) => {
              setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
            },
          },
        });
        poll = setInterval(() => {
          if (!ytPlayerRef.current?.getCurrentTime) return;
          const t = ytPlayerRef.current.getCurrentTime();
          const d = ytPlayerRef.current.getDuration();
          setCurrentTime(t);
          setDuration(d);
          if (d > 0) setProgress((t / d) * 100);
        }, 250);
      };

      if (window.YT?.Player) create();
      else window.onYouTubeIframeAPIReady = create;
    });

    return () => {
      cancelled = true;
      clearInterval(poll);
      ytPlayerRef.current?.destroy?.();
    };
  }, [source.type, source.id]);

  // -------------------------------------------------------------------------
  // Backend init: Vimeo
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (source.type !== 'vimeo' || !vimeoContainerRef.current) return;
    let cancelled = false;

    loadScriptOnce('https://player.vimeo.com/api/player.js', () => !!window.Vimeo?.Player).then(() => {
      if (cancelled || !vimeoContainerRef.current) return;
      const player = new window.Vimeo.Player(vimeoContainerRef.current, {
        id: source.id,
        autoplay: true,
        controls: false,
        responsive: true,
      });
      vimeoPlayerRef.current = player;

      player.ready().then(() => setPlayerReady(true));
      player.on('loaded', () => player.getDuration().then(setDuration));
      player.on('timeupdate', (data: { seconds: number; duration: number }) => {
        setCurrentTime(data.seconds);
        setDuration(data.duration);
        if (data.duration > 0) setProgress((data.seconds / data.duration) * 100);
      });
      player.on('play', () => setIsPlaying(true));
      player.on('pause', () => setIsPlaying(false));
    });

    return () => {
      cancelled = true;
      vimeoPlayerRef.current?.destroy?.();
    };
  }, [source.type, source.id]);

  // -------------------------------------------------------------------------
  // Backend init: HLS (.m3u8) — native on Safari, hls.js elsewhere
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (source.type !== 'hls' || !videoRef.current) return;
    const videoEl = videoRef.current;

    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS: native HLS support, just set src directly
      videoEl.src = source.url;
      return;
    }

    // Everyone else needs hls.js: `npm install hls.js`
    let destroyed = false;
    import('hls.js').then(({ default: Hls }) => {
      if (destroyed) return;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(source.url);
        hls.attachMedia(videoEl);
        hlsRef.current = hls;
      } else {
        console.error('HLS is not supported in this browser and hls.js could not initialize.');
      }
    });

    return () => {
      destroyed = true;
      hlsRef.current?.destroy?.();
    };
  }, [source.type, source.url]);

  // -------------------------------------------------------------------------
  // Backend init: direct file
  // -------------------------------------------------------------------------
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 0;
    setCurrentTime(current);
    setDuration(total);
    if (total > 0) setProgress((current / total) * 100);
  };

  // Load / persist watch progress — only meaningful for direct/hls sources
  // where we own the <video> element and a stable duration up front.
  useEffect(() => {
    if (profile.id === 'guest' || isTrailerMode) return;
    if (source.type !== 'direct' && source.type !== 'hls') return;

    try {
      const key = `progress_${profile.id}`;
      const saved = localStorage.getItem(key);
      if (!saved) return;
      const progressList = JSON.parse(saved) as { movieId: string; progress: number }[];
      const matched = progressList.find(item => item.movieId === movie.id);
      if (!matched || !videoRef.current) return;

      const applySeek = () => {
        if (videoRef.current && matched.progress > 0 && matched.progress < 98) {
          videoRef.current.currentTime = (matched.progress / 100) * videoRef.current.duration;
          setProgress(matched.progress);
        }
      };
      videoRef.current.addEventListener('loadedmetadata', applySeek, { once: true });
    } catch (err) {
      console.error('Error loading history:', err);
    }
  }, [profile.id, movie.id, isTrailerMode, source.type]);

  useEffect(() => {
    if (isTrailerMode) return;
    const interval = setInterval(() => {
      if (!duration || !currentTime) return;
      const calculatedProgress = Math.min(Math.round((currentTime / duration) * 100), 100);
      try {
        const key = `progress_${profile.id}`;
        const saved = localStorage.getItem(key);
        let progressList = saved ? (JSON.parse(saved) as { movieId: string; progress: number; updatedAt: number }[]) : [];
        progressList = progressList.filter(item => item.movieId !== movie.id);
        progressList.push({ movieId: movie.id, progress: calculatedProgress, updatedAt: Date.now() });
        localStorage.setItem(key, JSON.stringify(progressList));
      } catch (err) {
        console.error('Error updating progress:', err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [profile.id, movie.id, isTrailerMode, currentTime, duration]);

  // Controls-visibility timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isPlaying && !showSettingsMenu) setShowControls(false);
      }, 4000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, [isPlaying, showSettingsMenu]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getSubtitleText = (time: number, lang: 'en' | 'es' | 'fr' | 'off') => {
    if (lang === 'off') return '';
    const captions: { [key: string]: { [key: number]: string } } = {
      en: {
        0: `Now streaming ${movie.title}...`,
        3: `Enjoy your show.`,
        6: `Welcome, ${profile.name}!`,
        10: `Customize subtitles in settings.`,
      },
      es: {
        0: `Transmitiendo ahora ${movie.title}...`,
        3: `Disfrute su programa.`,
        6: `¡Bienvenido, ${profile.name}!`,
        10: `Personalice los subtítulos en ajustes.`,
      },
      fr: {
        0: `Diffusion en cours de ${movie.title}...`,
        3: `Profitez de votre programme.`,
        6: `Bienvenue, ${profile.name}!`,
        10: `Personnalisez les sous-titres.`,
      },
    };
    const activeCaptions = captions[lang];
    const keys = Object.keys(activeCaptions).map(Number).sort((a, b) => b - a);
    const matchedKey = keys.find(k => time >= k);
    return matchedKey !== undefined ? activeCaptions[matchedKey] : '';
  };

  const trailerDisplayDuration = isTrailerMode ? Math.min(duration, 15) : duration;
  const trailerDisplayCurrent = isTrailerMode ? Math.min(currentTime, 15) : currentTime;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-black z-100 flex items-center justify-center select-none overflow-hidden ${hardwareAcc ? 'rendering-accelerated' : ''}`}
    >
      {/* Video surface — exactly one of these three renders based on detected source */}
      {source.type === 'youtube' && (
        <div ref={ytContainerRef} className="w-full h-full pointer-events-none" />
      )}
      {source.type === 'vimeo' && (
        <div ref={vimeoContainerRef} className="w-full h-full pointer-events-none" />
      )}
      {(source.type === 'direct' || source.type === 'hls') && (
        <video
          ref={videoRef}
          src={source.type === 'direct' ? source.url : undefined}
          crossOrigin="anonymous"
          autoPlay
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setPlayerReady(true)}
          className="w-full h-full object-contain cursor-none"
          onClick={handlePlayPause}
        />
      )}

      {/* Click-catcher over embeds so our own play/pause + control-visibility logic still works */}
      {(source.type === 'youtube' || source.type === 'vimeo') && (
        <div className="absolute inset-0 z-[5]" onClick={handlePlayPause} />
      )}

      {/* Dynamic Styled Custom Subtitles */}
      {subtitleSettings.language !== 'off' && !trailerLimitReached && (
        <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center max-w-xl px-4">
          <span
            className={`px-3 py-1.5 rounded-md font-sans font-bold tracking-wide drop-shadow-md transition-all ${
              subtitleSettings.size === 'small' ? 'text-xs sm:text-sm' : subtitleSettings.size === 'large' ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
            } ${
              subtitleSettings.color === 'yellow' ? 'text-yellow-300' : subtitleSettings.color === 'green' ? 'text-green-300' : 'text-white'
            } ${
              subtitleSettings.opacity === 100 ? 'bg-black' : subtitleSettings.opacity === 50 ? 'bg-black/60' : 'bg-transparent'
            }`}
          >
            {getSubtitleText(trailerDisplayCurrent, subtitleSettings.language)}
          </span>
        </div>
      )}

      {/* Trailer Cutoff Premium Overlay Wall */}
      {trailerLimitReached && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col justify-center items-center z-40 p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-red-600/10 border border-red-600 rounded-full flex items-center justify-center text-red-500">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Trailer Limit Reached</h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
              You watched the trailer for <span className="text-white font-bold">"{movie.title}"</span>. Upgrade to a premium subscription to stream the full movie and gain unlimited access across all profiles.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            {profile.id === 'guest' ? (
              <button
                onClick={() => { onClose(); if (onAuthRequired) onAuthRequired(); }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-red-600/20"
              >
                Sign In to Watch Full Movie
              </button>
            ) : (
              <button
                onClick={() => { onClose(); if (onSubscribeTrigger) onSubscribeTrigger(); }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-red-600/20"
              >
                Unlock Premium ($9.99)
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer border border-zinc-800"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      )}

      {/* Control Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/70 flex flex-col justify-between p-4 sm:p-6 transition-opacity duration-500 z-10 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="flex items-center gap-2 text-white hover:text-zinc-300 font-medium cursor-pointer" title="Go Back">
            <ArrowLeft className="w-6 h-6" />
            <span className="text-xs sm:text-sm font-bold tracking-wider font-mono uppercase">
              {isTrailerMode ? 'Exit Trailer' : 'Exit Stream'}
            </span>
          </button>
          <div className="text-center font-sans">
            <h1 className="text-xs sm:text-base font-black text-white tracking-wide">{movie.title}</h1>
            <p className="text-[9px] sm:text-[10px] text-red-500 font-mono font-bold tracking-widest uppercase">
              {isTrailerMode ? 'FREE TRAILER MODE (15s PREVIEW)' : `STREAMING VIA ${source.type.toUpperCase()}`}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm shadow-inner">
            {profile.avatar}
          </div>
        </div>

        <div className="flex items-center justify-center">
          {!isPlaying && !trailerLimitReached && playerReady && (
            <button
              onClick={handlePlayPause}
              className="p-5 sm:p-6 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full text-white cursor-pointer hover:scale-105 transition-all border border-white/20 shadow-2xl"
            >
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current text-white" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono text-zinc-300">
            <span>{formatTime(trailerDisplayCurrent)}</span>
            <div className={`flex-1 h-1.5 bg-zinc-800 rounded-full relative group ${isTrailerMode ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} overflow-hidden`}>
              {!isTrailerMode && (
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
              )}
              <div className="h-full bg-red-600 rounded-full relative" style={{ width: `${progress}%` }}>
                {!isTrailerMode && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
                )}
              </div>
            </div>
            <span>{formatTime(trailerDisplayDuration - trailerDisplayCurrent)}</span>
          </div>

          <div className="flex items-center justify-between text-white flex-wrap gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={() => handleSkip(-10)} disabled={isTrailerMode} className="hover:text-zinc-300 disabled:opacity-40 cursor-pointer" title="Backward 10s">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button onClick={handlePlayPause} className="hover:text-zinc-300 cursor-pointer" title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" /> : <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />}
              </button>
              <button onClick={() => handleSkip(10)} disabled={isTrailerMode} className="hover:text-zinc-300 disabled:opacity-40 cursor-pointer" title="Forward 10s">
                <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="flex items-center gap-2 group/volume">
                <button onClick={handleToggleMute} className="hover:text-zinc-300 cursor-pointer" title="Mute">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-0 group-hover/volume:w-16 sm:group-hover/volume:w-20 h-1 bg-zinc-700 rounded-full appearance-none accent-white transition-all cursor-pointer overflow-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="hover:text-zinc-300 flex items-center gap-1.5 cursor-pointer text-xs font-mono font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-400"
                title="Media Customization Settings"
              >
                <Settings className="w-4 h-4 animate-spin-slow" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 bottom-12 w-64 bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-2xl space-y-4 text-xs text-zinc-300 z-50">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="font-bold text-white uppercase tracking-wider font-mono">Custom Player Configuration</span>
                    <button onClick={() => setShowSettingsMenu(false)} className="text-zinc-500 hover:text-white font-black">✕</button>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-zinc-500 font-bold uppercase flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> Speed:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          onClick={() => changeSpeed(speed)}
                          className={`px-2 py-1 rounded cursor-pointer ${playbackSpeed === speed ? 'bg-red-600 text-white font-bold' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-zinc-900 pt-2.5">
                    <span className="text-zinc-500 font-bold uppercase flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Subtitles Language:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {['off', 'en', 'es', 'fr'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => setSubtitleSettings({ ...subtitleSettings, language: lang as any })}
                          className={`px-1 py-1 rounded cursor-pointer capitalize ${subtitleSettings.language === lang ? 'bg-red-600 text-white font-bold' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {subtitleSettings.language !== 'off' && (
                    <div className="space-y-2 border-t border-zinc-900 pt-2 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 uppercase font-semibold">Text Size:</span>
                        <div className="flex gap-1">
                          {['small', 'medium', 'large'].map(sz => (
                            <button
                              key={sz}
                              onClick={() => setSubtitleSettings({ ...subtitleSettings, size: sz as any })}
                              className={`px-1.5 py-0.5 rounded capitalize ${subtitleSettings.size === sz ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 uppercase font-semibold">Color Accent:</span>
                        <div className="flex gap-1">
                          {['white', 'yellow', 'green'].map(col => (
                            <button
                              key={col}
                              onClick={() => setSubtitleSettings({ ...subtitleSettings, color: col as any })}
                              className={`px-1.5 py-0.5 rounded capitalize ${subtitleSettings.color === col ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              {col}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 uppercase font-semibold">Bg Opacity:</span>
                        <div className="flex gap-1">
                          {[0, 50, 100].map(op => (
                            <button
                              key={op}
                              onClick={() => setSubtitleSettings({ ...subtitleSettings, opacity: op as any })}
                              className={`px-1.5 py-0.5 rounded capitalize ${subtitleSettings.opacity === op ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              {op}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {supportsQualityControls && (
                    <>
                      <div className="space-y-1.5 border-t border-zinc-900 pt-2.5">
                        <span className="text-zinc-500 font-bold uppercase flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Resolution:</span>
                        <div className="grid grid-cols-4 gap-1">
                          {['Auto', '4K', '1080p', '720p'].map(res => (
                            <button
                              key={res}
                              onClick={() => setQuality(res as any)}
                              className={`px-1 py-1 rounded cursor-pointer ${quality === res ? 'bg-red-600 text-white font-bold' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'}`}
                            >
                              {res}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-900 pt-2.5">
                        <span className="text-zinc-500 font-bold uppercase flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> GPU Acceleration:</span>
                        <button
                          onClick={() => setHardwareAcc(!hardwareAcc)}
                          className={`px-2 py-1 rounded cursor-pointer ${hardwareAcc ? 'bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-zinc-900 text-zinc-500'}`}
                        >
                          {hardwareAcc ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </>
                  )}

                  {!supportsQualityControls && (
                    <p className="text-[10px] text-zinc-500 italic border-t border-zinc-900 pt-2.5">
                      Resolution & GPU settings are managed by {source.type === 'youtube' ? 'YouTube' : 'Vimeo'} for embedded playback.
                    </p>
                  )}
                </div>
              )}

              <button onClick={handleToggleFullscreen} className="hover:text-zinc-300 cursor-pointer" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                {isFullscreen ? <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}