 'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setMessage('Check your inbox to confirm your email before signing in.');
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          router.push('/');
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = mode === 'signup';

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-[#2a2a3a] rounded-2xl bg-[#151520]/80 backdrop-blur-md p-8 shadow-xl">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#a1a1aa]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3a] rounded-xl focus:outline-none focus:border-[#E4B77D] focus:ring-2 focus:ring-[#E4B77D]/30 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#a1a1aa]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full px-4 py-3 bg-[#1f1f2e] border border-[#2a2a3a] rounded-xl focus:outline-none focus:border-[#E4B77D] focus:ring-2 focus:ring-[#E4B77D]/30 transition"
              placeholder="********"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-green-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E4B77D]/30 via-[#E4B77D]/40 to-[#E4B77D]/30 border border-[#E4B77D]/40 hover:from-[#E4B77D]/40 hover:via-[#E4B77D]/50 hover:to-[#E4B77D]/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-[#a1a1aa]">
          {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-[#E4B77D] hover:text-[#f9e0bd] transition underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}
