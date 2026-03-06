export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  notes_used?: number;
  intent?: {
    title: string | null;
    summary?: string | null;
    confidence?: number | null;
    reason?: string | null;
    microTasks?: MicroTask[];
    imagePrompts?: string[];
  };
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  imageUrl?: string;
  userId?: string;
}

export interface MicroTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  manifestation_id: string;
  content: string;
  mood?: 'high' | 'neutral' | 'low' | null;
  created_at: string;
  updated_at: string;
}

export interface ChunkResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: 'manifestation' | 'journal' | 'chat';
  source_id: string;
  similarity: number;
}

export type AIProvider = 'openai' | 'ollama' | 'replicate';
export type ImageProvider = 'openai' | 'replicate';

export interface Profile {
  id: string;
  avatar_url?: string | null;
  display_name?: string | null;
  updated_at?: string;
}

export interface SavedImage {
  id: string;
  user_id: string;
  manifestation_id: string;
  source_url: string;
  prompt?: string | null;
  is_training_data: boolean;
  created_at: string;
}

export interface ReferenceImage {
  id: string;
  user_id: string;
  manifestation_id?: string | null;
  storage_path: string;
  source_url: string;
  label?: string | null;
  is_profile_picture: boolean;
  is_training_data: boolean;
  created_at: string;
}
