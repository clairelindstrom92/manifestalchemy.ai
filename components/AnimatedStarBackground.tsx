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
    
    // Original stationary stars (50 stars)
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
    
    // Additional falling stars (30 stars) - slower
    for (let i = 50; i < 80; i++) {
      const seed = i * 0.1;
      stars.push({
        id: i,
        left: seededRandom(seed) * 100,
        top: seededRandom(seed + 1) * 100,
        width: seededRandom(seed + 2) * 2 + 1,
        height: seededRandom(seed + 3) * 2 + 1,
        backgroundColor: seededRandom(seed + 4) > 0.5 ? '#FFD700' : '#FFA500',
        animationDelay: seededRandom(seed + 5) * 8,
        animationDuration: seededRandom(seed + 6) * 4 + 6,
        opacity: seededRandom(seed + 7) * 0.6 + 0.3,
        animationType: 'falling-star'
      });
    }
    
    return stars;
  };

  const stars = generateStars();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style jsx>{`
        @keyframes falling-star {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .falling-star {
          animation: falling-star linear infinite;
        }
      `}</style>
      {/* Multiple layers of animated stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute ${star.animationType === 'falling-star' ? 'falling-star' : star.animationType}`}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.width}px`,
            height: `${star.height}px`,
            backgroundColor: star.backgroundColor,
            borderRadius: '50%',
            animationDelay: `${star.animationDelay}s`,
            animationDuration: `${star.animationDuration}s`,
            opacity: star.opacity,
            ...(star.animationType === 'falling-star' && {
              boxShadow: `0 0 ${star.width * 2}px ${star.backgroundColor}`,
            }),
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedStarBackground;