'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Image as ImageIcon, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useToast } from '@/components/shared/Toast';
import ChatInterface from './ChatInterface';

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
  const completed = tasks.filter(task => task.completed).length;
  return Math.round((completed / tasks.length) * 100);
};

export default function ManifestationDetail({ manifestation, onBack, onUpdate }: ManifestationDetailProps) {
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [intentState, setIntentState] = useState<Record<string, any>>(manifestation.intent || {});
  const [microTasks, setMicroTasks] = useState<MicroTask[]>(normalizeMicroTasks(manifestation.intent?.microTasks));
  const [progress, setProgress] = useState(calculateProgress(microTasks));
  const [summary, setSummary] = useState(
    manifestation.summary || (manifestation.intent?.summary as string) || ''
  );
  const [galleryImages, setGalleryImages] = useState<VisionImage[]>(() => {
    const gallery = (manifestation.intent?.gallery as string[]) || [];
    return gallery.map((url) => ({ url, source: 'gallery' as const }));
  });
  const [chatImages, setChatImages] = useState<VisionImage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { user } = useSupabaseUser();
  const { showSuccess, showError } = useToast();

  const collectChatMessages = (): Message[] => {
    const allMessages: Message[] = [];
    if (manifestation.chats && manifestation.chats.length > 0) {
      manifestation.chats.forEach((chat) => {
        if (chat.messages) {
          allMessages.push(...chat.messages);
        } else if (chat.content) {
          try {
            const parsed = JSON.parse(chat.content);
            if (Array.isArray(parsed)) {
              allMessages.push(...parsed);
            }
          } catch {}
        }
      });
    }
    return allMessages;
  };

  useEffect(() => {
    setIntentState(manifestation.intent || {});

    const normalizedTasks = normalizeMicroTasks(
      manifestation.intent?.microTasks as MicroTask[]
    );
    setMicroTasks(normalizedTasks);
    setProgress(calculateProgress(normalizedTasks));
    setSummary(
      manifestation.summary ||
        (manifestation.intent?.summary as string) ||
        ''
    );

    const gallery = (manifestation.intent?.gallery as string[]) || [];
    setGalleryImages(gallery.map((url) => ({ url, source: 'gallery' as const })));

    const chatImageUrls = collectChatMessages()
      .filter((msg) => !!msg.imageUrl)
      .map((msg) => msg.imageUrl as string);
    const uniqueChatImages = Array.from(new Set(chatImageUrls)).map((url) => ({
      url,
      source: 'chat' as const,
    }));
    setChatImages(uniqueChatImages);
  }, [manifestation.intent, manifestation.summary, manifestation.chats]);

  const handleNewChat = () => {
    setShowNewChat(true);
    setActiveChat(null);
  };

  const handleChatCreated = async (chatData: any) => {
    // Update manifestation with new chat
    await onUpdate();
    setShowNewChat(false);
  };

  const handleChatSelect = (chat: Chat) => {
    // Parse messages if needed
    let messages: Message[] = [];
    if (chat.messages) {
      messages = chat.messages;
    } else if (chat.content) {
      try {
        messages = JSON.parse(chat.content);
      } catch {
        messages = [];
      }
    }
    
    setActiveChat({
      ...chat,
      messages,
      title: chat.title || 'Untitled Chat'
    });
    setShowNewChat(false);
  };

  const updateIntent = async (patch: Record<string, any>, extraFields: Record<string, any> = {}) => {
    if (!manifestation.id) return;
    const mergedIntent = {
      ...(intentState || {}),
      ...patch,
    };
    setIntentState(mergedIntent);
    await supabase
      .from('manifestations')
      .update({
        intent: mergedIntent,
        ...extraFields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', manifestation.id);
    onUpdate();
  };

  const handleToggleTask = async (taskId: string) => {
    const updatedTasks = microTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setMicroTasks(updatedTasks);
    setProgress(calculateProgress(updatedTasks));
    await updateIntent({ microTasks: updatedTasks });
  };

  const handleGeneratePlan = async () => {
    if (!manifestation.id) {
      showError('Manifestation is missing an id');
      return;
    }
    const conversation = collectChatMessages()
      .filter((msg) => msg.content && msg.content.trim().length > 0)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    if (conversation.length === 0) {
      showError('No chat history found. Start a conversation first.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/manifestations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifestationId: manifestation.id,
          messages: conversation.slice(-60),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze manifestation');
      }

      const data = await response.json();
      const tasks = normalizeMicroTasks(data.microTasks);
      setMicroTasks(tasks);
      setProgress(calculateProgress(tasks));
      setSummary(data.summary || summary);

      await updateIntent(
        { microTasks: tasks, summary: data.summary, inspirationPrompts: data.inspirationPrompts },
        { summary: data.summary }
      );
      showSuccess('Plan refreshed');
    } catch (error) {
      showError(
        `Unable to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!manifestation.id || !user) {
      showError('You must be logged in to upload images');
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const sanitizedName = file.name.replace(/\s+/g, '-');
      const filePath = `${user.id}/${manifestation.id}/${Date.now()}-${sanitizedName}`;
      const { error } = await supabase.storage
        .from('manifestation-media')
        .upload(filePath, file);
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('manifestation-media').getPublicUrl(filePath);

      const updatedGallery = [
        ...galleryImages,
        { url: publicUrl, source: 'gallery' as const },
      ];
      setGalleryImages(updatedGallery);
      await updateIntent({
        gallery: updatedGallery
          .filter((img) => img.source === 'gallery')
          .map((img) => img.url),
      });
      showSuccess('Image uploaded');
    } catch (error) {
      showError(
        `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleGenerateVision = async () => {
    if (!manifestation.id) {
      showError('Manifestation not found');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/manifestations/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifestationId: manifestation.id,
          prompt: summary || manifestation.title,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate image');
      }

      const { imageUrl } = await response.json();
      const updatedGallery = [
        ...galleryImages,
        { url: imageUrl, source: 'gallery' as const },
      ];
      setGalleryImages(updatedGallery);
      await updateIntent({
        gallery: updatedGallery
          .filter((img) => img.source === 'gallery')
          .map((img) => img.url),
      });
      showSuccess('Vision image generated');
    } catch (error) {
      showError(
        `Vision generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
          updated_at: activeChat.updated_at
        } : null}
        onBack={() => {
          setShowNewChat(false);
          setActiveChat(null);
        }}
        onProjectUpdate={onUpdate}
        onProjectCreated={handleChatCreated}
        onProjectDeleted={onUpdate}
        manifestationId={manifestation.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f5f5f7]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0f] border-b border-[#2a2a3a] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors p-2 hover:bg-[#1f1f2e] rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#f5f5f7] flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#E4B77D]" />
                {manifestation.title}
              </h1>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="relative transition-all duration-500 backdrop-blur-sm overflow-hidden px-4 py-2 rounded-full text-sm font-medium text-[#f5f5f7] gold-shiny"
            style={{
              background: 'linear-gradient(to right, rgba(228, 183, 125, 0.2), rgba(228, 183, 125, 0.25), rgba(228, 183, 125, 0.2))',
              border: '1px solid rgba(228, 183, 125, 0.3)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
            <Plus className="w-4 h-4 inline mr-2 relative z-10" />
            <span className="relative z-10">New Chat</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Summary */}
        <div className="bg-[#151520] border border-[#2a2a3a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-[#f5f5f7]">Manifestation Summary</h3>
              <p className="text-sm text-[#a1a1aa]">
                Snapshot of the vision captured directly from your chats.
              </p>
            </div>
            <button
              onClick={handleGeneratePlan}
              disabled={analyzing}
              className="px-4 py-2 rounded-full text-sm font-medium border border-[#E4B77D]/40 text-[#E4B77D] hover:bg-[#E4B77D]/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyzing…' : 'Generate Plan'}
            </button>
          </div>
          <p className="text-[#f5f5f7] leading-relaxed">
            {summary
              ? summary
              : 'No summary yet. Generate a plan once the chat contains enough details.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-[#151520] border border-[#2a2a3a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-[#f5f5f7]">Progress</h3>
            <span className="text-[#E4B77D] font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-[#1f1f2e] rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#E4B77D] to-[#F0C896] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-[#71717a] mt-2">
            {microTasks.length > 0
              ? `${microTasks.filter(task => task.completed).length}/${microTasks.length} micro-tasks completed`
              : 'Generate a plan to unlock micro-tasks.'}
          </p>
        </div>

        {/* Images Gallery */}
        <div className="bg-[#151520] border border-[#2a2a3a] rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-[#f5f5f7] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#E4B77D]" />
              Vision Board
            </h3>
            <div className="flex flex-wrap gap-2">
              <label className="px-4 py-2 rounded-full text-xs font-semibold border border-[#E4B77D]/40 text-[#E4B77D] hover:bg-[#E4B77D]/10 transition cursor-pointer">
                {uploadingImage ? 'Uploading…' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
              <button
                onClick={handleGenerateVision}
                disabled={isGeneratingImage}
                className="px-4 py-2 rounded-full text-xs font-semibold border border-[#E4B77D]/40 text-[#151520] bg-[#E4B77D] hover:bg-[#F0C896] transition disabled:opacity-60"
              >
                {isGeneratingImage ? 'Generating…' : 'Generate Vision'}
              </button>
            </div>
          </div>
          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {galleryImages.map((image, index) => (
                <motion.div
                  key={`${image.url}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-[#2a2a3a]"
                >
                  <img src={image.url} alt="Vision image" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#a1a1aa]">
              No gallery images yet. Upload a photo or generate a vision to begin.
            </p>
          )}

          {chatImages.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-[#71717a] mb-2">Images mentioned in your chats</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {chatImages.map((image) => (
                  <div
                    key={image.url}
                    className="aspect-square rounded-lg overflow-hidden border border-dashed border-[#2a2a3a]"
                  >
                    <img src={image.url} alt="Chat attachment" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Todos Checklist */}
        <div className="bg-[#151520] border border-[#2a2a3a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#f5f5f7]">Micro Tasks</h3>
            <span className="text-xs text-[#71717a]">
              {microTasks.length ? 'Tap to mark complete' : ''}
            </span>
          </div>
          {microTasks.length > 0 ? (
            <div className="space-y-2">
              {microTasks.map((task, index) => (
                <motion.button
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-lg border border-transparent hover:border-[#E4B77D]/40 hover:bg-[#1f1f2e] transition"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#E4B77D]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#E4B77D]" />
                  )}
                  <div>
                    <p className="text-[#f5f5f7] font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-[#a1a1aa] mt-0.5">{task.description}</p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#a1a1aa]">
              No micro-tasks yet. Generate a plan to receive bite-sized actions.
            </p>
          )}
        </div>

        {/* Chats List */}
        <div className="bg-[#151520] border border-[#2a2a3a] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#f5f5f7] mb-4">Chats</h3>
          {manifestation.chats && manifestation.chats.length > 0 ? (
            <div className="space-y-2">
              {manifestation.chats.map((chat) => (
                <motion.button
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className="w-full text-left p-4 rounded-lg border border-[#2a2a3a] hover:border-[#E4B77D]/50 hover:bg-[#1f1f2e] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#f5f5f7] group-hover:text-[#E4B77D] transition-colors">
                        {chat.title || 'Untitled Chat'}
                      </h4>
                      <p className="text-sm text-[#a1a1aa] mt-1">
                        {(() => {
                          if (chat.messages) return chat.messages.length;
                          if (chat.content) {
                            try {
                              const parsed = JSON.parse(chat.content);
                              return Array.isArray(parsed) ? parsed.length : 0;
                            } catch {
                              return 0;
                            }
                          }
                          return 0;
                        })()} messages
                      </p>
                    </div>
                    <div className="text-xs text-[#71717a]">
                      {chat.updated_at ? new Date(chat.updated_at).toLocaleDateString() : 'No date'}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#a1a1aa]">
              <p>No chats yet. Start a new chat to begin!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

