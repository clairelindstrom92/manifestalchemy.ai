'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

export default function AffirmationsPage() {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const [affirmations, setAffirmations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) fetchAffirmations();
  }, [user]);

  const fetchAffirmations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, content, title, created_at')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (posts && posts.length > 0) {
        const extracted: string[] = [];
        for (const post of posts) {
          try {
            const messages = JSON.parse(post.content || '[]');
            messages.forEach((msg: any) => {
              if (msg.role === 'assistant' && msg.content) {
                msg.content.split(/[.!?]+/).forEach((s: string) => {
                  const t = s.trim();
                  if (t.length > 20 && (t.toLowerCase().startsWith('i ') || t.toLowerCase().startsWith('you ') || /^[A-Z]/.test(t))) {
                    extracted.push(t);
                  }
                });
              }
            });
          } catch {}
        }
        if (extracted.length > 0) { setAffirmations(extracted.slice(0, 9)); setIsLoading(false); return; }
      }
      await generateAffirmations(posts || []);
    } catch {
      setAffirmations([
        "I am worthy of all that I desire and more.",
        "Abundance flows to me effortlessly and naturally.",
        "Every day, I grow more aligned with my highest self.",
        "I attract love, wealth, and radiant health.",
        "My thoughts are seeds of infinite possibility.",
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAffirmations = async (posts: any[]) => {
    setIsGenerating(true);
    try {
      const context = posts.slice(0, 5).map((p) => {
        try { return JSON.parse(p.content || '[]').map((m: any) => m.content).join(' '); } catch { return ''; }
      }).join(' ').substring(0, 600);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Based on my manifestation journey, generate 9 powerful, personalized affirmations in "I am" and "I have" format. Make them specific, vivid, and high-vibrational. Format as a numbered list.\n\nContext: ${context || 'general manifestation work'}`,
          }],
        }),
      });

      // Consume streaming response
      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          try {
            const ev = JSON.parse(line);
            if (ev.t === 'c') fullText += ev.v;
          } catch {}
        }
      }

      const lines = fullText.split('\n').filter((l) => l.trim().length > 8).map((l) => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
      setAffirmations(lines.slice(0, 9));
    } catch {
      setAffirmations([
        "I am aligned with the frequency of abundance.",
        "I magnetize my desires with ease and grace.",
        "I am the architect of my extraordinary reality.",
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#08080f]/95 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#E4B77D]" />
          <h1 className="text-base font-semibold text-white/85">Daily Affirmations</h1>
        </div>
        <button
          onClick={() => generateAffirmations([])}
          disabled={isGenerating}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-white/10 text-white/40 hover:text-[#E4B77D] hover:border-[#E4B77D]/30 transition-all disabled:opacity-40"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Regenerate
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {affirmations.length > 0 ? (
              affirmations.map((aff, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex items-start gap-4 bg-[#0e0e18] border border-white/6 hover:border-[#E4B77D]/25 rounded-xl p-4 transition-all duration-200"
                >
                  <div className="w-6 h-6 rounded-full bg-[#E4B77D]/10 border border-[#E4B77D]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-[#E4B77D]/70" />
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/85 transition-colors">{aff}</p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-white/25">
                <p className="text-sm">No affirmations yet. Start chatting to generate personalized ones.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
