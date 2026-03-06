'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import AnimatedStarBackground from '@/components/AnimatedStarBackground';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage('Check your inbox to confirm your email before signing in.');
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.user) { router.push('/'); router.refresh(); }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = mode === 'signup';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(228,183,125,0.09) 0%, transparent 70%)',
        }}
      />
      <AnimatedStarBackground />

      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-5 left-5 z-20 p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
        aria-label="Back"
      >
        <ArrowLeft size={18} />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-full overflow-hidden border border-[#E4B77D]/25 mb-4"
            style={{ boxShadow: '0 0 40px rgba(228,183,125,0.18)' }}
          >
            <Image src="/custom-logo.png" alt="Manifest Alchemy" width={64} height={64} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#E4B77D]/60 mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Manifest Alchemy AI</span>
          </div>
          <h1 className="text-xl font-semibold text-white/90 text-center">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-white/35 text-sm mt-1 text-center">
            {isSignUp ? 'Begin your manifestation journey' : 'Continue manifesting your dreams'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0e0e18] border border-white/6 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-1.5 text-white/40">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#E4B77D]/40 focus:ring-1 focus:ring-[#E4B77D]/20 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium mb-1.5 text-white/40">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#E4B77D]/40 focus:ring-1 focus:ring-[#E4B77D]/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {message && (
              <div className="text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-[#0a0a0f] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: 'linear-gradient(135deg, #E4B77D 0%, #F0C896 50%, #E4B77D 100%)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(228,183,125,0.2)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing {isSignUp ? 'up' : 'in'}...</span>
                </span>
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-5 text-xs text-center text-white/30">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(null); setMessage(null); }}
              className="text-[#E4B77D]/80 hover:text-[#E4B77D] transition-colors underline-offset-2 hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
