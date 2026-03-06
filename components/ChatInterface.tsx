'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Trash2, ArrowLeft, LogOut, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useToast } from '@/components/shared/Toast';
import GoldButton from '@/components/shared/GoldButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

interface ProjectData {
  id?: string;
  title?: string;
  messages?: string;
  content?: string;
  updated_at?: string;
  manifestation_id?: string | null;
}

interface MicroTask {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
}

interface IntentPayload {
  title: string | null;
  summary?: string | null;
  confidence?: number | null;
  reason?: string | null;
  microTasks?: MicroTask[];
  imagePrompts?: string[];
}

interface ChatInterfaceProps {
  onBack?: () => void;
  project?: ProjectData | null;
  onProjectUpdate?: () => void;
  onProjectCreated?: (project: ProjectData) => void;
  onProjectDeleted?: () => void;
  manifestationId?: string;
}

const INTENT_CONFIDENCE_THRESHOLD = 0.7;

const STARTER_PROMPTS = [
  "I want to manifest financial abundance and freedom",
  "I want to attract my ideal romantic partner",
  "I want to build my dream career or business",
  "I want to manifest my dream home",
  "I want to improve my health and vitality",
  "I want to cultivate deeper confidence and self-love",
];

const normalizeMicroTasks = (tasks?: MicroTask[]): MicroTask[] => {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.map((task, index) => ({
    id: task.id || `task-${Date.now()}-${index}`,
    title: task.title || `Task ${index + 1}`,
    description: task.description || '',
    completed: Boolean(task.completed),
  }));
};

export default function ChatInterface({
  onBack,
  project,
  onProjectUpdate,
  onProjectCreated,
  onProjectDeleted,
  manifestationId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentProjectIdRef = useRef<string | null>(null);
  const currentManifestationIdRef = useRef<string | null>(project?.manifestation_id || null);
  const { user } = useSupabaseUser();
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const contentToParse = project?.content || project?.messages;
    if (contentToParse) {
      try {
        setMessages(JSON.parse(contentToParse));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
    currentProjectIdRef.current = project?.id || null;
    currentManifestationIdRef.current = project?.manifestation_id || null;
  }, [project]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showError('Image must be under 10MB'); return; }
    if (!file.type.startsWith('image/')) { showError('Please select an image file'); return; }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deriveInitialTitle = (content?: string) => {
    if (!content) return null;
    const cleaned = content.replace(/\[Image\]/g, '').trim();
    if (cleaned.split(/\s+/).filter(Boolean).length < 3 || cleaned.length < 20) return null;
    return cleaned.length > 80 ? `${cleaned.substring(0, 77)}...` : cleaned;
  };

  const ensureManifestation = async (postId?: string | null) => {
    if (!user) return null;

    if (!currentManifestationIdRef.current && postId) {
      const { data: existing } = await supabase
        .from('manifestations')
        .select('id')
        .eq('chat_post_id', postId)
        .maybeSingle();
      if (existing?.id) {
        currentManifestationIdRef.current = existing.id;
        return existing.id;
      }
    }

    if (currentManifestationIdRef.current) {
      if (postId) {
        await supabase.from('posts').update({ manifestation_id: currentManifestationIdRef.current }).eq('id', postId);
      }
      return currentManifestationIdRef.current;
    }

    const payload: Record<string, unknown> = { author_id: user.id, status: 'draft', needs_title: true };
    if (postId) payload.chat_post_id = postId;

    const { data, error } = await supabase.from('manifestations').insert(payload).select('id').single();
    if (error) { showError(`Failed to start manifestation: ${error.message}`); return null; }

    currentManifestationIdRef.current = data?.id || null;
    if (postId && currentManifestationIdRef.current) {
      await supabase.from('posts').update({ manifestation_id: currentManifestationIdRef.current }).eq('id', postId);
    }
    return currentManifestationIdRef.current;
  };

  const maybeFinalizeManifestation = async (intent?: IntentPayload) => {
    if (!intent?.title || !intent?.confidence) return;
    if (intent.confidence < INTENT_CONFIDENCE_THRESHOLD) return;

    const normalizedTasks = normalizeMicroTasks(intent.microTasks);
    const mId = await ensureManifestation(currentProjectIdRef.current);
    if (!mId) return;

    await supabase.from('manifestations').update({
      title: intent.title,
      summary: intent.summary ?? null,
      confidence: intent.confidence,
      needs_title: false,
      status: 'active',
      intent: { ...intent, microTasks: normalizedTasks },
      chat_post_id: currentProjectIdRef.current,
    }).eq('id', mId);

    if (currentProjectIdRef.current) {
      await supabase.from('posts').update({
        title: intent.title,
        manifestation_id: mId,
        updated_at: new Date().toISOString(),
      }).eq('id', currentProjectIdRef.current);
    }

    if (user && intent.title) {
      const embeddableContent = [intent.title, intent.summary, intent.reason].filter(Boolean).join('. ');
      fetch('/api/journal/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sourceType: 'manifestation', sourceId: mId, content: embeddableContent, metadata: { title: intent.title } }),
      }).catch(() => {});
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    if (!user) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('chat-images').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(data.path);
      return publicUrl;
    } catch {
      showError('Failed to upload image');
      return null;
    }
  };

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput ?? input;
    if ((!text.trim() && !selectedImage) || isLoading) return;

    let imageUrl: string | null = null;
    if (selectedImage) imageUrl = await uploadImageToSupabase(selectedImage);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim() || (imageUrl ? '[Image]' : ''),
      timestamp: new Date(),
      imageUrl: imageUrl || undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    // Add streaming placeholder
    const streamingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: streamingId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    let fullText = '';
    let intent: IntentPayload | undefined;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          imageUrl,
          userId: user?.id,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.t === 'c') {
              fullText += event.v;
              setMessages((prev) =>
                prev.map((m) => (m.id === streamingId ? { ...m, content: fullText } : m))
              );
            } else if (event.t === 'd') {
              intent = event.intent;
            } else if (event.t === 'e') {
              throw new Error(event.error);
            }
          } catch (parseErr) {
            // Ignore JSON parse errors for partial lines
          }
        }
      }

      // Finalize message in state
      const finalMessages = updatedMessages.concat({
        id: streamingId,
        role: 'assistant',
        content: fullText || "I'm here to help you manifest your dreams. Please try again.",
        timestamp: new Date(),
      });
      setMessages(finalMessages);

      try {
        await saveMessages(finalMessages);
        if (intent) await maybeFinalizeManifestation(intent);
        if (onProjectUpdate) onProjectUpdate();
      } catch (saveErr) {
        showError(`Failed to save: ${saveErr instanceof Error ? saveErr.message : 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showError(errorMsg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId ? { ...m, content: `I encountered an issue: ${errorMsg}. Please try again.` } : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessages = async (updatedMessages: Message[]) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const messagesJson = JSON.stringify(updatedMessages);
    const firstUserMsg = updatedMessages.find((m) => m.role === 'user');
    const derivedTitle = deriveInitialTitle(firstUserMsg?.content || '');
    const projectId = currentProjectIdRef.current || project?.id;

    if (projectId) {
      const { error } = await supabase.from('posts').update({
        content: messagesJson,
        updated_at: new Date().toISOString(),
      }).eq('id', projectId);
      if (error) throw error;
      await ensureManifestation(projectId);
    } else {
      const insertData: Record<string, unknown> = {
        author_id: authUser.id,
        title: derivedTitle ?? 'Manifestation in progress',
        content: messagesJson,
        is_public: false,
      };
      if (manifestationId) insertData.manifestation_id = manifestationId;

      const { data, error } = await supabase.from('posts').insert(insertData).select().single();
      if (error) throw error;
      if (data) {
        currentProjectIdRef.current = data.id;
        await ensureManifestation(data.id);
        const payloadForParent = { ...data, manifestation_id: currentManifestationIdRef.current };
        if (currentManifestationIdRef.current && !data.manifestation_id) {
          await supabase.from('posts').update({ manifestation_id: currentManifestationIdRef.current }).eq('id', data.id);
        }
        if (onProjectCreated) onProjectCreated(payloadForParent);
        showSuccess('Manifestation session saved');
      }
    }

    if (authUser && currentManifestationIdRef.current) {
      const chatContent = updatedMessages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
      const sourceId = currentProjectIdRef.current || project?.id;
      if (chatContent.trim() && sourceId) {
        fetch('/api/journal/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: authUser.id, sourceType: 'chat', sourceId, content: chatContent, metadata: { manifestation_id: currentManifestationIdRef.current } }),
        }).catch(() => {});
      }
    }
  };

  const deleteChat = async () => {
    if (!project?.id) { setMessages([]); return; }
    if (!confirm('Delete this chat? This cannot be undone.')) return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { showError('Not authenticated'); return; }

      const { error } = await supabase.from('posts').delete().eq('id', project.id).eq('author_id', authUser.id);
      if (error) { showError(`Delete failed: ${error.message}`); return; }

      setMessages([]);
      if (onProjectDeleted) onProjectDeleted();
      setTimeout(() => { if (onProjectUpdate) onProjectUpdate(); if (onBack) onBack(); }, 100);
    } catch (error) {
      showError(`Delete failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[#08080f]">
      {/* Header */}
      <div className="shrink-0 bg-[#0e0e18]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#E4B77D]" />
              <span className="font-semibold text-white/90 text-sm tracking-wide">Manifest Alchemy AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project?.id && (
              <button
                onClick={deleteChat}
                className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                aria-label="Delete chat"
              >
                <Trash2 size={16} />
              </button>
            )}
            {user && (
              <button
                onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
                className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center pt-12 pb-4"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-[#E4B77D]/30"
                style={{ background: 'radial-gradient(circle, rgba(228,183,125,0.15) 0%, rgba(228,183,125,0.05) 100%)' }}
              >
                <Sparkles size={28} className="text-[#E4B77D]" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">What do you want to manifest?</h2>
              <p className="text-white/40 text-sm mb-8 max-w-sm leading-relaxed">
                Describe your desire and I'll help you architect a precise plan to bring it into reality.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-4 py-3 rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-[#E4B77D]/30 text-white/60 hover:text-white/90 text-xs transition-all duration-200 leading-relaxed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((message) => (
            <AnimatePresence key={message.id}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center mr-3 mt-1 shrink-0 border border-[#E4B77D]/30 bg-[#E4B77D]/10">
                    <Sparkles size={12} className="text-[#E4B77D]" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] lg:max-w-2xl px-4 py-3 rounded-2xl relative ${
                    message.role === 'user'
                      ? 'rounded-br-sm'
                      : 'rounded-bl-sm bg-[#13131f] border border-white/6'
                  }`}
                  style={
                    message.role === 'user'
                      ? {
                          background: 'linear-gradient(135deg, rgba(228,183,125,0.18), rgba(228,183,125,0.12))',
                          border: '1px solid rgba(228,183,125,0.25)',
                        }
                      : {}
                  }
                >
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Attached"
                      className="max-w-full h-auto rounded-lg mb-2"
                      style={{ maxHeight: 280 }}
                    />
                  )}
                  {message.role === 'user' ? (
                    <p className="text-white/90 text-[15px] leading-relaxed">
                      {message.content && message.content !== '[Image]' ? message.content : ''}
                    </p>
                  ) : (
                    <div className="text-[15px] leading-relaxed">
                      {message.content === '' && isLoading ? (
                        <span className="flex items-center gap-2 text-white/30">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E4B77D] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E4B77D] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E4B77D] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-3 last:mb-0 text-white/85">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-[#E4B77D]">{children}</strong>,
                            em: ({ children }) => <em className="italic text-white/70">{children}</em>,
                            code: ({ children }) => <code className="bg-white/8 text-[#E4B77D] px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1.5 text-white/80">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1.5 text-white/80">{children}</ol>,
                            li: ({ children }) => <li className="text-white/80">{children}</li>,
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-white">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-[#E4B77D]">{children}</h3>,
                            hr: () => <hr className="border-white/10 my-4" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 bg-[#0e0e18]/95 backdrop-blur-md border-t border-white/5 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-24 w-auto rounded-lg border border-[#E4B77D]/20" />
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" id="image-upload" />
            <label
              htmlFor="image-upload"
              className="p-2.5 rounded-xl text-white/30 hover:text-[#E4B77D] hover:bg-[#E4B77D]/10 border border-white/8 hover:border-[#E4B77D]/30 transition-all cursor-pointer shrink-0"
            >
              <ImageIcon className="w-4 h-4" />
            </label>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              disabled={isLoading}
              placeholder="Describe what you want to manifest..."
              rows={1}
              className="flex-1 bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#E4B77D]/40 focus:ring-1 focus:ring-[#E4B77D]/20 transition-all resize-none disabled:opacity-50 leading-relaxed"
              style={{ minHeight: '42px', maxHeight: '160px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="p-2.5 rounded-xl shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={
                !isLoading && (input.trim() || selectedImage)
                  ? {
                      background: 'linear-gradient(135deg, rgba(228,183,125,0.25), rgba(228,183,125,0.15))',
                      border: '1px solid rgba(228,183,125,0.4)',
                      color: '#E4B77D',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.2)',
                    }
              }
              aria-label="Send"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-white/15 text-[10px] mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
