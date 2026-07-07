import React, { useState, useEffect } from 'react';
import { Movie, UserProfile } from '../types';
import { Play, Plus, Check, Info, ThumbsUp, Heart } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
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

  // Sync Watchlist state for this specific movie & profile
  useEffect(() => {
    if (profile.id === 'guest') {
      setInList(false);
      return;
    }
    const q = query(
      collection(db, 'watchlist'),
      where('profileId', '==', profile.id),
      where('movieId', '==', movie.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInList(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [profile.id, movie.id]);

  // Sync Watch progress for this specific movie & profile
  useEffect(() => {
    if (profile.id === 'guest') {
      setWatchProgress(null);
      return;
    }
    const q = query(
      collection(db, 'progress'),
      where('profileId', '==', profile.id),
      where('movieId', '==', movie.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const progDoc = snapshot.docs[0].data();
        const p = progDoc.progress || 0;
        // Movies started but not finished (e.g., between 1% and 95%)
        if (p > 0 && p < 95) {
          setWatchProgress(p);
        } else {
          setWatchProgress(null);
        }
      } else {
        // Fallback to older 'history' collection if 'progress' is not found yet
        const qHist = query(
          collection(db, 'history'),
          where('profileId', '==', profile.id),
          where('movieId', '==', movie.id)
        );
        getDocs(qHist).then((snapHist) => {
          if (!snapHist.empty) {
            const histDoc = snapHist.docs[0].data();
            const p = histDoc.progress || 0;
            if (p > 0 && p < 95) {
              setWatchProgress(p);
            } else {
              setWatchProgress(null);
            }
          } else {
            setWatchProgress(null);
          }
        }).catch(() => {
          setWatchProgress(null);
        });
      }
    });

    return () => unsubscribe();
  }, [profile.id, movie.id]);

  // Sync User Rating/Like state
  useEffect(() => {
    if (profile.id === 'guest') {
      setIsLiked(false);
      return;
    }
    const q = query(
      collection(db, 'ratings'),
      where('profileId', '==', profile.id),
      where('movieId', '==', movie.id),
      where('value', '==', 'like')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsLiked(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [profile.id, movie.id]);

  const confirmRemoveList = async () => {
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    try {
      const q = query(
        collection(db, 'watchlist'),
        where('profileId', '==', profile.id),
        where('movieId', '==', movie.id)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  const handleToggleList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    try {
      const q = query(
        collection(db, 'watchlist'),
        where('profileId', '==', profile.id),
        where('movieId', '==', movie.id)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(collection(db, 'watchlist'), {
          profileId: profile.id,
          movieId: movie.id,
          addedAt: Date.now()
        });
      } else {
        setShowRemoveConfirm(true);
      }
    } catch (err) {
      console.error('Error toggling list:', err);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    try {
      const q = query(
        collection(db, 'ratings'),
        where('profileId', '==', profile.id),
        where('movieId', '==', movie.id)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Add like
        await addDoc(collection(db, 'ratings'), {
          profileId: profile.id,
          movieId: movie.id,
          value: 'like'
        });
      } else {
        // Remove rating
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
    } catch (err) {
      console.error('Error toggling rating:', err);
    }
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
            <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
          </button>

          {/* Quick Add List */}
          <button
            onClick={handleToggleList}
            className={`p-1.5 sm:p-2 border rounded-full cursor-pointer transition-colors ${
              inList 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                : 'bg-zinc-900/80 border-zinc-600 hover:border-white text-zinc-300 hover:text-white'
            }`}
            title={inList ? "Remove from List" : "Add to List"}
          >
            {inList ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          </button>

          {/* Quick Like */}
          <button
            onClick={handleToggleLike}
            className={`p-1.5 sm:p-2 border rounded-full cursor-pointer transition-colors ${
              isLiked 
                ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                : 'bg-zinc-900/80 border-zinc-600 hover:border-white text-zinc-300 hover:text-white'
            }`}
            title="Like"
          >
            <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {/* Expand Info */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetails(movie); }}
            className="p-1.5 sm:p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-600 hover:border-white rounded-full text-zinc-300 hover:text-white cursor-pointer ml-auto"
            title="More details"
          >
            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Tiny metadata footer */}
        <div className="flex items-center justify-between text-[10px] text-zinc-300 pt-1 font-medium border-t border-zinc-800/60">
          <span className="text-emerald-400 font-semibold">{Math.round(movie.rating * 20)}% match</span>
          <span>{movie.ageRating}</span>
          <span>{movie.releaseYear}</span>
        </div>
      </div>

      {/* Top badges for specific categories */}
      {movie.isTrending && (
        <div className="absolute top-2 left-2 bg-red-600 text-[8px] sm:text-[9px] font-bold text-white px-1.5 py-0.5 rounded-xs uppercase tracking-wider shadow-md">
          Trending
        </div>
      )}

      {/* Progress bar for started movies */}
      {watchProgress !== null && (
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-zinc-800 z-10 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-red-600 transition-all duration-300" 
            style={{ width: `${watchProgress}%` }}
          />
        </div>
      )}

      {/* Watchlist Removal Confirmation Overlay */}
      {showRemoveConfirm && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-4 text-center select-none"
        >
          <p className="text-xs font-bold text-zinc-100 mb-4 px-1 leading-normal">
            Remove "{movie.title}" from My List?
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await confirmRemoveList();
                setShowRemoveConfirm(false);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all cursor-pointer"
            >
              Remove
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRemoveConfirm(false);
              }}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-bold py-2 px-3 rounded-lg text-xs transition-all cursor-pointer border border-zinc-700/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
