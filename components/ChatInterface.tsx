'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { ChatMessage, UserData, ManifestationProject } from '../types';
import { conversationQuestions } from '../lib/questions';
import { ManifestationAgent, ConversationContext } from '../lib/aiAgent';
import { ImageLearningSystem } from '../lib/imageLearning';
import { generateImageWithMidjourney, enhancePromptForMidjourney } from '../lib/midjourney';
import { generateManifestationPlan } from '../lib/openai';
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
}

export default function ChatInterface({ onComplete }: ChatInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInspirationCarousel, setShowInspirationCarousel] = useState(false);
  const [isGeneratingCustomImage, setIsGeneratingCustomImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = conversationQuestions[currentQuestionIndex];

  useEffect(() => {
    // Add initial greeting message
    if (messages.length === 0) {
      const greetingMessage: ChatMessage = {
        id: 'greeting',
        role: 'assistant',
        content: currentQuestion.question,
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
      setShowQuestion(true);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current && showQuestion) {
      inputRef.current.focus();
    }
  }, [showQuestion]);

  useEffect(() => {
    // Show inspiration carousel for visualization questions (after name)
    if (currentQuestionIndex > 0 && !showInspirationCarousel && !isGeneratingCustomImage) {
      setTimeout(() => {
        setShowInspirationCarousel(true);
      }, 2000);
    }
  }, [currentQuestionIndex]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInspirationSelect = (image: any) => {
    if (image) {
      setUserData(prev => ({
        ...prev,
        visualization: `I see myself achieving ${image.name.toLowerCase()} - ${image.category}`
      }));
    }
    setShowInspirationCarousel(false);
    proceedToNextQuestion();
  };

  const handleGenerateCustomImage = async () => {
    if (!inputValue.trim()) return;
    
    setIsGeneratingCustomImage(true);
    setShowInspirationCarousel(false);
    
    try {
      const enhancedPrompt = enhancePromptForMidjourney(inputValue);
      const result = await generateImageWithMidjourney({ prompt: enhancedPrompt });
      
      if (result.success && result.imageUrl) {
        setCustomImageUrl(result.imageUrl);
        setUserData(prev => ({
          ...prev,
          visualization: inputValue.trim()
        }));
        proceedToNextQuestion();
      } else {
        // Fallback to text input
        setUserData(prev => ({
          ...prev,
          visualization: inputValue.trim()
        }));
        proceedToNextQuestion();
      }
    } catch (error) {
      console.error('Error generating custom image:', error);
      // Fallback to text input
      setUserData(prev => ({
        ...prev,
        visualization: inputValue.trim()
      }));
      proceedToNextQuestion();
    } finally {
      setIsGeneratingCustomImage(false);
    }
  };

  const proceedToNextQuestion = () => {
    setTimeout(() => {
      if (currentQuestion.isLast) {
        // Generate manifestation plan with updated data
        const updatedUserData = userData as UserData;
        
        generateManifestationPlan(updatedUserData).then(steps => {
          const project: ManifestationProject = {
            id: `project-${Date.now()}`,
            userData: updatedUserData,
            steps,
            createdAt: new Date(),
            completedSteps: []
          };
          
          // Save to localStorage
          localStorage.setItem('manifestationProject', JSON.stringify(project));
          
          // Show completion message
          const completionMessage: ChatMessage = {
            id: `completion-${Date.now()}`,
            role: 'assistant',
            content: "Perfect! I've created your personalized manifestation plan. Let me show you what we've built together...",
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, completionMessage]);
          
          // Transition to dashboard after a delay
          setTimeout(() => {
            onComplete(project);
          }, 500);
        });
      } else {
        // Move to next question - hide current question and show next
        setShowQuestion(false);
        setCurrentQuestionIndex(prev => prev + 1);
        
        setTimeout(() => {
          setShowQuestion(true);
        }, 300);
      }
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Update user data
    setUserData(prev => ({
      ...prev,
      [currentQuestion.field]: inputValue.trim()
    }));

    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
      
      if (currentQuestion.isLast) {
        // Generate manifestation plan with updated data
        const updatedUserData = {
          ...userData,
          [currentQuestion.field]: inputValue.trim()
        } as UserData;
        
        generateManifestationPlan(updatedUserData).then(steps => {
          const project: ManifestationProject = {
            id: `project-${Date.now()}`,
            userData: updatedUserData,
            steps,
            createdAt: new Date(),
            completedSteps: []
          };
          
          // Save to localStorage
          localStorage.setItem('manifestationProject', JSON.stringify(project));
          
          // Show completion message
          const completionMessage: ChatMessage = {
            id: `completion-${Date.now()}`,
            role: 'assistant',
            content: "Perfect! I've created your personalized manifestation plan. Let me show you what we've built together...",
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, completionMessage]);
          
          // Transition to dashboard after a delay
          setTimeout(() => {
            onComplete(project);
          }, 500);
        });
      } else {
        // Move to next question
        const nextQuestion = conversationQuestions[currentQuestionIndex + 1];
        const nextMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: nextQuestion.question,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, nextMessage]);
        setCurrentQuestionIndex(prev => prev + 1);
        setShowQuestion(true);
        setShowInspirationCarousel(false);
      }
    }, 1000);
  };

  return (
    <div 
      className="flex flex-col h-screen relative overflow-hidden"
      style={{
        backgroundColor: '#1a1a2e',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
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
                  text={currentQuestion.question}
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
        {!showInspirationCarousel && !isGeneratingCustomImage && (
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
                placeholder={currentQuestion?.placeholder || 'Type your response...'}
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
      </div>
    </div>
  );
}
