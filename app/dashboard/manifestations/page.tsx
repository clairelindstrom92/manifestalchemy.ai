'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import ManifestationsGrid from '@/components/ManifestationsGrid';
import ManifestationDetail from '@/components/ManifestationDetail';
import { useState } from 'react';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { supabase } from '@/lib/supabaseClient';

interface ProjectData {
  id?: string;
  title?: string | null;
  summary?: string | null;
  intent?: Record<string, any> | null;
  status?: string | null;
  updated_at?: string;
  created_at?: string;
  confidence?: number | null;
  needs_title?: boolean;
  chats?: any[];
  manifestation_id?: string | null;
}

export default function ManifestationsPage() {
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

  if (!user) {
    router.push('/login');
    return null;
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

  const handleSelectManifestation = async (manifestation: ProjectData) => {
    // Fetch full manifestation data including chats
    if (manifestation.id && user) {
      try {
        const { data: chats } = await supabase
          .from('posts')
          .select('*')
          .eq('manifestation_id', manifestation.id)
          .order('created_at', { ascending: false });

        const fullManifestation = {
          ...manifestation,
          chats: chats || []
        };
        setSelectedProject(fullManifestation);
      } catch (error) {
        // If no chats found or error, just show the manifestation
        setSelectedProject(manifestation);
      }
    } else {
      setSelectedProject(manifestation);
    }
  };

  const handleBackToGrid = () => {
    setSelectedProject(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSidebarSelect = async (project: ProjectData) => {
    if (!project.manifestation_id) {
      if (project.id) {
        router.push('/chat');
      }
      return;
    }
    try {
      const { data: manifestation, error } = await supabase
        .from('manifestations')
        .select('*')
        .eq('id', project.manifestation_id)
        .single();

      if (error || !manifestation) return;

      const { data: chats } = await supabase
        .from('posts')
        .select('*')
        .eq('manifestation_id', manifestation.id)
        .order('created_at', { ascending: false });

      setSelectedProject({
        ...manifestation,
        chats: chats || [],
      });
    } catch (error) {
      console.error('Failed to load manifestation from sidebar:', error);
    }
  };

  // If a manifestation is selected, show the detail view
  if (selectedProject) {
    return (
      <div className="flex min-h-screen bg-black">
        <div className="hidden sm:block">
          <Sidebar
            onSelectProject={handleSidebarSelect}
            onNewProject={handleBackToGrid}
            refreshTrigger={refreshTrigger}
          />
        </div>
        <div className="flex-1 relative overflow-y-auto">
          <ManifestationDetail
            manifestation={selectedProject}
            onBack={handleBackToGrid}
            onUpdate={handleProjectUpdate}
          />
        </div>
      </div>
    );
  }

  // Otherwise, show the manifestations grid
  return (
    <div className="flex min-h-screen bg-black">
      <div className="hidden sm:block">
        <Sidebar
          onSelectProject={handleSidebarSelect}
          onNewProject={handleBackToGrid}
          refreshTrigger={refreshTrigger}
        />
      </div>
      <div className="flex-1 relative overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0f] border-b border-[#2a2a3a] px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors p-2 hover:bg-[#1f1f2e] rounded-lg"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-[#f5f5f7]">Manifestations</h1>
        </div>

        {/* Manifestations Grid */}
        <ManifestationsGrid 
          onSelectManifestation={handleSelectManifestation}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}

