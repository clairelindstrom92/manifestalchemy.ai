'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles, LogOut, User, Plus } from 'lucide-react';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', currentUserId);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.avatarUrl) setAvatarUrl(json.avatarUrl);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);

      const [profileRes, projectsRes] = await Promise.all([
        fetch(`/api/profile/avatar?userId=${user.id}`),
        supabase.from('posts').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
      ]);

      const profileJson = await profileRes.json();
      if (profileJson.profile?.avatar_url) setAvatarUrl(profileJson.profile.avatar_url);
      setProjects(projectsRes.data || []);
      setLoading(false);
    };

    fetchProjects();
  }, [refreshTrigger]);

  return (
    <div className="w-60 shrink-0 bg-[#0c0c16] border-r border-white/5 flex flex-col h-screen">
      {/* Profile */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <label className="relative cursor-pointer group shrink-0" title="Upload profile photo">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#E4B77D]/25 group-hover:border-[#E4B77D]/60 transition-colors flex items-center justify-center bg-[#E4B77D]/8">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-[#E4B77D]/50 group-hover:text-[#E4B77D] transition-colors" />
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <div className="w-3.5 h-3.5 border-2 border-[#E4B77D] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
        </label>
        <div className="min-w-0">
          <p className="text-[11px] text-white/40 leading-none">Profile</p>
          <p className="text-[10px] text-[#E4B77D]/50 mt-0.5">Personalize your visions</p>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} className="text-[#E4B77D]" />
          Sessions
        </h2>
        <button
          onClick={onNewProject}
          className="w-6 h-6 rounded-lg bg-[#E4B77D]/15 hover:bg-[#E4B77D]/25 border border-[#E4B77D]/20 flex items-center justify-center text-[#E4B77D] transition-colors"
          title="New chat"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="px-4 py-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-white/3 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-[11px] text-white/25 px-4 py-4 leading-relaxed">
            No sessions yet. Start chatting to begin your manifestation journey.
          </p>
        ) : (
          projects.map((p) => (
            <motion.button
              key={p.id}
              onClick={() => { setActiveId(p.id || null); onSelectProject(p); }}
              className={`w-full text-left px-3 py-2.5 mx-1 rounded-lg transition-all duration-150 border ${
                activeId === p.id
                  ? 'bg-[#E4B77D]/12 border-[#E4B77D]/20 text-white/90'
                  : 'border-transparent hover:bg-white/4 hover:border-white/6 text-white/60'
              }`}
              style={{ width: 'calc(100% - 8px)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-medium text-[13px] truncate">{p.title || 'Manifestation in progress'}</div>
              <div className="text-[10px] text-white/25 mt-0.5">
                {p.updated_at ? new Date(p.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/4 transition-colors text-xs"
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
