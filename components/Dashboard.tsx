'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MessageCircle,
  Sparkles,
  Heart,
  Calendar,
  Send,
  BookOpen,
  UserPlus,
  LogOut,
  Moon,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AnimatedStarBackground from '@/components/AnimatedStarBackground';

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

const NAV_ITEMS = [
  {
    icon: MessageCircle,
    label: 'Manifest',
    description: 'Start a new AI session',
    route: '/chat',
    gradient: 'from-[#E4B77D]/20 to-[#E4B77D]/5',
    border: 'border-[#E4B77D]/25',
  },
  {
    icon: Sparkles,
    label: 'Manifestations',
    description: 'View & manage your goals',
    route: '/dashboard/manifestations',
    gradient: 'from-[#E4B77D]/20 to-[#E4B77D]/5',
    border: 'border-[#E4B77D]/25',
  },
  {
    icon: Heart,
    label: 'Affirmations',
    description: 'Your daily power words',
    route: '/dashboard/affirmations',
    gradient: 'from-[#E4B77D]/20 to-[#E4B77D]/5',
    border: 'border-[#E4B77D]/25',
  },
  {
    icon: BookOpen,
    label: 'Inspirations',
    description: 'Curated wisdom & quotes',
    route: '/dashboard/inspirations',
    gradient: 'from-[#E4B77D]/20 to-[#E4B77D]/5',
    border: 'border-[#E4B77D]/25',
  },
  {
    icon: Send,
    label: 'Feed',
    description: 'Community manifestations',
    route: '/dashboard/feed',
    gradient: 'from-[#E4B77D]/20 to-[#E4B77D]/5',
    border: 'border-[#E4B77D]/25',
  },
  {
    icon: UserPlus,
    label: 'Friends',
    description: 'Connect & inspire others',
    route: '/dashboard/friends',
    gradient: 'from-[#E4B77D]/20 to-[#E4B77D]/5',
    border: 'border-[#E4B77D]/25',
  },
  {
    icon: Calendar,
    label: 'Birth Chart',
    description: 'Cosmic alignment insights',
    route: '/dashboard/birth-chart',
    gradient: 'from-[#E4B77D]/20 to-[#E4B77D]/5',
    border: 'border-[#E4B77D]/25',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(228,183,125,0.12) 0%, transparent 70%)',
        }}
      />
      <AnimatedStarBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E4B77D]/30">
            <Image src="/custom-logo.png" alt="Logo" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white/40 text-xs leading-none">{greeting()}</p>
            <p className="text-white/80 text-sm font-medium mt-0.5 leading-none truncate max-w-[200px]">
              {userEmail ? userEmail.split('@')[0] : 'Alchemist'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Moon className="w-4 h-4 text-[#E4B77D]/60" strokeWidth={1.5} />
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 text-center pt-10 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-5 border border-[#E4B77D]/20 bg-[#E4B77D]/8 text-[#E4B77D]/80"
          >
            <Sparkles className="w-3 h-3" />
            <span>Your manifestation portal</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-light text-white mb-3 tracking-tight"
            style={{ fontFamily: "'Ballet', cursive", letterSpacing: '0.04em' }}
          >
            Manifest Alchemy
          </h1>
          <p className="text-white/35 text-sm max-w-xs mx-auto leading-relaxed">
            Transform your desires into reality through intention, alchemy, and aligned action.
          </p>
        </motion.div>
      </div>

      {/* Navigation Grid */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {NAV_ITEMS.map((navItem) => {
            const Icon = navItem.icon;
            return (
              <motion.button
                key={navItem.label}
                variants={item}
                onClick={() => {
                  if (onNavigate) onNavigate(navItem.label);
                  router.push(navItem.route);
                }}
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97 }}
                className={`relative group flex flex-col items-center text-center p-5 rounded-2xl border bg-gradient-to-br backdrop-blur-sm transition-all duration-300 hover:border-[#E4B77D]/50 ${navItem.gradient} ${navItem.border} bg-white/2`}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 border border-[#E4B77D]/20 bg-[#E4B77D]/10 group-hover:bg-[#E4B77D]/20 transition-colors"
                >
                  <Icon className="w-5 h-5 text-[#E4B77D]" strokeWidth={1.5} />
                </div>
                <span className="text-white/85 font-medium text-sm mb-1">{navItem.label}</span>
                <span className="text-white/30 text-[11px] leading-snug">{navItem.description}</span>

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-[#E4B77D]/0 group-hover:bg-[#E4B77D]/4 transition-colors pointer-events-none" />
              </motion.button>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
