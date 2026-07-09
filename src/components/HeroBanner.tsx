import React, { useState, useEffect, useRef } from 'react';
import { Movie, UserProfile } from '../types';
import { Play, Plus, Check, Info, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

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
      <div className="relative h-[55vh] md:h-[80vh] w-full overflow-hidden bg-zinc-950 flex flex-col justify-end pb-12 px-4 md:px-12 border-b border-zinc-900/10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-zinc-900/10 to-transparent" />
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
    <div className="relative h-[55vh] md:h-[80vh] w-full overflow-hidden select-none bg-black">
      {/* Background: poster shows first, video crossfades in once it can actually play */}
      <div className="absolute inset-0">
        {/* Poster image, always present as a fallback / while video buffers */}
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className={`absolute inset-0 w-full h-full object-cover brightness-[0.7] transition-opacity duration-700 ${
            videoReady ? 'opacity-0' : 'opacity-100'
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
            className={`absolute inset-0 w-full h-full object-cover brightness-[0.7] scale-102 transition-opacity duration-700 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/30 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent opacity-90" />
      </div>

      {/* Main Content Info Container */}
      <div className="absolute bottom-10 md:bottom-24 left-4 md:left-12 max-w-xl md:max-w-2xl z-20 space-y-3 md:space-y-6">
        {movie.isTrending && (
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider text-white shadow-md">
              N SERIES
            </span>
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              🔥 #{movie.trendingRank} in Movies Today
            </span>
          </div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md font-sans"
        >
          {movie.title}
        </motion.h1>

        <p className="text-xs md:text-sm text-zinc-200 line-clamp-3 leading-relaxed drop-shadow-sm font-light max-w-lg">
          {movie.synopsis}
        </p>

        <div className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
          <span className="text-emerald-400 font-bold">{Math.round(movie.rating * 20)}% Match</span>
          <span>{movie.releaseYear}</span>
          <span className="border border-zinc-500/80 px-1.5 py-0.1 text-[10px] rounded-xs font-semibold">{movie.ageRating}</span>
          <span>{movie.duration}</span>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3.5 pt-2">
          <button
            onClick={() => onPlay(movie)}
            className="flex items-center justify-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-white text-black hover:bg-zinc-200 font-semibold text-xs md:text-sm rounded-md transition-all shadow-md cursor-pointer"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            <span>Play</span>
          </button>

              <button
            onClick={handleToggleList}
            className={`flex items-center justify-center gap-2 px-5 md:px-6 py-2 md:py-3 border ${
              inList
                ? 'bg-zinc-800/40 border-emerald-500 text-emerald-400'
                : 'bg-[#141414]/50 border-zinc-600 text-white hover:border-white'
            } font-semibold text-xs md:text-sm rounded-md transition-all shadow-md cursor-pointer`}
          >
            {inList ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Plus className="w-4 h-4 md:w-5 md:h-5" />}
            <span>{inList ? 'In My List' : 'My List'}</span>
          </button>

          <button
            onClick={() => onOpenDetails(movie)}
            className="flex items-center justify-center gap-2 px-5 md:px-6 py-2 md:py-3 bg-zinc-500/30 hover:bg-zinc-500/50 border border-transparent hover:border-zinc-400/30 text-white font-semibold text-xs md:text-sm rounded-md transition-all shadow-md cursor-pointer"
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
            <span>More Info</span>
          </button>
        </div>
      </div>

      {/* Right Side Info & Audio Tag */}
      <div className="absolute right-0 bottom-16 md:bottom-28 z-20 flex items-center gap-3 pr-4 md:pr-12">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 bg-zinc-900/60 hover:bg-zinc-800/80 rounded-full border border-zinc-700/50 text-white cursor-pointer transition-colors"
          title={isMuted ? "Unmute Ambient Stream" : "Mute Ambient Stream"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="border-l-4 border-zinc-400 bg-zinc-900/50 text-zinc-300 px-3.5 py-1 text-xs md:text-sm font-medium pr-12">
          {movie.ageRating}
        </div>
      </div>
    </div>
  );
}