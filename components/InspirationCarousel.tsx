'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2 } from 'lucide-react';

interface InspirationImage {
  id: string;
  name: string;
  src: string;
  category: string;
}

interface InspirationCarouselProps {
  onSelect: (imageId: string, imageName: string, imageUrl: string) => void;
  onGenerateCustom: () => void;
  relevantImages?: string[];
}

const InspirationCarousel: React.FC<InspirationCarouselProps> = ({ onSelect, onGenerateCustom, relevantImages = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const inspirationImages: InspirationImage[] = [
    { id: 'spirituality', name: 'Spirituality', src: '/inspiration-images/spirituality.png', category: 'spiritual' },
    { id: 'meditation', name: 'Meditation', src: '/inspiration-images/meditation.png', category: 'spiritual' },
    { id: 'love', name: 'Love', src: '/inspiration-images/love.png', category: 'relationships' },
    { id: 'marriage', name: 'Marriage', src: '/inspiration-images/marriage.png', category: 'relationships' },
    { id: 'business', name: 'Business', src: '/inspiration-images/business.png', category: 'career' },
    { id: 'success', name: 'Success', src: '/inspiration-images/success.png', category: 'career' },
    { id: 'money', name: 'Wealth', src: '/inspiration-images/money.png', category: 'wealth' },
    { id: 'luxury', name: 'Luxury', src: '/inspiration-images/luxury.png', category: 'wealth' },
    { id: 'fitness', name: 'Fitness', src: '/inspiration-images/fitness.png', category: 'health' },
    { id: 'manworkout', name: 'Strength', src: '/inspiration-images/manworkout.png', category: 'health' },
    { id: 'car', name: 'Car', src: '/inspiration-images/car.png', category: 'material' },
    { id: 'newcar', name: 'New Car', src: '/inspiration-images/newcar.png', category: 'material' },
    { id: 'privatejet', name: 'Private Jet', src: '/inspiration-images/privatejet.png', category: 'travel' },
    { id: 'terrace', name: 'Travel', src: '/inspiration-images/man sitting on terrace.png', category: 'travel' },
    { id: 'mansion', name: 'Mansion', src: '/inspiration-images/mansion.png', category: 'home' },
    { id: 'fame', name: 'Fame', src: '/inspiration-images/fame.png', category: 'recognition' },
    { id: 'college', name: 'Education', src: '/inspiration-images/college.png', category: 'growth' },
    { id: 'sleep', name: 'Rest', src: '/inspiration-images/sleep.png', category: 'wellness' },
    { id: 'shopping', name: 'Shopping', src: '/inspiration-images/shopping.png', category: 'lifestyle' }
  ];

  // Filter images based on relevant images if provided
  const filteredImages = relevantImages.length > 0 
    ? inspirationImages.filter(img => relevantImages.includes(img.id))
    : inspirationImages;

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < filteredImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === filteredImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [filteredImages.length]);

  const handleImageSelect = (image: InspirationImage) => {
    onSelect(image.id, image.name, image.src);
  };

  const handleGenerateCustom = async () => {
    setIsGenerating(true);
    try {
      await onGenerateCustom();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Do any of these manifestations resonate?
        </h2>
        <p className="text-white/70 text-lg">
          Swipe through or tap to explore your inspirations
        </p>
      </div>

      {/* Swipeable Carousel */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div 
          className="flex"
          animate={{ x: -currentIndex * 100 + '%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {filteredImages.map((image, index) => (
            <div key={image.id} className="w-full flex-shrink-0 px-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.slice(index * 4, (index + 1) * 4).map((img) => (
                  <motion.div
                    key={img.id}
                    className="relative group cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleImageSelect(img)}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-black/20 backdrop-blur-sm">
                      <img
                        src={img.src}
                        alt={img.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.svg';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-2 left-2 right-2 text-center">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {img.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: Math.ceil(filteredImages.length / 4) }).map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              index === currentIndex ? 'bg-white' : 'bg-white/30'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {/* Custom Generation Button */}
      <div className="text-center mt-8">
        <button
          onClick={handleGenerateCustom}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white rounded-full transition-colors duration-200 backdrop-blur-sm"
        >
          <Wand2 className="w-4 h-4" />
          {isGenerating ? 'Generating...' : 'Generate Custom Image'}
        </button>
      </div>
    </div>
  );
};

export default InspirationCarousel;