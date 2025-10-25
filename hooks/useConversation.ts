'use client';

import { useState, useCallback, useMemo } from 'react';
import { ConversationMessage, ConversationResponse, ExtractedData } from '../types';

export type ManifestationState = 'discovered' | 'active' | 'materializing' | 'manifested';

interface ConversationHook {
  history: ConversationMessage[];
  isThinking: boolean;
  manifestationState: ManifestationState;
  progressVelocity: number;
  saturationLevel: number;
  nextActions: string[];
  causalMap: any[];
  extractedData: ExtractedData;
  sendMessage: (message: string) => Promise<void>;
  currentAIMessage: ConversationMessage | undefined;
  resetConversation: () => void;
  readyForDashboard: boolean;
}

export function useConversation(): ConversationHook {
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [manifestationState, setManifestationState] = useState<ManifestationState>('discovered');
  const [progressVelocity, setProgressVelocity] = useState(0);
  const [saturationLevel, setSaturationLevel] = useState(0);
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [causalMap, setCausalMap] = useState<any[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [readyForDashboard, setReadyForDashboard] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Add user message to history
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    const newHistory = [...history, userMessage];
    setHistory(newHistory);
    setIsThinking(true);

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

      const data = await response.json();
      
      // Add AI response to history
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: data.aiResponse,
        timestamp: new Date()
      };

      setHistory([...newHistory, aiMessage]);
      
      // Update agentic state
      setManifestationState(data.manifestationState || 'discovered');
      setProgressVelocity(data.progressVelocity || 0);
      setSaturationLevel(data.saturationLevel || 0);
      setNextActions(data.nextActions || []);
      setCausalMap(data.causalMap || []);
      setExtractedData(data.extractedData || {});
      setReadyForDashboard(data.readyForDashboard || false);
      
    } catch (error) {
      console.error('Error in conversation:', error);
      // Add fallback AI response
      const fallbackMessage: ConversationMessage = {
        role: 'assistant',
        content: 'I am attuning to your manifestation frequency. Please share your core intention.',
        timestamp: new Date()
      };
      setHistory([...newHistory, fallbackMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [history]);

  const currentAIMessage = useMemo(() => 
    history.filter(msg => msg.role === 'assistant').pop(),
    [history]
  );

  const resetConversation = useCallback(() => {
    setHistory([]);
    setIsThinking(false);
    setManifestationState('discovered');
    setProgressVelocity(0);
    setSaturationLevel(0);
    setNextActions([]);
    setCausalMap([]);
    setExtractedData({});
    setReadyForDashboard(false);
  }, []);

  return {
    history,
    isThinking,
    manifestationState,
    progressVelocity,
    saturationLevel,
    nextActions,
    causalMap,
    extractedData,
    sendMessage,
    currentAIMessage,
    resetConversation,
    readyForDashboard
  };
}
