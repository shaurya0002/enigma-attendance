import React, { useState } from 'react';
import { User, Lock, KeyRound, Loader2, AlertCircle } from 'lucide-react';
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
      onLoggedIn(res.data);
    } else if (res.status === 429) {
      setError('Too many attempts. Try again later.');
    } else if (res.status === 401) {
      setError('Invalid credentials.');
    } else {
      setError(res.data?.error || 'Something went wrong. Try again.');
    }
  };

  const field = 'w-full pl-10 pr-4 py-2.5 bg-[#faf9f6] border border-stone-300 focus:border-[#a51c30] rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#a51c30]/20 transition-all font-sans';
  const icon = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500';

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <PartyBackground />
      
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm bg-white border border-[#a51c30]/30 rounded-3xl p-6 md:p-8 shadow-xl space-y-4 text-left overflow-hidden"
      >
        {/* Crimson Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#a51c30]" />

        {/* Shield Crest */}
        <div className="text-center pt-2 mb-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-14 bg-[#a51c30] rounded-b-lg border-2 border-[#c59b27] flex flex-col items-center justify-center text-white shadow-sm">
              <span className="text-[8.5px] font-serif font-bold tracking-widest leading-none text-[#f5e6be]">EN</span>
              <span className="text-[8.5px] font-serif font-bold tracking-widest leading-none text-[#f5e6be] my-0.5">IG</span>
              <span className="text-[8.5px] font-serif font-bold tracking-widest leading-none text-[#f5e6be]">MA</span>
            </div>
          </div>
          <h1 className="text-xl font-serif font-bold text-stone-900 tracking-tight">ENIGMA 2026</h1>
          <p className="text-xs text-[#a51c30] font-serif italic mt-0.5">Authorised Officials Only</p>
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
          <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-sans">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#a51c30] hover:bg-[#7f1322] border border-[#c59b27]/40 text-white font-serif font-bold text-xs tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-md"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In To Portal'}
        </button>
      </form>
    </div>
  );
}
