'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gold } from 'gleamy';
import { ArrowLeft, Heart, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface Post {
  id: string;
  content: string;
  title?: string;
  created_at: string;
}

export default function AffirmationsPage() {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const [affirmations, setAffirmations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAffirmations();
    }
  }, [user]);

  const fetchAffirmations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch user's chat posts
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, content, title, created_at')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Extract affirmations from chat content
      const extractedAffirmations: string[] = [];
      
      if (posts && posts.length > 0) {
        for (const post of posts) {
          try {
            const messages = JSON.parse(post.content || '[]');
            // Look for assistant messages that contain affirmation-like content
            messages.forEach((msg: any) => {
              if (msg.role === 'assistant' && msg.content) {
                // Extract sentences that sound like affirmations
                const sentences = msg.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
                sentences.forEach((sentence: string) => {
                  const trimmed = sentence.trim();
                  if (trimmed.length > 0 && 
                      (trimmed.toLowerCase().includes('i ') || 
                       trimmed.toLowerCase().includes('you ') ||
                       trimmed.toLowerCase().includes('we ') ||
                       trimmed.match(/^[A-Z]/))) {
                    extractedAffirmations.push(trimmed);
                  }
                });
              }
            });
          } catch (e) {
            console.error('Error parsing post content:', e);
          }
        }
      }

      // If we have extracted affirmations, use them; otherwise generate new ones
      if (extractedAffirmations.length > 0) {
        setAffirmations(extractedAffirmations.slice(0, 10));
      } else {
        // Generate affirmations from AI based on user's chats
        await generateAffirmationsFromChats(posts || []);
      }
    } catch (error) {
      console.error('Error fetching affirmations:', error);
      // Fallback affirmations
      setAffirmations([
        "I am worthy of all my dreams and desires.",
        "I attract abundance and prosperity into my life.",
        "Every day, I grow stronger and more confident.",
        "I am surrounded by love and positive energy.",
        "My thoughts create my reality, and I choose positivity.",
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAffirmationsFromChats = async (posts: Post[]) => {
    setIsGenerating(true);
    try {
      // Combine recent chat content
      const recentContent = posts.slice(0, 5).map(p => {
        try {
          const messages = JSON.parse(p.content || '[]');
          return messages.map((m: any) => m.content).join(' ');
        } catch {
          return '';
        }
      }).join(' ');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Based on my recent manifestation conversations, generate 5 personalized affirmations that align with my goals and dreams. Here's a summary of my recent chats: ${recentContent.substring(0, 500)}`
            }
          ]
        })
      });

      const data = await response.json();
      if (data.message) {
        // Extract affirmations from the response
        const lines = data.message.split('\n').filter((line: string) => 
          line.trim().length > 0 && 
          (line.includes('I ') || line.includes('You ') || line.includes('•') || line.includes('-'))
        );
        setAffirmations(lines.slice(0, 10));
      }
    } catch (error) {
      console.error('Error generating affirmations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateNew = async () => {
    await generateAffirmationsFromChats([]);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => router.push('/')}
          className="p-2 rounded-full border border-[#E4B77D] text-[#E4B77D] hover:bg-[#E4B77D]/10 transition-colors gold-shiny"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      
      <div className="max-w-2xl mx-auto pt-16 sm:pt-20 px-4 pb-8">
        <Gold acceleration={1} rendering={true} noFill={false} edgeThickness={1} spread={0.5}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center flex items-center justify-center gap-2 sm:gap-3">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-[#E4B77D] gold-shiny" />
            Daily Affirmations
          </h1>
        </Gold>
        
        <div className="mb-6 text-center">
          <button 
            onClick={handleGenerateNew}
            disabled={isGenerating}
            className="px-4 sm:px-6 py-2 sm:py-3 border border-[#E4B77D] text-[#E4B77D] rounded-lg hover:bg-[#E4B77D]/10 transition-colors flex items-center gap-2 mx-auto gold-shiny disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="text-sm sm:text-base">Generating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">New Affirmation</span>
              </>
            )}
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#E4B77D] animate-spin gold-shiny" />
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {affirmations.length > 0 ? (
              affirmations.map((affirmation, index) => (
                <div
                  key={index}
                  className="border border-[#E4B77D]/30 rounded-lg p-4 sm:p-6 bg-black/50 backdrop-blur-sm hover:border-[#E4B77D]/50 transition-colors"
                >
                  <p className="text-white text-base sm:text-lg leading-relaxed">{affirmation}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-[#a1a1aa]">
                <p>No affirmations found. Start chatting to generate personalized affirmations!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
