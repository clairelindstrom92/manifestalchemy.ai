'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw, Home, MessageCircle, Target, Calendar, TrendingUp, Zap, Heart, Eye } from 'lucide-react';
import { ManifestationProject, DiscoveredManifestation } from '../types';
import MagicalBackground from './shared/MagicalBackground';
import MagicalButton from './shared/MagicalButton';
import { MAGICAL_STYLES } from '../lib/constants';

interface ManifestationDashboardProps {
  project: ManifestationProject;
  onRestart: () => void;
  onManifestationClick: (manifestationId: string) => void;
}

interface ManifestationIcon {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  dynamic: string;
  status: DiscoveredManifestation['status'];
  confidence: number;
}

export default function ManifestationDashboard({ project, onRestart, onManifestationClick }: ManifestationDashboardProps) {
  const [selectedManifestation, setSelectedManifestation] = useState<string | null>(null);

  // Memoized helper functions for dynamic manifestation tiles
  const getIconForCategory = useMemo(() => (category: string): React.ReactNode => {
    switch (category.toLowerCase()) {
      case 'primary':
      case 'core':
        return <Target className="w-8 h-8" />;
      case 'environment':
      case 'surrounding':
        return <Home className="w-8 h-8" />;
      case 'emotion':
      case 'frequency':
        return <Heart className="w-8 h-8" />;
      case 'symbols':
      case 'sigils':
        return <Eye className="w-8 h-8" />;
      case 'energy':
      case 'vibration':
        return <Zap className="w-8 h-8" />;
      default:
        return <Sparkles className="w-8 h-8" />;
    }
  }, []);

  const getColorForStatus = useMemo(() => (status: DiscoveredManifestation['status']): string => {
    switch (status) {
      case 'discovered':
        return 'from-yellow-400/20 via-amber-300/25 to-yellow-400/20';
      case 'active':
        return 'from-yellow-400/30 via-amber-300/35 to-yellow-400/30';
      case 'materializing':
        return 'from-yellow-400/40 via-amber-300/45 to-yellow-400/40';
      case 'manifested':
        return 'from-yellow-400/50 via-amber-300/55 to-yellow-400/50';
      default:
        return 'from-yellow-400/20 via-amber-300/25 to-yellow-400/20';
    }
  }, []);

  const getStatusText = useMemo(() => (status: DiscoveredManifestation['status']): string => {
    switch (status) {
      case 'discovered':
        return 'Newly discovered';
      case 'active':
        return 'Actively manifesting';
      case 'materializing':
        return 'Materializing now';
      case 'manifested':
        return 'Manifested ✨';
      default:
        return 'Discovered';
    }
  }, []);

  // Memoized manifestations array
  const manifestations: ManifestationIcon[] = useMemo(() => 
    project.discoveredManifestations?.map(manifestation => ({
      id: manifestation.id,
      name: manifestation.name,
      icon: getIconForCategory(manifestation.category),
      color: getColorForStatus(manifestation.status),
      description: manifestation.description,
      dynamic: `${manifestation.category} — ${getStatusText(manifestation.status)}`,
      status: manifestation.status,
      confidence: manifestation.confidence
    })) || [],
    [project.discoveredManifestations, getIconForCategory, getColorForStatus, getStatusText]
  );

  const handleManifestationClick = (manifestationId: string) => {
    setSelectedManifestation(manifestationId);
    onManifestationClick(manifestationId);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <MagicalBackground />
      
      <div className="relative z-10 p-6">
        {/* Magical Header */}
        <motion.div 
          className="flex items-center justify-between mb-8 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            {/* Glowing Logo */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative"
            >
              <img 
                src="/custom-logo.png" 
                alt="Manifest Alchemy" 
                className="w-12 h-12"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))'
                }}
              />
            </motion.div>
            
            {/* Magical Title */}
            <motion.h1 
              className="text-4xl font-bold text-white ballet-font"
              style={{
                textShadow: MAGICAL_STYLES.textShadow,
                letterSpacing: MAGICAL_STYLES.letterSpacing
              }}
            >
              Alchemy Board
            </motion.h1>
          </div>
          
          {/* Magical Restart Button */}
          <MagicalButton
            onClick={onRestart}
            size="md"
            title="Clear the board and begin a fresh casting."
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Recast Session
            </div>
          </MagicalButton>
        </motion.div>

      {/* Magical Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 relative z-10"
      >
        {/* Pulsing background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-amber-300/15 to-yellow-400/10 rounded-3xl blur-xl"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        <h2 
          className="text-3xl font-semibold text-white mb-4 relative z-10"
          style={{
            textShadow: MAGICAL_STYLES.textShadow,
            fontFamily: MAGICAL_STYLES.fontFamily,
            letterSpacing: MAGICAL_STYLES.letterSpacing
          }}
        >
          Welcome back, {project.userData.userName || 'Manifestor'}. Manifest Alchemy AI is attuned.
        </h2>
        
        <p 
          className="text-white/80 text-lg max-w-2xl mx-auto relative z-10"
          style={{
            textShadow: MAGICAL_STYLES.textShadowSubtle,
            fontFamily: MAGICAL_STYLES.fontFamily
          }}
        >
          Choose a tile to continue your manifestation.
        </p>
      </motion.div>

      {/* Empty State - No Manifestations Discovered Yet */}
      {manifestations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-16 relative z-10"
        >
          {/* Pulsing background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-amber-300/15 to-yellow-400/10 rounded-3xl blur-xl"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <div className="bg-gradient-to-r from-yellow-400/10 via-amber-300/15 to-yellow-400/10 backdrop-blur-sm rounded-2xl p-12 max-w-2xl mx-auto border border-yellow-300/20 relative z-10">
            {/* Breathing logo */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-6"
            >
              <img 
                src="/custom-logo.png" 
                alt="Manifest Alchemy" 
                className="w-16 h-16 mx-auto"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))'
                }}
              />
            </motion.div>
            
            <h2 
              className="text-2xl font-semibold text-white mb-4"
              style={{
                textShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 165, 0, 0.4)',
                fontFamily: "'Quicksand', 'Poppins', sans-serif",
                letterSpacing: '0.05em'
              }}
            >
              Manifest Alchemy AI is listening...
            </h2>
            
            <p 
              className="text-white/80 text-lg mb-8"
              style={{
                textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
                fontFamily: "'Quicksand', 'Poppins', sans-serif"
              }}
            >
              Begin a conversation to discover your manifestations.
            </p>
            
            <MagicalButton
              onClick={() => onManifestationClick('new-conversation')}
              size="lg"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Start Manifestation Discovery
              </div>
            </MagicalButton>
          </div>
        </motion.div>
      )}

      {/* Manifestation Cards with Golden Theme - Only show if manifestations exist */}
      {manifestations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {manifestations.map((manifestation, index) => (
          <motion.div
            key={manifestation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group cursor-pointer"
            onClick={() => handleManifestationClick(manifestation.id)}
          >
            <div className={`
              relative bg-gradient-to-br from-yellow-400/20 via-amber-300/25 to-yellow-400/20
              rounded-3xl p-8 text-center shadow-2xl backdrop-blur-sm
              border border-yellow-300/20 hover:border-yellow-300/40
              transform transition-all duration-300 
              group-hover:scale-105 group-hover:shadow-3xl
              ${selectedManifestation === manifestation.id ? 'ring-4 ring-yellow-300/50 scale-105' : ''}
              overflow-hidden
            `}>
              {/* Sparkle particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-1 h-1 bg-yellow-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-6 right-6 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-70" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-4 left-6 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '2s' }}></div>
              </div>
              
              {/* Icon with Golden Glow */}
              <div className="text-white mb-4 flex justify-center">
                <div 
                  className="p-3 rounded-full bg-gradient-to-r from-yellow-400/30 to-amber-300/30"
                  style={{
                    filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))'
                  }}
                >
                  {manifestation.icon}
                </div>
              </div>
              
              {/* Name with Magical Glow */}
              <h3 
                className="text-xl font-bold text-white mb-2"
                style={{
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
                  fontFamily: "'Quicksand', 'Poppins', sans-serif",
                  letterSpacing: '0.05em'
                }}
              >
                {manifestation.name}
              </h3>
              
              {/* Description */}
              <p className="text-white/80 text-sm leading-relaxed mb-2">
                {manifestation.description}
              </p>
              
              {/* Dynamic Content */}
              <p className="text-white/90 text-xs leading-relaxed font-medium">
                {manifestation.dynamic}
              </p>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent transform -skew-x-12 animate-shimmer rounded-3xl pointer-events-none overflow-hidden" style={{ animationDuration: '4s' }}></div>
              
              {/* Confidence Indicator */}
              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: manifestation.confidence > 0.8 ? '#10b981' : manifestation.confidence > 0.6 ? '#f59e0b' : '#ef4444',
                    boxShadow: `0 0 10px ${manifestation.confidence > 0.8 ? 'rgba(16, 185, 129, 0.6)' : manifestation.confidence > 0.6 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(239, 68, 68, 0.6)'}`
                  }}
                />
              </div>
              
              {/* Click Indicator */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse" style={{ boxShadow: '0 0 10px rgba(255, 215, 0, 0.6)' }} />
              </div>
            </div>
          </motion.div>
        ))}
        </div>
      )}

      </div>
    </div>
  );
}