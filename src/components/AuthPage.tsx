import React, { useMemo, useState } from 'react';
import { Film, Loader2, Mail, ShieldCheck, Sparkles, ArrowLeft, User, Key, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { sendVerificationCode, verifyVerificationCode } from '../lib/api';

interface AuthPageProps {
  onClose?: () => void;
  onLoginSuccess?: (user: { uid: string; email: string; displayName: string }) => void;
}

export default function AuthPage({ onClose, onLoginSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const title = useMemo(() => (mode === 'signup' ? 'Create your account' : 'Welcome back'), [mode]);

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await sendVerificationCode(email);
      if (res.debugCode) {
        setSuccess(`${res.message} Code: ${res.debugCode}`);
      } else {
        setSuccess(res.message || 'Verification code sent.');
      }
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Unable to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name && mode === 'signup') {
      setError('Please enter your name.');
      return;
    }
    if (!email || !code) {
      setError('Please provide your email and the verification code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const verified = await verifyVerificationCode(email, code, name.trim());
      if (!verified.success) {
        throw new Error(verified.message || 'Verification failed.');
      }

      if (verified.token) {
        localStorage.setItem('netflix_auth_token', verified.token);
      }
      const userFromServer = verified.user || { uid: `user_${Date.now()}`, email: email.trim(), displayName: name.trim() || email.split('@')[0] };
      localStorage.setItem('netflix_auth_user', JSON.stringify(userFromServer));

      if (onLoginSuccess) onLoginSuccess(userFromServer);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to complete authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-red-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 24 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 shadow-2xl shadow-red-900/10 p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 mb-4 shadow-lg shadow-red-900/30">
              <Film className="h-10 w-10 text-white" />
            </div>
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 font-semibold mb-2">Stream Max</p>
            <h1 className="text-2xl font-black bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              {mode === 'signup' ? 'Start your premium streaming journey' : 'Continue watching your favorites'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-full bg-red-600/20 flex-shrink-0">
                  <ShieldCheck className="h-4 w-4 text-red-400" />
                </div>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </motion.div>
          )}
          
          {success && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-full bg-emerald-600/20 flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-sm text-emerald-300">{success}</p>
              </div>
            </motion.div>
          )}

          {/* Mode Toggle */}
          <div className="mb-8 flex rounded-2xl bg-zinc-950/80 border border-zinc-800/50 p-1.5 backdrop-blur-sm">
            <button 
              onClick={() => { setMode('signup'); setStep('form'); setError(''); setSuccess(''); }} 
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'signup' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/20' 
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <User className="h-4 w-4" />
              Sign Up
            </button>
            <button 
              onClick={() => { setMode('login'); setStep('form'); setError(''); setSuccess(''); }} 
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'login' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/20' 
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <LogIn className="h-4 w-4" />
              Log In
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-5">
            {mode === 'signup' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="group"
              >
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-500 group-focus-within:text-red-400 transition-colors" />
                  </div>
                  <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white pl-12 pr-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                    placeholder="Alicia Brooks" 
                  />
                </div>
              </motion.div>
            )}

            <div className="group">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
                Email Address
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-red-400 transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white pl-12 pr-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm" 
                    placeholder="you@example.com" 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleSendCode} 
                  disabled={isLoading} 
                  className="rounded-xl bg-gradient-to-r from-red-600/20 to-red-900/20 border border-red-800/30 px-4 text-red-300 hover:from-red-600/30 hover:to-red-900/30 hover:border-red-700/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Mail className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="group">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400 flex items-center gap-2">
                <Key className="h-3 w-3" />
                Security Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-zinc-500 group-focus-within:text-red-400 transition-colors" />
                </div>
                <input 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  className="w-full rounded-xl bg-zinc-950/80 border border-zinc-700/50 text-white pl-12 pr-4 py-3.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600/70 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 backdrop-blur-sm tracking-widest" 
                  placeholder="Enter the 6-digit code" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 p-[1px] transition-all duration-300 hover:shadow-lg hover:shadow-red-900/30 mt-2"
            >
              <div className="relative w-full rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-red-700 px-6 py-4 transition-all duration-300 group-hover:from-red-500 group-hover:via-red-400 group-hover:to-red-600">
                <span className="relative z-10 flex items-center justify-center gap-3 text-sm font-bold text-white">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : step === 'verify' ? (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      Verify and Continue
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="h-5 w-5" />
                      Continue
                    </>
                  )}
                </span>
              </div>
            </button>
          </form>

          {/* Info Card */}
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/80 border border-zinc-800/50 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-900/20 border border-amber-800/30">
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <p className="font-semibold text-zinc-200 text-sm">Secure Premium Access</p>
            </div>
            <p className="text-xs leading-5 text-zinc-400">
              We use email-based verification, secure backend checks, and Flutterwave-enabled subscription unlocks so full movies stay protected.
            </p>
          </div>

          {/* Guest Option */}
          {onClose && (
            <div className="mt-6 text-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
                <span className="text-xs text-zinc-600 font-medium">OR</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
              </div>
              <button 
                onClick={onClose} 
                className="text-sm text-zinc-500 hover:text-red-400 transition-colors duration-300 font-medium"
              >
                Continue as guest
              </button>
            </div>
          )}
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