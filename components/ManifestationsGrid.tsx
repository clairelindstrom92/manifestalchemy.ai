'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trash2, MessageCircle, Plus, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useToast } from '@/components/shared/Toast';
import { useRouter } from 'next/navigation';

interface MicroTask {
  id: string;
  title: string;
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

const STATUS_STYLES: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  draft: 'text-white/30 bg-white/5 border-white/10',
  completed: 'text-[#E4B77D] bg-[#E4B77D]/10 border-[#E4B77D]/20',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function ManifestationsGrid({ onSelectManifestation, refreshTrigger }: ManifestationsGridProps) {
  const [manifestations, setManifestations] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseUser();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { setLoading(false); return; }
        const { data, error } = await supabase
          .from('manifestations')
          .select('*')
          .eq('author_id', authUser.id)
          .order('updated_at', { ascending: false });
        if (error) { showError('Failed to load manifestations'); setManifestations([]); }
        else setManifestations(data || []);
      } catch { showError('Failed to load'); setManifestations([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user, refreshTrigger, showError]);

  const handleDelete = async (e: React.MouseEvent, m: ProjectData) => {
    e.stopPropagation();
    if (!m.id || !confirm(`Delete "${m.title || 'this manifestation'}"?`)) return;
    try {
      await supabase.from('posts').delete().eq('manifestation_id', m.id);
      const { error } = await supabase.from('manifestations').delete().eq('id', m.id).eq('author_id', user?.id || '');
      if (error) throw error;
      showSuccess('Deleted');
      setManifestations((prev) => prev.filter((x) => x.id !== m.id));
    } catch (err) {
      showError(`Delete failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const getPreview = (m: ProjectData) => {
    const text = m.summary || (m.intent?.summary as string);
    if (text) return text.length > 140 ? `${text.slice(0, 137)}…` : text;
    return m.needs_title ? 'Still gathering details. Keep chatting.' : 'Open to view your full plan.';
  };

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-white/3 animate-pulse" />
        ))}
      </div>
    );
  }

  if (manifestations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 pt-16">
        <div className="w-16 h-16 rounded-2xl bg-[#E4B77D]/10 border border-[#E4B77D]/20 flex items-center justify-center mb-5">
          <Sparkles className="w-7 h-7 text-[#E4B77D]/60" />
        </div>
        <h3 className="text-lg font-semibold text-white/80 mb-2">No Manifestations Yet</h3>
        <p className="text-white/30 text-sm max-w-xs leading-relaxed mb-6">
          Start a chat session and the AI will capture your first manifestation automatically.
        </p>
        <button
          onClick={() => router.push('/chat')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-[#0a0a0f] transition-all hover:brightness-110 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #E4B77D, #F0C896)' }}
        >
          <Plus className="w-4 h-4" />
          Start Manifesting
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white/85 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E4B77D]" />
            My Manifestations
          </h2>
          <p className="text-white/30 text-xs mt-0.5">
            {manifestations.length} {manifestations.length === 1 ? 'manifestation' : 'manifestations'}
          </p>
        </div>
        <button
          onClick={() => router.push('/chat')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-[#0a0a0f] transition-all hover:brightness-110 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #E4B77D, #F0C896)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {manifestations.map((m) => {
          const tasks: MicroTask[] = (m.intent?.microTasks as MicroTask[]) || [];
          const completedCount = tasks.filter((t) => t.completed).length;
          const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
          const gallery: string[] = (m.intent?.gallery as string[]) || [];
          const thumb = gallery[0];

          return (
            <motion.div
              key={m.id}
              variants={item}
              onClick={() => onSelectManifestation(m)}
              className="group relative bg-[#0e0e18] border border-white/6 rounded-2xl cursor-pointer hover:border-[#E4B77D]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#E4B77D]/5 overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-[#E4B77D]/5 overflow-hidden">
                {thumb ? (
                  <img src={thumb} alt="Vision" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-[#E4B77D]/20" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e18] via-transparent to-transparent" />

                {/* Status badge */}
                {m.status && (
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${STATUS_STYLES[m.status] || STATUS_STYLES.draft}`}>
                    {m.status}
                  </span>
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, m)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-red-400/70 hover:text-red-400"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-white/85 text-sm mb-1 leading-tight line-clamp-2 group-hover:text-white transition-colors">
                  {m.title || 'Untitled Manifestation'}
                </h3>
                <p className="text-[11px] text-white/35 leading-relaxed line-clamp-2 mb-3">
                  {getPreview(m)}
                </p>

                {/* Progress bar */}
                {tasks.length > 0 && (
                  <div className="mb-3">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #E4B77D, #F0C896)' }}
                      />
                    </div>
                    <p className="text-[10px] text-white/20 mt-1">{progress}% complete</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-white/20 border-t border-white/5 pt-2">
                  <span>
                    {m.updated_at ? new Date(m.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                  <div className="flex items-center gap-1 text-[#E4B77D]/50 group-hover:text-[#E4B77D] transition-colors">
                    <span>Open</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
