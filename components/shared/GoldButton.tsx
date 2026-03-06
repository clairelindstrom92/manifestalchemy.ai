'use client';

import React from 'react';

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  shimmer?: boolean;
  fullWidth?: boolean;
}

export default function GoldButton({
  children,
  variant = 'outline',
  size = 'md',
  shimmer = true,
  fullWidth = false,
  className = '',
  style,
  ...props
}: GoldButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const baseStyle: React.CSSProperties =
    variant === 'solid'
      ? {
          background: 'linear-gradient(135deg, #E4B77D 0%, #F0C896 50%, #E4B77D 100%)',
          border: '1px solid rgba(228, 183, 125, 0.8)',
          color: '#0a0a0f',
          fontWeight: 600,
        }
      : {
          background:
            'linear-gradient(to right, rgba(228, 183, 125, 0.12), rgba(228, 183, 125, 0.2), rgba(228, 183, 125, 0.12))',
          border: '1px solid rgba(228, 183, 125, 0.35)',
          color: '#f5f5f7',
          textShadow: '0 0 10px rgba(228, 183, 125, 0.5)',
        };

  return (
    <button
      className={`relative rounded-full font-medium transition-all duration-300 backdrop-blur-sm overflow-hidden
        disabled:opacity-40 disabled:cursor-not-allowed
        hover:brightness-110 active:scale-[0.97]
        ${fullWidth ? 'w-full flex items-center justify-center' : 'inline-flex items-center'}
        ${sizeClasses[size]}
        ${className}`}
      style={{
        fontFamily: "'Quicksand', 'Poppins', sans-serif",
        letterSpacing: '0.08em',
        ...baseStyle,
        ...style,
      }}
      {...props}
    >
      {shimmer && (
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 animate-shimmer" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
