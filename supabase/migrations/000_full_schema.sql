-- ============================================================
-- Manifest Alchemy AI — COMPLETE SCHEMA
-- Run this in Supabase SQL Editor on a fresh project
-- Run this BEFORE 001_rag_journal.sql
-- ============================================================

-- ============================================================
-- 1. manifestations table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.manifestations (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT,
  summary         TEXT,
  status          TEXT,
  needs_title     BOOLEAN     DEFAULT true,
  confidence      NUMERIC,
  intent          JSONB       DEFAULT '{}',
  chat_post_id    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS manifestations_author_idx ON public.manifestations(author_id);

ALTER TABLE public.manifestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own manifestations"
  ON public.manifestations FOR ALL
  USING (auth.uid() = author_id);

-- ============================================================
-- 2. posts table (chat message history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title             TEXT,
  content           TEXT,
  is_public         BOOLEAN     DEFAULT false,
  manifestation_id  UUID        REFERENCES public.manifestations(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS posts_manifestation_idx ON public.posts(manifestation_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own posts"
  ON public.posts FOR ALL
  USING (auth.uid() = author_id);

-- ============================================================
-- 3. Enable pgvector
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 4. chunks table (per-user RAG memory)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chunks (
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

CREATE INDEX IF NOT EXISTS chunks_user_id_idx ON public.chunks(user_id);
CREATE INDEX IF NOT EXISTS chunks_user_source_idx ON public.chunks(user_id, source_id);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON public.chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users only access their own chunks"
  ON public.chunks FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. journal_entries table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  manifestation_id  UUID    REFERENCES public.manifestations(id) ON DELETE CASCADE NOT NULL,
  content           TEXT    NOT NULL,
  mood              TEXT    CHECK (mood IN ('high', 'neutral', 'low')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS journal_entries_manifestation_idx ON public.journal_entries(manifestation_id);
CREATE INDEX IF NOT EXISTS journal_entries_user_idx ON public.journal_entries(user_id);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their journal entries"
  ON public.journal_entries FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. match_chunks_ns RPC (per-user vector search)
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
  FROM public.chunks c
  WHERE
    c.namespace = ns
    AND (p_user_id IS NULL OR c.user_id = p_user_id)
    AND (1 - (c.embedding <=> query_embedding)) >= min_similarity
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- 7. Storage buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('manifestation-media', 'manifestation-media', true),
  ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view manifestation media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'manifestation-media');

CREATE POLICY "Authenticated users upload manifestation media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'manifestation-media' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');
