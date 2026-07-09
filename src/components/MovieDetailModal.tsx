import React, { useState, useEffect } from 'react';
import { Movie, UserProfile, ReviewDoc } from '../types';
import { MOVIES } from '../data/movies';
import { Play, Plus, Check, Heart, X, Send, Trash2, Star, Calendar, Clock, Smile, Share2, Download, TrendingUp, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ShareModal from './ShareModal';

interface MovieDetailModalProps {
  movie: Movie;
  profile: UserProfile;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onAuthRequired?: () => void;
}

const DEFAULT_CRITIQUES: Record<string, string[]> = {
  default: [
    "Absolutely breathtaking cinematography! This is a modern masterpiece.",
    "The character development kept me on the edge of my seat. Highly recommend!",
    "Decent watch, but the pacing felt a bit rushed towards the final act.",
  ]
};

export default function MovieDetailModal({ movie, profile, onClose, onPlay, onAuthRequired }: MovieDetailModalProps) {
  const [inList, setInList] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);

  // Sync download status
  useEffect(() => {
    if (profile.id === 'guest') {
      setIsDownloaded(false);
      return;
    }
    const downloadedList = JSON.parse(localStorage.getItem(`downloads_${profile.id}`) || '[]');
    setIsDownloaded(downloadedList.includes(movie.id));
  }, [profile.id, movie.id]);

  const handleToggleDownload = () => {
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    const key = `downloads_${profile.id}`;
    const downloadedList = JSON.parse(localStorage.getItem(key) || '[]');
    if (downloadedList.includes(movie.id)) {
      const filtered = downloadedList.filter((id: string) => id !== movie.id);
      localStorage.setItem(key, JSON.stringify(filtered));
      setIsDownloaded(false);
    } else {
      downloadedList.push(movie.id);
      localStorage.setItem(key, JSON.stringify(downloadedList));
      setIsDownloaded(true);
    }
  };

  // Sync Watchlist status
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

  // Sync Ratings like status
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

  // Sync Star Rating status
  useEffect(() => {
    if (profile.id === 'guest') {
      setUserRating(0);
      return;
    }
    const syncStarRating = () => {
      const key = `star_ratings_${profile.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const ratingsMap = JSON.parse(saved) as Record<string, number>;
        setUserRating(ratingsMap[movie.id] || 0);
      } else {
        setUserRating(0);
      }
    };
    syncStarRating();
    const interval = setInterval(syncStarRating, 1000);
    return () => clearInterval(interval);
  }, [profile.id, movie.id]);

  // Sync Reviews thread
  useEffect(() => {
    const syncReviews = () => {
      const key = `reviews_${movie.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setReviews(JSON.parse(saved) as ReviewDoc[]);
      } else {
        const seeded: ReviewDoc[] = (DEFAULT_CRITIQUES[movie.id] || DEFAULT_CRITIQUES.default).map((c, idx) => ({
          id: `seed_${idx}`,
          profileId: `seed_user_${idx}`,
          profileName: ["Nolan Fanatic", "Jules Codeur", "Cinema Geek"][idx % 3],
          profileAvatar: ["🎬", "🍿", "⭐️"][idx % 3],
          movieId: movie.id,
          content: c,
          timestamp: Date.now() - (idx * 3600000 * 4)
        }));
        localStorage.setItem(key, JSON.stringify(seeded));
        setReviews(seeded);
      }
    };
    syncReviews();
    const interval = setInterval(syncReviews, 2000);
    return () => clearInterval(interval);
  }, [movie.id]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    if (!commentInput.trim() || submittingReview) return;
    setSubmittingReview(true);

    try {
      const key = `reviews_${movie.id}`;
      const saved = localStorage.getItem(key);
      const currentReviews = saved ? (JSON.parse(saved) as ReviewDoc[]) : [];

      const newReview: ReviewDoc = {
        id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        profileId: profile.id,
        profileName: profile.name,
        profileAvatar: profile.avatar,
        movieId: movie.id,
        content: commentInput.trim(),
        timestamp: Date.now()
      };

      const updated = [newReview, ...currentReviews];
      localStorage.setItem(key, JSON.stringify(updated));
      setReviews(updated);
      setCommentInput('');
    } catch (err) {
      console.error('Error saving review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    if (!window.confirm("Are you sure you want to delete your comment?")) return;
    try {
      const key = `reviews_${movie.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const currentReviews = JSON.parse(saved) as ReviewDoc[];
        const updated = currentReviews.filter(r => r.id !== reviewId);
        localStorage.setItem(key, JSON.stringify(updated));
        setReviews(updated);
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const confirmRemoveList = () => {
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

  const handleToggleList = () => {
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

  const handleToggleLike = () => {
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

  const handleSaveRating = (ratingVal: number) => {
    if (profile.id === 'guest') {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    try {
      const key = `star_ratings_${profile.id}`;
      const saved = localStorage.getItem(key);
      const ratingsMap = saved ? JSON.parse(saved) : {};
      ratingsMap[movie.id] = ratingVal;
      localStorage.setItem(key, JSON.stringify(ratingsMap));
      setUserRating(ratingVal);
    } catch (err) {
      console.error('Error saving rating:', err);
    }
  };

  const recommendations = MOVIES.filter(m => m.id !== movie.id && m.genres.some(g => movie.genres.includes(g))).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-black/95 via-zinc-950/95 to-red-950/95 backdrop-blur-md overflow-y-auto select-none">
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative bg-gradient-to-b from-zinc-900 via-black to-red-950/30 text-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl z-20 border border-red-900/20 max-h-[90vh] flex flex-col backdrop-blur-xl"
      >
        {/* Header Hero Backdrop section */}
        <div className="relative h-[25vh] md:h-[45vh] w-full flex-none">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover brightness-[0.7]"
            referrerPolicy="no-referrer"
          />
          
          {/* Enhanced gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent" />

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-red-950/50 rounded-full text-white transition-all duration-300 border border-zinc-700/50 hover:border-red-500/50 backdrop-blur-sm shadow-lg"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Title & Floating controls */}
          <div className="absolute bottom-4 left-4 md:left-10 z-10 space-y-3 md:space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg"
            >
              <span className="bg-gradient-to-r from-white via-zinc-200 to-red-200 bg-clip-text text-transparent">
                {movie.title}
              </span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 md:gap-3.5 flex-wrap"
            >
              {/* Play Button */}
              <button
                onClick={() => onPlay(movie)}
                className="group relative overflow-hidden flex items-center gap-2 px-6 md:px-8 py-2.5 bg-white text-black font-bold text-sm md:text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-white/20 transform hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current transition-transform duration-300 group-hover:scale-110" />
                <span>Play</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              {/* Watchlist Button */}
              <button
                onClick={handleToggleList}
                className={`group p-2.5 border-2 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 backdrop-blur-sm ${
                  inList 
                    ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-900/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-900/20' 
                    : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-300 hover:border-red-500/50 hover:bg-red-950/30'
                }`}
                title="Add to Watchlist"
              >
                {inList ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <Plus className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:rotate-90" />
                )}
              </button>

              {/* Favorite Button */}
              <button
                onClick={handleToggleLike}
                className={`group p-2.5 border-2 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 backdrop-blur-sm ${
                  isLiked 
                    ? 'bg-gradient-to-r from-rose-600/20 to-rose-900/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-900/20' 
                    : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-300 hover:border-red-500/50 hover:bg-red-950/30'
                }`}
                title="Favorite"
              >
                <Heart className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              {/* Download Button */}
              <button
                onClick={handleToggleDownload}
                className={`group p-2.5 border-2 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 backdrop-blur-sm ${
                  isDownloaded 
                    ? 'bg-gradient-to-r from-cyan-600/20 to-cyan-900/20 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-900/20' 
                    : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-300 hover:border-red-500/50 hover:bg-red-950/30'
                }`}
                title={isDownloaded ? 'Delete Downloaded Movie' : 'Download for Offline Mode'}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" />
              </button>

              {/* Share Button */}
              <button
                onClick={() => setIsSharing(true)}
                className="group p-2.5 bg-zinc-900/60 backdrop-blur-sm border-2 border-zinc-700/50 text-zinc-300 hover:text-white hover:border-red-500/50 hover:bg-red-950/30 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
                title="Secure Share"
              >
                <Share2 className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          {/* Details split grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Col: Match & Synopsis */}
            <div className="md:col-span-2 space-y-5 text-sm">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 font-medium text-zinc-300 flex-wrap"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
                    <span className="text-xs font-bold text-white">{Math.round(movie.rating * 20)}%</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">Match</span>
                </div>
                <span className="text-zinc-600">|</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  {movie.releaseYear}
                </span>
                <span className="px-2 py-0.5 border border-zinc-600/50 rounded-lg text-xs font-semibold bg-zinc-900/50 backdrop-blur-sm">
                  {movie.ageRating}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  {movie.duration}
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-zinc-300 leading-relaxed font-light text-sm sm:text-base"
              >
                {movie.synopsis}
              </motion.p>
            </div>

            {/* Right Col: Cast & Genres */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-5 text-xs md:text-sm border-l border-zinc-800/50 pl-0 md:pl-6"
            >
              <div>
                <span className="text-zinc-400 font-semibold block mb-2 uppercase tracking-wider text-xs">Cast</span>
                <p className="text-zinc-300 leading-relaxed">{movie.cast.join(', ')}</p>
              </div>

              <div>
                <span className="text-zinc-400 font-semibold block mb-2 uppercase tracking-wider text-xs">Genres</span>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map(genre => (
                    <span key={genre} className="bg-gradient-to-r from-red-950/30 to-zinc-900/80 text-zinc-300 px-3 py-1 rounded-lg border border-red-900/20 text-xs font-medium backdrop-blur-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/30 space-y-4">
                <div>
                  <span className="text-zinc-400 font-semibold block mb-2 uppercase tracking-wider text-xs">Community Rating</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-amber-400 fill-current" />
                      <span className="text-amber-400 font-bold text-lg">{movie.rating}</span>
                    </div>
                    <span className="text-zinc-500 text-xs">/ 5.0</span>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 font-semibold block mb-2 uppercase tracking-wider text-xs">Your Rating</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSaveRating(star)}
                        className="p-0.5 transition-colors"
                        title={`Rate ${star} Stars`}
                      >
                        <Star 
                          className={`w-6 h-6 transition-all duration-200 ${
                            userRating >= star 
                              ? 'text-amber-400 fill-current drop-shadow-lg' 
                              : 'text-zinc-600 hover:text-amber-400'
                          }`} 
                        />
                      </motion.button>
                    ))}
                    {userRating > 0 && (
                      <span className="text-sm font-bold text-amber-400 ml-2">
                        {userRating}/5
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* More Like This */}
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4 pt-6 border-t border-zinc-800/30"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-400" />
                More Like This
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendations.map(m => (
                  <motion.div
                    key={m.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onClick={() => { onClose(); onPlay(m); }}
                    className="bg-gradient-to-br from-zinc-900/80 to-black/80 rounded-xl overflow-hidden border border-zinc-800/50 hover:border-red-800/30 cursor-pointer shadow-lg hover:shadow-red-900/10 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="relative h-36">
                      <img src={m.backdropUrl} alt={m.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm border border-zinc-700/50 px-2 py-1 text-xs font-semibold rounded-lg text-zinc-300 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {m.duration}
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm truncate max-w-[65%]">{m.title}</span>
                        <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {Math.round(m.rating * 20)}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-light">{m.synopsis}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Discussions & Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-5 pt-6 border-t border-zinc-800/30"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Smile className="w-5 h-5 text-red-400" />
                <span>Community Reviews</span>
              </h3>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-800/50">
                {reviews.length} reviews
              </span>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddReview} className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/20 to-zinc-800 flex items-center justify-center text-lg shadow-inner border border-zinc-700/50 flex-none backdrop-blur-sm">
                {profile.avatar}
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  required
                  placeholder={`Share your thoughts on "${movie.title}"...`}
                  className="w-full px-4 py-3 text-sm bg-zinc-950/80 border border-zinc-700/50 rounded-xl focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 placeholder-zinc-500 text-zinc-100 transition-all duration-300 backdrop-blur-sm pr-12"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={submittingReview || !commentInput.trim()}
                  className="absolute right-2 top-2.5 p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-40 rounded-lg transition-colors"
                  title="Post comment"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {reviews.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-zinc-800/50 rounded-xl text-zinc-500 text-sm">
                  <Smile className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                  No reviews yet. Be the first to share your thoughts!
                </div>
              ) : (
                reviews.map(rev => (
                  <motion.div
                    key={rev.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-r from-zinc-950/80 to-black/80 border border-zinc-800/50 p-4 rounded-xl flex gap-3 items-start justify-between backdrop-blur-sm hover:border-red-900/20 transition-all duration-300"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600/20 to-zinc-800 flex items-center justify-center text-base border border-zinc-700/30 flex-none">
                        {rev.profileAvatar}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-zinc-200 text-sm">{rev.profileName}</span>
                          <span className="text-xs text-zinc-500">
                            {new Date(rev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed font-light">
                          {rev.content}
                        </p>
                      </div>
                    </div>

                    {rev.profileId === profile.id && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition-colors flex-none"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isSharing && (
            <ShareModal
              movie={movie}
              activeProfile={profile}
              onClose={() => setIsSharing(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Remove Confirmation Modal */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-zinc-900 to-black border border-red-900/20 p-8 rounded-2xl max-w-sm w-full text-center space-y-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30 mx-auto flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Remove from My List?</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Are you sure you want to remove <span className="text-red-400 font-semibold">"{movie.title}"</span> from your collection?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmRemoveList}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-red-900/20"
                >
                  Yes, Remove
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 font-bold py-3 px-4 rounded-xl text-sm transition-all border border-zinc-700/50 backdrop-blur-sm"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(185, 28, 28, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(185, 28, 28, 0.5);
        }
      `}</style>
    </div>
  );
}