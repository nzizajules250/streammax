import React, { useState, useEffect, useRef } from 'react';
import { Movie, UserProfile } from '../types';
import { Play, Plus, Check, Info, Volume2, VolumeX, Star, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroBannerProps {
  movie?: Movie;
  profile?: UserProfile;
  onPlay?: (movie: Movie) => void;
  onOpenDetails?: (movie: Movie) => void;
  onAuthRequired?: () => void;
  onToggleList?: (movie: Movie) => void;
  inList?: boolean;
  isLoading?: boolean;
}

const getBackgroundVideoUrl = (movie?: Movie) => {
  if (!movie) return '';
  return movie.videoUrl || '';
};

export default function HeroBanner({ movie, profile, onPlay, onOpenDetails, onAuthRequired, onToggleList, inList = false, isLoading = false }: HeroBannerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoReady(false);
    const el = videoRef.current;
    const backgroundVideoUrl = getBackgroundVideoUrl(movie);
    if (!el || !backgroundVideoUrl) return;

    const tryPlay = () => {
      el.play().catch(() => {
        // Autoplay may be blocked; the user can still click play.
      });
    };

    tryPlay();
  }, [movie?.id, movie?.videoUrl]);

  const handleToggleList = () => {
    if (!movie) return;
    if (!profile || profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    if (onToggleList) {
      onToggleList(movie);
    }
  };

  if (isLoading || !movie) {
    return (
      <div className="relative h-[55vh] md:h-[80vh] w-full overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-red-950 flex flex-col justify-end pb-12 px-4 md:px-12 border-b border-red-900/10">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-900/10 to-transparent" />
        <div className="absolute inset-0 bg-zinc-900/25 animate-pulse" />
        <div className="relative z-10 max-w-xl space-y-4 animate-pulse">
          <div className="h-4 w-28 bg-zinc-800/80 rounded-md" />
          <div className="h-10 md:h-16 w-3/4 bg-zinc-800/80 rounded-lg" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-zinc-800/80 rounded" />
            <div className="h-4 w-16 bg-zinc-800/80 rounded" />
            <div className="h-4 w-10 bg-zinc-800/80 rounded" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full bg-zinc-800/80 rounded" />
            <div className="h-4 w-5/6 bg-zinc-800/80 rounded" />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <div className="h-12 w-28 bg-zinc-800 rounded-xl" />
            <div className="h-12 w-32 bg-zinc-800/60 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen min-h-[100vh] w-full overflow-hidden select-none bg-black">
      {/* Background with deep red gradient overlay */}
      <div className="absolute inset-0">
        {/* Poster image with red-tinted overlay */}
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className={`absolute inset-0 w-full h-full object-cover brightness-[0.6] transition-all duration-1000 ${
            videoReady ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
        />

        {getBackgroundVideoUrl(movie) && (
          <video
            ref={videoRef}
            key={movie.id}
            src={getBackgroundVideoUrl(movie)}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            onPlaying={() => setVideoReady(true)}
            className={`absolute inset-0 w-full h-full object-cover brightness-[0.6] scale-102 transition-all duration-1000 ${
              videoReady ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        )}

        {/* Enhanced gradient overlays with deep red tones */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-red-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-transparent to-transparent" />
        
        {/* Animated light streaks */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent animate-light-streak"></div>
          <div className="absolute top-2/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400/10 to-transparent animate-light-streak animation-delay-2000"></div>
        </div>
      </div>

      {/* Main Content Info Container */}
      <div className="absolute bottom-10 md:bottom-24 left-4 md:left-12 max-w-xl md:max-w-2xl z-20 space-y-4 md:space-y-6">
        {/* Trending Badge */}
        <AnimatePresence>
          {movie.isTrending && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 px-3 py-1.5 rounded-lg shadow-lg shadow-red-900/30">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-white">
                  Trending Now
                </span>
              </div>
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-400 fill-current" />
                #{movie.trendingRank} in Movies Today
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Movie Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-3xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg"
        >
          <span className="bg-gradient-to-r from-white via-zinc-200 to-red-200 bg-clip-text text-transparent">
            {movie.title}
          </span>
        </motion.h1>

        {/* Synopsis */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xs md:text-sm text-zinc-300 line-clamp-3 leading-relaxed drop-shadow-md font-light max-w-lg"
        >
          {movie.synopsis}
        </motion.p>

        {/* Movie Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex items-center gap-4 text-xs md:text-sm text-zinc-300 font-medium"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <span className="text-[10px] font-bold text-white">{Math.round(movie.rating * 20)}%</span>
            </div>
            <span className="text-emerald-400 font-semibold">Match</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span>{movie.releaseYear}</span>
          <span className="px-2 py-0.5 border border-zinc-600/50 rounded-md text-[11px] font-semibold bg-zinc-900/50 backdrop-blur-sm">
            {movie.ageRating}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            {movie.duration}
          </span>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="flex flex-wrap gap-3 md:gap-4 pt-2"
        >
          {/* Play Button */}
          <button
            onClick={() => onPlay(movie)}
            className="group relative overflow-hidden flex items-center justify-center gap-2 px-8 md:px-10 py-3 md:py-3.5 bg-white text-black font-bold text-sm md:text-base rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-white/20 transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 md:w-6 md:h-6 fill-current transition-transform duration-300 group-hover:scale-110" />
            <span>Play</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* My List Button */}
          <button
            onClick={handleToggleList}
            className={`group relative overflow-hidden flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-3.5 font-semibold text-sm md:text-base rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              inList
                ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-900/20 border-2 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-900/20'
                : 'bg-zinc-900/60 backdrop-blur-sm border-2 border-zinc-700/50 text-white hover:border-red-500/50 hover:bg-red-950/30'
            }`}
          >
            {inList ? (
              <Check className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <Plus className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:rotate-90" />
            )}
            <span>{inList ? 'In My List' : 'My List'}</span>
          </button>

          {/* More Info Button */}
          <button
            onClick={() => onOpenDetails(movie)}
            className="group relative overflow-hidden flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-3.5 bg-zinc-800/40 backdrop-blur-sm border-2 border-zinc-700/50 hover:border-red-500/50 text-white font-semibold text-sm md:text-base rounded-xl transition-all duration-300 hover:bg-red-950/20 shadow-lg hover:shadow-red-900/10 transform hover:scale-105 active:scale-95"
          >
            <Info className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:scale-110" />
            <span>More Info</span>
          </button>
        </motion.div>
      </div>

      {/* Right Side Controls */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="absolute right-0 bottom-16 md:bottom-28 z-20 flex items-center gap-3 pr-4 md:pr-12"
      >
        {/* Mute/Unmute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="group p-3 bg-zinc-900/60 backdrop-blur-sm hover:bg-red-950/40 rounded-full border-2 border-zinc-700/50 hover:border-red-500/50 text-white transition-all duration-300 shadow-lg hover:shadow-red-900/20 transform hover:scale-110 active:scale-95"
          title={isMuted ? "Unmute Ambient Stream" : "Mute Ambient Stream"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
          ) : (
            <Volume2 className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
          )}
        </button>

        {/* Age Rating Badge */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
          <div className="relative border-l-4 border-red-500 bg-zinc-900/80 backdrop-blur-sm text-zinc-200 px-4 py-1.5 text-xs md:text-sm font-bold rounded-r-lg shadow-lg">
            {movie.ageRating}
          </div>
        </div>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none"></div>

      <style jsx>{`
        @keyframes lightStreak {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-light-streak {
          animation: lightStreak 8s linear infinite;
        }
        .animation-delay-2000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}