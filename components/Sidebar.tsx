'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectData {
  id?: string;
  title?: string;
  messages?: string;
  content?: string;
  updated_at?: string;
  created_at?: string;
  author_id?: string;
  manifestation_id?: string | null;
}

interface SidebarProps {
  onSelectProject: (project: ProjectData) => void;
  onNewProject: () => void;
  refreshTrigger?: number;
}

export default function Sidebar({ onSelectProject, onNewProject, refreshTrigger }: SidebarProps) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading projects:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        }
        // Set empty array on error to prevent UI issues
        setProjects([]);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    };
    
    fetchProjects();
  }, [refreshTrigger]);

  return (
    <div className="w-64 bg-[#151520] border-r border-[#2a2a3a] text-[#f5f5f7] flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a3a] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#f5f5f7] flex items-center gap-2">
          <Sparkles size={18} className="text-[#E4B77D] gold-shiny" /> Manifestations
        </h2>
        <button
          onClick={onNewProject}
          className="relative transition-all duration-500 backdrop-blur-sm overflow-hidden px-3 py-1.5 rounded-full text-xs font-medium text-[#f5f5f7] gold-shiny"
          style={{
            background: 'linear-gradient(to right, rgba(228, 183, 125, 0.2), rgba(228, 183, 125, 0.25), rgba(228, 183, 125, 0.2))',
            border: '1px solid rgba(228, 183, 125, 0.3)',
            textShadow: '0 0 10px rgba(228, 183, 125, 0.7), 0 0 20px rgba(228, 183, 125, 0.5), 0 0 30px rgba(228, 183, 125, 0.3)',
            fontFamily: "'Quicksand', 'Poppins', sans-serif",
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(228, 183, 125, 0.3), rgba(228, 183, 125, 0.35), rgba(228, 183, 125, 0.3))';
            e.currentTarget.style.borderColor = 'rgba(228, 183, 125, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(228, 183, 125, 0.2), rgba(228, 183, 125, 0.25), rgba(228, 183, 125, 0.2))';
            e.currentTarget.style.borderColor = 'rgba(228, 183, 125, 0.3)';
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
          <span className="relative z-10">+ New</span>
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <p className="text-sm text-[#a1a1aa] p-2">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-[#a1a1aa] p-3">
            No manifestations yet. <br /> Start one to begin your journey
          </p>
        ) : (
          projects.map((p) => (
            <motion.button
              key={p.id}
              onClick={() => onSelectProject(p)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#1f1f2e] transition-colors border border-transparent hover:border-[#2a2a3a]"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="font-medium text-[#f5f5f7] text-sm">{p.title || 'Manifestation in progress'}</div>
              <div className="text-xs text-[#71717a] mt-1">
                {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'No date'}
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-[#2a2a3a]">
        <button
          onClick={handleLogout}
          className="relative w-full flex items-center justify-center gap-2 px-4 py-2 text-[#f5f5f7] rounded-full transition-all duration-500 backdrop-blur-sm overflow-hidden text-xs font-medium gold-shiny"
          style={{
            background: 'linear-gradient(to right, rgba(228, 183, 125, 0.2), rgba(228, 183, 125, 0.25), rgba(228, 183, 125, 0.2))',
            border: '1px solid rgba(228, 183, 125, 0.3)',
            textShadow: '0 0 10px rgba(228, 183, 125, 0.7), 0 0 20px rgba(228, 183, 125, 0.5), 0 0 30px rgba(228, 183, 125, 0.3)',
            fontFamily: "'Quicksand', 'Poppins', sans-serif",
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(228, 183, 125, 0.3), rgba(228, 183, 125, 0.35), rgba(228, 183, 125, 0.3))';
            e.currentTarget.style.borderColor = 'rgba(228, 183, 125, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(228, 183, 125, 0.2), rgba(228, 183, 125, 0.25), rgba(228, 183, 125, 0.2))';
            e.currentTarget.style.borderColor = 'rgba(228, 183, 125, 0.3)';
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
          <LogOut size={14} className="relative z-10" />
          <span className="relative z-10">Logout</span>
        </button>
      </div>
    </div>
  );
}

