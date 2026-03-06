'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import type { JournalEntry } from '@/types';

interface JournalPanelProps {
  manifestationId: string;
  manifestationTitle?: string | null;
  manifestationSummary?: string | null;
}

const MOOD_LABELS: Record<string, string> = {
  high: '✨ High vibration',
  neutral: '〰️ Neutral',
  low: '🌙 Processing',
};

export default function JournalPanel({
  manifestationId,
  manifestationTitle,
  manifestationSummary,
}: JournalPanelProps) {
  const { user } = useSupabaseUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [askingAi, setAskingAi] = useState(false);

  // Load entries on mount
  useEffect(() => {
    if (!user) return;
    loadEntries();
  }, [user, manifestationId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadEntries() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/journal?manifestation_id=${manifestationId}&user_id=${user.id}`
      );
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user || !newEntry.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          manifestationId,
          content: newEntry.trim(),
          mood: mood || null,
        }),
      });
      const data = await res.json();
      if (data.entry) {
        setEntries(prev => [data.entry, ...prev]);
        setNewEntry('');
        setMood('');
      }
    } catch (err) {
      console.error('Failed to save entry:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    try {
      await fetch(`/api/journal?id=${id}&user_id=${user.id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  }

  async function handleAskAI() {
    if (!user || !aiQuestion.trim()) return;
    setAskingAi(true);
    setAiAnswer('');
    try {
      const res = await fetch('/api/journal/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          manifestationId,
          question: aiQuestion.trim(),
          manifestationTitle,
          manifestationSummary,
        }),
      });
      const data = await res.json();
      setAiAnswer(data.answer ?? 'No answer returned.');
    } catch (err) {
      console.error('Failed to ask AI:', err);
      setAiAnswer('Something went wrong. Please try again.');
    } finally {
      setAskingAi(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[#E4B77D]" />
        <h3 className="text-base font-semibold text-[#f5f5f7]">Living Journal</h3>
        <span className="text-xs text-[#71717a] ml-auto">{entries.length} entries</span>
      </div>

      {/* New entry composer */}
      <div className="space-y-3">
        <textarea
          value={newEntry}
          onChange={e => setNewEntry(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
          }}
          placeholder="Write today's reflection, progress, or insight..."
          className="w-full bg-[#1f1f2e] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#71717a] focus:outline-none focus:border-[#E4B77D]/60 resize-none min-h-[100px] transition-colors"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={mood}
            onChange={e => setMood(e.target.value)}
            className="bg-[#1f1f2e] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f5f5f7] focus:outline-none focus:border-[#E4B77D]/60 transition-colors"
          >
            <option value="">Mood (optional)</option>
            <option value="high">✨ High vibration</option>
            <option value="neutral">〰️ Neutral</option>
            <option value="low">🌙 Processing</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving || !newEntry.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[#E4B77D]/40 text-[#E4B77D] hover:bg-[#E4B77D]/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add Entry
          </button>
          <span className="text-xs text-[#52525b] hidden sm:block">⌘↵ to save</span>
        </div>
      </div>

      {/* AI Ask section */}
      <div className="border border-[#2a2a3a] rounded-xl p-4 space-y-3 bg-[#1a1a28]">
        <p className="text-xs text-[#71717a] flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#E4B77D]" />
          Ask the AI about your progress
        </p>
        <div className="flex gap-2">
          <input
            value={aiQuestion}
            onChange={e => setAiQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAskAI(); }}
            placeholder="Am I on track? What should I do today?"
            className="flex-1 bg-[#1f1f2e] border border-[#2a2a3a] rounded-xl px-4 py-2 text-sm text-white placeholder-[#71717a] focus:outline-none focus:border-[#E4B77D]/60 transition-colors"
          />
          <button
            onClick={handleAskAI}
            disabled={askingAi || !aiQuestion.trim()}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#E4B77D] text-[#151520] hover:bg-[#F0C896] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {askingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
          </button>
        </div>
        <AnimatePresence>
          {aiAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-[#1f1f2e] border border-[#E4B77D]/20 rounded-xl p-4 text-sm text-[#f5f5f7] leading-relaxed"
            >
              {aiAnswer}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Entry list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading entries...
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-[#52525b] italic">
            No entries yet. Write your first reflection above.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {entries.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="group bg-[#1f1f2e] border border-[#2a2a3a] rounded-xl p-4 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717a]">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {entry.mood && (
                      <span className="ml-2 text-[#E4B77D]">
                        · {MOOD_LABELS[entry.mood] ?? entry.mood}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 rounded"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm text-[#e4e4e7] leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
