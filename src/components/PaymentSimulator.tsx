import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Sparkles, AlertCircle, HelpCircle, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

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
      // Direct LocalStorage activation for instant bulletproof client-side premium mode
      const uid = params.uid || 'user-jules-123';
      const subKey = `subscription_${uid}`;
      localStorage.setItem(subKey, JSON.stringify({
        isPremium: true,
        txRef: params.tx_ref,
        transactionId: `sim_tx_${Date.now()}`,
        subscribedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 3600 * 1000, // 30 days
      }));

      // Optional server-side sync attempt, fails gracefully in standalone client-side situations
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
      }, 1800);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-slate-100 font-sans flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-red-950/20 via-transparent to-zinc-950" />

      <div className="max-w-md w-full relative z-10 bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Gateway Branding */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-6 text-white flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight uppercase">flutterwave</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                Sandbox
              </span>
            </div>
            <p className="text-xs text-orange-100 font-medium">Securing payments dynamically</p>
          </div>
          <CreditCard className="w-8 h-8 text-white/90" />
        </div>

        {/* Invoice details */}
        <div className="p-6 border-b border-zinc-900 bg-zinc-900/30 space-y-3">
          <div className="flex justify-between text-xs text-zinc-400 font-medium">
            <span>Merchant:</span>
            <span className="text-zinc-200 font-semibold">Netflix Clone Premium</span>
          </div>
          <div className="flex justify-between text-xs text-zinc-400 font-medium">
            <span>Customer:</span>
            <span className="text-zinc-200 font-semibold">{params.email}</span>
          </div>
          <div className="flex justify-between text-xs text-zinc-400 font-medium">
            <span>Transaction Ref:</span>
            <span className="text-zinc-400 font-mono text-[10px]">{params.tx_ref}</span>
          </div>
          <div className="pt-2 border-t border-zinc-900 flex justify-between items-center">
            <span className="text-sm font-bold text-zinc-300">Amount Due:</span>
            <span className="text-xl font-black text-amber-500">$9.99 <span className="text-[10px] text-zinc-500 font-mono">USD / mo</span></span>
          </div>
        </div>

        {/* Body Simulator controls */}
        <div className="p-6 flex-1 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-400 font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 bg-emerald-500/10 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400"
              >
                <ShieldCheck className="w-8 h-8" />
              </motion.div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Payment Approved!</h3>
                <p className="text-xs text-zinc-400 font-medium">Redirecting you to Netflix Premium content...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border border-amber-500/20 bg-amber-500/5 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sandbox Simulator Mode</span>
                </div>
                <p className="text-zinc-400 font-medium leading-relaxed">
                  You are testing Flutterwave inside the AI Studio Developer environment. You do not need to enter real payment details. Simply click the triggers below to verify the secure access controls.
                </p>
              </div>

              {/* Mock Input fields for realistic UI */}
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-500 font-semibold">Card Number</label>
                  <input
                    type="text"
                    readOnly
                    value="4000 1234 5678 9010"
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-500 font-semibold">Expiry Date</label>
                    <input
                      type="text"
                      readOnly
                      value="12 / 29"
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 font-mono text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-500 font-semibold">CVV</label>
                    <input
                      type="text"
                      readOnly
                      value="123"
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleSimulatePayment('success')}
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Simulate Success</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSimulatePayment('fail')}
                  disabled={isLoading}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer text-center block"
                >
                  Cancel & Decline
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-zinc-950 text-center border-t border-zinc-900">
          <p className="text-[10px] text-zinc-600 font-mono tracking-wider uppercase flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Encrypted by Flutterwave 3D-Secure</span>
          </p>
        </div>
      </div>
    </div>
  );
}
