'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Trash2, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

// 🪄 Markdown renderer for formatted AI responses
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectData {
  id?: string;
  title?: string;
  messages?: string;
  updated_at?: string;
}

interface ChatInterfaceProps {
  onBack?: () => void;
  project?: ProjectData | null;
  onProjectUpdate?: () => void;
  onProjectCreated?: (project: ProjectData) => void;
  onProjectDeleted?: () => void;
}

export default function ChatInterface({ onBack, project, onProjectUpdate, onProjectCreated, onProjectDeleted }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useSupabaseUser();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    if (project?.messages) {
      try {
        const parsedMessages = JSON.parse(project.messages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error parsing project messages:', error);
      }
    }
  }, [project]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
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
          }))
        }),
      });

      const data = await response.json();
      console.log('Received data from API:', data);

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

      console.log('Adding assistant message:', assistantMessage);
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save to Supabase
      await saveMessages(finalMessages);
      
      // Trigger sidebar refresh
      if (onProjectUpdate) {
        onProjectUpdate();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
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
      const title = updatedMessages[0]?.content?.substring(0, 50) || 'New Manifestation';

      if (project?.id) {
        // Update existing project
        await supabase
          .from('manifestations')
          .update({
            messages: messagesJson,
            updated_at: new Date().toISOString()
          })
          .eq('id', project.id);
      } else {
        // Create new project
        const { data } = await supabase
          .from('manifestations')
          .insert({
            user_id: user.id,
            title: title,
            messages: messagesJson
          })
          .select()
          .single();
        
        if (data && onProjectCreated) {
          onProjectCreated(data);
        }
      }
    } catch (error) {
      console.error('Error saving messages:', error);
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
        .from('manifestations')
        .delete()
        .eq('id', project.id)
        .eq('user_id', user.id) // Ensure we're deleting our own chat
        .select();

      if (error) {
        console.error('Delete error:', error);
        alert(`Failed to delete chat: ${error.message}`);
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
      console.error('Error deleting chat:', error);
      alert(`Failed to delete chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="bg-[#151520] border-b border-[#2a2a3a] px-6 py-4">
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
            <h1 className="text-xl font-semibold text-[#f5f5f7]">
              Manifest Alchemy AI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={handleLogout}
                className="relative bg-gradient-to-r from-indigo-500/20 via-blue-500/25 to-indigo-500/20 hover:from-indigo-500/30 hover:via-blue-500/35 hover:to-indigo-500/30 border border-indigo-400/30 hover:border-indigo-400/40 transition-all duration-500 backdrop-blur-sm overflow-hidden p-2 rounded-full flex items-center gap-2 text-xs font-medium text-[#f5f5f7]"
                style={{
                  textShadow: '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)',
                  fontFamily: "'Quicksand', 'Poppins', sans-serif",
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
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
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl mx-auto w-full">
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
                className={`max-w-[80%] lg:max-w-2xl px-4 py-3 rounded-full relative overflow-hidden ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500/20 via-blue-500/25 to-indigo-500/20 border border-indigo-400/30 text-[#f5f5f7] backdrop-blur-sm'
                    : 'bg-[#151520] text-[#f5f5f7] border border-[#2a2a3a] rounded-2xl'
                }`}
              >
                {message.role === 'user' && (
                  <>
                    {/* Sparkle particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-2 left-4 w-1 h-1 bg-indigo-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                      <div className="absolute top-3 right-6 w-1 h-1 bg-blue-200 rounded-full animate-ping opacity-70" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
                      <div className="absolute bottom-2 left-8 w-1 h-1 bg-indigo-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
                      <div className="absolute bottom-3 right-4 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1.5s', animationDuration: '2.2s' }}></div>
                    </div>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
                  </>
                )}
                <div className={`prose prose-invert max-w-none text-[15px] leading-relaxed relative z-10 ${message.role === 'user' ? 'text-[#f5f5f7]' : 'text-[#f5f5f7]'}`}>
                  {message.role === 'user' ? (
                    <p className="mb-0" style={{
                      textShadow: '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)'
                    }}>{message.content}</p>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0 text-[#f5f5f7]">{children}</p>,
                        strong: ({ children }) => (
                          <strong className="font-semibold text-[#a5b4fc]">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-[#d1d5db]">{children}</em>
                        ),
                        code: ({ children }) => (
                          <code className="bg-[#1f1f2e] text-[#a5b4fc] px-2 py-1 rounded text-sm font-mono">{children}</code>
                        ),
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-[#f5f5f7]">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-[#f5f5f7]">{children}</ol>,
                        li: ({ children }) => <li className="text-[#f5f5f7]">{children}</li>,
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-[#f5f5f7]">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-[#f5f5f7]">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-[#f5f5f7]">{children}</h3>,
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
                  <Loader2 className="w-4 h-4 animate-spin text-[#6366f1]" />
                  <span className="text-sm text-[#a1a1aa]">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-[#151520] border-t border-[#2a2a3a] px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
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
                className="flex-1 bg-[#1f1f2e] border border-[#2a2a3a] rounded-xl px-4 py-3 text-[#f5f5f7] placeholder-[#71717a] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="relative bg-gradient-to-r from-indigo-500/20 via-blue-500/25 to-indigo-500/20 hover:from-indigo-500/30 hover:via-blue-500/35 hover:to-indigo-500/30 disabled:from-[#2a2a3a] disabled:via-[#2a2a3a] disabled:to-[#2a2a3a] disabled:text-[#71717a] disabled:cursor-not-allowed border border-indigo-400/30 hover:border-indigo-400/40 disabled:border-[#2a2a3a] text-[#f5f5f7] p-3 rounded-full transition-all duration-500 flex items-center justify-center min-w-[48px] backdrop-blur-sm overflow-hidden"
                style={{
                  textShadow: !isLoading && input.trim() ? '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)' : 'none'
                }}
                aria-label="Send message"
              >
                {!isLoading && input.trim() && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
                    <div className="absolute top-1 left-2 w-1 h-1 bg-indigo-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                    <div className="absolute bottom-1 right-2 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
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
            
            {/* Save button section - only show for new projects without an ID */}
            {messages.length > 0 && !project?.id && (
              <div className="mt-4 text-center">
                {user ? (
                  <button
                    onClick={async () => {
                      const { error } = await supabase
                        .from('manifestations')
                        .insert([
                          {
                            user_id: user.id,
                            title: messages[0]?.content.slice(0, 60) || "Untitled Manifestation",
                            messages: JSON.stringify(messages),
                          },
                        ]);
                      if (error) {
                        console.error(error);
                        alert("Failed to save manifestation");
                      } else {
                        alert("Manifestation saved to your Alchemy Journal!");
                        if (onProjectUpdate) {
                          onProjectUpdate();
                        }
                      }
                    }}
                    className="relative bg-gradient-to-r from-indigo-500/20 via-blue-500/25 to-indigo-500/20 hover:from-indigo-500/30 hover:via-blue-500/35 hover:to-indigo-500/30 border border-indigo-400/30 hover:border-indigo-400/40 text-[#f5f5f7] font-medium px-6 py-2.5 rounded-full transition-all duration-500 backdrop-blur-sm overflow-hidden"
                    style={{
                      textShadow: '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)',
                      fontFamily: "'Quicksand', 'Poppins', sans-serif",
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
                    <div className="absolute top-1 left-4 w-1 h-1 bg-indigo-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                    <div className="absolute bottom-1 right-4 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
                    <span className="relative z-10">Save Manifestation</span>
                  </button>
                ) : (
                  <a
                    href="/login"
                    className="relative bg-gradient-to-r from-indigo-500/20 via-blue-500/25 to-indigo-500/20 hover:from-indigo-500/30 hover:via-blue-500/35 hover:to-indigo-500/30 border border-indigo-400/30 hover:border-indigo-400/40 text-[#f5f5f7] font-medium px-6 py-2.5 rounded-full transition-all duration-500 backdrop-blur-sm inline-block overflow-hidden"
                    style={{
                      textShadow: '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)',
                      fontFamily: "'Quicksand', 'Poppins', sans-serif",
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
                    <div className="absolute top-1 left-4 w-1 h-1 bg-indigo-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                    <div className="absolute bottom-1 right-4 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
                    <span className="relative z-10">Sign in to Save Manifestations</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
