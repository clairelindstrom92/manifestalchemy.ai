'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  Circle,
  Sparkles,
  Heart,
  Upload,
  X,
  Loader2,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useToast } from '@/components/shared/Toast';
import GoldButton from '@/components/shared/GoldButton';
import ChatInterface from './ChatInterface';
import JournalPanel from './JournalPanel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

interface Chat {
  id: string;
  title?: string;
  messages?: Message[];
  content?: string;
  created_at?: string;
  updated_at?: string;
}

interface MicroTask {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
}

interface VisionImage {
  url: string;
  source: 'gallery' | 'chat';
}

interface ReferenceImage {
  id: string;
  source_url: string;
  storage_path?: string;
  label?: string | null;
}

interface ManifestationData {
  id?: string;
  title?: string | null;
  summary?: string | null;
  intent?: Record<string, any> | null;
  needs_title?: boolean;
  status?: string | null;
  confidence?: number | null;
  chats?: Chat[];
  updated_at?: string;
  created_at?: string;
}

interface ManifestationDetailProps {
  manifestation: ManifestationData;
  onBack: () => void;
  onUpdate: () => void;
}

const normalizeMicroTasks = (tasks?: MicroTask[]): MicroTask[] => {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.map((task, index) => ({
    id: task.id || `task-${Date.now()}-${index}`,
    title: task.title || `Task ${index + 1}`,
    description: task.description || '',
    completed: Boolean(task.completed),
  }));
};

const calculateProgress = (tasks: MicroTask[]) => {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
};

export default function ManifestationDetail({ manifestation, onBack, onUpdate }: ManifestationDetailProps) {
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [intentState, setIntentState] = useState<Record<string, any>>(manifestation.intent || {});
  const [microTasks, setMicroTasks] = useState<MicroTask[]>(normalizeMicroTasks(manifestation.intent?.microTasks));
  const [progress, setProgress] = useState(calculateProgress(microTasks));
  const [summary, setSummary] = useState(manifestation.summary || (manifestation.intent?.summary as string) || '');
  const [galleryImages, setGalleryImages] = useState<VisionImage[]>(() =>
    ((manifestation.intent?.gallery as string[]) || []).map((url) => ({ url, source: 'gallery' as const }))
  );
  const [chatImages, setChatImages] = useState<VisionImage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savedImageUrls, setSavedImageUrls] = useState<Set<string>>(new Set());
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [uploadingReference, setUploadingReference] = useState(false);
  const { user } = useSupabaseUser();
  const { showSuccess, showError } = useToast();

  const collectChatMessages = (): Message[] => {
    const all: Message[] = [];
    manifestation.chats?.forEach((chat) => {
      if (chat.messages) {
        all.push(...chat.messages);
      } else if (chat.content) {
        try { const p = JSON.parse(chat.content); if (Array.isArray(p)) all.push(...p); } catch {}
      }
    });
    return all;
  };

  useEffect(() => {
    if (!user || !manifestation.id) return;
    supabase
      .from('saved_images')
      .select('source_url')
      .eq('user_id', user.id)
      .eq('manifestation_id', manifestation.id)
      .then(({ data }: { data: { source_url: string }[] | null }) => {
        if (data) setSavedImageUrls(new Set(data.map((r) => r.source_url)));
      });
    fetch(`/api/images/reference?userId=${user.id}&manifestationId=${manifestation.id}`)
      .then((r) => r.json())
      .then(({ images }) => { if (images) setReferenceImages(images); });
  }, [user, manifestation.id]);

  useEffect(() => {
    setIntentState(manifestation.intent || {});
    const tasks = normalizeMicroTasks(manifestation.intent?.microTasks as MicroTask[]);
    setMicroTasks(tasks);
    setProgress(calculateProgress(tasks));
    setSummary(manifestation.summary || (manifestation.intent?.summary as string) || '');
    setGalleryImages(((manifestation.intent?.gallery as string[]) || []).map((url) => ({ url, source: 'gallery' as const })));
    const chatImgUrls = Array.from(new Set(collectChatMessages().filter((m) => !!m.imageUrl).map((m) => m.imageUrl as string)));
    setChatImages(chatImgUrls.map((url) => ({ url, source: 'chat' as const })));
  }, [manifestation.intent, manifestation.summary, manifestation.chats]);

  const updateIntent = async (patch: Record<string, any>, extra: Record<string, any> = {}) => {
    if (!manifestation.id) return;
    const merged = { ...intentState, ...patch };
    setIntentState(merged);
    await supabase.from('manifestations').update({ intent: merged, ...extra, updated_at: new Date().toISOString() }).eq('id', manifestation.id);
    onUpdate();
  };

  const handleToggleTask = async (taskId: string) => {
    const updated = microTasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setMicroTasks(updated);
    setProgress(calculateProgress(updated));
    await updateIntent({ microTasks: updated });
  };

  const handleGeneratePlan = async () => {
    if (!manifestation.id) { showError('Manifestation ID missing'); return; }
    const conversation = collectChatMessages().filter((m) => m.content?.trim()).map((m) => ({ role: m.role, content: m.content }));
    if (!conversation.length) { showError('No chat history. Start a conversation first.'); return; }
    setAnalyzing(true);
    try {
      const res = await fetch('/api/manifestations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifestationId: manifestation.id, messages: conversation.slice(-60) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Analysis failed'); }
      const data = await res.json();
      const tasks = normalizeMicroTasks(data.microTasks);
      setMicroTasks(tasks);
      setProgress(calculateProgress(tasks));
      setSummary(data.summary || summary);
      await updateIntent({ microTasks: tasks, summary: data.summary, inspirationPrompts: data.inspirationPrompts }, { summary: data.summary });
      showSuccess('Plan generated');
    } catch (err) {
      showError(`Plan generation failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!manifestation.id || !user) { showError('Must be logged in'); return; }
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const sanitized = file.name.replace(/\s+/g, '-');
      const path = `${user.id}/${manifestation.id}/${Date.now()}-${sanitized}`;
      const { error } = await supabase.storage.from('manifestation-media').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('manifestation-media').getPublicUrl(path);
      const updated = [...galleryImages, { url: publicUrl, source: 'gallery' as const }];
      setGalleryImages(updated);
      await updateIntent({ gallery: updated.filter((i) => i.source === 'gallery').map((i) => i.url) });
      showSuccess('Image uploaded');
    } catch (err) {
      showError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleToggleSave = async (imageUrl: string) => {
    if (!user || !manifestation.id) return;
    const isSaved = savedImageUrls.has(imageUrl);
    if (isSaved) {
      await fetch('/api/images/save', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, sourceUrl: imageUrl }) });
      setSavedImageUrls((prev) => { const s = new Set(prev); s.delete(imageUrl); return s; });
    } else {
      await fetch('/api/images/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, manifestationId: manifestation.id, sourceUrl: imageUrl, prompt: summary || manifestation.title }) });
      setSavedImageUrls((prev) => new Set(prev).add(imageUrl));
      showSuccess('Saved to collection');
    }
  };

  const handleReferenceUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user || !manifestation.id) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReference(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('userId', user.id);
      fd.append('manifestationId', manifestation.id);
      fd.append('label', file.name);
      const res = await fetch('/api/images/reference', { method: 'POST', body: fd });
      const { image } = await res.json();
      if (image) { setReferenceImages((prev) => [image, ...prev]); showSuccess('Reference added — influences your next vision'); }
    } catch { showError('Upload failed'); }
    finally { setUploadingReference(false); e.target.value = ''; }
  };

  const handleRemoveReference = async (img: ReferenceImage) => {
    if (!user) return;
    await fetch('/api/images/reference', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, imageId: img.id, storagePath: img.storage_path }) });
    setReferenceImages((prev) => prev.filter((r) => r.id !== img.id));
  };

  const handleGenerateVision = async () => {
    if (!manifestation.id) { showError('Manifestation not found'); return; }
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/manifestations/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifestationId: manifestation.id, prompt: summary || manifestation.title, userId: user?.id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const { imageUrl } = await res.json();
      const updated = [...galleryImages, { url: imageUrl, source: 'gallery' as const }];
      setGalleryImages(updated);
      await updateIntent({ gallery: updated.filter((i) => i.source === 'gallery').map((i) => i.url) });
      showSuccess('Vision generated');
    } catch (err) {
      showError(`Vision generation failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (showNewChat || activeChat) {
    return (
      <ChatInterface
        project={activeChat ? {
          id: activeChat.id,
          title: activeChat.title || 'Untitled Chat',
          content: activeChat.messages ? JSON.stringify(activeChat.messages) : activeChat.content,
          updated_at: activeChat.updated_at,
        } : null}
        onBack={() => { setShowNewChat(false); setActiveChat(null); }}
        onProjectUpdate={onUpdate}
        onProjectCreated={async () => { await onUpdate(); setShowNewChat(false); }}
        onProjectDeleted={onUpdate}
        manifestationId={manifestation.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#08080f]/95 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E4B77D]" />
                <h1 className="text-lg font-semibold text-white/90 leading-tight">
                  {manifestation.title || 'Untitled Manifestation'}
                </h1>
              </div>
              {manifestation.status && (
                <span className="text-[11px] text-white/30 capitalize ml-6">{manifestation.status}</span>
              )}
            </div>
          </div>
          <GoldButton size="sm" onClick={() => { setShowNewChat(true); setActiveChat(null); }}>
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </GoldButton>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* Summary Card */}
        <div className="bg-[#0e0e18] border border-white/6 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-0.5">Manifestation Summary</h3>
              <p className="text-xs text-white/30">AI-captured snapshot of your vision</p>
            </div>
            <GoldButton size="sm" variant="outline" onClick={handleGeneratePlan} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{analyzing ? 'Analyzing…' : 'Generate Plan'}</span>
            </GoldButton>
          </div>
          <p className="text-white/65 text-sm leading-relaxed">
            {summary || 'No summary yet. Generate a plan once the chat has enough details.'}
          </p>
        </div>

        {/* Progress */}
        <div className="bg-[#0e0e18] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/80">Progress</h3>
            <span className="text-sm font-semibold text-[#E4B77D]">{progress}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #E4B77D, #F0C896)' }}
            />
          </div>
          <p className="text-[11px] text-white/25 mt-2">
            {microTasks.length > 0
              ? `${microTasks.filter((t) => t.completed).length} of ${microTasks.length} micro-tasks complete`
              : 'Generate a plan to unlock action steps'}
          </p>
        </div>

        {/* Vision Board */}
        <div className="bg-[#0e0e18] border border-white/6 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#E4B77D]" />
              <h3 className="text-sm font-semibold text-white/80">Vision Board</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 text-white/50 hover:text-white/80 hover:border-[#E4B77D]/30 transition-all cursor-pointer">
                {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploadingImage ? 'Uploading…' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
              <GoldButton size="sm" variant="solid" onClick={handleGenerateVision} disabled={isGeneratingImage}>
                {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isGeneratingImage ? 'Generating…' : 'Generate Vision'}</span>
              </GoldButton>
            </div>
          </div>

          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {galleryImages.map((image, i) => (
                <motion.div
                  key={`${image.url}-${i}`}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative aspect-square rounded-xl overflow-hidden border border-white/6 group"
                >
                  <img src={image.url} alt="Vision" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleToggleSave(image.url)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart size={14} className={savedImageUrls.has(image.url) ? 'fill-[#E4B77D] text-[#E4B77D]' : 'text-white'} />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/25 py-6 text-center">
              No vision images yet. Upload a photo or generate an AI vision to begin.
            </p>
          )}

          {chatImages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-white/30 mb-3">Chat attachments</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {chatImages.map((img) => (
                  <div key={img.url} className="relative aspect-square rounded-lg overflow-hidden border border-dashed border-white/10 group">
                    <img src={img.url} alt="Chat" className="w-full h-full object-cover" />
                    <button onClick={() => handleToggleSave(img.url)} className="absolute top-1 right-1 p-1 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart size={10} className={savedImageUrls.has(img.url) ? 'fill-[#E4B77D] text-[#E4B77D]' : 'text-white'} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference Images */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-white/60">Reference Images</p>
                <p className="text-[10px] text-white/25 mt-0.5">Influence how your visions are generated</p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-white/10 text-white/40 hover:text-[#E4B77D] hover:border-[#E4B77D]/30 transition-all cursor-pointer">
                <Upload size={11} />
                {uploadingReference ? 'Uploading…' : 'Add Reference'}
                <input type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} disabled={uploadingReference} />
              </label>
            </div>
            {referenceImages.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {referenceImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/8 group">
                    <img src={img.source_url} alt={img.label || 'Ref'} className="w-full h-full object-cover" />
                    <button onClick={() => handleRemoveReference(img)} className="absolute top-0.5 right-0.5 p-1 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={9} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-white/20">
                Add your photo — the AI will blend your likeness into generated visions.
              </p>
            )}
          </div>
        </div>

        {/* Micro Tasks */}
        <div className="bg-[#0e0e18] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/80">Action Steps</h3>
            {microTasks.length > 0 && (
              <span className="text-[11px] text-white/25">Tap to mark complete</span>
            )}
          </div>
          {microTasks.length > 0 ? (
            <div className="space-y-2">
              {microTasks.map((task, i) => (
                <motion.button
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`w-full flex items-start gap-3 text-left p-3 rounded-xl border transition-all ${
                    task.completed
                      ? 'border-[#E4B77D]/15 bg-[#E4B77D]/5'
                      : 'border-white/5 hover:border-[#E4B77D]/20 hover:bg-white/2'
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#E4B77D] mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/20 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${task.completed ? 'text-white/40 line-through' : 'text-white/80'}`}>{task.title}</p>
                    {task.description && <p className="text-[11px] text-white/30 mt-0.5">{task.description}</p>}
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/25 py-4 text-center">
              Generate a plan above to receive bite-sized action steps.
            </p>
          )}
        </div>

        {/* Living Journal */}
        {manifestation.id && (
          <div className="bg-[#0e0e18] border border-white/6 rounded-2xl p-5">
            <JournalPanel
              manifestationId={manifestation.id}
              manifestationTitle={manifestation.title}
              manifestationSummary={manifestation.summary}
            />
          </div>
        )}

        {/* Chats */}
        <div className="bg-[#0e0e18] border border-white/6 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Chat Sessions</h3>
          {manifestation.chats && manifestation.chats.length > 0 ? (
            <div className="space-y-2">
              {manifestation.chats.map((chat) => {
                const msgCount = chat.messages?.length ?? (() => {
                  try { const p = JSON.parse(chat.content || '[]'); return Array.isArray(p) ? p.length : 0; } catch { return 0; }
                })();
                return (
                  <motion.button
                    key={chat.id}
                    onClick={() => {
                      let msgs: Message[] = [];
                      if (chat.messages) msgs = chat.messages;
                      else if (chat.content) { try { msgs = JSON.parse(chat.content); } catch {} }
                      setActiveChat({ ...chat, messages: msgs, title: chat.title || 'Untitled Chat' });
                      setShowNewChat(false);
                    }}
                    className="w-full text-left p-4 rounded-xl border border-white/5 hover:border-[#E4B77D]/25 hover:bg-white/2 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">
                          {chat.title || 'Untitled Chat'}
                        </h4>
                        <p className="text-[11px] text-white/25 mt-0.5">{msgCount} messages</p>
                      </div>
                      <p className="text-[11px] text-white/20">
                        {chat.updated_at ? new Date(chat.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-white/25 py-4 text-center">
              No sessions yet. Start a new chat to begin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
