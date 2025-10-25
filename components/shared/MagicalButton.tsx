'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BUTTON_GRADIENTS, MAGICAL_STYLES, SPARKLE_POSITIONS, ANIMATION_DURATIONS } from '../../lib/constants';

interface MagicalButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export default function MagicalButton({ 
  onClick, 
  disabled = false, 
  children, 
  variant = 'primary',
  loading = false,
  size = 'md',
  className = '',
  title
}: MagicalButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  const baseClasses = `
    relative rounded-full transition-all duration-500 backdrop-blur-sm overflow-hidden
    ${BUTTON_GRADIENTS.primary} hover:${BUTTON_GRADIENTS.hover}
    ${BUTTON_GRADIENTS.border} ${BUTTON_GRADIENTS.borderHover}
    ${sizeClasses[size]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      style={{
        fontFamily: MAGICAL_STYLES.fontFamily,
        letterSpacing: MAGICAL_STYLES.letterSpacingWide,
        textShadow: MAGICAL_STYLES.textShadowSubtle,
        textTransform: 'uppercase'
      }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      title={title}
    >
      {/* Sparkle particles */}
      <div className="absolute inset-0 pointer-events-none">
        {SPARKLE_POSITIONS.map((pos, index) => (
          <div
            key={index}
            className={`absolute ${pos.top} ${pos.left || pos.right} w-1 h-1 bg-yellow-300 rounded-full animate-ping opacity-60`}
            style={{ 
              animationDelay: pos.delay, 
              animationDuration: pos.duration 
            }}
          />
        ))}
      </div>
      
      {loading ? 'Processing...' : children}
      
      {/* Shimmer effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 animate-shimmer rounded-full pointer-events-none overflow-hidden" 
        style={{ animationDuration: ANIMATION_DURATIONS.shimmerFast }}
      />
    </motion.button>
  );
}
