'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Gold } from 'gleamy';
import { ArrowLeft, UserPlus, Search } from 'lucide-react';

export default function FriendsPage() {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center flex items-center justify-center gap-2 sm:gap-3">
            <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-[#E4B77D] gold-shiny" />
            Friends
          </h1>
        </Gold>
        
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#E4B77D] gold-shiny" />
            <input
              type="text"
              placeholder="Search friends..."
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-black/50 border border-[#E4B77D]/30 rounded-lg text-white placeholder-[#E4B77D]/50 focus:outline-none focus:border-[#E4B77D] focus:ring-2 focus:ring-[#E4B77D]/20"
            />
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Sample friend */}
          <div className="flex items-center justify-between p-3 sm:p-4 border border-[#E4B77D]/30 rounded-lg bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[#E4B77D] gold-shiny"></div>
              <div>
                <Gold acceleration={1} rendering={true} noFill={false} edgeThickness={1} spread={0.5}>
                  <p className="font-medium text-white">Friend Name</p>
                </Gold>
                <p className="text-[#E4B77D]/60 text-sm">Active now</p>
              </div>
            </div>
            <button className="px-4 py-2 border border-[#E4B77D] text-[#E4B77D] rounded-lg hover:bg-[#E4B77D]/10 transition-colors gold-shiny">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

