'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import MagicalBackground from './shared/MagicalBackground';
import MagicalInput from './shared/MagicalInput';
import MagicalButton from './shared/MagicalButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onBack?: () => void;
}

export default function ChatInterface({ onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to get response');
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <MagicalBackground />
      
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            {onBack && (
              <button
                onClick={onBack}
                className="text-white/70 hover:text-white transition-colors"
              >
                ← Back
              </button>
            )}
            <h1 className="text-2xl font-bold text-white text-center flex-1">
              Manifest Alchemy AI
            </h1>
            {onBack && <div className="w-16"></div>}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-white/60 mt-20">
              <h2 className="text-xl mb-2">Welcome to Manifest Alchemy AI</h2>
              <p>Start a conversation to begin manifesting your dreams into reality.</p>
            </div>
          )}
          
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white backdrop-blur-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 text-white backdrop-blur-sm px-4 py-2 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2">
              <MagicalInput
                value={input}
                onChange={setInput}
                onSubmit={sendMessage}
                disabled={isLoading}
                placeholder="Type your message..."
                onKeyPress={handleKeyPress}
              />
              <MagicalButton
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                loading={isLoading}
                size="sm"
                className="px-4"
              >
                <Send className="w-4 h-4" />
              </MagicalButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
