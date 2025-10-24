'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw, Home, MessageCircle, Target, Calendar, TrendingUp } from 'lucide-react';
import { ManifestationProject } from '../types';

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
}

export default function ManifestationDashboard({ project, onRestart, onManifestationClick }: ManifestationDashboardProps) {
  const [selectedManifestation, setSelectedManifestation] = useState<string | null>(null);

  // Extract manifestations from the project data
  const manifestations: ManifestationIcon[] = [
    {
      id: 'primary',
      name: project.userData.manifestation_title || 'Primary Manifestation',
      icon: <Target className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      description: project.userData.manifestation_category || 'Your main manifestation focus'
    },
    {
      id: 'environment',
      name: 'Environment',
      icon: <Home className="w-8 h-8" />,
      color: 'from-green-500 to-teal-500',
      description: project.userData.environment_description || 'Your ideal environment'
    },
    {
      id: 'emotion',
      name: 'Emotional State',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500',
      description: `Feeling: ${project.userData.core_emotion || 'Your desired emotional state'}`
    },
    {
      id: 'symbols',
      name: 'Symbolic Elements',
      icon: <MessageCircle className="w-8 h-8" />,
      color: 'from-blue-500 to-indigo-500',
      description: project.userData.symbolic_elements || 'Your symbolic representations'
    }
  ];

  const handleManifestationClick = (manifestationId: string) => {
    setSelectedManifestation(manifestationId);
    onManifestationClick(manifestationId);
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white ballet-font">
            Manifestation Dashboard
          </h1>
        </div>
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Start Over
        </button>
      </div>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">
          Welcome back, {project.userData.userName || 'Manifestor'}! ✨
        </h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Your manifestations are ready for deep exploration. Click on any manifestation below to begin your personalized journey with Aurelia, your Manifest Alchemist.
        </p>
      </motion.div>

      {/* Manifestation Icons Grid */}
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
              relative bg-gradient-to-br ${manifestation.color} 
              rounded-3xl p-8 text-center shadow-2xl 
              transform transition-all duration-300 
              group-hover:scale-105 group-hover:shadow-3xl
              ${selectedManifestation === manifestation.id ? 'ring-4 ring-white/50 scale-105' : ''}
            `}>
              {/* Icon */}
              <div className="text-white mb-4 flex justify-center">
                {manifestation.icon}
              </div>
              
              {/* Name */}
              <h3 className="text-xl font-bold text-white mb-2">
                {manifestation.name}
              </h3>
              
              {/* Description */}
              <p className="text-white/80 text-sm leading-relaxed">
                {manifestation.description}
              </p>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-white/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Click Indicator */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-12"
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-3">
            How to Use Your Dashboard
          </h3>
          <div className="space-y-2 text-white/70">
            <p>• Click on any manifestation to start a deep conversation with Aurelia</p>
            <p>• Each manifestation has its own specialized AI agent</p>
            <p>• Get personalized tasks and insights for each area</p>
            <p>• Track your progress and celebrate your wins</p>
          </div>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-12"
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">
            Your Manifestation Journey
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Daily Practice</h4>
              <p className="text-white/70 text-sm">
                Consistent daily actions toward your manifestations
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Progress Tracking</h4>
              <p className="text-white/70 text-sm">
                Monitor your growth and celebrate milestones
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">AI Guidance</h4>
              <p className="text-white/70 text-sm">
                Personalized support from your Manifest Alchemist
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}