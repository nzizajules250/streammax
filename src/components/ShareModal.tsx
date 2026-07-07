import React, { useState } from 'react';
import { Movie, UserProfile } from '../types';
import { Copy, Share2, Send, Check, Sparkles, X, Globe } from 'lucide-react';
import { motion } from 'motion/react';

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

      // Avoid duplicates
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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none">
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-zinc-950 text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl z-20 border border-zinc-800 p-6 space-y-6"
      >
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-red-500 animate-pulse" />
            <span>Secure Social Share</span>
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Link display */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Copy secure link</label>
          <div className="flex items-center bg-zinc-900 rounded-xl p-1.5 border border-zinc-800 relative">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="flex-1 bg-transparent border-none text-xs text-zinc-300 font-mono px-2.5 focus:outline-hidden"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                copied 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Share with inside profiles */}
        <div className="space-y-3">
          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 uppercase font-bold">
            <Globe className="w-3.5 h-3.5" />
            <span>Recommend to Profile Friend</span>
          </div>

          <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
            Send directly to other profile slots on this account. They will see the recommendation directly in their dashboard!
          </p>

          <div className="grid grid-cols-2 gap-2">
            {OTHER_PROFILES.filter(p => p.id !== activeProfile.id).map(target => (
              <button
                key={target.id}
                onClick={() => handleShareWithProfile(target)}
                disabled={sharingProfileId !== null}
                className="flex items-center gap-2.5 p-2 bg-zinc-900 hover:bg-zinc-850 rounded-xl border border-zinc-800 text-left transition-all hover:scale-101 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-lg border border-zinc-700/50 flex-none">
                  {target.avatar}
                </div>
                <div className="truncate flex-1">
                  <span className="text-xs font-bold text-zinc-200 block truncate">{target.name}</span>
                  <span className="text-[9px] text-zinc-500 font-mono block uppercase">
                    {sharingProfileId === target.id ? 'Sending...' : 'Click to share'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {shareStatus && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg flex items-center gap-2 text-xs text-emerald-400 font-semibold justify-center">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{shareStatus}</span>
          </div>
        )}

        <div className="text-center pt-3 border-t border-zinc-900 text-[9px] text-zinc-600 font-mono uppercase">
          Real-time collaborative recommendation layer
        </div>
      </motion.div>
    </div>
  );
}
