'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Trash2, ArrowLeft, LogOut, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useToast } from '@/components/shared/Toast';

// 🪄 Markdown renderer for formatted AI responses
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

interface ChatInterfaceProps {
  onBack?: () => void;
  project?: ProjectData | null;
  onProjectUpdate?: () => void;
  onProjectCreated?: (project: ProjectData) => void;
  onProjectDeleted?: () => void;
  manifestationId?: string; // Optional: link chat to a manifestation
}

interface IntentPayload {
  title: string | null;
  summary?: string | null;
  confidence?: number | null;
  reason?: string | null;
  microTasks?: MicroTask[];
  imagePrompts?: string[];
  gallery?: string[];
}

const INTENT_CONFIDENCE_THRESHOLD = 0.7;
const normalizeMicroTasks = (tasks?: MicroTask[]): MicroTask[] => {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.map((task, index) => ({
    id: task.id || `task-${Date.now()}-${index}`,
    title: task.title || `Task ${index + 1}`,
    description: task.description || '',
    completed: Boolean(task.completed),
  }));
};

export default function ChatInterface({ onBack, project, onProjectUpdate, onProjectCreated, onProjectDeleted, manifestationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentProjectIdRef = useRef<string | null>(null);
  const currentManifestationIdRef = useRef<string | null>(project?.manifestation_id || null);
  const { user } = useSupabaseUser();
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    // Support both old (messages) and new (content) schema
    const contentToParse = project?.content || project?.messages;
    if (contentToParse) {
      try {
        const parsedMessages = JSON.parse(contentToParse);
        setMessages(parsedMessages);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error parsing project messages:', error);
        }
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
    // Update ref when project changes
    currentProjectIdRef.current = project?.id || null;
    currentManifestationIdRef.current = project?.manifestation_id || null;
  }, [project]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showError('Image size must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deriveInitialTitle = (content?: string) => {
    if (!content) return null;
    const cleaned = content.replace(/\[Image\]/g, '').trim();
    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
    if (cleaned.length < 20 || wordCount < 3) {
      return null;
    }
    const shortTitle = cleaned.slice(0, 80);
    return shortTitle.length > 60 ? `${shortTitle.substring(0, 57)}...` : shortTitle;
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
        await supabase
          .from('posts')
          .update({ manifestation_id: currentManifestationIdRef.current })
          .eq('id', postId);
      }
      return currentManifestationIdRef.current;
    }

    const payload: Record<string, unknown> = {
      author_id: user.id,
      status: 'draft',
      needs_title: true
    };

    if (postId) {
      payload.chat_post_id = postId;
    }

    const { data, error } = await supabase
      .from('manifestations')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      showError(`Failed to start manifestation: ${error.message}`);
      return null;
    }

    currentManifestationIdRef.current = data?.id || null;

    if (postId && currentManifestationIdRef.current) {
      await supabase
        .from('posts')
        .update({ manifestation_id: currentManifestationIdRef.current })
        .eq('id', postId);
    }

    return currentManifestationIdRef.current;
  };

  const maybeFinalizeManifestation = async (intent?: IntentPayload) => {
    if (!intent || !intent.title || !intent.confidence) return;
    if (intent.confidence < INTENT_CONFIDENCE_THRESHOLD) return;

    const normalizedTasks = normalizeMicroTasks(intent.microTasks);

    const manifestationId = await ensureManifestation(currentProjectIdRef.current);
    if (!manifestationId) return;

    await supabase
      .from('manifestations')
      .update({
        title: intent.title,
        summary: intent.summary ?? null,
        confidence: intent.confidence,
        needs_title: false,
        status: 'active',
        intent: {
          ...intent,
          microTasks: normalizedTasks,
        },
        chat_post_id: currentProjectIdRef.current,
      })
      .eq('id', manifestationId);

    if (currentProjectIdRef.current) {
      await supabase
        .from('posts')
        .update({
          title: intent.title,
          manifestation_id: manifestationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProjectIdRef.current);
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error uploading image:', error);
      }
      showError('Failed to upload image');
      return null;
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    let imageUrl: string | null = null;
    if (selectedImage) {
      imageUrl = await uploadImageToSupabase(selectedImage);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (imageUrl ? '[Image]' : ''),
      timestamp: new Date(),
      imageUrl: imageUrl || undefined
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          imageUrl: imageUrl
        }),
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`API returned non-JSON response: ${text.substring(0, 200)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to get response');
      }
      
      // Check if message exists and is not empty
      const messageContent = data.message || data.response || "I'm sorry, I couldn't generate a response.";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: messageContent,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save to Supabase
      try {
        await saveMessages(finalMessages);
        if (data.intent) {
          await maybeFinalizeManifestation(data.intent as IntentPayload);
        }
        // Trigger sidebar refresh
        if (onProjectUpdate) {
          onProjectUpdate();
        }
      } catch (saveError) {
        const errorMsg = saveError instanceof Error ? saveError.message : 'Unknown error';
        showError(`Failed to save manifestation: ${errorMsg}`);
        // Don't block the UI, but show error to user
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(errorMsg);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessages = async (updatedMessages: Message[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const messagesJson = JSON.stringify(updatedMessages);
      const firstUserMessage = updatedMessages.find(msg => msg.role === 'user');
      const derivedTitle = deriveInitialTitle(firstUserMessage?.content || '');

      const projectId = currentProjectIdRef.current || project?.id;

      if (projectId) {
        const { error } = await supabase
          .from('posts')
          .update({
            content: messagesJson,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
        
        if (error) throw error;
        await ensureManifestation(projectId);
      } else {
        const insertData: Record<string, unknown> = {
          author_id: user.id,
          title: derivedTitle ?? 'Manifestation in progress',
          content: messagesJson,
          is_public: false
        };

        if (manifestationId) {
          insertData.manifestation_id = manifestationId;
        }

        const { data, error } = await supabase
          .from('posts')
          .insert(insertData)
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          currentProjectIdRef.current = data.id;
          await ensureManifestation(data.id);

          const payloadForParent = {
            ...data,
            manifestation_id: currentManifestationIdRef.current
          };

          if (currentManifestationIdRef.current && !data.manifestation_id) {
            await supabase
              .from('posts')
              .update({ manifestation_id: currentManifestationIdRef.current })
              .eq('id', data.id);
          }

          if (onProjectCreated) {
            onProjectCreated(payloadForParent);
          }
          showSuccess('Chat saved successfully');
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save manifestation';
      showError(errorMsg);
      throw error;
    }
  };

  const deleteChat = async () => {
    if (!project?.id) {
      // Clear local messages for new chats
      setMessages([]);
      return;
    }

    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      // Get the current user to ensure we have auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to delete chats.');
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', project.id)
        .eq('author_id', user.id) // Ensure we're deleting our own chat
        .select();

      if (error) {
        showError(`Failed to delete chat: ${error.message}`);
        return;
      }

      // Clear local state immediately
      setMessages([]);
      
      // Trigger callbacks - first clear the selected project, then refresh sidebar, then navigate
      if (onProjectDeleted) {
        onProjectDeleted();
      }
      
      // Small delay to ensure state updates
      setTimeout(() => {
        if (onProjectUpdate) {
          onProjectUpdate();
        }
        if (onBack) {
          onBack();
        }
      }, 100);
      
    } catch (error) {
      showError(`Failed to delete chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="bg-[#151520] border-b border-[#2a2a3a] px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-[#a1a1aa] hover:text-[#f5f5f7] transition-colors p-2 hover:bg-[#1f1f2e] rounded-lg"
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-base sm:text-xl font-semibold text-[#f5f5f7]">
              Manifest Alchemy AI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={handleLogout}
                className="relative transition-all duration-500 backdrop-blur-sm overflow-hidden p-2 rounded-full flex items-center gap-2 text-xs font-medium text-[#f5f5f7] gold-shiny"
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
                aria-label="Logout"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
                <LogOut size={14} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Logout</span>
              </button>
            )}
            {project?.id && (
              <button
                onClick={deleteChat}
                className="text-[#ef4444] hover:text-[#f87171] hover:bg-[#1f1f2e] transition-colors p-2 rounded-lg flex items-center gap-2 text-sm"
                aria-label="Delete chat"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="text-center text-[#a1a1aa] mt-20">
              <h2 className="text-2xl font-semibold text-[#f5f5f7] mb-2">Welcome to Manifest Alchemy AI</h2>
              <p className="text-[#71717a]">Start a conversation to begin manifesting your dreams into reality.</p>
            </div>
          )}
          
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] lg:max-w-2xl px-3 sm:px-4 py-2 sm:py-3 rounded-3xl relative overflow-hidden ${
                  message.role === 'user'
                    ? 'border text-[#f5f5f7] backdrop-blur-sm gold-shiny'
                    : 'bg-[#151520] text-[#f5f5f7] border border-[#2a2a3a]'
                }`}
                style={message.role === 'user'
                  ? {
                      background:
                        'linear-gradient(to right, rgba(228, 183, 125, 0.2), rgba(228, 183, 125, 0.25), rgba(228, 183, 125, 0.2))',
                      borderColor: 'rgba(228, 183, 125, 0.3)',
                    }
                  : {}}
              >
                {message.role === 'user' && (
                  <>
                    {/* Sparkle particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-2 left-4 w-1 h-1 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s', backgroundColor: '#E4B77D', boxShadow: '0 0 6px rgba(228, 183, 125, 0.8)' }}></div>
                      <div className="absolute top-3 right-6 w-1 h-1 rounded-full animate-ping opacity-70" style={{ animationDelay: '0.5s', animationDuration: '2.5s', backgroundColor: '#F0C896', boxShadow: '0 0 6px rgba(240, 200, 150, 0.8)' }}></div>
                      <div className="absolute bottom-2 left-8 w-1 h-1 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s', animationDuration: '3s', backgroundColor: '#E4B77D', boxShadow: '0 0 6px rgba(228, 183, 125, 0.8)' }}></div>
                      <div className="absolute bottom-3 right-4 w-1 h-1 rounded-full animate-ping opacity-60" style={{ animationDelay: '1.5s', animationDuration: '2.2s', backgroundColor: '#F0C896', boxShadow: '0 0 6px rgba(240, 200, 150, 0.8)' }}></div>
                    </div>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
                  </>
                )}
                <div
                  className={`prose prose-invert max-w-none text-[15px] leading-relaxed relative z-10 break-words whitespace-pre-wrap ${
                    message.role === 'user' ? 'text-white' : 'text-white'
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {message.imageUrl && (
                    <div className="mb-2">
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded" 
                        className="max-w-full h-auto rounded-lg"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                  {message.role === 'user' ? (
                    <p className="mb-0 text-white" style={{
                      color: '#FFFFFF',
                      textShadow: '0 0 10px rgba(228, 183, 125, 0.5), 0 0 20px rgba(228, 183, 125, 0.3)'
                    }}>{message.content && message.content !== '[Image]' ? message.content : ''}</p>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0 text-white" style={{ color: '#FFFFFF' }}>{children}</p>,
                        strong: ({ children }) => (
                          <strong className="font-semibold text-[#E4B77D]" style={{ color: '#E4B77D' }}>{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-white" style={{ color: '#FFFFFF' }}>{children}</em>
                        ),
                        code: ({ children }) => (
                          <code className="bg-[#1f1f2e] text-[#E4B77D] px-2 py-1 rounded text-sm font-mono gold-shiny">{children}</code>
                        ),
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-white" style={{ color: '#FFFFFF' }}>{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-white" style={{ color: '#FFFFFF' }}>{children}</ol>,
                        li: ({ children }) => <li className="text-white" style={{ color: '#FFFFFF' }}>{children}</li>,
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-white" style={{ color: '#FFFFFF' }}>{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-white" style={{ color: '#FFFFFF' }}>{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-white" style={{ color: '#FFFFFF' }}>{children}</h3>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-[#151520] text-[#f5f5f7] border border-[#2a2a3a] px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#E4B77D] gold-shiny" />
                  <span className="text-sm text-[#a1a1aa]">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-[#151520] border-t border-[#2a2a3a] px-3 sm:px-4 py-3 sm:py-4">
          <div className="max-w-4xl mx-auto">
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-[200px] h-auto rounded-lg border border-[#E4B77D]/30"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="p-2 sm:p-3 rounded-full border border-[#E4B77D]/30 text-[#E4B77D] hover:bg-[#E4B77D]/10 transition-colors cursor-pointer gold-shiny flex items-center justify-center"
                aria-label="Upload image"
              >
                <ImageIcon className="w-5 h-5" />
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isLoading}
                placeholder="Type your message..."
                className="flex-1 bg-[#1f1f2e] border border-[#2a2a3a] rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-[#71717a] focus:outline-none focus:border-[#E4B77D] focus:ring-2 focus:ring-[#E4B77D]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className="relative disabled:from-[#2a2a3a] disabled:via-[#2a2a3a] disabled:to-[#2a2a3a] disabled:text-[#71717a] disabled:cursor-not-allowed disabled:border-[#2a2a3a] text-white p-3 rounded-full transition-all duration-500 flex items-center justify-center min-w-[48px] backdrop-blur-sm overflow-hidden gold-shiny"
                style={!isLoading && (input.trim() || selectedImage) ? {
                  background: 'linear-gradient(to right, rgba(228, 183, 125, 0.2), rgba(228, 183, 125, 0.25), rgba(228, 183, 125, 0.2))',
                  border: '1px solid rgba(228, 183, 125, 0.3)',
                  textShadow: '0 0 10px rgba(228, 183, 125, 0.7), 0 0 20px rgba(228, 183, 125, 0.5), 0 0 30px rgba(228, 183, 125, 0.3)'
                } : {
                  background: 'linear-gradient(to right, #2a2a3a, #2a2a3a, #2a2a3a)',
                  border: '1px solid #2a2a3a',
                  textShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && (input.trim() || selectedImage)) {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgba(228, 183, 125, 0.3), rgba(228, 183, 125, 0.35), rgba(228, 183, 125, 0.3))';
                    e.currentTarget.style.borderColor = 'rgba(228, 183, 125, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && (input.trim() || selectedImage)) {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgba(228, 183, 125, 0.2), rgba(228, 183, 125, 0.25), rgba(228, 183, 125, 0.2))';
                    e.currentTarget.style.borderColor = 'rgba(228, 183, 125, 0.3)';
                  }
                }}
                aria-label="Send message"
              >
                {!isLoading && (input.trim() || selectedImage) && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
                    <div className="absolute top-1 left-2 w-1 h-1 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s', backgroundColor: '#E4B77D', boxShadow: '0 0 6px rgba(228, 183, 125, 0.8)' }}></div>
                    <div className="absolute bottom-1 right-2 w-1 h-1 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s', animationDuration: '2.5s', backgroundColor: '#F0C896', boxShadow: '0 0 6px rgba(240, 200, 150, 0.8)' }}></div>
                  </>
                )}
                <span className="relative z-10">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}
