'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MAGICAL_STYLES, ANIMATION_DURATIONS } from '../../lib/constants';

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
}

export default function MagicalInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Speak your manifestation into existence or type...",
  disabled = false,
  withVoice = true,
  onVoiceClick,
  isListening = false,
  rows = 4,
  className = ''
}: MagicalInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={`relative max-w-xl mx-auto ${className}`}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-6 py-4 bg-gradient-to-r from-yellow-400/10 via-amber-300/15 to-yellow-400/10 border border-yellow-300/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:border-yellow-300/40 transition-all duration-300 backdrop-blur-sm"
        style={{
          textShadow: MAGICAL_STYLES.textShadowSubtle,
          fontFamily: MAGICAL_STYLES.fontFamily,
          letterSpacing: MAGICAL_STYLES.letterSpacing,
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)'
        }}
        rows={rows}
        disabled={disabled}
      />
      
      {/* Voice Button */}
      {withVoice && onVoiceClick && (
        <motion.button
          type="button"
          onClick={onVoiceClick}
          className="absolute top-3 right-3 w-10 h-10 bg-gradient-to-r from-yellow-400/20 via-amber-300/25 to-yellow-400/20 hover:from-yellow-400/30 hover:via-amber-300/35 hover:to-yellow-400/30 border border-yellow-300/30 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
          style={{
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={isListening ? { scale: [1, 1.1, 1] } : {}}
          transition={isListening ? { duration: 1, repeat: Infinity } : {}}
          disabled={disabled}
        >
          {isListening ? (
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
          ) : (
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          )}
        </motion.button>
      )}
      
      {/* Shimmer effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent transform -skew-x-12 animate-shimmer rounded-xl pointer-events-none overflow-hidden" 
        style={{ animationDuration: ANIMATION_DURATIONS.shimmer }}
      />
    </div>
  );
}
