'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import MagicalBackground from '@/components/shared/MagicalBackground';

interface ProjectData {
  id?: string;
  title?: string;
  messages?: string;
  content?: string;
  updated_at?: string;
  manifestation_id?: string | null;
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const handleProjectUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProjectCreated = (project: ProjectData) => {
    setSelectedProject(project);
  };

  const handleProjectDeleted = () => {
    setSelectedProject(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="relative min-h-screen bg-black">
      <MagicalBackground />

      {/* Extra glow to echo the golden arc aesthetic */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[80vw] max-w-5xl aspect-square rounded-full border border-[#E4B77D]/20 blur-3xl opacity-40"></div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-10 flex justify-center">
        <div className="w-2/3 max-w-3xl h-48 bg-gradient-to-b from-[#E4B77D]/30 via-transparent to-transparent blur-3xl opacity-60"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black z-0"></div>

      <div className="relative flex flex-col md:flex-row min-h-screen z-10">
        {user && (
          <Sidebar
            onSelectProject={(p) => setSelectedProject(p)}
            onNewProject={() => setSelectedProject(null)}
            refreshTrigger={refreshTrigger}
          />
        )}
        <div className="flex-1 relative min-h-screen">
          <ChatInterface 
            project={selectedProject} 
            onBack={() => {
              // Go back to dashboard if logged in, otherwise home
              if (user) {
                router.push('/');
              } else {
                router.push('/');
              }
            }}
            onProjectUpdate={handleProjectUpdate}
            onProjectCreated={handleProjectCreated}
            onProjectDeleted={handleProjectDeleted}
          />
        </div>
      </div>
    </div>
  );
}

