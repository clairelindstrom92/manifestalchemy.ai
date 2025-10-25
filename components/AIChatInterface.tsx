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
    name: '',
    manifestation: '',
    currentState: '',
    obstacles: '',
    timeline: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      field: 'name',
      question: "What should I call you?",
      placeholder: "Your name..."
    },
    {
      field: 'manifestation',
      question: "What are you here to manifest into reality?",
      placeholder: "Describe what you want to create..."
    },
    {
      field: 'currentState',
      question: "Where are you now in relation to this manifestation?",
      placeholder: "Describe your current situation..."
    },
    {
      field: 'obstacles',
      question: "What patterns or obstacles are blocking this from manifesting?",
      placeholder: "What's holding you back..."
    },
    {
      field: 'timeline',
      question: "What timeframe feels aligned for this manifestation?",
      placeholder: "e.g., 3 months, 6 months, 1 year..."
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateManifestationPlan();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
          userName: formData.name,
          manifestation_category: 'general',
          environment_description: formData.currentState,
          core_emotion: 'determined',
          symbolic_elements: formData.manifestation,
          manifestation_title: formData.manifestation
        },
        steps: (data.alchemy_sequences || data.steps || []).map((step: string, index: number) => ({
          id: `step-${index}`,
          title: `Step ${index + 1}`,
          description: step,
          actionable: true,
          timeframe: formData.timeline || 'flexible'
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
          userName: formData.name,
          manifestation_category: 'general',
          environment_description: formData.currentState,
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
          timeframe: formData.timeline || 'flexible'
        })),
        createdAt: new Date(),
        completedSteps: []
      };
      onComplete(project);
    }
  };

  const currentStepData = steps[currentStep];

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

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
        >
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-center space-x-2 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' 
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            <p className="text-white/60 text-sm">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Question */}
          <motion.h2 
            className="text-2xl md:text-3xl text-white mb-8 font-light"
            style={{ 
              textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
              letterSpacing: '0.05em'
            }}
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {currentStepData.question}
          </motion.h2>

          {/* Input */}
          <motion.div
            key={`input-${currentStep}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <textarea
              value={formData[currentStepData.field as keyof typeof formData]}
              onChange={(e) => handleInputChange(currentStepData.field, e.target.value)}
              placeholder={currentStepData.placeholder}
              className="w-full max-w-md mx-auto bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-white/50 resize-none focus:outline-none focus:border-yellow-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm"
              rows={4}
              style={{
                fontFamily: "'Quicksand', 'Poppins', sans-serif",
                letterSpacing: '0.05em'
              }}
            />
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center space-x-4"
          >
            {currentStep > 0 && (
              <motion.button
                onClick={handleBack}
                className="px-6 py-3 bg-transparent border border-white/30 text-white rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back
              </motion.button>
            )}
            
            <motion.button
              onClick={handleNext}
              disabled={!formData[currentStepData.field as keyof typeof formData].trim() || isGenerating}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400/20 via-amber-300/25 to-yellow-400/20 hover:from-yellow-400/30 hover:via-amber-300/35 hover:to-yellow-400/30 text-white rounded-full transition-all duration-300 backdrop-blur-sm border border-yellow-400/20 hover:border-yellow-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "'Quicksand', 'Poppins', sans-serif",
                letterSpacing: '0.1em',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                textTransform: 'uppercase'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGenerating ? 'Generating...' : currentStep === steps.length - 1 ? 'Generate Plan' : 'Next'}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}