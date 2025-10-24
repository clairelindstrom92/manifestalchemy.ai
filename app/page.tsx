'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import AIChatInterface from '../components/AIChatInterface';
import ManifestationDashboard from '../components/ManifestationDashboard';
import AnimatedStarBackground from '../components/AnimatedStarBackground';
import { ManifestationProject } from '../types';

// InstantText Component - shows text immediately
const InstantText = ({ text, className, delay = 0 }: { text: string; className: string; delay?: number }) => {
  return (
    <motion.p 
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {text}
    </motion.p>
  );
};

type AppState = 'welcome' | 'chat' | 'dashboard' | 'manifestation-';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [savedProject, setSavedProject] = useState<ManifestationProject | null>(null);
  const [selectedManifestation, setSelectedManifestation] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved project in localStorage
    const saved = localStorage.getItem('manifestationProject');
    if (saved) {
      try {
        const project = JSON.parse(saved);
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setSavedProject(project);
          setAppState('dashboard');
        }, 0);
      } catch (error) {
        console.error('Error parsing saved project:', error);
      }
    }
  }, []);

  const handleStartChat = () => {
    setAppState('chat');
  };

  const handleChatComplete = (project: ManifestationProject) => {
    setSavedProject(project);
    setAppState('dashboard');
  };

  const handleRestart = () => {
    localStorage.removeItem('manifestationProject');
    setSavedProject(null);
    setAppState('welcome');
  };

  const handleManifestationClick = (manifestationId: string) => {
    setSelectedManifestation(manifestationId);
    setAppState('manifestation-');
  };

  const handleContinueProject = () => {
    setAppState('dashboard');
  };

  if (appState === 'chat') {
    return <AIChatInterface onComplete={handleChatComplete} />;
  }

  if (appState === 'dashboard' && savedProject) {
    return (
      <div className="relative">
        <AnimatedStarBackground />
        <ManifestationDashboard 
          project={savedProject} 
          onRestart={handleRestart}
          onManifestationClick={handleManifestationClick}
        />
      </div>
    );
  }

  if (appState === 'manifestation-' && savedProject && selectedManifestation) {
    return (
      <div className="relative">
        <AnimatedStarBackground />
        <AIChatInterface 
          onComplete={handleChatComplete}
          manifestationId={selectedManifestation}
          project={savedProject}
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 25%, #0f0f23 50%, #000000 100%)'
      }}
    >
      {/* Animated stars overlay */}
      <AnimatedStarBackground />

      <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Custom Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mb-8"
            >
              <div className="w-32 h-32 mx-auto flex items-center justify-center">
                <img 
                  src="/custom-logo.png" 
                  alt="Manifest Alchemy Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
            
            {/* Title with elegant script-like styling */}
            <motion.h1 
              className="text-6xl md:text-7xl font-bold text-white mb-4 ballet-font"
              style={{ 
                textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                letterSpacing: '0.05em'
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Manifest Alchemy
            </motion.h1>
            
            <InstantText 
              text="Transform your dreams into reality with personalized manifestation plans. I'm Aurelia, your AI manifestation coach, and I'm here to guide you on your journey."
              className="text-xl text-white mb-12 leading-relaxed max-w-lg mx-auto"
              delay={0.7}
            />

            <div className="space-y-6">
            <motion.button
              onClick={handleStartChat}
              className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              BEGIN MANIFESTING WITH AI
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Debug Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="text-center"
            >
              <a
                href="/log"
                className="text-white/50 hover:text-white/80 text-sm transition-colors"
              >
                Debug Logs
              </a>
            </motion.div>

              {savedProject && (
                <motion.button
                  onClick={handleContinueProject}
                  className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-transparent text-white border-2 border-white/30 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-white/20 hover:text-white backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  Continue Your Project
                </motion.button>
              )}
            </div>

            {/* Feature cards with mystical styling */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
            >
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-2xl">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Personalized Goals
                </h3>
                <p className="text-white/80 text-sm">
                  Tell me about your dreams and I&apos;ll create a custom plan just for you.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-2xl">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Actionable Steps
                </h3>
                <p className="text-white/80 text-sm">
                  Get practical, immediate actions you can take today to move forward.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-2xl">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Track Progress
                </h3>
                <p className="text-white/80 text-sm">
                  Monitor your journey and celebrate every step towards your goal.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
  );
}
