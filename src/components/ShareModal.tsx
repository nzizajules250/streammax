import React, { useState } from 'react';
import { Movie, UserProfile } from '../types';
import { Copy, Share2, Send, Check, Sparkles, X, Globe, Link, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const OTHER_PROFILES: Omit<UserProfile, 'color'>[] = [
  { id: 'u1', name: 'Jules', avatar: '🦊' },
  { id: 'u2', name: 'Sarah', avatar: '🐨' },
  { id: 'u3', name: 'Devon', avatar: '🐯' },
  { id: 'u4', name: 'Elena', avatar: '🐼' }
];

interface ShareModalProps {
  movie: Movie;
  activeProfile: UserProfile;
  onClose: () => void;
}

export default function ShareModal({ movie, activeProfile, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharingProfileId, setSharingProfileId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const shareLink = `${window.location.origin}/?watch=${movie.id}&ref=${activeProfile.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWithProfile = (target: Omit<UserProfile, 'color'>) => {
    setSharingProfileId(target.id);
    setShareStatus(null);

    try {
      const key = `recommendations_${target.id}`;
      const saved = localStorage.getItem(key);
      const list = saved ? JSON.parse(saved) : [];

      const exists = list.some((item: any) => item.movieId === movie.id && item.fromProfileId === activeProfile.id);
      if (!exists) {
        list.push({
          id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          movieId: movie.id,
          fromProfileId: activeProfile.id,
          fromProfileName: activeProfile.name,
          fromProfileAvatar: activeProfile.avatar,
          timestamp: Date.now()
        });
        localStorage.setItem(key, JSON.stringify(list));
      }

      setShareStatus(`Shared successfully with ${target.name}!`);
      setTimeout(() => {
        setSharingProfileId(null);
        setShareStatus(null);
      }, 2500);
    } catch (err) {
      console.error('Error creating dynamic recommendation:', err);
      setShareStatus('Failed to share. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-br from-black/95 via-zinc-950/95 to-red-950/95 backdrop-blur-md select-none">
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gradient-to-b from-zinc-900/95 via-black/95 to-red-950/30 text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl z-20 border border-red-900/20 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-red-900/10"></div>
          <div className="relative p-6 pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-900/20">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Share Movie</h3>
                  <p className="text-xs text-zinc-400">Recommend to friends & family</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 transition-all duration-300 border border-zinc-700/50 hover:border-red-800/50"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Movie Info */}
        <div className="px-6 pb-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950/80 to-black/80 border border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-700/50">
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{movie.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-400">{movie.releaseYear}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs text-emerald-400 font-semibold">{Math.round(movie.rating * 20)}% Match</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 truncate">Shared by {activeProfile.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Share Link Section */}
        <div className="px-6 space-y-3">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-red-400" />
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Share Link</label>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="w-full bg-zinc-950/80 border border-zinc-700/50 rounded-xl text-xs text-zinc-300 font-mono px-4 py-3 pr-20 focus:outline-none focus:border-red-600/50 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyLink}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all duration-300 ${
                  copied 
                    ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-900/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-900/20'
                }`}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Copied
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Share with Profiles Section */}
        <div className="px-6 pt-5 pb-4 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-red-400" />
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recommend to Profile</label>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            Send directly to other profiles on this account. They'll see your recommendation in their dashboard!
          </p>

          <div className="grid grid-cols-2 gap-3">
            {OTHER_PROFILES.filter(p => p.id !== activeProfile.id).map(target => (
              <motion.button
                key={target.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleShareWithProfile(target)}
                disabled={sharingProfileId !== null}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left ${
                  sharingProfileId === target.id
                    ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-900/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-900/20'
                    : 'bg-gradient-to-r from-zinc-950/80 to-black/80 border-2 border-zinc-800/50 hover:border-red-800/50 hover:bg-red-950/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border-2 transition-all duration-300 ${
                  sharingProfileId === target.id
                    ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border-emerald-500/30'
                    : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700/50'
                }`}>
                  <span>{target.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-zinc-200 block truncate">{target.name}</span>
                  <span className="text-[10px] text-zinc-500 font-medium block">
                    {sharingProfileId === target.id ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Zap className="w-3 h-3" />
                        Sending...
                      </span>
                    ) : (
                      'Click to share'
                    )}
                  </span>
                </div>
                <Send className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${
                  sharingProfileId === target.id ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-red-400'
                }`} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Status Message */}
        <AnimatePresence>
          {shareStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="px-6 pb-4"
            >
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 to-emerald-900/30 border border-emerald-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                  <span className="text-sm text-emerald-300 font-semibold">{shareStatus}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-zinc-950/80 to-black/80 border-t border-zinc-800/50">
          <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              <span>Secure Share</span>
            </div>
            <div className="w-px h-3 bg-zinc-800"></div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span>Collaborative</span>
            </div>
            <div className="w-px h-3 bg-zinc-800"></div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              <span>Real-time</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}