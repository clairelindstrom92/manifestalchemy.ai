-- ============================================================
-- Manifest Alchemy AI — Complete Schema Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. profiles — user avatar + display name
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url   TEXT,
  display_name TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage their own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- Auto-create profile row on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. saved_images — hearted/saved generated images
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_images (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  manifestation_id  UUID REFERENCES manifestations(id) ON DELETE CASCADE NOT NULL,
  source_url        TEXT NOT NULL,
  prompt            TEXT,
  is_training_data  BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_images_user_idx ON saved_images(user_id);
CREATE INDEX IF NOT EXISTS saved_images_manifestation_idx ON saved_images(manifestation_id);
CREATE UNIQUE INDEX IF NOT EXISTS saved_images_unique_idx ON saved_images(user_id, source_url);

ALTER TABLE saved_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage their saved images"
  ON saved_images FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. reference_images — user-uploaded photos for FLUX conditioning
-- ============================================================
CREATE TABLE IF NOT EXISTS reference_images (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  manifestation_id   UUID REFERENCES manifestations(id) ON DELETE SET NULL,
  storage_path       TEXT NOT NULL,
  source_url         TEXT NOT NULL,
  label              TEXT,
  is_profile_picture BOOLEAN DEFAULT false,
  is_training_data   BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reference_images_user_idx ON reference_images(user_id);
CREATE INDEX IF NOT EXISTS reference_images_manifestation_idx ON reference_images(manifestation_id);

ALTER TABLE reference_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage their reference images"
  ON reference_images FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. Storage buckets
-- Run these separately if the SQL editor doesn't support them:
-- Go to Storage > New bucket for each one below
-- ============================================================

-- manifestation-media (vision board images, AI-generated images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('manifestation-media', 'manifestation-media', true)
ON CONFLICT (id) DO NOTHING;

-- chat-images (images uploaded in chat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- reference-images (user reference photos for FLUX)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', true)
ON CONFLICT (id) DO NOTHING;

-- avatars (profile pictures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Storage RLS policies
-- ============================================================

-- manifestation-media: authenticated users can upload/read
CREATE POLICY IF NOT EXISTS "Authenticated users can upload manifestation media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'manifestation-media');

CREATE POLICY IF NOT EXISTS "Anyone can view manifestation media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'manifestation-media');

-- chat-images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload chat images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY IF NOT EXISTS "Anyone can view chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

-- reference-images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload reference images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reference-images');

CREATE POLICY IF NOT EXISTS "Anyone can view reference images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reference-images');

CREATE POLICY IF NOT EXISTS "Users can delete their own reference images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'reference-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- avatars
CREATE POLICY IF NOT EXISTS "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
