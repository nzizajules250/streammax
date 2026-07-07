import React, { useState, useEffect } from 'react';
import { Movie, UserProfile } from '../types';
import { Play, Plus, Check, Info, ThumbsUp, Heart, X } from 'lucide-react';
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetails(movie)}
      layoutId={`card-container-${movie.id}`}
      className="relative flex-none w-36 sm:w-48 h-56 sm:h-72 rounded-lg overflow-hidden cursor-pointer bg-zinc-900 select-none group border border-zinc-800/40"
    >
      {/* Movie Poster Image */}
      <img
        src={movie.posterUrl}
        alt={movie.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />

      {/* Hover action overlay & Quick details */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 space-y-2">
        {/* Title */}
        <h3 className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-2">
          {movie.title}
        </h3>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pt-1">
          {/* Quick Play */}
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(movie); }}
            className="p-1.5 sm:p-2 bg-white text-black hover:bg-zinc-200 rounded-full cursor-pointer transition-transform duration-150 active:scale-95 shadow-sm"
            title="Play movie"
          >
            <Play className="w-3.5 h-3.5 fill-current text-black" />
          </button>

          {/* Quick List add/remove */}
          <button
            onClick={handleToggleList}
            className={`p-1.5 sm:p-2 border border-zinc-500 hover:border-white hover:bg-zinc-800/50 rounded-full text-zinc-300 hover:text-white transition-colors cursor-pointer`}
            title={inList ? 'Remove from List' : 'Add to My List'}
          >
            {inList ? <Check className="w-3.5 h-3.5 text-red-500" /> : <Plus className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Like */}
          <button
            onClick={handleToggleLike}
            className={`p-1.5 sm:p-2 border border-zinc-500 hover:border-white hover:bg-zinc-800/50 rounded-full transition-colors cursor-pointer ${
              isLiked ? 'text-red-500 border-red-500' : 'text-zinc-300 hover:text-white'
            }`}
            title="Like this movie"
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {/* More details info icon */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetails(movie); }}
            className="ml-auto p-1.5 sm:p-2 bg-zinc-850/60 text-zinc-300 hover:text-white rounded-full transition-colors cursor-pointer"
            title="More Info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Movie Meta Information */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-zinc-400 font-semibold pt-1">
          <span className="text-emerald-500">{Math.round(movie.rating * 20)}% Match</span>
          <span>{movie.releaseYear}</span>
          <span className="border border-zinc-700 px-1 rounded-xs text-[9px] text-zinc-300 font-mono">
            {movie.rating}
          </span>
        </div>

        {/* Categories preview */}
        <div className="flex flex-wrap gap-1 text-[8px] sm:text-[10px] text-zinc-500 font-medium">
          {movie.genres.slice(0, 2).map((g, index) => (
            <span key={index} className="after:content-['•'] after:ml-1 last:after:content-none">
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Watch Progress slider indicator */}
      {watchProgress !== null && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-800 z-10">
          <div 
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${watchProgress}%` }}
          />
        </div>
      )}

      {/* Watchlist Removal Confirmation Dialog */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-3 text-center space-y-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Remove from My List?</span>
            <span className="text-[11px] text-white font-medium line-clamp-1">{movie.title}</span>
            <div className="flex gap-2 w-full pt-1">
              <button
                onClick={confirmRemoveList}
                className="flex-1 bg-red-600 text-white font-bold text-[9px] py-1 rounded cursor-pointer hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowRemoveConfirm(false); }}
                className="flex-1 bg-zinc-800 text-zinc-300 font-bold text-[9px] py-1 rounded cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                Keep
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
