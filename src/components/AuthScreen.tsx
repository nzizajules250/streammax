import React, { useState } from 'react';
import { Film, X, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onClose?: () => void;
  onLoginSuccess?: (user: { uid: string; email: string; displayName: string }) => void;
}

export default function AuthScreen({ onClose, onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const mockUser = {
        uid: `user-${Date.now()}`,
        email: email.trim(),
        displayName: email.split('@')[0],
      };
      
      localStorage.setItem('netflix_auth_user', JSON.stringify(mockUser));
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(mockUser);
      }
      if (onClose) onClose();
    }, 1000);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const demoUser = {
        uid: 'user-jules-123',
        email: 'nzizajules250@gmail.com',
        displayName: 'Jules',
      };
      localStorage.setItem('netflix_auth_user', JSON.stringify(demoUser));
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(demoUser);
      }
      if (onClose) onClose();
    }, 800);
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center bg-black font-sans select-none overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(30, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.98) 100%), url("https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?auto=format&fit=crop&q=80&w=1200")',
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
        className="relative z-10 w-full max-w-[420px] p-4"
      >
        <div className="bg-zinc-950/95 backdrop-blur-md p-8 sm:p-10 rounded-2xl border border-zinc-800/80 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign In</h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium">Enjoy unlimited premium HD cinema streaming</p>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs py-2.5 px-3 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider block">
                Email Address
              </label>
              <input 
                type="email"
                required
                placeholder="nzizajules250@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 transition-all text-sm font-semibold placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider block">
                Password
              </label>
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 transition-all text-sm font-semibold placeholder:text-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800/80 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-900" />
            </div>
            <span className="relative bg-zinc-950 px-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">or</span>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Single-Click Demo Access</span>
          </button>

          <div className="text-center pt-2">
            <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
              New to Netflix Studio? Enter any details above. Credentials are kept entirely private in your local browser storage.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

