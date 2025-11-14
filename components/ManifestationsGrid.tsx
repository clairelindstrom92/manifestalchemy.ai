'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trash2, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useToast } from '@/components/shared/Toast';

interface MicroTask {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
}

interface ProjectData {
  id?: string;
  title?: string | null;
  summary?: string | null;
  intent?: Record<string, any> | null;
  status?: string | null;
  needs_title?: boolean;
  updated_at?: string;
  created_at?: string;
  confidence?: number | null;
}

interface ManifestationsGridProps {
  onSelectManifestation: (manifestation: ProjectData) => void;
  refreshTrigger?: number;
}

export default function ManifestationsGrid({ onSelectManifestation, refreshTrigger }: ManifestationsGridProps) {
  const [manifestations, setManifestations] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseUser();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const fetchManifestations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('manifestations')
          .select('*')
          .eq('author_id', authUser.id)
          .order('updated_at', { ascending: false });

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error loading manifestations:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
          }
          showError('Failed to load manifestations');
          setManifestations([]);
        } else {
          setManifestations(data || []);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching manifestations:', error);
        }
        showError('Failed to load manifestations');
        setManifestations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchManifestations();
  }, [user, refreshTrigger, showError]);

  const handleDelete = async (e: React.MouseEvent, manifestation: ProjectData) => {
    e.stopPropagation();
    
    if (!manifestation.id) return;
    
    if (!confirm(`Are you sure you want to delete "${manifestation.title || 'this manifestation'}"?`)) {
      return;
    }

    try {
      await supabase
        .from('posts')
        .delete()
        .eq('manifestation_id', manifestation.id);

      const { error } = await supabase
        .from('manifestations')
        .delete()
        .eq('id', manifestation.id)
        .eq('author_id', user?.id || '');

      if (error) throw error;

      showSuccess('Manifestation deleted');
      setManifestations(prev => prev.filter(m => m.id !== manifestation.id));
    } catch (error) {
      showError(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getManifestationPreview = (manifestation: ProjectData): string => {
    const intentSummary = manifestation.intent?.summary as string | undefined;
    const baseSummary = manifestation.summary || intentSummary;
    if (baseSummary) {
      return baseSummary.length > 160 ? `${baseSummary.slice(0, 157)}…` : baseSummary;
    }
    return manifestation.needs_title
      ? 'Still gathering details. Keep chatting to define this manifestation.'
      : 'Tap to open the full manifestation plan.';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#a1a1aa]">Loading manifestations...</div>
      </div>
    );
  }

  if (manifestations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Sparkles className="w-16 h-16 text-[#E4B77D] mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-[#f5f5f7] mb-2">No Manifestations Yet</h3>
        <p className="text-[#a1a1aa] max-w-md">
          Start a new chat to create your first manifestation. Your saved manifestations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#f5f5f7] mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#E4B77D]" />
          My Manifestations
        </h2>
        <p className="text-[#a1a1aa] text-sm">
          {manifestations.length} {manifestations.length === 1 ? 'manifestation' : 'manifestations'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {manifestations.map((manifestation, index) => (
          <motion.div
            key={manifestation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectManifestation(manifestation)}
            className="group relative bg-[#151520] border border-[#2a2a3a] rounded-xl p-5 cursor-pointer hover:border-[#E4B77D]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#E4B77D]/10"
          >
            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(e, manifestation)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300"
              aria-label="Delete manifestation"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Icon/Image representation */}
            <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#E4B77D]/20 to-[#E4B77D]/10 border border-[#E4B77D]/30 mx-auto group-hover:scale-110 transition-transform duration-300 overflow-hidden">
              {(() => {
                const gallery = (manifestation.intent?.gallery as string[]) || [];
                const firstImage = gallery[0];
                if (firstImage) {
                  return (
                    <img
                      src={firstImage}
                      alt={manifestation.title || 'Manifestation vision'}
                      className="w-full h-full object-cover"
                    />
                  );
                }
                return <Sparkles className="w-8 h-8 text-[#E4B77D]" />;
              })()}
            </div>
            
            {/* Progress indicator */}
            {(() => {
              const tasks: MicroTask[] = (manifestation.intent?.microTasks as MicroTask[]) || [];
              const completed = tasks.filter(task => task.completed).length;
              const total = tasks.length;
              if (total === 0) {
                return (
                  <p className="text-xs text-[#71717a] mb-2">
                    No micro-tasks yet. Open to generate a plan.
                  </p>
                );
              }
              const progress = Math.round((completed / total) * 100);
              return (
                <div className="mb-2">
                  <div className="w-full bg-[#1f1f2e] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#E4B77D] to-[#F0C896] rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#71717a] mt-1">{progress}% complete</p>
                </div>
              );
            })()}

            {/* Title */}
            <h3 className="text-lg font-semibold text-[#f5f5f7] mb-2 text-center line-clamp-2 group-hover:text-[#E4B77D] transition-colors">
              {manifestation.title || 'Untitled Manifestation'}
            </h3>

            {/* Preview */}
            <p className="text-sm text-[#a1a1aa] line-clamp-3 mb-4 min-h-[3rem]">
              {getManifestationPreview(manifestation)}
            </p>

            {/* Date */}
            <div className="flex items-center justify-between text-xs text-[#71717a] pt-3 border-t border-[#2a2a3a]">
              <span>
                {manifestation.updated_at
                  ? new Date(manifestation.updated_at).toLocaleDateString()
                  : 'No date'}
              </span>
              <div className="flex items-center gap-1 text-[#E4B77D]">
                <MessageCircle className="w-3 h-3" />
                <span>Open</span>
              </div>
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#E4B77D]/0 to-[#E4B77D]/0 group-hover:from-[#E4B77D]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

