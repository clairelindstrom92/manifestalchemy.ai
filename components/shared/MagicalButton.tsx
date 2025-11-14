'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
    bg-gradient-to-r from-yellow-400/10 via-amber-300/15 to-yellow-400/10 
    hover:from-yellow-400/20 hover:via-amber-300/25 hover:to-yellow-400/20
    border border-yellow-300/20 hover:border-yellow-300/40
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
        fontFamily: "'Quicksand', 'Poppins', sans-serif",
        letterSpacing: '0.15em',
        textShadow: '0 0 10px rgba(228, 183, 125, 0.7), 0 0 20px rgba(228, 183, 125, 0.5), 0 0 30px rgba(228, 183, 125, 0.3)',
        textTransform: 'uppercase'
      }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      title={title}
    >
      {/* Sparkle particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-4 w-1 h-1 bg-yellow-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
        <div className="absolute top-3 right-6 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-70" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
        <div className="absolute bottom-2 left-8 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
        <div className="absolute bottom-3 right-4 w-1 h-1 bg-amber-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1.5s', animationDuration: '2.2s' }}></div>
      </div>
      
      {loading ? 'Processing...' : children}
      
      {/* Shimmer effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 animate-shimmer rounded-full pointer-events-none overflow-hidden" 
        style={{ animationDuration: '2s' }}
      />
    </motion.button>
  );
}
