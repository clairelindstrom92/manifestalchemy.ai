'use client';

import React from 'react';
import AnimatedStarBackground from '../AnimatedStarBackground';

export default function MagicalBackground() {
  return (
    <>
      {/* Magical Background Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(212, 175, 55, 0.6) 0%, rgba(139, 105, 20, 0.5) 20%, rgba(74, 52, 16, 0.4) 40%, rgba(45, 31, 15, 0.3) 60%, rgba(26, 17, 8, 0.2) 80%, rgba(0, 0, 0, 0.8) 100%)'
        }}
      />
      
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{ backgroundImage: 'url("/BACKGROUND.png")' }}
      />
      
      {/* Animated Stars */}
      <AnimatedStarBackground />
    </>
  );
}
