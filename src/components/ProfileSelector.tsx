import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Plus, HelpCircle, Lock, Loader2, User, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_PROFILES: Omit<UserProfile, 'id'>[] = [
  { name: 'Jules', avatar: '🦊', color: 'border-fuchsia-500 text-fuchsia-500 shadow-fuchsia-500/10' },
  { name: 'Sarah', avatar: '🐨', color: 'border-indigo-500 text-indigo-500 shadow-indigo-500/10' },
  { name: 'Devon', avatar: '🐯', color: 'border-amber-500 text-amber-500 shadow-amber-500/10' },
  { name: 'Elena', avatar: '🐼', color: 'border-emerald-500 text-emerald-500 shadow-emerald-500/10' }
];

const AVATARS = ['🦊', '🐨', '🐯', '🐼', '🦁', '🐸', '🐙', '🐵', '🦉', '🦄'];
const COLORS = [
  'border-fuchsia-500 text-fuchsia-500 shadow-fuchsia-500/10',
  'border-indigo-500 text-indigo-500 shadow-indigo-500/10',
  'border-amber-500 text-amber-500 shadow-amber-500/10',
  'border-emerald-500 text-emerald-500 shadow-emerald-500/10',
  'border-cyan-500 text-cyan-500 shadow-cyan-500/10',
  'border-rose-500 text-rose-500 shadow-rose-500/10',
];

interface ProfileSelectorProps {
  userId: string;
  onSelect: (profile: UserProfile) => void;
}

export default function ProfileSelector({ userId, onSelect }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  // Sync Profiles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`profiles_${userId || 'default'}`);
    if (saved) {
      setProfiles(JSON.parse(saved));
    } else {
      const seeded: UserProfile[] = DEFAULT_PROFILES.map((p, index) => ({
        id: `profile-${index}-${Date.now()}`,
        ...p
      }));
      localStorage.setItem(`profiles_${userId || 'default'}`, JSON.stringify(seeded));
      setProfiles(seeded);
    }
    setIsLoading(false);
  }, [userId]);

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const newProfile: UserProfile = {
      id: `profile-${Date.now()}`,
      name: newProfileName.trim(),
      avatar: selectedAvatar,
      color: selectedColor,
    };

    const updated = [...profiles, newProfile];
    localStorage.setItem(`profiles_${userId || 'default'}`, JSON.stringify(updated));
    setProfiles(updated);
    setNewProfileName('');
    setSelectedAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
    setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setIsAdding(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-red-950 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-red-500" />
        </motion.div>
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">Loading Cinema Profiles...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-red-950 text-white flex flex-col justify-center items-center px-4 font-sans select-none relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6TTM2IDI0djJIMjR2LTJoMTJ6TTM2IDE0djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center space-y-8 max-w-4xl w-full relative z-10"
      >
        {/* Header */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 shadow-lg shadow-red-900/30 mx-auto"
          >
            <User className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-white via-zinc-200 to-red-200 bg-clip-text text-transparent">
              Who's Watching?
            </span>
          </h1>
          <p className="text-sm text-zinc-400 font-medium">Select your profile to continue</p>
        </div>

        {/* Profiles Grid */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 py-6">
          <AnimatePresence>
            {profiles.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.4, delay: i * 0.1, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(profile)}
                className="group flex flex-col items-center cursor-pointer space-y-4"
              >
                {/* Profile Avatar Frame */}
                <div className="relative">
                  <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 ${profile.color} bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-5xl md:text-6xl group-hover:border-white group-hover:shadow-2xl transition-all duration-300 shadow-lg backdrop-blur-sm`}>
                    <motion.span
                      whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {profile.avatar}
                    </motion.span>
                    
                    {/* Primary Profile Indicator */}
                    {i === 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-gradient-to-r from-red-600 to-red-700 p-1.5 rounded-full border-2 border-zinc-900 shadow-lg shadow-red-900/30"
                        title="Primary Profile"
                      >
                        <Shield className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-600/20 to-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"></div>
                </div>

                {/* Profile Name */}
                <span className="text-sm md:text-base text-zinc-400 group-hover:text-white transition-colors font-semibold">
                  {profile.name}
                </span>
              </motion.div>
            ))}

            {/* Add Profile Interface */}
            {isAdding ? (
              <motion.form 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onSubmit={handleAddProfile}
                className="flex flex-col items-center space-y-4"
              >
                <div className="w-28 md:w-36 flex flex-col items-center space-y-3">
                  {/* Avatar Preview */}
                  <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 ${selectedColor} bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-5xl md:text-6xl shadow-lg`}>
                    <span>{selectedAvatar}</span>
                  </div>

                  {/* Avatar Selection */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {AVATARS.slice(0, 6).map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all duration-200 ${
                          selectedAvatar === avatar 
                            ? 'bg-red-600/30 border-2 border-red-500 scale-110' 
                            : 'bg-zinc-800/50 border-2 border-zinc-700/50 hover:border-zinc-500'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>

                  {/* Color Selection */}
                  <div className="flex gap-1.5">
                    {COLORS.slice(0, 4).map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-6 h-6 rounded-full transition-all duration-200 ${
                          selectedColor === color 
                            ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' 
                            : 'hover:scale-110'
                        } ${
                          idx === 0 ? 'bg-fuchsia-500' :
                          idx === 1 ? 'bg-indigo-500' :
                          idx === 2 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Name Input */}
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={10}
                    placeholder="Profile name"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-700/50 rounded-xl px-3 py-2 text-center text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm"
                  />

                  {/* Action Buttons */}
                  <div className="flex gap-2 w-full">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-lg shadow-red-900/20"
                    >
                      Create
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsAdding(false)}
                      className="flex-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 font-bold text-xs py-2 rounded-xl transition-all border border-zinc-700/50"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.form>
            ) : (
              profiles.length < 5 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: profiles.length * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAdding(true)}
                  className="group flex flex-col items-center cursor-pointer space-y-4"
                >
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-dashed border-zinc-700/50 group-hover:border-red-500/50 bg-gradient-to-br from-zinc-900/50 to-black/50 flex items-center justify-center transition-all duration-300 group-hover:bg-red-950/20 backdrop-blur-sm">
                    <Plus className="w-12 h-12 text-zinc-600 group-hover:text-red-400 transition-colors duration-300" />
                  </div>
                  <span className="text-sm md:text-base text-zinc-500 group-hover:text-red-400 transition-colors font-medium">
                    Add Profile
                  </span>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Create Profile Button */}
        {!isAdding && profiles.length < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-6"
          >
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAdding(true)}
              className="px-8 py-3 border-2 border-zinc-700/50 hover:border-red-500/50 text-zinc-400 hover:text-red-400 text-sm font-semibold tracking-wider uppercase rounded-xl transition-all duration-300 bg-transparent hover:bg-red-950/20 backdrop-blur-sm flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Custom Profile
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Footer Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 flex items-center gap-2 text-xs text-zinc-600 font-mono tracking-wider"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-red-600/50" />
          <span>STREAM MAX PREMIUM</span>
        </div>
        <div className="w-px h-3 bg-zinc-800"></div>
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>AI STUDIO EDITION</span>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}