import React, { useState, useEffect } from 'react';
import { Movie, UserProfile } from '../types';
import { Play, Plus, Check, Info, Volume2, VolumeX } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { motion } from 'motion/react';

interface HeroBannerProps {
  movie: Movie;
  profile: UserProfile;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onAuthRequired?: () => void;
}

export default function HeroBanner({ movie, profile, onPlay, onOpenDetails, onAuthRequired }: HeroBannerProps) {
  const [inList, setInList] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [loadingList, setLoadingList] = useState(true);

  // Synchronise watchlist from Firestore
  useEffect(() => {
    if (profile.id === 'guest') {
      setInList(false);
      setLoadingList(false);
      return;
    }
    const q = query(
      collection(db, 'watchlist'),
      where('profileId', '==', profile.id),
      where('movieId', '==', movie.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInList(!snapshot.empty);
      setLoadingList(false);
    });

    return () => unsubscribe();
  }, [profile.id, movie.id]);

  const handleToggleList = async () => {
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
        // Add to watchlist
        await addDoc(collection(db, 'watchlist'), {
          profileId: profile.id,
          movieId: movie.id,
          addedAt: Date.now()
        });
      } else {
        // Remove from watchlist
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  return (
    <div className="relative h-[55vh] md:h-[80vh] w-full overflow-hidden select-none bg-black">
      {/* Background Backdrop Image with Rich Shadow Vignettes */}
      <div className="absolute inset-0">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover brightness-[0.7] scale-102 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        {/* Shadow overlays for true cinematic blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/30 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent opacity-90" />
      </div>

      {/* Main Content Info Container */}
      <div className="absolute bottom-10 md:bottom-24 left-4 md:left-12 max-w-xl md:max-w-2xl z-20 space-y-3 md:space-y-6">
        
        {/* Accent Tag */}
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

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md font-sans"
        >
          {movie.title}
        </motion.h1>

        {/* Synopsis */}
        <p className="text-xs md:text-sm text-zinc-200 line-clamp-3 leading-relaxed drop-shadow-sm font-light max-w-lg">
          {movie.synopsis}
        </p>

        {/* Meta Info Row */}
        <div className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
          <span className="text-emerald-400 font-bold">{Math.round(movie.rating * 20)}% Match</span>
          <span>{movie.releaseYear}</span>
          <span className="border border-zinc-500/80 px-1.5 py-0.1 text-[10px] rounded-xs font-semibold">{movie.ageRating}</span>
          <span>{movie.duration}</span>
        </div>

        {/* Controls: Play, List, Info */}
        <div className="flex flex-wrap gap-2 md:gap-3.5 pt-2">
          {/* Play Button */}
          <button
            onClick={() => onPlay(movie)}
            className="flex items-center justify-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-white text-black hover:bg-zinc-200 font-semibold text-xs md:text-sm rounded-md transition-all shadow-md cursor-pointer"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            <span>Play</span>
          </button>

          {/* My List Button */}
          <button
            onClick={handleToggleList}
            className={`flex items-center justify-center gap-2 px-5 md:px-6 py-2 md:py-3 border ${
              inList 
                ? 'bg-zinc-800/40 border-emerald-500 text-emerald-400' 
                : 'bg-[#141414]/50 border-zinc-600 text-white hover:border-white'
            } font-semibold text-xs md:text-sm rounded-md transition-all shadow-md cursor-pointer`}
          >
            {inList ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Plus className="w-4 h-4 md:w-5 md:h-5" />}
            <span>My List</span>
          </button>

          {/* More Info */}
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
        {/* Simulated Mute/Audio toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 bg-zinc-900/60 hover:bg-zinc-800/80 rounded-full border border-zinc-700/50 text-white cursor-pointer transition-colors"
          title={isMuted ? "Unmute Ambient Stream" : "Mute Ambient Stream"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Ambient rating flag */}
        <div className="border-l-4 border-zinc-400 bg-zinc-900/50 text-zinc-300 px-3.5 py-1 text-xs md:text-sm font-medium pr-12">
          {movie.ageRating}
        </div>
      </div>
    </div>
  );
}
