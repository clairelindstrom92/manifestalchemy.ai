'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';
import AnimatedStarBackground from '../components/AnimatedStarBackground';
import Dashboard from '../components/Dashboard';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const { user, loading } = useSupabaseUser();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-[#E4B77D]/40 border-t-[#E4B77D] animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(228,183,125,0.1) 0%, transparent 70%)',
        }}
      />
      <AnimatedStarBackground />

      {/* Top nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-[#E4B77D]/30">
            <Image src="/custom-logo.png" alt="Logo" width={28} height={28} className="w-full h-full object-cover" />
          </div>
          <span className="text-white/60 text-sm font-medium tracking-wide">Manifest Alchemy</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="text-[#E4B77D]/70 hover:text-[#E4B77D] text-sm transition-colors border border-[#E4B77D]/20 hover:border-[#E4B77D]/40 px-4 py-1.5 rounded-full"
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div
            className="w-28 h-28 mx-auto rounded-full overflow-hidden border border-[#E4B77D]/25"
            style={{
              boxShadow: '0 0 60px rgba(228,183,125,0.2), 0 0 120px rgba(228,183,125,0.08)',
            }}
          >
            <Image
              src="/custom-logo.png"
              alt="Manifest Alchemy"
              width={112}
              height={112}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </motion.div>

        {/* Tagline badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] mb-5 border border-[#E4B77D]/20 bg-[#E4B77D]/8 text-[#E4B77D]/70"
        >
          <Sparkles className="w-3 h-3" />
          <span>AI-Powered Manifestation Coaching</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl sm:text-5xl text-white mb-4 tracking-tight"
          style={{
            fontFamily: "'Ballet', cursive",
            letterSpacing: '0.06em',
            textShadow: '0 0 40px rgba(228,183,125,0.3)',
          }}
        >
          Manifest Alchemy
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-white/40 text-base leading-relaxed mb-10 max-w-sm"
        >
          Transform your deepest desires into reality through AI-guided intention setting,
          vision boards, and aligned action plans.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs"
        >
          <button
            onClick={() => router.push('/login')}
            className="relative w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#0a0a0f] transition-all duration-200 hover:brightness-110 active:scale-[0.97] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #E4B77D 0%, #F0C896 50%, #E4B77D 100%)',
              boxShadow: '0 0 30px rgba(228,183,125,0.3)',
            }}
          >
            <span>Begin Your Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-white/20 text-xs mt-8"
        >
          Mystical. Methodical. Transformative.
        </motion.p>
      </div>
    </div>
  );
}
