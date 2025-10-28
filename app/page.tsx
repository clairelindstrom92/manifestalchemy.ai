'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ChatInterface from '../components/ChatInterface';
import Sidebar from '../components/Sidebar';
import AnimatedStarBackground from '../components/AnimatedStarBackground';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

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
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top left, rgba(212, 175, 55, 0.6) 0%, rgba(139, 105, 20, 0.5) 20%, rgba(74, 52, 16, 0.4) 40%, rgba(45, 31, 15, 0.3) 60%, rgba(26, 17, 8, 0.2) 80%, rgba(0, 0, 0, 0.8) 100%)'
      }}
    >
      {/* Background image overlay */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: 'url("/BACKGROUND.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      {/* Animated stars overlay */}
      <AnimatedStarBackground />

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
              {/* Magical aura background */}
              <div 
                className="absolute inset-0 blur-xl opacity-60"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.4) 0%, rgba(255, 165, 0, 0.3) 30%, rgba(255, 140, 0, 0.2) 60%, transparent 100%)',
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
                  background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.6) 0%, rgba(255, 165, 0, 0.4) 50%, transparent 100%)',
                  zIndex: -1
                }}
              ></motion.div>
              
              <motion.h1 
                className="relative text-3xl md:text-3xl text-white ballet-font z-10"
                style={{ 
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 165, 0, 0.4)',
                  letterSpacing: '0.1em'
                }}
              >
                Manifest Alchemy
              </motion.h1>
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
                  filter: 'drop-shadow(0 0 25px rgba(255, 215, 0, 0.7)) drop-shadow(0 0 50px rgba(255, 165, 0, 0.5))',
                }}
              >
                {/* Glowing orb in center background */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.4, 1.4, 1.4, 1.4, 1],
                    opacity: [0.4, 0.7, 0.7, 0.7, 0.7, 0.4]
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.2, 1],
                    times: [0, 0.3, 0.4, 0.7, 0.8, 1],
                    delay: 1.3
                  }}
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.9) 0%, rgba(255, 165, 0, 0.7) 25%, rgba(255, 140, 0, 0.5) 50%, rgba(255, 120, 0, 0.3) 75%, transparent 100%)',
                    zIndex: -1
                  }}
                ></motion.div>
                
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
              className="relative w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/10 via-amber-300/15 to-yellow-400/10 hover:from-yellow-400/20 hover:via-amber-300/25 hover:to-yellow-400/20 text-white rounded-full text-xs font-medium transition-all duration-500 transform hover:scale-105 shadow-lg backdrop-blur-sm border border-yellow-300/20 hover:border-yellow-300/40 overflow-hidden"
              style={{
                fontFamily: "'Quicksand', 'Poppins', sans-serif",
                letterSpacing: '0.15em',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)',
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
                <div className="absolute top-2 left-4 w-1 h-1 bg-yellow-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                <div className="absolute top-3 right-6 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-70" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
                <div className="absolute bottom-2 left-8 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
                <div className="absolute bottom-3 right-4 w-1 h-1 bg-amber-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1.5s', animationDuration: '2.2s' }}></div>
                <div className="absolute top-1/2 left-2 w-1 h-1 bg-yellow-200 rounded-full animate-ping opacity-40" style={{ animationDelay: '2s', animationDuration: '2.8s' }}></div>
                <div className="absolute top-1/2 right-2 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-55" style={{ animationDelay: '2.5s', animationDuration: '2.3s' }}></div>
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