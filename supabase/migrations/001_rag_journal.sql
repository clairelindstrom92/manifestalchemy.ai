-- ============================================================
-- Manifest Alchemy AI — RAG + Journal Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 2. chunks table (per-user RAG memory store)
--    Stores embeddings of chat messages, journal entries,
--    and manifestation summaries for retrieval
-- ============================================================
CREATE TABLE IF NOT EXISTS chunks (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  namespace   TEXT    NOT NULL DEFAULT 'manifest-alchemy',
  source_type TEXT    NOT NULL CHECK (source_type IN ('manifestation', 'journal', 'chat')),
  source_id   TEXT    NOT NULL,
  content     TEXT    NOT NULL,
  metadata    JSONB   DEFAULT '{}',
  embedding   vector(1536),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chunks_user_id_idx
  ON chunks(user_id);

CREATE INDEX IF NOT EXISTS chunks_user_source_idx
  ON chunks(user_id, source_id);

-- IVFFlat index for fast approximate nearest-neighbor search
-- (Run ANALYZE on the table after inserting first batch of rows)
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Row Level Security: users only see their own chunks
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own chunks"
  ON chunks FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. journal_entries table
--    One entry = one dated reflection tied to a manifestation
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  manifestation_id  UUID    REFERENCES manifestations(id) ON DELETE CASCADE NOT NULL,
  content           TEXT    NOT NULL,
  mood              TEXT    CHECK (mood IN ('high', 'neutral', 'low')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS journal_entries_manifestation_idx
  ON journal_entries(manifestation_id);

CREATE INDEX IF NOT EXISTS journal_entries_user_idx
  ON journal_entries(user_id);

-- Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their journal entries"
  ON journal_entries FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. match_chunks_ns RPC function
--    Per-user vector similarity search
--    Called from /api/chat and /api/journal/ask
-- ============================================================
CREATE OR REPLACE FUNCTION match_chunks_ns(
  query_embedding  vector(1536),
  match_count      INT     DEFAULT 6,
  min_similarity   FLOAT   DEFAULT 0.65,
  ns               TEXT    DEFAULT 'manifest-alchemy',
  p_user_id        UUID    DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  metadata    JSONB,
  source_type TEXT,
  source_id   TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.metadata,
    c.source_type,
    c.source_id,
    (1 - (c.embedding <=> query_embedding))::FLOAT AS similarity
  FROM chunks c
  WHERE
    c.namespace = ns
    AND (p_user_id IS NULL OR c.user_id = p_user_id)
    AND (1 - (c.embedding <=> query_embedding)) >= min_similarity
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
