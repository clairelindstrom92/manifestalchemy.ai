-- ============================================================
-- Manifest Alchemy AI - Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up the database
-- ============================================================

-- --------------------------------------------------------
-- 1. POSTS TABLE
--    Stores individual chat sessions. Each row is one
--    conversation thread, saved as JSON in `content`.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT,
  content         TEXT,                   -- JSON array of chat messages
  is_public       BOOLEAN DEFAULT FALSE,
  manifestation_id UUID,                  -- FK to manifestations (set after creation)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_manifestation_id ON posts(manifestation_id);

-- --------------------------------------------------------
-- 2. MANIFESTATIONS TABLE
--    Stores the "manifestation" entity derived from chats.
--    The `intent` JSONB column holds structured data:
--    { title, summary, confidence, reason, microTasks, imagePrompts, gallery }
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS manifestations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT,
  summary         TEXT,
  status          TEXT DEFAULT 'draft',   -- 'draft' | 'active' | 'completed'
  needs_title     BOOLEAN DEFAULT TRUE,   -- true until AI extracts a confident title
  confidence      FLOAT,                  -- 0.0-1.0, AI confidence in title extraction
  chat_post_id    UUID REFERENCES posts(id) ON DELETE SET NULL,
  intent          JSONB DEFAULT '{}',     -- structured intent data from AI
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manifestations_author_id ON manifestations(author_id);
CREATE INDEX IF NOT EXISTS idx_manifestations_chat_post_id ON manifestations(chat_post_id);

-- Add FK from posts back to manifestations (after both tables exist)
ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_manifestation_id_fkey;

ALTER TABLE posts
  ADD CONSTRAINT posts_manifestation_id_fkey
  FOREIGN KEY (manifestation_id) REFERENCES manifestations(id) ON DELETE SET NULL;

-- --------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
--    Users can only see and modify their own data.
-- --------------------------------------------------------

-- Posts RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
CREATE POLICY "Users can view their own posts"
  ON posts FOR SELECT
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- Manifestations RLS
ALTER TABLE manifestations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own manifestations" ON manifestations;
CREATE POLICY "Users can view their own manifestations"
  ON manifestations FOR SELECT
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can insert their own manifestations" ON manifestations;
CREATE POLICY "Users can insert their own manifestations"
  ON manifestations FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own manifestations" ON manifestations;
CREATE POLICY "Users can update their own manifestations"
  ON manifestations FOR UPDATE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own manifestations" ON manifestations;
CREATE POLICY "Users can delete their own manifestations"
  ON manifestations FOR DELETE
  USING (auth.uid() = author_id);

-- --------------------------------------------------------
-- 4. STORAGE BUCKET (run separately in Supabase dashboard
--    or via the Storage API — SQL cannot create buckets)
-- --------------------------------------------------------
-- Create a bucket named "chat-images" in the Supabase dashboard
-- under Storage → New Bucket → Name: chat-images → Public: true
-- Then add a policy allowing authenticated users to upload:
--
--   Allowed MIME types: image/*
--   Max upload size: 10 MB

-- --------------------------------------------------------
-- 5. OPTIONAL: Vector search for knowledge retrieval
--    Only needed if you want RAG (Retrieval-Augmented Generation)
--    for the chat API. Requires the pgvector extension.
-- --------------------------------------------------------
-- Enable pgvector:
--   CREATE EXTENSION IF NOT EXISTS vector;
--
-- Create chunks table for embeddings:
--   CREATE TABLE IF NOT EXISTS chunks (
--     id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     namespace  TEXT NOT NULL,
--     content    TEXT NOT NULL,
--     metadata   JSONB DEFAULT '{}',
--     embedding  vector(1536),
--     created_at TIMESTAMPTZ DEFAULT NOW()
--   );
--
--   CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
--
-- Create the RPC function used by the chat API:
--   CREATE OR REPLACE FUNCTION match_chunks_ns(
--     query_embedding vector(1536),
--     match_count     int,
--     min_similarity  float,
--     ns              text
--   )
--   RETURNS TABLE (content text, metadata jsonb, similarity float)
--   LANGUAGE sql STABLE
--   AS $$
--     SELECT content, metadata,
--            1 - (embedding <=> query_embedding) AS similarity
--     FROM chunks
--     WHERE namespace = ns
--       AND 1 - (embedding <=> query_embedding) >= min_similarity
--     ORDER BY embedding <=> query_embedding
--     LIMIT match_count;
--   $$;
