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
          background: 'radial-gradient(ellipse at top left, rgba(228, 183, 125, 0.6) 0%, rgba(180, 140, 90, 0.5) 20%, rgba(140, 110, 70, 0.4) 40%, rgba(100, 80, 50, 0.3) 60%, rgba(60, 50, 30, 0.2) 80%, rgba(0, 0, 0, 0.8) 100%)'
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
