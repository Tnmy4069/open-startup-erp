'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AppConfig } from '@/lib/config';

const BOOT_LINES = [
  `> ${AppConfig.name.toUpperCase()} SECURE SHELL v2.4.1`,
  '> Initializing cryptographic subsystem...',
  '> Loading role-based access matrix...',
  '> Establishing secure channel...',
  '> Authentication required.',
];

export default function HomePage() {
  const router = useRouter();

  const [bootLines, setBootLines] = useState<string[]>([]);
  const [bootDone, setBootDone] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  // Boot sequence typewriter
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setBootLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setBootDone(true);
          setTimeout(() => usernameRef.current?.focus(), 100);
        }, 300);
      }
    }, 220);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        setLoading(false);
        return;
      }

      // Hard redirect to reset React states and fetch fresh session
      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Check your connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 font-mono">
      {/* Subtle scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, var(--primary-color) 0px, var(--primary-color) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <div className="w-full max-w-md z-10 space-y-6">

        {/* Brand */}
        <div className="text-center space-y-2 flex flex-col items-center justify-center">
          <img src={AppConfig.logoUrl} alt={`${AppConfig.name} Logo`} className="h-16 w-auto object-contain mb-2" />
          <p className="text-[10px] text-text-muted tracking-[0.3em]">FINANCIAL OPERATIONS SYSTEM</p>
        </div>

        {/* Terminal Boot Sequence */}
        <div className="bg-bg-surface border border-border-normal rounded-xl p-4 space-y-1 min-h-[130px]">
          {bootLines.map((line, i) => (
            <div key={i} className="text-[11px] text-text-muted font-mono leading-relaxed">
              <span className={i === bootLines.length - 1 ? 'text-primary' : ''}>{line}</span>
            </div>
          ))}
          {!bootDone && (
            <span className="inline-block w-2 h-3.5 bg-primary animate-pulse ml-0.5" />
          )}
        </div>

        {/* Login Form — appears after boot */}
        {bootDone && (
          <form
            onSubmit={handleLogin}
            className="bg-bg-surface border border-border-normal rounded-xl p-6 space-y-5 animate-in fade-in duration-200"
          >
            <div className="space-y-1">
              <p className="text-[10px] text-text-muted tracking-widest">AUTHENTICATE TO CONTINUE</p>
              <div className="h-px bg-border-normal/50" />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="text-[10px] text-text-muted tracking-wider block">
                USERNAME
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="login-username"
                  ref={usernameRef}
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full h-11 bg-bg-primary border border-border-normal rounded-lg pl-10 pr-4 text-sm text-text-heading font-mono placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                  placeholder="enter username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-[10px] text-text-muted tracking-wider block">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full h-11 bg-bg-primary border border-border-normal rounded-lg pl-10 pr-11 text-sm text-text-heading font-mono placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-cyber-danger shrink-0" />
                <p className="text-[11px] text-cyber-danger font-mono">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full h-11 rounded-lg bg-primary text-black font-bold text-sm tracking-wider transition-all duration-150 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
                  AUTHENTICATING...
                </>
              ) : (
                '> LOGIN'
              )}
            </button>

            <p className="text-center text-[10px] text-text-muted font-mono">
              Contact Tanmay Hirodkar at{' '}
              <a href={`mailto:${AppConfig.contactEmail}`} className="underline hover:opacity-80 text-text-heading">
                {AppConfig.contactEmail}
              </a>{' '}
              to get access credentials.
            </p>
          </form>
        )}


        <p className="text-center text-[9px] text-text-muted tracking-widest">
          {AppConfig.name.toUpperCase()} LEDGER &mdash; SECURE ACCESS ONLY
        </p>
      </div>
    </div>
  );
}
