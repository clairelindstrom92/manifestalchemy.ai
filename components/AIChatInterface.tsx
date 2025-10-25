'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ManifestationProject, ConversationMessage, ConversationResponse } from '../types';
import AnimatedStarBackground from './AnimatedStarBackground';

interface ChatInterfaceProps {
  onComplete: (project: ManifestationProject) => void;
  manifestationId?: string;
  project?: ManifestationProject;
}

export default function ChatInterface({ onComplete }: ChatInterfaceProps) {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isConversing, setIsConversing] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>({});

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
        setCurrentInput(transcript);
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

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to history
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    const newHistory = [...conversationHistory, userMessage];
    setConversationHistory(newHistory);
    setCurrentInput('');
    setAiThinking(true);

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: newHistory,
          userMessage: message
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data: ConversationResponse = await response.json();
      
      // Add AI response to history
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: data.aiResponse,
        timestamp: new Date()
      };

      setConversationHistory([...newHistory, aiMessage]);
      setReadyToGenerate(data.readyToGenerate);
      setExtractedData(data.extractedData);
      
      if (!isConversing) {
        setIsConversing(true);
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      // Add fallback AI response
      const fallbackMessage: ConversationMessage = {
        role: 'assistant',
        content: 'I am attuning to your manifestation frequency. Please share your core intention.',
        timestamp: new Date()
      };
      setConversationHistory([...newHistory, fallbackMessage]);
    } finally {
      setAiThinking(false);
    }
  };

  const generateManifestations = async () => {
    if (!readyToGenerate) return;

    try {
      // Discover manifestations from conversation
      const discoveryResponse = await fetch('/api/discover-manifestations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory,
          extractedData,
          existingManifestations: []
        }),
      });

      let discoveredManifestations = [];
      if (discoveryResponse.ok) {
        const discoveryData = await discoveryResponse.json();
        discoveredManifestations = discoveryData.discoveredManifestations?.map((manifestation: any) => ({
          id: `manifestation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: manifestation.name,
          description: manifestation.description,
          category: manifestation.category,
          discoveredAt: new Date(),
          conversationId: `conv-${Date.now()}`,
          confidence: manifestation.confidence,
          status: manifestation.status,
          source: 'ai-conversation' as const,
          details: manifestation.details
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
            manifestation: conversationHistory.map(msg => msg.content).join(' '),
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
          symbolic_elements: conversationHistory.map(msg => msg.content).join(' '),
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(currentInput);
  };

  // Get the current AI message (last assistant message)
  const currentAIMessage = conversationHistory.filter(msg => msg.role === 'assistant').pop();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Magical Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 25%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0.9) 100%)'
        }}
      />
      
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{ backgroundImage: 'url("/BACKGROUND.png")' }}
      />
      
      {/* Animated Stars */}
      <AnimatedStarBackground />
      
      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
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
                fontFamily: "'Quicksand', 'Poppins', sans-serif",
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              WHAT ARE YOU HERE TO MANIFEST?
            </motion.h2>

            {/* AI Thinking Animation */}
            {aiThinking && (
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
                    fontFamily: "'Quicksand', 'Poppins', sans-serif"
                  }}
                >
                  Manifest Alchemy AI is analyzing...
                </p>
              </motion.div>
            )}

            {/* Current AI Message */}
            {currentAIMessage && !aiThinking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div 
                  className="text-white text-lg leading-relaxed max-w-2xl mx-auto"
                  style={{
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
                    fontFamily: "'Quicksand', 'Poppins', sans-serif"
                  }}
                >
                  {currentAIMessage.content}
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
                <div className="relative max-w-xl mx-auto">
                  <textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Share your manifestation intention..."
                    className="w-full px-6 py-4 bg-gradient-to-r from-yellow-400/10 via-amber-300/15 to-yellow-400/10 border border-yellow-300/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:border-yellow-300/40 transition-all duration-300 backdrop-blur-sm"
                    style={{
                      textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
                      fontFamily: "'Quicksand', 'Poppins', sans-serif",
                      letterSpacing: '0.05em',
                      boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)'
                    }}
                    rows={4}
                    disabled={aiThinking}
                  />
                  
                  {/* Voice Button */}
                  <motion.button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className="absolute top-3 right-3 w-10 h-10 bg-gradient-to-r from-yellow-400/20 via-amber-300/25 to-yellow-400/20 hover:from-yellow-400/30 hover:via-amber-300/35 hover:to-yellow-400/30 border border-yellow-300/30 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                    style={{
                      boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)'
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                    transition={isListening ? { duration: 1, repeat: Infinity } : {}}
                    disabled={aiThinking}
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
              </form>
            </motion.div>

            {/* Generate Manifestations Button */}
            {readyToGenerate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <motion.button
                  onClick={generateManifestations}
                  className="relative px-8 py-3 bg-gradient-to-r from-yellow-400/20 via-amber-300/25 to-yellow-400/20 hover:from-yellow-400/30 hover:via-amber-300/35 hover:to-yellow-400/30 text-white rounded-full transition-all duration-500 backdrop-blur-sm border border-yellow-300/20 hover:border-yellow-300/40 overflow-hidden"
                  style={{
                    fontFamily: "'Quicksand', 'Poppins', sans-serif",
                    letterSpacing: '0.1em',
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                    textTransform: 'uppercase',
                    fontSize: '0.9rem'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Manifest Alchemy AI has gathered sufficient data"
                >
                  {/* Sparkle particles */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1 left-2 w-1 h-1 bg-yellow-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s' }}></div>
                    <div className="absolute top-2 right-3 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-70" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute bottom-1 left-4 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-2 right-2 w-1 h-1 bg-amber-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1.5s' }}></div>
                  </div>
                  
                  Generate Manifestations
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 animate-shimmer rounded-full pointer-events-none overflow-hidden" style={{ animationDuration: '3s' }}></div>
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}