import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Film, X } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onClose?: () => void;
}

export default function AuthScreen({ onClose }: AuthScreenProps) {
  return (
    <div 
      className="min-h-screen relative flex items-center justify-center bg-black font-sans select-none overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(30, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.98) 100%), url("https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?auto=format&fit=crop&q=80&w=1200")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-xs" />

      {/* Top Header Branding */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-2">
        <Film className="w-8 h-8 text-red-600 animate-pulse" />
        <span className="text-2xl font-black tracking-tighter text-red-600 uppercase">
          NETFLIX
        </span>
        <span className="text-[10px] font-mono border border-red-600/30 px-1.5 py-0.5 rounded text-red-500 font-bold tracking-wider">
          STUDIO
        </span>
      </div>

      {/* Close/Back to Guest Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-30 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-white font-medium border border-zinc-800 text-sm transition-all cursor-pointer backdrop-blur-sm"
        >
          <X className="w-4 h-4" />
          <span>Browse as Guest</span>
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 p-4"
      >
        <SignIn
          routing="virtual"
          appearance={{
            variables: {
              colorPrimary: '#E50914', // Netflix Red
              colorBackground: '#09090b', // zinc-950
              colorText: '#f4f4f5', // zinc-100
              colorInputBackground: '#18181b', // zinc-900
              colorInputText: '#ffffff',
              borderRadius: '12px',
            },
            elements: {
              cardBox: 'shadow-2xl border border-zinc-800 rounded-2xl overflow-hidden',
              card: 'bg-zinc-950/95 backdrop-blur-md p-8 sm:p-10 border-0',
              headerTitle: 'text-2xl font-extrabold text-white tracking-tight text-center',
              headerSubtitle: 'text-zinc-400 text-xs sm:text-sm font-medium text-center',
              socialButtonsBlockButton: 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-200 text-xs font-bold transition-all',
              formButtonPrimary: 'bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg py-3 rounded-xl border-0 cursor-pointer',
              footerActionText: 'text-zinc-500 text-xs font-semibold',
              footerActionLink: 'text-red-500 hover:text-red-400 font-bold text-xs',
              identityPreviewText: 'text-white font-bold',
              formFieldLabel: 'text-zinc-400 font-bold text-[10px] uppercase tracking-wider mb-1.5',
              formFieldInput: 'bg-zinc-900 border border-zinc-800 text-white rounded-xl py-3 focus:border-red-600 focus:ring-red-600 text-sm font-semibold',
              dividerLine: 'bg-zinc-900',
              dividerText: 'text-zinc-500 font-semibold text-[10px] uppercase tracking-wider',
            }
          }}
        />
      </motion.div>
    </div>
  );
}
