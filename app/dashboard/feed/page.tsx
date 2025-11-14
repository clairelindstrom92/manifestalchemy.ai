'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Gold } from 'gleamy';
import { ArrowLeft, Send, Heart, MessageCircle } from 'lucide-react';

export default function FeedPage() {
  const router = useRouter();

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
      
      <div className="max-w-2xl mx-auto pt-16 sm:pt-20 px-4 pb-8">
        <Gold acceleration={1} rendering={true} noFill={false} edgeThickness={1} spread={0.5}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">Feed</h1>
        </Gold>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Sample post */}
          <div className="border border-[#E4B77D]/30 rounded-lg p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full border-2 border-[#E4B77D] gold-shiny"></div>
              <div>
                <Gold acceleration={1} rendering={true} noFill={false} edgeThickness={1} spread={0.5}>
                  <p className="font-medium text-white">User Name</p>
                </Gold>
                <p className="text-[#E4B77D]/60 text-sm">2 hours ago</p>
              </div>
            </div>
            <p className="text-white mb-4">
              Just manifested my dream job! The universe is truly amazing ✨
            </p>
            <div className="flex items-center gap-4 text-[#E4B77D]">
              <button className="flex items-center gap-2 hover:text-[#F0C896] transition-colors gold-shiny">
                <Heart className="w-5 h-5" />
                <span>24</span>
              </button>
              <button className="flex items-center gap-2 hover:text-[#F0C896] transition-colors gold-shiny">
                <MessageCircle className="w-5 h-5" />
                <span>5</span>
              </button>
              <button className="flex items-center gap-2 hover:text-[#F0C896] transition-colors gold-shiny">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

