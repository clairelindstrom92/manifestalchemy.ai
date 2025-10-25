'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ManifestationProject, DiscoveredManifestation } from '../types';
import MagicalBackground from './shared/MagicalBackground';
import MagicalButton from './shared/MagicalButton';
import MagicalInput from './shared/MagicalInput';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useConversation } from '../hooks/useConversation';
import { MAGICAL_STYLES } from '../lib/constants';

interface ChatInterfaceProps {
  onComplete: (project: ManifestationProject) => void;
  manifestationId?: string;
  project?: ManifestationProject;
}

export default function ChatInterface({ onComplete, manifestationId, project }: ChatInterfaceProps) {
  const [currentInput, setCurrentInput] = useState('');
  
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const { 
    history, 
    isThinking, 
    manifestationState,
    progressVelocity,
    saturationLevel,
    nextActions,
    extractedData, 
    sendMessage, 
    currentAIMessage,
    readyForDashboard
  } = useConversation();

  // Update input when speech recognition completes
  React.useEffect(() => {
    if (transcript) {
      setCurrentInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(currentInput);
    setCurrentInput('');
  };

  const generateManifestations = useCallback(async () => {

    try {
      // Discover manifestations from conversation
      const discoveryResponse = await fetch('/api/discover-manifestations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: history,
          extractedData,
          existingManifestations: []
        }),
      });

      let discoveredManifestations = [];
      if (discoveryResponse.ok) {
        const discoveryData = await discoveryResponse.json();
        discoveredManifestations = discoveryData.discoveredManifestations?.map((manifestation: DiscoveredManifestation) => ({
          id: `manifestation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: manifestation.name,
          description: manifestation.description,
          category: manifestation.category,
          discoveredAt: new Date(),
          conversationId: `conv-${Date.now()}`,
          confidence: manifestation.confidence,
          status: manifestation.status,
          source: 'ai-conversation' as const,
          details: manifestation.details,
          agentType: manifestation.agentType,
          causalMap: manifestation.causalMap,
          microActions: manifestation.microActions,
          synchronicityTriggers: manifestation.synchronicityTriggers
        })) || [];
      }

      // Generate the manifestation plan
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            manifestation: history.map(msg => msg.content).join(' '),
            extractedData
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await response.json();
      
      const project: ManifestationProject = {
        id: Date.now().toString(),
        userData: {
          userName: 'Manifestor',
          manifestation_category: 'general',
          environment_description: 'Current reality',
          core_emotion: 'determined',
          symbolic_elements: history.map(msg => msg.content).join(' '),
          manifestation_title: extractedData.coreDesire || 'Your manifestation'
        },
        steps: (data.alchemy_sequences || data.steps || []).map((step: string, index: number) => ({
          id: `step-${index}`,
          title: `Step ${index + 1}`,
          description: step,
          actionable: true,
          timeframe: 'flexible'
        })),
        createdAt: new Date(),
        completedSteps: [],
        discoveredManifestations: discoveredManifestations,
        activeConversations: [`conv-${Date.now()}`]
      };

      onComplete(project);
    } catch (error) {
      console.error('Error generating manifestations:', error);
    }
  }, [readyForDashboard, history, extractedData, onComplete]);

  // Manual generation - user clicks button when ready

  return (
    <div className="min-h-screen relative overflow-hidden">
      <MagicalBackground />
      
      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            {/* Contextual Title */}
            <motion.h2 
              className="text-2xl md:text-3xl text-white mb-2 font-light relative"
              style={{ 
                textShadow: MAGICAL_STYLES.textShadow,
                fontFamily: MAGICAL_STYLES.fontFamily,
                letterSpacing: MAGICAL_STYLES.letterSpacing,
                textTransform: 'uppercase'
              }}
            >
              {manifestationId && project
                ? 'RE-ENTERING MANIFESTATION PORTAL'
                : 'WHAT ARE YOU HERE TO MANIFEST?'}
            </motion.h2>
            {manifestationId && project && (
              <div className="text-white/70 text-sm mb-6">
                {project.userData?.manifestation_title || 'Active Manifestation'}
              </div>
            )}

            {/* Pulsing background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-amber-300/15 to-yellow-400/10 rounded-3xl blur-xl"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* AI Thinking Animation */}
            {isThinking && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-4"
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
                <p 
                  className="text-white/60 text-lg"
                  style={{
                    fontFamily: MAGICAL_STYLES.fontFamily
                  }}
                >
                  Manifest Alchemy AI is analyzing...
                </p>
              </motion.div>
            )}

            {/* Current AI Message */}
            {currentAIMessage && !isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div 
                  className="text-white text-lg leading-relaxed max-w-2xl mx-auto"
                  style={{
                    textShadow: MAGICAL_STYLES.textShadowSubtle,
                    fontFamily: MAGICAL_STYLES.fontFamily
                  }}
                >
                  {currentAIMessage.content}
                </div>
              </motion.div>
            )}

            {/* Manifestation State Display */}
            {manifestationState !== 'discovered' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
              >
                <div className="bg-gradient-to-r from-yellow-400/20 via-amber-300/25 to-yellow-400/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-300/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm font-medium">Manifestation State</span>
                    <span className="text-yellow-300 text-sm font-bold capitalize">{manifestationState}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm font-medium">Progress Velocity</span>
                    <span className="text-yellow-300 text-sm font-bold">{Math.round(progressVelocity * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm font-medium">Saturation Level</span>
                    <span className="text-yellow-300 text-sm font-bold">{Math.round(saturationLevel * 100)}%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Processing Status - No user actions needed */}
            {manifestationState !== 'discovered' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
              >
                <div className="bg-gradient-to-r from-yellow-400/20 via-amber-300/25 to-yellow-400/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-300/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm font-medium">AI Processing Status</span>
                    <span className="text-yellow-300 text-sm font-bold capitalize">{manifestationState}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm font-medium">Algorithm Progress</span>
                    <span className="text-yellow-300 text-sm font-bold">{Math.round(progressVelocity * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm font-medium">Data Saturation</span>
                    <span className="text-yellow-300 text-sm font-bold">{Math.round(saturationLevel * 100)}%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Input Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative mb-6"
            >
              <form onSubmit={handleSubmit}>
                <MagicalInput
                  value={currentInput}
                  onChange={setCurrentInput}
                  onSubmit={() => sendMessage(currentInput)}
                  disabled={isThinking}
                  withVoice={isSupported}
                  onVoiceClick={isListening ? stopListening : startListening}
                  isListening={isListening}
                />
                
                {/* Submit Button */}
                <MagicalButton
                  onClick={() => sendMessage(currentInput)}
                  disabled={!currentInput.trim() || isThinking}
                  loading={isThinking}
                  size="sm"
                  className="mt-4"
                >
                  {isThinking ? 'Processing...' : 'Continue'}
                </MagicalButton>
              </form>
            </motion.div>

            {/* Take Me To Dashboard (user-directed termination) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <MagicalButton
                onClick={generateManifestations}
                size="lg"
                title="Exit conversation and create manifestation portals"
              >
                Take Me To Dashboard
              </MagicalButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}