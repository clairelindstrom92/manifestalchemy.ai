'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { logger } from '../lib/logger';
import { ChatMessage, UserData, ManifestationProject } from '../types';
import { ConversationContext } from '../lib/aiAgent';
import InspirationCarousel from './InspirationCarousel';
import AnimatedStarBackground from './AnimatedStarBackground';

// InstantText Component - shows text immediately
const InstantText = ({ text, className, delay = 0 }: { text: string; className: string; delay?: number }) => {
  return (
    <motion.div 
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {text.split('\n').map((line, index) => (
        <p key={index} className="mb-2 last:mb-0">
          {line}
        </p>
      ))}
    </motion.div>
  );
};

interface ChatInterfaceProps {
  onComplete: (project: ManifestationProject) => void;
  manifestationId?: string;
  project?: ManifestationProject;
}

export default function ChatInterface({ onComplete, manifestationId, project }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputRef] = useState(React.createRef<HTMLInputElement>());
  
  // Conversation State
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    previousResponses: [],
    currentFocus: '',
    manifestationGoals: [],
    emotionalState: '',
    imagePreferences: [],
    conversationStage: 'initial',
    previousQuestions: [],
    conversationHistory: []
  });
  
  // UI State
  const [showQuestion, setShowQuestion] = useState(true);
  const [showInspirationCarousel, setShowInspirationCarousel] = useState(false);
  const [isGeneratingCustomImage, setIsGeneratingCustomImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const [relevantImages, setRelevantImages] = useState<string[]>([]);

  useEffect(() => {
    // Start the conversation with AI agent
    startConversation();
  }, []);

  const startConversation = async () => {
    setIsTyping(true);
    logger.info('Starting conversation', { manifestationId, project }, 'AIChatInterface');
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse: '',
          context: conversationContext,
          manifestationId: manifestationId,
          project: project
        })
      });
      
      const data = await response.json();
      console.log('API response:', data);
      console.log('Should show images:', data.shouldShowImages);
      console.log('Previous responses count:', data.context.previousResponses.length);
      console.log('Relevant images:', data.relevantImages);
      
      logger.info('API response received', { 
        shouldShowImages: data.shouldShowImages, 
        relevantImages: data.relevantImages,
        responseCount: data.context.previousResponses.length 
      }, 'AIChatInterface');
      
      setCurrentQuestion(data.question);
      setConversationContext(data.context);
      setShowQuestion(true);
      setRelevantImages(data.relevantImages || []);
      
      // Show carousel if API indicates we should
      if (data.shouldShowImages) {
        setShowInspirationCarousel(true);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      logger.error('Failed to start conversation', { error: (error as Error).message }, 'AIChatInterface');
      // Manifestation-specific fallback questions
      const fallbackQuestions = {
        'primary': "Close your eyes for a moment... What vision of your ideal life makes your heart skip a beat?",
        'environment': "Imagine stepping into your perfect day six months from now... Where are you? What does the space around you feel like?",
        'emotion': "Feel into your deepest desire... What emotions would flow through you when this manifestation becomes your reality?",
        'symbols': "What symbols, images, or recurring themes keep appearing in your dreams and daydreams about this manifestation?"
      };
      const fallbackQuestion = manifestationId ? fallbackQuestions[manifestationId as keyof typeof fallbackQuestions] || fallbackQuestions['primary'] : fallbackQuestions['primary'];
      setCurrentQuestion(fallbackQuestion);
      setShowQuestion(true);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit clicked!', { inputValue, isTyping, isGenerating });
    logger.info('User submitted response', { inputValue, isTyping, isGenerating }, 'AIChatInterface');
    if (!inputValue.trim() || isTyping || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    const userResponse = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    // Generate next AI response
    setTimeout(async () => {
      try {
        console.log('Making API call...');
        const response = await fetch('/api/ai-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userResponse,
            context: conversationContext,
            manifestationId: manifestationId,
            project: project
          })
        });
        
        const data = await response.json();
        console.log('API response:', data);
        console.log('Relevant images:', data.relevantImages);
        
        setCurrentQuestion(data.question);
        setConversationContext(data.context);
        setRelevantImages(data.relevantImages || []);
        
        // Show images if AI recommends it
        if (data.shouldShowImages) {
          setShowInspirationCarousel(true);
        }
        
        // Check if conversation is complete
        if (data.isComplete) {
          setIsConversationComplete(true);
          await generateManifestationPlan();
        }
        
      } catch (error) {
        console.error('Error generating AI response:', error);
        // Fallback to engaging questions
        const fallbackQuestions = [
          "Close your eyes for a moment... What vision of your ideal life makes your heart skip a beat?",
          "I sense something powerful stirring in you. What area of your life feels most ready for transformation right now?",
          "Feel into that vision... What emotions arise when you imagine this manifestation as your reality?",
          "What's the first step that would make this manifestation feel tangibly closer to you?"
        ];
        const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
        setCurrentQuestion(randomQuestion);
      } finally {
        setIsTyping(false);
      }
    }, 1500);
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
          context: conversationContext
        })
      });
      
      const data = await response.json();
      const steps = data.steps;
      
      const project: ManifestationProject = {
        id: `project-${Date.now()}`,
        userData: {
          manifestation_category: conversationContext.currentFocus,
          environment_description: conversationContext.previousResponses.join(' '),
          core_emotion: conversationContext.emotionalState,
          symbolic_elements: conversationContext.manifestationGoals.join(', '),
          manifestation_title: conversationContext.manifestationGoals[0] || 'Personal Manifestation'
        },
        steps,
        createdAt: new Date(),
        completedSteps: []
      };
      
      // Save to localStorage
      localStorage.setItem('manifestationProject', JSON.stringify(project));
      
      // Transition to dashboard
      setTimeout(() => {
        onComplete(project);
      }, 500);
      
    } catch (error) {
      console.error('Error generating manifestation plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInspirationSelect = async (imageId: string, imageName: string, imageUrl: string) => {
    // Update context with image preference
    setConversationContext(prev => ({
      ...prev,
      imagePreferences: [...prev.imagePreferences, imageId]
    }));
    
    // Hide carousel and continue conversation
    setShowInspirationCarousel(false);
    
    // Generate next AI question based on image selection
    setTimeout(async () => {
      try {
        const response = await fetch('/api/ai-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userResponse: `I selected the ${imageName} image`,
            context: conversationContext
          })
        });
        
        const data = await response.json();
        setCurrentQuestion(data.question);
        setConversationContext(data.context);
      } catch (error) {
        console.error('Error generating response to image selection:', error);
      }
    }, 500);
  };

  const handleGenerateCustomImage = async () => {
    if (!conversationContext) return;
    
    setIsGeneratingCustomImage(true);
    try {
      // For now, just show a placeholder - Midjourney integration can be added later
      const placeholderUrl = '/placeholder-image.svg';
      setCustomImageUrl(placeholderUrl);
      
      // Add a delay to simulate image generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Error generating custom image:', error);
    } finally {
      setIsGeneratingCustomImage(false);
    }
  };

  return (
    <div 
      className="flex flex-col h-screen relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 25%, #0f0f23 50%, #000000 100%)'
      }}
    >
      {/* Animated stars overlay */}
      <AnimatedStarBackground />

      {/* Header */}
      <div className="flex items-center justify-center p-6 relative z-10">
        <div className="flex items-center gap-3">
          <img 
            src="/custom-logo.png" 
            alt="Manifest Alchemy Logo" 
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-3xl font-bold text-white ballet-font">
            Manifest Alchemy
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Centered Question Display */}
        <AnimatePresence>
          {showQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-center mb-8"
            >
              <div className="bg-black/30 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                <InstantText 
                  text={currentQuestion}
                  className="text-lg text-white leading-relaxed"
                  delay={0.2}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inspiration Carousel */}
        <AnimatePresence>
          {showInspirationCarousel && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-6xl"
            >
              <InspirationCarousel
                onSelect={handleInspirationSelect}
                onGenerateCustom={handleGenerateCustomImage}
                relevantImages={relevantImages}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Image Generation Loading */}
        <AnimatePresence>
          {isGeneratingCustomImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white">Generating your custom image with AI...</span>
              </div>
              <p className="text-sm text-white/70">This may take a few moments</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Generated Image */}
        <AnimatePresence>
          {customImageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-8"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Your Custom Visualization</h3>
              <div className="max-w-md mx-auto">
                <img
                  src={customImageUrl}
                  alt="Custom visualization"
                  className="w-full h-64 object-cover rounded-xl"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        {!showInspirationCarousel && !isGeneratingCustomImage && !isConversationComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your response..."
                disabled={isTyping || isGenerating}
                className="flex-1 px-6 py-4 rounded-2xl bg-black/30 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 text-lg"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping || isGenerating}
                className="px-8 py-4 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white rounded-2xl transition-colors duration-200 flex items-center gap-2 font-semibold text-lg backdrop-blur-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-white/70 text-sm">Aurelia is thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generating Manifestation Plan */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white">Creating your personalized manifestation plan...</span>
              </div>
              <p className="text-sm text-white/70">This may take a few moments</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
