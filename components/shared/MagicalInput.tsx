'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MagicalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  withVoice?: boolean;
  onVoiceClick?: () => void;
  isListening?: boolean;
  rows?: number;
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}

export default function MagicalInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your message...",
  disabled = false,
  withVoice = false,
  onVoiceClick,
  isListening = false,
  rows = 1,
  className = '',
  onKeyPress
}: MagicalInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyPress) {
      onKeyPress(e);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-all duration-300 backdrop-blur-sm"
        style={{
          textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
          fontFamily: "'Quicksand', 'Poppins', sans-serif",
          letterSpacing: '0.05em',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
        }}
        disabled={disabled}
      />
      
      {/* Voice Button */}
      {withVoice && onVoiceClick && (
        <motion.button
          type="button"
          onClick={onVoiceClick}
          className="absolute top-2 right-2 w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
          style={{
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={isListening ? { scale: [1, 1.1, 1] } : {}}
          transition={isListening ? { duration: 1, repeat: Infinity } : {}}
          disabled={disabled}
        >
          {isListening ? (
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          ) : (
            <div className="w-2 h-2 bg-white rounded-full"></div>
          )}
        </motion.button>
      )}
      
      {/* Shimmer effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent transform -skew-x-12 animate-shimmer rounded-xl pointer-events-none overflow-hidden" 
        style={{ animationDuration: '3s' }}
      />
    </div>
  );
}
