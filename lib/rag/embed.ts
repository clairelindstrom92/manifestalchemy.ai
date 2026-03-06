/**
 * lib/rag/embed.ts
 * Utility for upserting content chunks into Supabase pgvector.
 * Called server-side only (API routes).
 *
 * upsertChunk() replaces any existing chunk for the same source_id
 * so re-saves don't create duplicates.
 */

import { createClient } from '@supabase/supabase-js';
import { embedText } from '@/lib/ai/router';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const NAMESPACE = 'manifest-alchemy';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface UpsertChunkParams {
  userId: string;
  sourceType: 'manifestation' | 'journal' | 'chat';
  sourceId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Embed content and store/replace in the chunks table.
 * Safe to call fire-and-forget (all errors logged, never throws to caller).
 */
export async function upsertChunk(params: UpsertChunkParams): Promise<void> {
  const { userId, sourceType, sourceId, content, metadata = {} } = params;

  if (!content.trim()) return;

  const supabase = getSupabase();
  if (!supabase) {
    console.warn('upsertChunk: Supabase not configured');
    return;
  }

  try {
    // Generate embedding
    const embedding = await embedText(content);

    // Delete existing chunk for this source (upsert by source_id + user_id)
    await supabase
      .from('chunks')
      .delete()
      .eq('user_id', userId)
      .eq('source_id', sourceId)
      .eq('source_type', sourceType);

    // Insert fresh chunk with new embedding
    const { error } = await supabase.from('chunks').insert({
      user_id: userId,
      namespace: NAMESPACE,
      source_type: sourceType,
      source_id: sourceId,
      content,
      metadata,
      embedding,
    });

    if (error) {
      console.warn('upsertChunk insert error:', error.message);
    }
  } catch (err) {
    console.warn('upsertChunk failed (non-fatal):', err);
  }
}

/**
 * Delete all chunks for a given source (e.g. when a journal entry is deleted)
 */
export async function deleteChunk(params: {
  userId: string;
  sourceId: string;
  sourceType: 'manifestation' | 'journal' | 'chat';
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from('chunks')
      .delete()
      .eq('user_id', params.userId)
      .eq('source_id', params.sourceId)
      .eq('source_type', params.sourceType);
  } catch (err) {
    console.warn('deleteChunk failed (non-fatal):', err);
  }
}

/**
 * Query the per-user vector store
 */
export async function queryChunks(params: {
  userId: string;
  query: string;
  matchCount?: number;
  minSimilarity?: number;
}): Promise<Array<{ content: string; source_type: string; source_id: string; similarity: number }>> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const embedding = await embedText(params.query);

    const { data, error } = await supabase.rpc('match_chunks_ns', {
      query_embedding: embedding,
      match_count: params.matchCount ?? 6,
      min_similarity: params.minSimilarity ?? 0.65,
      ns: NAMESPACE,
      p_user_id: params.userId,
    });

    if (error) {
      console.warn('queryChunks RPC error:', error.message);
      return [];
    }

    return (data ?? []) as Array<{
      content: string;
      source_type: string;
      source_id: string;
      similarity: number;
    }>;
  } catch (err) {
    console.warn('queryChunks failed:', err);
    return [];
  }
}
