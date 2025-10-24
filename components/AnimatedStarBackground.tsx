'use client';

import React, { useState, useEffect } from 'react';

const AnimatedStarBackground = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Use setTimeout to defer the state update to the next tick
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isClient) {
    return null; // Don't render on server to avoid hydration mismatch
  }

  // Generate consistent star positions using a seeded random function
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const generateStars = () => {
    const stars = [];
    for (let i = 0; i < 50; i++) {
      const seed = i * 0.1;
      stars.push({
        id: i,
        left: seededRandom(seed) * 100,
        top: seededRandom(seed + 1) * 100,
        width: seededRandom(seed + 2) * 3 + 1,
        height: seededRandom(seed + 3) * 3 + 1,
        backgroundColor: seededRandom(seed + 4) > 0.5 ? '#FFD700' : '#FFA500',
        animationDelay: seededRandom(seed + 5) * 3,
        animationDuration: seededRandom(seed + 6) * 2 + 1,
        opacity: seededRandom(seed + 7) * 0.8 + 0.2,
        animationType: seededRandom(seed + 8) > 0.7 ? 'animate-ping' : seededRandom(seed + 9) > 0.5 ? 'animate-bounce' : 'animate-pulse'
      });
    }
    return stars;
  };

  const stars = generateStars();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Multiple layers of animated stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute ${star.animationType}`}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.width}px`,
            blockSize: `${star.height}px`,
            backgroundColor: star.backgroundColor,
            borderRadius: '50%',
            animationDelay: `${star.animationDelay}s`,
            animationDuration: `${star.animationDuration}s`,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedStarBackground;