import React, { useState } from 'react';

export default function AdminAuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await fetch('/api/admin/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        setMode('login');
      } else {
        const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        localStorage.setItem('admin_token', data.adminToken || data.token);
        window.location.href = '/admin';
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-black text-white mb-3">Admin {mode === 'register' ? 'Register' : 'Login'}</h2>
        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm" />
          )}
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm" />
          <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm" />
          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold">{loading ? 'Working...' : mode === 'register' ? 'Create Admin' : 'Login'}</button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm text-zinc-400">{mode === 'login' ? 'Create account' : 'Have an account?'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
