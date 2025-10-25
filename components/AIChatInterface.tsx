'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ManifestationProject } from '../types';
import AnimatedStarBackground from './AnimatedStarBackground';

interface ChatInterfaceProps {
  onComplete: (project: ManifestationProject) => void;
  manifestationId?: string;
  project?: ManifestationProject;
}

export default function ChatInterface({ onComplete }: ChatInterfaceProps) {
  const [formData, setFormData] = useState({
    manifestation: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize speech recognition
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({ ...prev, manifestation: prev.manifestation + ' ' + transcript }));
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      try {
        setIsListening(true);
        recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
      }
    } else {
      console.warn('Speech recognition not available');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const generateManifestationPlan = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: formData
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
          symbolic_elements: formData.manifestation,
          manifestation_title: formData.manifestation
        },
        steps: (data.alchemy_sequences || data.steps || []).map((step: string, index: number) => ({
          id: `step-${index}`,
          title: `Step ${index + 1}`,
          description: step,
          actionable: true,
          timeframe: 'flexible'
        })),
        createdAt: new Date(),
        completedSteps: []
      };

      onComplete(project);
    } catch (error) {
      console.error('Error generating plan:', error);
      // Fallback plan
      const project: ManifestationProject = {
        id: Date.now().toString(),
        userData: {
          userName: 'Manifestor',
          manifestation_category: 'general',
          environment_description: 'Current reality',
          core_emotion: 'determined',
          symbolic_elements: formData.manifestation,
          manifestation_title: formData.manifestation
        },
        steps: [
          "Attune the manifestation — translate the desire into its pure emotional and energetic signature.",
          "Construct the manifestation matrix — define the structural components required for it to exist in reality.",
          "Activate the transmutation algorithm — convert emotion into action through executable behaviors.",
          "Establish the feedback loop — measure micro-results and refine alignment with each iteration.",
          "Integrate embodiment — begin behaving as though the manifestation already exists.",
          "Anchor reality — solidify the manifested outcome through symbolic representation.",
          "Stabilize the field — express gratitude and recalibration to lock the manifestation into reality."
        ].map((step, index) => ({
          id: `step-${index}`,
          title: `Step ${index + 1}`,
          description: step,
          actionable: true,
          timeframe: 'flexible'
        })),
        createdAt: new Date(),
        completedSteps: []
      };
      onComplete(project);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
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

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
        >
          {/* Magical Question */}
          <motion.h2 
            className="text-2xl md:text-3xl text-white mb-8 font-light relative"
            style={{ 
              textShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 165, 0, 0.4)',
              letterSpacing: '0.05em',
              fontFamily: "'Quicksand', 'Poppins', sans-serif",
              textTransform: 'uppercase'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Subtle pulsing glow effect */}
            <motion.div
              className="absolute inset-0 blur-xl opacity-30"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.6) 0%, rgba(255, 165, 0, 0.4) 50%, transparent 100%)',
                zIndex: -1
              }}
            />
            <span className="relative z-10">What are you here to manifest?</span>
          </motion.h2>

          {/* Magical Input with Voice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 relative"
          >
            {/* Sparkle particles around input */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-3 left-6 w-1 h-1 bg-yellow-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
              <div className="absolute -top-2 right-8 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-70" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
              <div className="absolute -bottom-3 left-10 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
              <div className="absolute -bottom-2 right-6 w-1 h-1 bg-amber-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1.5s', animationDuration: '2.2s' }}></div>
              <div className="absolute top-1/2 -left-2 w-1 h-1 bg-yellow-200 rounded-full animate-ping opacity-40" style={{ animationDelay: '2s', animationDuration: '2.8s' }}></div>
              <div className="absolute top-1/2 -right-2 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-55" style={{ animationDelay: '2.5s', animationDuration: '2.3s' }}></div>
            </div>
            
            <div className="relative">
              <textarea
                value={formData.manifestation}
                onChange={(e) => setFormData(prev => ({ ...prev, manifestation: e.target.value }))}
                placeholder="Speak your manifestation into existence... or type it here..."
                className="w-full max-w-xl mx-auto bg-gradient-to-r from-white/10 via-white/15 to-white/10 border border-yellow-300/30 rounded-xl px-6 py-4 text-white placeholder-white/60 resize-none focus:outline-none focus:border-yellow-400/60 focus:from-white/15 focus:via-white/20 focus:to-white/15 transition-all duration-500 backdrop-blur-sm relative z-10"
                rows={4}
                style={{
                  fontFamily: "'Quicksand', 'Poppins', sans-serif",
                  letterSpacing: '0.05em',
                  textShadow: '0 0 5px rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.2), inset 0 0 20px rgba(255, 215, 0, 0.1)'
                }}
              />
              
              {/* Voice Button */}
              <motion.button
                onClick={isListening ? stopListening : startListening}
                className="absolute top-3 right-3 w-10 h-10 bg-gradient-to-r from-yellow-400/20 via-amber-300/25 to-yellow-400/20 hover:from-yellow-400/30 hover:via-amber-300/35 hover:to-yellow-400/30 border border-yellow-300/30 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                style={{
                  boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                transition={isListening ? { duration: 1, repeat: Infinity } : {}}
              >
                {isListening ? (
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                ) : (
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                )}
              </motion.button>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent transform -skew-x-12 animate-shimmer rounded-xl pointer-events-none overflow-hidden" style={{ animationDuration: '6s' }}></div>
            </div>
          </motion.div>

          {/* Magical Generate Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center"
          >
            <motion.button
              onClick={generateManifestationPlan}
              disabled={!formData.manifestation.trim() || isGenerating}
              className="relative px-8 py-3 bg-gradient-to-r from-yellow-400/20 via-amber-300/25 to-yellow-400/20 hover:from-yellow-400/30 hover:via-amber-300/35 hover:to-yellow-400/30 text-white rounded-full transition-all duration-500 backdrop-blur-sm border border-yellow-300/20 hover:border-yellow-300/40 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              style={{
                fontFamily: "'Quicksand', 'Poppins', sans-serif",
                letterSpacing: '0.1em',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 165, 0, 0.3)',
                textTransform: 'uppercase',
                fontSize: '0.9rem'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
              
              <span className="relative z-10">
                {isGenerating ? 'Generating Your Manifestation Plan...' : 'Manifest This Reality'}
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}