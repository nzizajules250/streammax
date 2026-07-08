import React, { useMemo, useState } from 'react';
import { Film, Loader2, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { sendVerificationCode, verifyVerificationCode } from '../lib/api';

interface AuthPageProps {
  onClose?: () => void;
  onLoginSuccess?: (user: { uid: string; email: string; displayName: string }) => void;
}

export default function AuthPage({ onClose, onLoginSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isLoaded: isSignUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const { isLoaded: isSignInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();

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

      if (mode === 'signup' && isSignUpLoaded && signUp) {
        try {
          await signUp.create({
            firstName: name.trim().split(' ')[0] || 'User',
            lastName: name.trim().split(' ').slice(1).join(' ') || '',
            emailAddress: email.trim(),
            password,
          });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        } catch (clerkError: any) {
          console.warn('Clerk signup setup warning:', clerkError?.errors?.[0]?.message || clerkError.message);
        }
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
      const verified = await verifyVerificationCode(email, code);
      if (!verified.success) {
        throw new Error(verified.message || 'Verification failed.');
      }

      // Save token and user returned from server
      if (verified.token) {
        localStorage.setItem('netflix_auth_token', verified.token);
      }
      if (verified.user) {
        localStorage.setItem('netflix_auth_user', JSON.stringify(verified.user));
      }

      if (mode === 'signup') {
        if (isSignUpLoaded && signUp) {
          try {
            await signUp.attemptEmailAddressVerification({ code });
            await setActiveSignUp({ session: signUp.createdSessionId || '' });
          } catch (clerkError: any) {
            console.warn('Clerk verification warning:', clerkError?.errors?.[0]?.message || clerkError.message);
          }
        }
      } else if (isSignInLoaded && signIn) {
        try {
          const attempt = await signIn.create({ identifier: email.trim(), password });
          const result = await attempt.attemptFirstFactor({ strategy: 'password', password });
          await setActiveSignIn({ session: result.createdSessionId || '' });
        } catch (clerkError: any) {
          console.warn('Clerk sign-in warning:', clerkError?.errors?.[0]?.message || clerkError.message);
        }
      }

      const userFromServer = verified.user || { uid: `user_${Date.now()}`, email: email.trim(), displayName: name.trim() || email.split('@')[0] };
      if (!verified.user) localStorage.setItem('netflix_auth_user', JSON.stringify(userFromServer));
      if (onLoginSuccess) onLoginSuccess(userFromServer);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to complete authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/95 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3 text-red-500">
          <Film className="h-8 w-8" />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Netflix Studio</p>
            <h1 className="text-xl font-black">{title}</h1>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/50 p-3 text-sm text-red-300">{error}</div> : null}
        {success ? <div className="mb-4 rounded-xl border border-emerald-900/60 bg-emerald-950/50 p-3 text-sm text-emerald-300">{success}</div> : null}

        <div className="mb-6 flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
          <button onClick={() => { setMode('signup'); setStep('form'); setError(''); setSuccess(''); }} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}>Sign Up</button>
          <button onClick={() => { setMode('login'); setStep('form'); setError(''); setSuccess(''); }} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}>Log In</button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {mode === 'signup' ? (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none ring-0" placeholder="Alicia Brooks" />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Email Address</label>
            <div className="flex gap-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none ring-0" placeholder="you@example.com" />
              <button type="button" onClick={handleSendCode} disabled={isLoading} className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-200 disabled:opacity-60">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none ring-0" placeholder="Create a secure password" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Security Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none ring-0" placeholder="Enter the 6-digit code" />
          </div>

          <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold transition hover:bg-red-700 disabled:opacity-60">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {step === 'verify' ? 'Verify and Continue' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
          <div className="mb-2 flex items-center gap-2 font-semibold text-zinc-200">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Secure access includes email verification and protected premium streaming.
          </div>
          <p className="text-xs leading-5">We use email-based verification, secure backend checks, and Flutterwave-enabled subscription unlocks so full movies stay protected.</p>
        </div>

        {onClose ? (
          <button onClick={onClose} className="mt-6 text-sm text-zinc-500 hover:text-white">Continue as guest</button>
        ) : null}
      </motion.div>
    </div>
  );
}
