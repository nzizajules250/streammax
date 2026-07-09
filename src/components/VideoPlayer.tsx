import React, { useState, useEffect, useRef } from 'react';
import { Movie, UserProfile, SubtitleSettings } from '../types';
import { getMuxPlaybackUrl } from '../lib/mux';
import { 
  ArrowLeft, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, 
  Settings, Sparkles, Sliders, Monitor, Globe, Check, Eye
} from 'lucide-react';

interface VideoPlayerProps {
  movie: Movie;
  profile: UserProfile;
  isPremium: boolean;
  onClose: () => void;
  onSubscribeTrigger?: () => void;
  onAuthRequired?: () => void;
}

export default function VideoPlayer({ movie, profile, isPremium, onClose, onSubscribeTrigger, onAuthRequired }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

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

  // Load existing watch history progress on start
  useEffect(() => {
    if (profile.id === 'guest') return;
    
    try {
      const key = `progress_${profile.id}`;
      const saved = localStorage.getItem(key);
      let savedProgress = 0;

      if (saved) {
        const progressList = JSON.parse(saved) as { movieId: string; progress: number }[];
        const matched = progressList.find(item => item.movieId === movie.id);
        if (matched) {
          savedProgress = matched.progress || 0;
        }
      }

      if (videoRef.current && savedProgress > 0 && savedProgress < 98 && !isTrailerMode) {
        // Wait for metadata to load to apply seek
        const applySeek = () => {
          if (videoRef.current) {
            const targetTime = (savedProgress / 100) * videoRef.current.duration;
            videoRef.current.currentTime = targetTime;
            setProgress(savedProgress);
          }
        };
        videoRef.current.addEventListener('loadedmetadata', applySeek, { once: true });
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  }, [profile.id, movie.id, isTrailerMode]);

  // Persist playback progress to LocalStorage periodically
  useEffect(() => {
    if (isTrailerMode) return; // Do not save history for trailer clips

    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        if (isNaN(currentProgress)) return;

        const calculatedProgress = Math.min(Math.round(currentProgress), 100);

        try {
          const key = `progress_${profile.id}`;
          const saved = localStorage.getItem(key);
          let progressList = saved ? (JSON.parse(saved) as { movieId: string; progress: number; updatedAt: number }[]) : [];

          progressList = progressList.filter(item => item.movieId !== movie.id);
          progressList.push({
            movieId: movie.id,
            progress: calculatedProgress,
            updatedAt: Date.now()
          });

          localStorage.setItem(key, JSON.stringify(progressList));
        } catch (err) {
          console.error('Error updating progress:', err);
        }
      }
    }, 4000); // sync every 4 seconds

    return () => clearInterval(interval);
  }, [profile.id, movie.id, isTrailerMode]);

  // Handle controls visibility timer on mouse movement
  useEffect(() => {
    let timer: NodeJS.Timeout;
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

  // Handle Playback speed changes
  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handlePlayPause = () => {
    if (trailerLimitReached) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (percentage: number) => {
    if (isTrailerMode) return; // Lock seeking for trailers
    if (videoRef.current && videoRef.current.duration) {
      const targetTime = (percentage / 100) * videoRef.current.duration;
      videoRef.current.currentTime = targetTime;
      setProgress(percentage);
    }
  };

  const handleSkip = (seconds: number) => {
    if (isTrailerMode) return; // Lock skipping for trailers
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setIsMuted(value === 0);
    if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 0;

      // Trailer limit cutoff at 15 seconds
      if (isTrailerMode && current >= 15) {
        videoRef.current.pause();
        setIsPlaying(false);
        setTrailerLimitReached(true);
        setShowControls(true);
        return;
      }

      setCurrentTime(current);
      setDuration(isTrailerMode ? 15 : total);
      if (total > 0) {
        setProgress((current / (isTrailerMode ? 15 : total)) * 100);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Subtitle subtitle engine dictionary generator
  const getSubtitleText = (time: number, lang: 'en' | 'es' | 'fr' | 'off') => {
    if (lang === 'off') return '';
    
    const captions: { [key: string]: { [key: number]: string } } = {
      en: {
        0: `Now streaming ${movie.title}...`,
        3: `This film is optimized with Hardware Acceleration.`,
        6: `Welcome, ${profile.name}! Enjoy high-definition cinematic audio.`,
        10: `Remember to customize your subtitle colors in the player configurations!`,
        14: `Streaming globally at 4K Resolution.`
      },
      es: {
        0: `Transmitiendo ahora ${movie.title}...`,
        3: `Esta película está optimizada con aceleración de hardware.`,
        6: `¡Bienvenido, ${profile.name}! Disfrute del audio cinematográfico de alta definición.`,
        10: `¡Recuerde personalizar los colores de sus subtítulos en los ajustes!`,
        14: `Transmitiendo globalmente a resolución 4K.`
      },
      fr: {
        0: `Diffusion en cours de ${movie.title}...`,
        3: `Ce film est optimisé avec l'accélération matérielle.`,
        6: `Bienvenue, ${profile.name}! Profitez d'un son cinéma haute définition.`,
        10: `N'oubliez pas de personnaliser les couleurs de vos sous-titres !`,
        14: `Diffusion mondiale en résolution 4K.`
      }
    };

    const activeCaptions = captions[lang];
    const keys = Object.keys(activeCaptions).map(Number).sort((a, b) => b - a);
    const matchedKey = keys.find(k => time >= k);
    
    return matchedKey !== undefined ? activeCaptions[matchedKey] : '';
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-black z-100 flex items-center justify-center select-none overflow-hidden ${
        hardwareAcc ? 'rendering-accelerated' : ''
      }`}
    >
      {/* Real HTML Video Component */}
      <video
        ref={videoRef}
        src={movie.videoUrl || getMuxPlaybackUrl(movie.muxPlaybackId)}
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-contain cursor-none"
        onClick={handlePlayPause}
      />

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
            {getSubtitleText(currentTime, subtitleSettings.language)}
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
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Trailer Limit Reached
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
              You watched the trailer for <span className="text-white font-bold">"{movie.title}"</span>. Upgrade to a premium subscription to stream the full movie and gain unlimited access across all profiles.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            {profile.id === 'guest' ? (
              <button
                onClick={() => {
                  onClose();
                  if (onAuthRequired) onAuthRequired();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-red-600/20"
              >
                Sign In to Watch Full Movie
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  if (onSubscribeTrigger) onSubscribeTrigger();
                }}
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

      {/* Control Overlay Wrap (Fades when idle) */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/70 flex flex-col justify-between p-4 sm:p-6 transition-opacity duration-500 z-10 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Control Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white hover:text-zinc-300 font-medium cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-xs sm:text-sm font-bold tracking-wider font-mono uppercase">
              {isTrailerMode ? 'Exit Trailer' : 'Exit Stream'}
            </span>
          </button>

          <div className="text-center font-sans">
            <h1 className="text-xs sm:text-base font-black text-white tracking-wide">
              {movie.title}
            </h1>
            <p className="text-[9px] sm:text-[10px] text-red-500 font-mono font-bold tracking-widest uppercase">
              {isTrailerMode ? 'FREE TRAILER MODE (15s PREVIEW)' : 'ULTRA-HD STREAMING ACTIVE'}
            </p>
          </div>

          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm shadow-inner">
            {profile.avatar}
          </div>
        </div>

        {/* Center Big Play Trigger & Playback status */}
        <div className="flex items-center justify-center">
          {!isPlaying && !trailerLimitReached && (
            <button
              onClick={handlePlayPause}
              className="p-5 sm:p-6 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full text-white cursor-pointer hover:scale-105 transition-all border border-white/20 shadow-2xl"
            >
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current text-white" />
            </button>
          )}
        </div>

        {/* Bottom Timeline & Sound Controls */}
        <div className="space-y-4">
          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono text-zinc-300">
            <span>{formatTime(currentTime)}</span>
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
              <div
                className="h-full bg-red-600 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                {!isTrailerMode && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
                )}
              </div>
            </div>
            <span>{formatTime(duration - currentTime)}</span>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between text-white flex-wrap gap-4">
            {/* Play controls */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Skip back */}
              <button
                onClick={() => handleSkip(-10)}
                disabled={isTrailerMode}
                className="hover:text-zinc-300 disabled:opacity-40 cursor-pointer"
                title="Backward 10s"
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Play / Pause Toggle */}
              <button
                onClick={handlePlayPause}
                className="hover:text-zinc-300 cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                )}
              </button>

              {/* Skip forward */}
              <button
                onClick={() => handleSkip(10)}
                disabled={isTrailerMode}
                className="hover:text-zinc-300 disabled:opacity-40 cursor-pointer"
                title="Forward 10s"
              >
                <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Volume / Mute slider */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={handleToggleMute}
                  className="hover:text-zinc-300 cursor-pointer"
                  title="Mute"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
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

            {/* Quick settings selector bar */}
            <div className="flex items-center gap-4 relative">
              {/* Playback Configuration Panel Toggle */}
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="hover:text-zinc-300 flex items-center gap-1.5 cursor-pointer text-xs font-mono font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-400"
                title="Media Customization Settings"
              >
                <Settings className="w-4 h-4 animate-spin-slow" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              {/* Custom Settings Context Box */}
              {showSettingsMenu && (
                <div className="absolute right-0 bottom-12 w-64 bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-2xl space-y-4 text-xs text-zinc-300 z-50">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="font-bold text-white uppercase tracking-wider font-mono">Custom Player Configuration</span>
                    <button onClick={() => setShowSettingsMenu(false)} className="text-zinc-500 hover:text-white font-black">✕</button>
                  </div>

                  {/* Playback speed options */}
                  <div className="space-y-1.5">
                    <span className="text-zinc-500 font-bold uppercase flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> Speed:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          onClick={() => changeSpeed(speed)}
                          className={`px-2 py-1 rounded cursor-pointer ${
                            playbackSpeed === speed ? 'bg-red-600 text-white font-bold' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtitle custom styles */}
                  <div className="space-y-1.5 border-t border-zinc-900 pt-2.5">
                    <span className="text-zinc-500 font-bold uppercase flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Subtitles Language:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {['off', 'en', 'es', 'fr'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => setSubtitleSettings({ ...subtitleSettings, language: lang as any })}
                          className={`px-1 py-1 rounded cursor-pointer capitalize ${
                            subtitleSettings.language === lang ? 'bg-red-600 text-white font-bold' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtitle custom appearance tools */}
                  {subtitleSettings.language !== 'off' && (
                    <div className="space-y-2 border-t border-zinc-900 pt-2 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 uppercase font-semibold">Text Size:</span>
                        <div className="flex gap-1">
                          {['small', 'medium', 'large'].map(sz => (
                            <button
                              key={sz}
                              onClick={() => setSubtitleSettings({ ...subtitleSettings, size: sz as any })}
                              className={`px-1.5 py-0.5 rounded capitalize ${
                                subtitleSettings.size === sz ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                              }`}
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
                              className={`px-1.5 py-0.5 rounded capitalize ${
                                subtitleSettings.color === col ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                              }`}
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
                              className={`px-1.5 py-0.5 rounded capitalize ${
                                subtitleSettings.opacity === op ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {op}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quality Selector */}
                  <div className="space-y-1.5 border-t border-zinc-900 pt-2.5">
                    <span className="text-zinc-500 font-bold uppercase flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Resolution:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {['Auto', '4K', '1080p', '720p'].map(res => (
                        <button
                          key={res}
                          onClick={() => setQuality(res as any)}
                          className={`px-1 py-1 rounded cursor-pointer ${
                            quality === res ? 'bg-red-600 text-white font-bold' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hardware acceleration setting toggle */}
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-2.5">
                    <span className="text-zinc-500 font-bold uppercase flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> GPU Acceleration:</span>
                    <button
                      onClick={() => setHardwareAcc(!hardwareAcc)}
                      className={`px-2 py-1 rounded cursor-pointer ${
                        hardwareAcc ? 'bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      {hardwareAcc ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleToggleFullscreen}
                className="hover:text-zinc-300 cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
