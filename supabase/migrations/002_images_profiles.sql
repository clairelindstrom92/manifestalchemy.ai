-- ============================================================
-- 002_images_profiles.sql
-- Profiles, saved images, reference images + storage buckets
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. User profiles (avatar + display name)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  avatar_url TEXT,
  display_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill profiles for existing users
INSERT INTO profiles (id)
SELECT id FROM auth.users
ON CONFLICT DO NOTHING;

-- 2. Saved images (hearts/favorites — used for training flywheel)
CREATE TABLE IF NOT EXISTS saved_images (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  manifestation_id UUID REFERENCES manifestations(id) ON DELETE CASCADE NOT NULL,
  source_url  TEXT NOT NULL,
  prompt      TEXT,
  is_training_data BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their saved images" ON saved_images
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_images_user_idx ON saved_images(user_id);

-- 3. Reference images (uploaded by users to influence FLUX generation)
CREATE TABLE IF NOT EXISTS reference_images (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  manifestation_id UUID REFERENCES manifestations(id) ON DELETE CASCADE,
  storage_path     TEXT NOT NULL,
  source_url       TEXT NOT NULL,
  label            TEXT,
  is_profile_picture BOOLEAN DEFAULT FALSE,
  is_training_data   BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reference_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their reference images" ON reference_images
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS reference_images_user_idx ON reference_images(user_id);
CREATE INDEX IF NOT EXISTS reference_images_manifestation_idx ON reference_images(manifestation_id);
CREATE INDEX IF NOT EXISTS reference_images_profile_idx ON reference_images(user_id, is_profile_picture);

-- 4. Storage buckets
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('reference-images', 'reference-images', true)
  ON CONFLICT DO NOTHING;

-- 5. Storage RLS policies
-- avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- reference-images
CREATE POLICY "Anyone can view reference images" ON storage.objects
  FOR SELECT USING (bucket_id = 'reference-images');

CREATE POLICY "Users upload their own reference images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reference-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete their own reference images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'reference-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
