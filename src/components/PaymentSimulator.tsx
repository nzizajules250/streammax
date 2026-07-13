import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Sparkles, AlertCircle, HelpCircle, Loader2, ArrowLeft, Lock, Key, Zap, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PaymentSimulator() {
  const [params, setParams] = useState({
    tx_ref: '',
    email: '',
    uid: '',
    name: 'Premium Member',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 9010');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('123');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setParams({
      tx_ref: urlParams.get('tx_ref') || `sim_tx_${Date.now()}`,
      email: urlParams.get('email') || 'user@example.com',
      uid: urlParams.get('uid') || '',
      name: urlParams.get('name') || 'Premium Member',
    });
  }, []);

  const handleSimulatePayment = async (status: 'success' | 'fail') => {
    if (status === 'fail') {
      window.location.href = '/?payment=failed';
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const uid = params.uid || 'user-jules-123';
      const subKey = `subscription_${uid}`;
      localStorage.setItem(subKey, JSON.stringify({
        isPremium: true,
        txRef: params.tx_ref,
        transactionId: `sim_tx_${Date.now()}`,
        subscribedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
      }));

      try {
        await fetch('/api/payments/simulate-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: params.uid,
            tx_ref: params.tx_ref,
            email: params.email,
          }),
        });
      } catch (e) {
        console.warn("Backend billing sync skipped (Running in pure client-side mode)");
      }

      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = '/?payment=success';
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-red-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-zinc-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6TTM2IDI0djJIMjR2LTJoMTJ6TTM2IDE0djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-gradient-to-b from-zinc-900/90 via-black/90 to-red-950/20 backdrop-blur-xl border border-red-900/20 rounded-2xl overflow-hidden shadow-2xl shadow-red-900/10">
          {/* Gateway Branding */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-600 to-red-800"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDEwdjEwSDB6TTEwIDEwaDEwdjEwSDEweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
            <div className="relative p-6 text-white flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tight uppercase">Flutterwave</span>
                  </div>
                  <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg font-mono font-bold tracking-wider uppercase border border-white/20">
                    Sandbox
                  </span>
                </div>
                <p className="text-xs text-red-100 font-medium flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Secured payment gateway
                </p>
              </div>
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-6 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400 font-medium">Merchant</span>
              <span className="text-sm text-zinc-200 font-bold">Stream Max Premium</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400 font-medium">Customer</span>
              <span className="text-xs text-zinc-300 font-semibold">{params.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400 font-medium">Reference</span>
              <span className="text-[10px] text-zinc-500 font-mono">{params.tx_ref}</span>
            </div>
            <div className="pt-3 border-t border-zinc-800/30 flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-300">Amount Due</span>
              <div className="text-right">
                <span className="text-2xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">$9.99</span>
                <span className="text-[10px] text-zinc-500 font-mono ml-1">USD/mo</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="p-6 space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 rounded-xl bg-red-950/50 border border-red-800/50 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-red-600/20 flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-sm text-red-300 font-medium">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/20"
                >
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Payment Approved!</h3>
                  <p className="text-sm text-zinc-400">Redirecting to premium content...</p>
                </div>
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Sandbox Notice */}
                <div className="p-4 rounded-xl bg-linear-to-r from-amber-950/30 to-amber-900/20 border border-amber-800/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Sandbox Mode</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Testing environment. No real payment details required. Use the simulator below to test the payment flow.
                  </p>
                </div>

                {/* Card Input Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" />
                      Card Number
                    </label>
                    <div className={`relative rounded-xl transition-all duration-300 ${
                      focusedField === 'card' 
                        ? 'ring-2 ring-red-600/30 border-red-600/50' 
                        : 'border-zinc-700/50'
                    }`}>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        onFocus={() => setFocusedField('card')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full px-4 py-3 bg-zinc-950/80 border border-zinc-700/50 rounded-xl text-zinc-300 font-mono text-sm backdrop-blur-sm focus:outline-none transition-all duration-300"
                        placeholder="0000 0000 0000 0000"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className="w-8 h-5 bg-gradient-to-r from-red-600 to-red-800 rounded"></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Expiry
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        onFocus={() => setFocusedField('expiry')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3 bg-zinc-950/80 border rounded-xl text-zinc-300 font-mono text-sm text-center backdrop-blur-sm focus:outline-none transition-all duration-300 ${
                          focusedField === 'expiry' 
                            ? 'ring-2 ring-red-600/30 border-red-600/50' 
                            : 'border-zinc-700/50'
                        }`}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Key className="w-3.5 h-3.5" />
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        onFocus={() => setFocusedField('cvv')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3 bg-zinc-950/80 border rounded-xl text-zinc-300 font-mono text-sm text-center backdrop-blur-sm focus:outline-none transition-all duration-300 ${
                          focusedField === 'cvv' 
                            ? 'ring-2 ring-red-600/30 border-red-600/50' 
                            : 'border-zinc-700/50'
                        }`}
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSimulatePayment('success')}
                    disabled={isLoading}
                    className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 p-[1px] transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="relative w-full rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-700 px-6 py-4 transition-all duration-300 group-hover:from-emerald-500 group-hover:via-emerald-400 group-hover:to-emerald-600">
                      <span className="relative z-10 flex items-center justify-center gap-3 text-sm font-bold text-white">
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5" />
                            Simulate Success Payment
                          </>
                        )}
                      </span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSimulatePayment('fail')}
                    disabled={isLoading}
                    className="w-full px-6 py-3.5 bg-zinc-900/80 hover:bg-red-950/30 border-2 border-zinc-700/50 hover:border-red-800/50 text-zinc-400 hover:text-red-400 font-bold text-sm rounded-xl transition-all duration-300 backdrop-blur-sm"
                  >
                    Cancel & Decline Payment
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gradient-to-r from-zinc-950/80 to-black/80 border-t border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">256-bit SSL</span>
              </div>
              <div className="w-px h-3 bg-zinc-800"></div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">3D Secure</span>
              </div>
              <div className="w-px h-3 bg-zinc-800"></div>
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">Support</span>
              </div>
            </div>
          </div>
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

// Calendar icon component
function Calendar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}