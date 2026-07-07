import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Plus, HelpCircle, Lock, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';

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

  // Sync Profiles from Firestore
  useEffect(() => {
    if (!userId) return;

    const colRef = collection(db, 'users', userId, 'profiles');
    
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty) {
        // First login, auto-provision default profiles in Firestore
        setIsLoading(true);
        try {
          const promises = DEFAULT_PROFILES.map(p => addDoc(colRef, p));
          await Promise.all(promises);
        } catch (err) {
          console.error('Error auto-seeding profiles:', err);
        }
      } else {
        const loaded: UserProfile[] = [];
        snapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() } as UserProfile);
        });
        setProfiles(loaded);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !userId) return;

    try {
      const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

      await addDoc(collection(db, 'users', userId, 'profiles'), {
        name: newProfileName.trim(),
        avatar: randomAvatar,
        color: randomColor,
      });

      setNewProfileName('');
      setIsAdding(false);
    } catch (err) {
      console.error('Error adding profile:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center text-red-600 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">Loading Cinema Profiles...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col justify-center items-center px-4 font-sans select-none relative">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center space-y-8 max-w-4xl w-full"
      >
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-100">
          Who's watching?
        </h1>

        {/* Profiles Grid */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 py-6">
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              onClick={() => onSelect(profile)}
              className="group flex flex-col items-center cursor-pointer space-y-3"
            >
              {/* Profile Avatar Frame */}
              <div className={`w-28 h-28 md:w-36 md:h-36 rounded-xl border-4 ${profile.color} bg-zinc-800 flex items-center justify-center text-5xl md:text-6xl group-hover:border-white group-hover:scale-105 transition-all duration-300 relative shadow-md`}>
                <span>{profile.avatar}</span>
                {i === 0 && (
                  <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full border border-white/10" title="Primary Profile">
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                )}
              </div>

              {/* Profile Name */}
              <span className="text-sm md:text-base text-zinc-400 group-hover:text-white transition-colors">
                {profile.name}
              </span>
            </motion.div>
          ))}

          {/* Add Profile Interface */}
          {isAdding ? (
            <motion.form 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleAddProfile}
              className="w-28 sm:w-36 flex flex-col items-center space-y-3"
            >
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-xl border-4 border-red-600/40 bg-zinc-900 flex flex-col items-center justify-center p-3 space-y-3">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={10}
                  placeholder="Name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-center text-xs text-white focus:outline-hidden focus:border-red-600"
                />
                <div className="flex gap-1.5 w-full">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white font-bold text-[10px] py-1 rounded cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 bg-zinc-850 text-zinc-400 text-[10px] py-1 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">New Slot</span>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: profiles.length * 0.1 }}
              onClick={() => setIsAdding(true)}
              className="group flex flex-col items-center cursor-pointer space-y-3 opacity-60 hover:opacity-100 transition-opacity"
            >
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-xl border-4 border-dashed border-zinc-700 hover:border-zinc-400 bg-transparent flex items-center justify-center text-3xl hover:scale-102 transition-all duration-300">
                <Plus className="w-10 h-10 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </div>
              <span className="text-sm md:text-base text-zinc-500 group-hover:text-zinc-300 transition-colors">
                Add Profile
              </span>
            </motion.div>
          )}
        </div>

        {/* Manage Profiles Button */}
        <div className="pt-6">
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-2 border border-zinc-600 text-zinc-500 hover:border-zinc-300 hover:text-white text-xs md:text-sm font-medium tracking-widest uppercase rounded-sm transition-all bg-transparent cursor-pointer"
          >
            Create Custom Profile
          </button>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-[10px] text-zinc-600 font-mono tracking-widest flex items-center gap-1">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>NETFLIX AI STUDIO PREMIUM EDITION</span>
      </div>
    </div>
  );
}
