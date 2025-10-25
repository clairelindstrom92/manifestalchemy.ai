'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AnimatedStarBackground from '../AnimatedStarBackground';
import { GRADIENT_BACKGROUND } from '../../lib/constants';

export default function MagicalBackground() {
  return (
    <>
      {/* Magical Background Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: GRADIENT_BACKGROUND
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
