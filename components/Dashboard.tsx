'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Gold } from 'gleamy';
import { 
  MessageCircle, 
  Sparkles, 
  Heart, 
  Calendar,
  Moon,
  Send,
  BookOpen,
  UserPlus,
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [radius, setRadius] = useState(240);

  // Calculate responsive radius
  useEffect(() => {
    const updateRadius = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setRadius(140);
      } else if (width < 768) {
        setRadius(180);
      } else {
        setRadius(240);
      }
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const handleSectionClick = (section: string, route: string) => {
    setSelectedSection(section);
    if (route) {
      router.push(route);
    } else if (onNavigate) {
      onNavigate(section);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Main navigation sections
  const mainSections = [
    { icon: MessageCircle, label: 'Chat', route: '/chat', color: 'rgba(228, 183, 125, 0.9)', action: 'chat' },
    { icon: Sparkles, label: 'Manifestations', route: '/dashboard/manifestations', color: 'rgba(228, 183, 125, 0.9)', action: 'manifestations' },
    { icon: Send, label: 'Feed', route: '/dashboard/feed', color: 'rgba(228, 183, 125, 0.9)', action: 'feed' },
    { icon: BookOpen, label: 'Inspirations', route: '/dashboard/inspirations', color: 'rgba(228, 183, 125, 0.9)', action: 'inspirations' },
    { icon: UserPlus, label: 'Friends', route: '/dashboard/friends', color: 'rgba(228, 183, 125, 0.9)', action: 'friends' },
    { icon: Heart, label: 'Affirmations', route: '/dashboard/affirmations', color: 'rgba(228, 183, 125, 0.9)', action: 'affirmations' },
    { icon: Calendar, label: 'Birth Chart', route: '/dashboard/birth-chart', color: 'rgba(228, 183, 125, 0.9)', action: 'birth-chart' },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Top status bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
        <Moon className="w-5 h-5 text-[#E4B77D] gold-shiny" strokeWidth={1.5} />
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="p-2 rounded-full border border-[#E4B77D] text-[#E4B77D] hover:bg-[#E4B77D]/10 transition-colors gold-shiny"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="w-8 h-1 bg-[#E4B77D] rounded-full opacity-60 gold-shiny"></div>
        </div>
      </div>

      {/* Main navigation sections only */}
      <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
        <div className="relative" style={{ width: '100%', height: '100%' }}>
          {mainSections.map((section, index) => {
            const Icon = section.icon;
            const angle = (index * 360) / mainSections.length - 90; // Start from top
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            
            return (
              <motion.button
                key={section.label}
                className="absolute pointer-events-auto group"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => {
                  handleSectionClick(section.label, section.route);
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0.8, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <div 
                    className="p-2 sm:p-3 md:p-4 rounded-full border-2 border-[#E4B77D] bg-black/70 backdrop-blur-sm gold-shiny"
                    style={{
                      boxShadow: `
                        0 0 20px rgba(228, 183, 125, 0.9),
                        0 0 40px rgba(228, 183, 125, 0.6),
                        inset 0 0 15px rgba(228, 183, 125, 0.7)
                      `,
                    }}
                  >
                    <Icon 
                      className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#E4B77D] stroke-[2.5] gold-shiny" 
                      style={{
                        filter: 'drop-shadow(0 0 12px rgba(228, 183, 125, 1)) drop-shadow(0 0 20px rgba(228, 183, 125, 0.8))',
                      }}
                    />
                  </div>
                  <Gold 
                    acceleration={1} 
                    rendering={true} 
                    noFill={false} 
                    edgeThickness={1} 
                    spread={0.5}
                  >
                    <span 
                      className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap"
                      style={{
                        fontSize: '10px',
                        letterSpacing: '0.05em',
                        textShadow: '0 0 8px rgba(228, 183, 125, 0.8)',
                      }}
                    >
                      {section.label}
                    </span>
                  </Gold>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#E4B77D] rounded-full gold-shiny"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.3,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: Math.max(0.1, 3 + Math.random() * 2),
            repeat: Infinity,
            delay: Math.max(0, Math.random() * 2),
          }}
        />
      ))}
    </div>
  );
}

