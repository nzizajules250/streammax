import React, { useState, useEffect } from 'react';
import { Movie, UserProfile } from '../types';
import { Play, Plus, Check, Info, ThumbsUp, Heart, X, Star, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MovieCardProps {
  key?: React.Key;
  movie: Movie;
  profile: UserProfile;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onAuthRequired?: () => void;
}

export default function MovieCard({ movie, profile, onPlay, onOpenDetails, onAuthRequired }: MovieCardProps) {
  const [inList, setInList] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [watchProgress, setWatchProgress] = useState<number | null>(null);

  // Sync Watchlist state
  useEffect(() => {
    if (profile.id === 'guest') {
      setInList(false);
      return;
    }
    const syncWatchlist = () => {
      const key = `watchlist_${profile.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const list = JSON.parse(saved) as string[];
        setInList(list.includes(movie.id));
      } else {
        setInList(false);
      }
    };
    syncWatchlist();
    const interval = setInterval(syncWatchlist, 1000);
    return () => clearInterval(interval);
  }, [profile.id, movie.id]);

  // Sync Watch progress
  useEffect(() => {
    if (profile.id === 'guest') {
      setWatchProgress(null);
      return;
    }
    const syncProgress = () => {
      const key = `progress_${profile.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const progressList = JSON.parse(saved) as { movieId: string; progress: number }[];
        const matched = progressList.find(item => item.movieId === movie.id);
        if (matched && matched.progress > 0 && matched.progress < 95) {
          setWatchProgress(matched.progress);
        } else {
          setWatchProgress(null);
        }
      } else {
        setWatchProgress(null);
      }
    };
    syncProgress();
    const interval = setInterval(syncProgress, 1000);
    return () => clearInterval(interval);
  }, [profile.id, movie.id]);

  // Sync User Rating/Like state
  useEffect(() => {
    if (profile.id === 'guest') {
      setIsLiked(false);
      return;
    }
    const syncLiked = () => {
      const key = `ratings_${profile.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const list = JSON.parse(saved) as string[];
        setIsLiked(list.includes(movie.id));
      } else {
        setIsLiked(false);
      }
    };
    syncLiked();
    const interval = setInterval(syncLiked, 1000);
    return () => clearInterval(interval);
  }, [profile.id, movie.id]);

  const confirmRemoveList = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    const key = `watchlist_${profile.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const list = JSON.parse(saved) as string[];
      const updated = list.filter(id => id !== movie.id);
      localStorage.setItem(key, JSON.stringify(updated));
      setInList(false);
    }
    setShowRemoveConfirm(false);
  };

  const handleToggleList = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    const key = `watchlist_${profile.id}`;
    const saved = localStorage.getItem(key);
    const list = saved ? (JSON.parse(saved) as string[]) : [];

    if (!list.includes(movie.id)) {
      list.push(movie.id);
      localStorage.setItem(key, JSON.stringify(list));
      setInList(true);
    } else {
      setShowRemoveConfirm(true);
    }
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    const key = `ratings_${profile.id}`;
    const saved = localStorage.getItem(key);
    let list = saved ? (JSON.parse(saved) as string[]) : [];

    if (!list.includes(movie.id)) {
      list.push(movie.id);
      setIsLiked(true);
    } else {
      list = list.filter(id => id !== movie.id);
      setIsLiked(false);
    }
    localStorage.setItem(key, JSON.stringify(list));
  };

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetails(movie)}
      className="relative flex-none w-36 sm:w-48 h-56 sm:h-72 rounded-xl overflow-hidden cursor-pointer select-none group shadow-lg hover:shadow-2xl transition-shadow duration-300"
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Card Border Gradient */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-600/20 via-zinc-800/30 to-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Card Content Container */}
      <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-zinc-800/50 group-hover:border-red-800/50 transition-all duration-300">
        {/* Movie Poster Image */}
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Top Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          {movie.isTrending && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-lg shadow-red-900/30 flex items-center gap-1"
            >
              <TrendingUp className="w-3 h-3" />
              TRENDING
            </motion.div>
          )}
          {movie.isPopular && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-lg shadow-amber-900/20 flex items-center gap-1"
            >
              <Star className="w-3 h-3 fill-current" />
              POPULAR
            </motion.div>
          )}
        </div>

        {/* Hover Action Overlay */}
        <motion.div
          initial={false}
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 10,
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex flex-col justify-end p-3 space-y-2"
        >
          {/* Title */}
          <h3 className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
            {movie.title}
          </h3>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 pt-1">
            {/* Play Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onPlay(movie); }}
              className="p-1.5 sm:p-2 bg-white text-black hover:bg-zinc-200 rounded-full shadow-lg hover:shadow-white/20 transition-all duration-300"
              title="Play movie"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </motion.button>

            {/* Watchlist Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleList}
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 backdrop-blur-sm ${
                inList 
                  ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-900/30 border-2 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-900/20' 
                  : 'bg-zinc-900/60 border-2 border-zinc-600/50 text-zinc-300 hover:border-red-500/50 hover:bg-red-950/30'
              }`}
              title={inList ? 'Remove from List' : 'Add to My List'}
            >
              {inList ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
            </motion.button>

            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleLike}
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 backdrop-blur-sm ${
                isLiked 
                  ? 'bg-gradient-to-r from-rose-600/30 to-rose-900/30 border-2 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-900/20' 
                  : 'bg-zinc-900/60 border-2 border-zinc-600/50 text-zinc-300 hover:border-red-500/50 hover:bg-red-950/30'
              }`}
              title="Like this movie"
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Info Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onOpenDetails(movie); }}
              className="ml-auto p-1.5 sm:p-2 bg-zinc-900/60 backdrop-blur-sm border-2 border-zinc-600/50 text-zinc-300 hover:text-white hover:border-red-500/50 hover:bg-red-950/30 rounded-full transition-all duration-300"
              title="More Info"
            >
              <Info className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Movie Meta Information */}
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold pt-1">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <span className="text-[8px] font-bold text-white">{Math.round(movie.rating * 20)}%</span>
              </div>
              <span className="text-emerald-400">Match</span>
            </div>
            <span className="text-zinc-400">{movie.releaseYear}</span>
            <span className="px-1.5 py-0.5 border border-zinc-600/50 rounded-md text-[9px] text-zinc-300 bg-zinc-900/50 backdrop-blur-sm">
              {movie.ageRating}
            </span>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1.5">
            {movie.genres.slice(0, 2).map((genre) => (
              <span 
                key={genre} 
                className="text-[9px] sm:text-[10px] text-zinc-400 font-medium bg-zinc-900/60 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-zinc-700/30"
              >
                {genre}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Watch Progress Bar */}
        <AnimatePresence>
          {watchProgress !== null && !isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 w-full z-10"
            >
              <div className="h-1.5 bg-zinc-800/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${watchProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-900/30 relative"
                >
                  <div className="absolute right-0 top-0 h-full w-1 bg-white/30 rounded-full"></div>
                </motion.div>
              </div>
              <div className="absolute -top-5 right-2 text-[9px] font-bold text-white bg-red-600/90 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                {Math.round(watchProgress)}%
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Remove Confirmation Overlay */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-br from-black/95 via-zinc-950/95 to-red-950/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-4 text-center space-y-3 rounded-xl border-2 border-red-900/30"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-red-400" />
            </motion.div>
            <div>
              <p className="text-xs font-bold text-white mb-1">Remove from List?</p>
              <p className="text-[11px] text-zinc-400 line-clamp-1">{movie.title}</p>
            </div>
            <div className="flex gap-2 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmRemoveList}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-lg shadow-red-900/20"
              >
                Remove
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); setShowRemoveConfirm(false); }}
                className="flex-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 font-bold text-xs py-2 rounded-lg transition-all border border-zinc-700/50 backdrop-blur-sm"
              >
                Keep
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}