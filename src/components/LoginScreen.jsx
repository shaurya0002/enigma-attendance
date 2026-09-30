import React, { useState } from 'react';
import { ShieldCheck, User, Lock, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import PartyBackground from './PartyBackground';
import { login } from '../services/api';

export default function LoginScreen({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password || adminKey.length !== 8) {
      setError('Enter username, password and the 8-letter admin key.');
      return;
    }
    setLoading(true);
    const res = await login(username.trim(), password, adminKey);
    setLoading(false);
    if (res.ok) {
      setPassword('');
      setAdminKey('');
      onLoggedIn(res.data.username);
    } else if (res.status === 429) {
      setError('Too many attempts. Try again later.');
    } else if (res.status === 401) {
      setError('Invalid credentials.');
    } else {
      setError(res.data?.error || 'Something went wrong. Try again.');
    }
  };

  const field = 'w-full pl-10 pr-4 py-2.5 bg-[#090716] border border-indigo-900/60 focus:border-cyan-400 rounded-xl text-white placeholder-indigo-300/30 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all';
  const icon = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400';

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <PartyBackground />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm bg-[#0d0a1c]/90 border border-indigo-700/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(30,15,56,0.5)] backdrop-blur-2xl space-y-4"
      >
        <div className="text-center mb-2">
          <div className="inline-flex p-3 rounded-xl bg-indigo-900/50 border border-indigo-700/40 text-cyan-400 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">ENIGMA 2026 Admin</h1>
          <p className="text-xs text-indigo-300/70 mt-1">Authorised admins only</p>
        </div>

        <div className="relative">
          <div className={icon}><User className="w-4 h-4" /></div>
          <input className={field} type="text" placeholder="Username" autoComplete="username"
            autoCapitalize="none" autoCorrect="off" spellCheck={false}
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="relative">
          <div className={icon}><Lock className="w-4 h-4" /></div>
          <input className={field} type="password" placeholder="Password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="relative">
          <div className={icon}><KeyRound className="w-4 h-4" /></div>
          <input className={`${field} font-mono tracking-widest`} type="password" placeholder="8-letter admin key"
            maxLength={8} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            value={adminKey} onChange={(e) => setAdminKey(e.target.value.replace(/[^A-Za-z]/g, ''))} />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-rose-950/50 border border-rose-500/30 rounded-xl text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-500 to-violet-600 text-white font-bold text-sm tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
