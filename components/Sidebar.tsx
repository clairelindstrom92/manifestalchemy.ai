'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectData {
  id?: string;
  title?: string;
  messages?: string;
  updated_at?: string;
  user_id?: string;
}

interface SidebarProps {
  onSelectProject: (project: ProjectData) => void;
  onNewProject: () => void;
  refreshTrigger?: number;
}

export default function Sidebar({ onSelectProject, onNewProject, refreshTrigger }: SidebarProps) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('manifestations')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('updated_at', { ascending: false });

      if (error) console.error('Error loading projects:', error);
      else setProjects(data || []);
      setLoading(false);
    };
    
    fetchProjects();
  }, [refreshTrigger]);

  return (
    <div className="w-64 bg-black/30 backdrop-blur-md border-r border-white/10 text-white flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
          <Sparkles size={18} /> Manifestations
        </h2>
        <button
          onClick={onNewProject}
          className="bg-amber-500 hover:bg-amber-400 transition-colors px-2 py-1 rounded-md text-sm font-medium text-black"
        >
          + New
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <p className="text-sm text-white/60 p-2">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-white/60 p-3">
            No manifestations yet. <br /> Start one to begin your journey ✨
          </p>
        ) : (
          projects.map((p) => (
            <motion.button
              key={p.id}
              onClick={() => onSelectProject(p)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-medium text-amber-300">{p.title || 'Untitled'}</div>
              <div className="text-xs text-white/50">
                {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'No date'}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}

