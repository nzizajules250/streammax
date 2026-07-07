import React, { useState, useEffect } from 'react';
import { Movie, UserProfile, ReviewDoc } from '../types';
import { MOVIES } from '../data/movies';
import { Play, Plus, Check, Heart, X, Send, Trash2, Star, Calendar, Clock, Smile, Share2, Download } from 'lucide-react';
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
        // Prepopulate with elegant mock comments
        const seeded: ReviewDoc[] = (DEFAULT_CRITIQUES[movie.id] || DEFAULT_CRITIQUES.default).map((c, idx) => ({
          id: `seed_${idx}`,
          profileId: `seed_user_${idx}`,
          profileName: ["Nolan Fanatic", "Jules Codeur", "Cinema Geek"][idx % 3],
          profileAvatar: ["🎬", "🍿", "⭐️"][idx % 3],
          movieId: movie.id,
          content: c,
          timestamp: Date.now() - (idx * 3600000 * 4) // spaced by hours
        }));
        localStorage.setItem(key, JSON.stringify(seeded));
        setReviews(seeded);
      }
    };
    syncReviews();
    const interval = setInterval(syncReviews, 2000);
    return () => clearInterval(interval);
  }, [movie.id]);

  // Add review to LocalStorage
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

  // Delete review from LocalStorage
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

  // Recommendations: Other movies in the same genre
  const recommendations = MOVIES.filter(m => m.id !== movie.id && m.genres.some(g => movie.genres.includes(g))).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto select-none">
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Card Content Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative bg-[#181818] text-white w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl z-20 border border-zinc-800/80 max-h-[90vh] flex flex-col no-scrollbar"
      >
        {/* Header Hero Backdrop section */}
        <div className="relative h-[25vh] md:h-[45vh] w-full flex-none">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover brightness-[0.75]"
            referrerPolicy="no-referrer"
          />
          {/* Shadows to blend with black body background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#181818]/60 via-transparent to-transparent" />

          {/* Close trigger */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-zinc-800/80 rounded-full text-white cursor-pointer transition-colors border border-white/10"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Floating controls */}
          <div className="absolute bottom-4 left-4 md:left-10 z-10 space-y-2 md:space-y-4">
            <h2 className="text-xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {movie.title}
            </h2>

            <div className="flex items-center gap-2 md:gap-3.5 flex-wrap">
              {/* Play Button */}
              <button
                onClick={() => onPlay(movie)}
                className="flex items-center gap-1.5 px-5 md:px-7 py-2 bg-white text-black hover:bg-zinc-200 font-bold text-xs md:text-sm rounded-md transition-colors shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-black" />
                <span>Play</span>
              </button>

              {/* Watchlist */}
              <button
                onClick={handleToggleList}
                className={`p-2 border rounded-full cursor-pointer transition-colors ${
                  inList 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-zinc-900/80 border-zinc-600 hover:border-white text-zinc-300 hover:text-white'
                }`}
                title="Add to Watchlist"
              >
                {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>

              {/* Favorite Rating */}
              <button
                onClick={handleToggleLike}
                className={`p-2 border rounded-full cursor-pointer transition-colors ${
                  isLiked 
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                    : 'bg-zinc-900/80 border-zinc-600 hover:border-white text-zinc-300 hover:text-white'
                }`}
                title="Favorite"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              {/* Offline download trigger */}
              <button
                onClick={handleToggleDownload}
                className={`p-2 border rounded-full cursor-pointer transition-colors ${
                  isDownloaded 
                    ? 'bg-cyan-500/25 border-cyan-500 text-cyan-400' 
                    : 'bg-zinc-900/80 border-zinc-600 hover:border-white text-zinc-300 hover:text-white'
                }`}
                title={isDownloaded ? 'Delete Downloaded Movie' : 'Download for Offline Mode'}
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Secure Social share trigger */}
              <button
                onClick={() => setIsSharing(true)}
                className="p-2 border bg-zinc-900/80 border-zinc-600 hover:border-white text-zinc-300 hover:text-white rounded-full cursor-pointer transition-colors"
                title="Secure Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 no-scrollbar">
          {/* Details split grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Col: Match & Synopsis */}
            <div className="md:col-span-2 space-y-4 text-sm">
              <div className="flex items-center gap-3 font-medium text-zinc-300">
                <span className="text-emerald-400 font-bold text-base">{Math.round(movie.rating * 20)}% Match</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-zinc-400" /> {movie.releaseYear}</span>
                <span className="border border-zinc-700 px-1.5 py-0.2 text-xs rounded-xs font-semibold">{movie.rating}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-zinc-400" /> {movie.duration}</span>
              </div>

              <p className="text-zinc-200 leading-relaxed font-light text-sm sm:text-base">
                {movie.synopsis}
              </p>
            </div>

            {/* Right Col: Cast & Genres */}
            <div className="space-y-3 text-xs md:text-sm border-l border-zinc-800/80 pl-0 md:pl-6">
              <div>
                <span className="text-zinc-500 font-semibold block mb-1">Cast:</span>
                <p className="text-zinc-300 leading-tight">{movie.cast.join(', ')}</p>
              </div>

              <div>
                <span className="text-zinc-500 font-semibold block mb-1">Genres:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {movie.genres.map(genre => (
                    <span key={genre} className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-xs border border-zinc-700/50">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/50 space-y-2">
                <div>
                  <span className="text-zinc-500 font-semibold block mb-0.5">Community Rating:</span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{movie.rating} / 5</span>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 font-semibold block mb-1">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleSaveRating(star)}
                        className="text-zinc-600 hover:text-amber-400 transition-colors p-0.5"
                        title={`Rate ${star} Stars`}
                      >
                        <Star 
                          className={`w-5 h-5 cursor-pointer transition-transform hover:scale-110 ${
                            userRating >= star ? 'text-amber-400 fill-current' : 'text-zinc-600 hover:text-amber-500'
                          }`} 
                        />
                      </button>
                    ))}
                    {userRating > 0 && (
                      <span className="text-xs font-semibold text-amber-400 ml-2 font-mono">
                        ({userRating}/5)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* More Like This (Simulated local recommendation engine) */}
          {recommendations.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-zinc-800/80">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                More Like This
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendations.map(m => (
                  <div
                    key={m.id}
                    onClick={() => { onClose(); onPlay(m); }}
                    className="bg-[#202020] hover:bg-zinc-800/60 rounded-lg overflow-hidden border border-zinc-800/40 cursor-pointer group shadow-md transition-colors"
                  >
                    <div className="relative h-36">
                      <img src={m.backdropUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" referrerPolicy="no-referrer" />
                      <div className="absolute top-2 right-2 bg-black/60 border border-white/5 px-1 py-0.5 text-[9px] font-bold rounded-xs">
                        {m.duration}
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5 text-xs text-zinc-300">
                      <div className="flex items-center justify-between font-bold text-white text-sm">
                        <span className="truncate max-w-[70%]">{m.title}</span>
                        <span className="text-emerald-400 font-semibold">{Math.round(m.rating * 20)}% match</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed text-zinc-400 font-light">{m.synopsis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussions & Live Reviews Thread */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Smile className="w-5 h-5 text-zinc-400" />
              <span>Workspace Review Stream</span>
              <span className="text-xs font-normal text-zinc-500 font-mono">({reviews.length} active)</span>
            </h3>

            {/* Comment Post Form */}
            <form onSubmit={handleAddReview} className="flex gap-2 items-start">
              {/* Profile Avatar indicator */}
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-lg shadow-inner border border-zinc-700/50 flex-none">
                {profile.avatar}
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  required
                  placeholder={`Write an honest critique on "${movie.title}" as ${profile.name}...`}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-hidden focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 placeholder-zinc-500 text-zinc-100 transition-all pr-10"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={submittingReview || !commentInput.trim()}
                  className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-white disabled:opacity-40 rounded-md cursor-pointer"
                  title="Post comment"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Reviews list stack */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {reviews.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-xs">
                  No critiques posted yet. Be the first to share your thoughts!
                </div>
              ) : (
                reviews.map(rev => (
                  <div
                    key={rev.id}
                    className="bg-zinc-900/40 border border-zinc-800/40 p-3 rounded-lg flex gap-2.5 items-start justify-between"
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-base border border-zinc-700/30 flex-none">
                        {rev.profileAvatar}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-bold text-zinc-300">{rev.profileName}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {new Date(rev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-xs sm:text-sm font-light leading-relaxed">
                          {rev.content}
                        </p>
                      </div>
                    </div>

                    {/* Delete OWN review */}
                    {rev.profileId === profile.id && (
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded-md transition-colors cursor-pointer flex-none"
                        title="Delete review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
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

      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Remove from My List?</h3>
            <p className="text-zinc-400 text-sm">
              Are you sure you want to remove <span className="text-white font-semibold">"{movie.title}"</span> from your personalized collection?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  confirmRemoveList();
                  setShowRemoveConfirm(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-bold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer border border-zinc-700/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
