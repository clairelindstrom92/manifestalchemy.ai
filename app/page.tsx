'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ChatInterface from '../components/ChatInterface';
import Sidebar from '../components/Sidebar';
import AnimatedStarBackground from '../components/AnimatedStarBackground';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { supabase } from '@/lib/supabaseClient';

type AppState = 'welcome' | 'chat';

interface ProjectData {
  id?: string;
  title?: string;
  messages?: string;
  updated_at?: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, loading } = useSupabaseUser();
  const router = useRouter();

  const handleStartChat = () => {
    setAppState('chat');
  };

  const handleBackToWelcome = () => {
    setAppState('welcome');
  };

  const handleProjectUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProjectCreated = (project: ProjectData) => {
    setSelectedProject(project);
  };

  const handleProjectDeleted = () => {
    setSelectedProject(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (appState === 'chat') {
    return (
      <div className="flex h-screen">
        {/* Sidebar only for logged-in users */}
        {user && (
          <Sidebar
            onSelectProject={(p) => setSelectedProject(p)}
            onNewProject={() => setSelectedProject(null)}
            refreshTrigger={refreshTrigger}
          />
        )}
        <div className="flex-1 relative">
          <ChatInterface 
            project={selectedProject} 
            onBack={handleBackToWelcome}
            onProjectUpdate={handleProjectUpdate}
            onProjectCreated={handleProjectCreated}
            onProjectDeleted={handleProjectDeleted}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f] relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#151520] to-[#0a0a0f]"></div>
      {/* Animated stars overlay */}
      <AnimatedStarBackground />

      {/* Login/Logout button in top right */}
      <div className="absolute top-4 right-4 z-20">
        {user ? (
          <button
            onClick={handleLogout}
            className="relative bg-gradient-to-r from-indigo-500/20 via-blue-500/25 to-indigo-500/20 hover:from-indigo-500/30 hover:via-blue-500/35 hover:to-indigo-500/30 border border-indigo-400/30 hover:border-indigo-400/40 text-[#f5f5f7] px-4 py-2 rounded-full transition-all duration-500 backdrop-blur-sm overflow-hidden text-xs font-medium"
            style={{
              textShadow: '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)',
              fontFamily: "'Quicksand', 'Poppins', sans-serif",
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
            <span className="relative z-10">Logout</span>
          </button>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="relative bg-gradient-to-r from-indigo-500/20 via-blue-500/25 to-indigo-500/20 hover:from-indigo-500/30 hover:via-blue-500/35 hover:to-indigo-500/30 border border-indigo-400/30 hover:border-indigo-400/40 text-[#f5f5f7] px-4 py-2 rounded-full transition-all duration-500 backdrop-blur-sm overflow-hidden text-xs font-medium"
            style={{
              textShadow: '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)',
              fontFamily: "'Quicksand', 'Poppins', sans-serif",
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
            <div className="absolute top-1 left-2 w-1 h-1 bg-indigo-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
            <div className="absolute bottom-1 right-2 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
            <span className="relative z-10">Login</span>
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Title with magical aura styling */}
            <motion.div
              className="relative mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {/* Blue aura background */}
              <div 
                className="absolute inset-0 blur-xl opacity-60"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.3) 30%, rgba(124, 58, 237, 0.2) 60%, transparent 100%)',
                  transform: 'scale(1.5)',
                  zIndex: -1
                }}
              ></div>
              
              {/* Pulsing glow effect */}
              <motion.div
                className="absolute inset-0 blur-lg opacity-40"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.6) 0%, rgba(139, 92, 246, 0.4) 50%, transparent 100%)',
                  zIndex: -1
                }}
              ></motion.div>
              
              <motion.h1 
                className="relative text-3xl md:text-4xl text-white ballet-font z-10"
                style={{ 
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(99, 102, 241, 0.6), 0 0 60px rgba(139, 92, 246, 0.4)',
                  letterSpacing: '0.1em'
                }}
              >
                Manifest Alchemy
              </motion.h1>
              <p className="text-[#a1a1aa] text-sm mt-2">Transform your dreams into reality</p>
            </motion.div>
            {/* Custom Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
                transition: { duration: 1, delay: 0.3 }
              }}
              className="mb-8"
            >
              <motion.div 
                className="w-60 h-60 mx-auto flex items-center justify-center relative"
                animate={{ 
                  scale: [1, 1.2, 1.2, 0.6, 0.6, 1],
                  opacity: [0.9, 1, 1, 0.8, 0.8, 0.9]
                }}
                transition={{ 
                  duration: 20, 
                  repeat: Infinity, 
                  ease: [0.4, 0, 0.2, 1],
                  times: [0, 0.3, 0.4, 0.7, 0.8, 1],
                  delay: 1.3
                }}
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))',
                }}
              >
                
                <Image 
                  src="/custom-logo.png" 
                  alt="Manifest Alchemy Logo" 
                  width={240}
                  height={240}
                  className="w-full h-full object-contain relative z-10"
                />
              </motion.div>
            </motion.div>
            
            <div className="space-y-6">
            <motion.button
              onClick={handleStartChat}
              className="relative w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 via-blue-500/15 to-indigo-500/10 hover:from-indigo-500/20 hover:via-blue-500/25 hover:to-indigo-500/20 text-white rounded-full text-xs font-medium transition-all duration-500 transform hover:scale-105 shadow-lg backdrop-blur-sm border border-indigo-400/20 hover:border-indigo-400/40 overflow-hidden"
              style={{
                fontFamily: "'Quicksand', 'Poppins', sans-serif",
                letterSpacing: '0.15em',
                textShadow: '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)',
                textTransform: 'uppercase'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              {/* Sparkle particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-4 w-1 h-1 bg-indigo-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                <div className="absolute top-3 right-6 w-1 h-1 bg-blue-200 rounded-full animate-ping opacity-70" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
                <div className="absolute bottom-2 left-8 w-1 h-1 bg-indigo-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
                <div className="absolute bottom-3 right-4 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1.5s', animationDuration: '2.2s' }}></div>
                <div className="absolute top-1/2 left-2 w-1 h-1 bg-indigo-200 rounded-full animate-ping opacity-40" style={{ animationDelay: '2s', animationDuration: '2.8s' }}></div>
                <div className="absolute top-1/2 right-2 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-55" style={{ animationDelay: '2.5s', animationDuration: '2.3s' }}></div>
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
              
              {/* Magical text with character-by-character animation */}
              <span className="relative z-10">
                {Array.from("I'M READY TO MANIFEST MY DREAMS").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: 0.9 + (index * 0.05),
                      ease: "easeOut"
                    }}
                    className="inline-block"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </span>
            </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
  );
}