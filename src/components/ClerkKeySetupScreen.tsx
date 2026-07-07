import React, { useState } from 'react';
import { ShieldAlert, Sparkles, Key, ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function ClerkKeySetupScreen() {
  const [tempKey, setTempKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tempKey.trim();
    if (!trimmed) {
      setError('Please paste a valid Clerk Publishable Key.');
      return;
    }

    if (!trimmed.startsWith('pk_test_') && !trimmed.startsWith('pk_live_')) {
      setError('Invalid format! A Clerk Publishable Key typically starts with "pk_test_" or "pk_live_".');
      return;
    }

    // Save key to localStorage so the preview immediately works!
    localStorage.setItem('clerk_temp_publishable_key', trimmed);
    setError(null);
    window.location.reload();
  };

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

      {/* Header Branding */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-2">
        <span className="text-2xl font-black tracking-tighter text-red-600 uppercase">
          NETFLIX
        </span>
        <span className="text-[10px] font-mono border border-red-600/30 px-1.5 py-0.5 rounded text-red-500 font-bold tracking-wider">
          STUDIO
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative bg-zinc-950/95 border border-zinc-800 p-8 sm:p-10 rounded-2xl max-w-md w-full mx-4 shadow-2xl z-10 backdrop-blur-md"
      >
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Clerk Setup Required
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
              You chose to integrate <strong className="text-white font-bold">Clerk Authentication</strong>! To connect your workspace, provide your Clerk Publishable Key below.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-400 font-medium">
              <ShieldAlert className="w-4 h-4 flex-none mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSaveKey} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase font-bold">
                Clerk Publishable Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="pk_test_..."
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-hidden focus:border-red-600 focus:ring-1 focus:ring-red-600 text-xs text-white placeholder-zinc-500 transition-all font-mono"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Save Key & Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="border-t border-zinc-900 pt-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-500">How to get your key:</span>
              <a 
                href="https://dashboard.clerk.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-red-500 hover:underline flex items-center gap-1 font-bold text-[11px]"
              >
                <span>Clerk Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              1. Sign in to your Clerk Dashboard.<br />
              2. Go to <strong>API Keys</strong> under development settings.<br />
              3. Copy your <strong>Publishable Key</strong> and paste it here.<br />
              4. You can also save it permanently in <code>.env.example</code> under <code>VITE_CLERK_PUBLISHABLE_KEY</code>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
