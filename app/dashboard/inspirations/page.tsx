'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Gold } from 'gleamy';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

export default function InspirationsPage() {
  const router = useRouter();

  const inspirations = [
    {
      title: "The Power of Intention",
      content: "When you set a clear intention, the universe aligns to support your vision.",
      icon: Sparkles,
    },
    {
      title: "Daily Gratitude",
      content: "Gratitude transforms what we have into enough, and opens the door for more.",
      icon: Sparkles,
    },
    {
      title: "Visualization Mastery",
      content: "See it, feel it, believe it. Your mind creates your reality.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => router.push('/')}
          className="p-2 rounded-full border border-[#E4B77D] text-[#E4B77D] hover:bg-[#E4B77D]/10 transition-colors gold-shiny"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      
      <div className="max-w-3xl mx-auto pt-16 sm:pt-20 px-4 pb-8">
        <Gold acceleration={1} rendering={true} noFill={false} edgeThickness={1} spread={0.5}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center flex items-center justify-center gap-2 sm:gap-3">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-[#E4B77D] gold-shiny" />
            Inspirations
          </h1>
        </Gold>
        
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {inspirations.map((inspiration, index) => {
            const Icon = inspiration.icon;
            return (
              <div
                key={index}
                className="border border-[#E4B77D]/30 rounded-lg p-4 sm:p-6 bg-black/50 backdrop-blur-sm hover:border-[#E4B77D]/50 transition-colors"
              >
                <Icon className="w-8 h-8 text-[#E4B77D] mb-4 gold-shiny" />
                <Gold acceleration={1} rendering={true} noFill={false} edgeThickness={1} spread={0.5}>
                  <h3 className="text-xl font-semibold mb-3 text-white">{inspiration.title}</h3>
                </Gold>
                <p className="text-white/80">{inspiration.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

