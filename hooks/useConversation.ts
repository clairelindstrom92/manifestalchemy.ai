'use client';

import { useState, useCallback, useMemo } from 'react';
import { ConversationMessage, ConversationResponse, ExtractedData } from '../types';

interface ConversationHook {
  history: ConversationMessage[];
  isThinking: boolean;
  readyToGenerate: boolean;
  extractedData: ExtractedData;
  sendMessage: (message: string) => Promise<void>;
  currentAIMessage: ConversationMessage | undefined;
  resetConversation: () => void;
}

export function useConversation(): ConversationHook {
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});

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

      const data: ConversationResponse = await response.json();
      
      // Add AI response to history
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: data.aiResponse,
        timestamp: new Date()
      };

      setHistory([...newHistory, aiMessage]);
      setReadyToGenerate(data.readyToGenerate);
      setExtractedData(data.extractedData);
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
    setReadyToGenerate(false);
    setExtractedData({});
  }, []);

  return {
    history,
    isThinking,
    readyToGenerate,
    extractedData,
    sendMessage,
    currentAIMessage,
    resetConversation
  };
}
