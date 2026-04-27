-- STORIES TABLE
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  attached_photo_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  admin_note text
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- **SECURITY UPDATE: Remove old public direct INSERT policies.**
DROP POLICY IF EXISTS "Public can submit stories" ON stories;

-- Public can read approved stories
DROP POLICY IF EXISTS "Public can read approved stories" ON stories;
CREATE POLICY "Public can read approved stories"
ON stories FOR SELECT
USING (status = 'approved');

-- Admins can read all stories
DROP POLICY IF EXISTS "Admins can read all stories" ON stories;
CREATE POLICY "Admins can read all stories"
ON stories FOR SELECT
USING (auth.role() = 'authenticated');

-- Admins can update story status
DROP POLICY IF EXISTS "Admins can update story status" ON stories;
CREATE POLICY "Admins can update story status"
ON stories FOR UPDATE
USING (auth.role() = 'authenticated');

-- Admins can delete stories
DROP POLICY IF EXISTS "Admins can delete stories" ON stories;
CREATE POLICY "Admins can delete stories"
ON stories FOR DELETE
USING (auth.role() = 'authenticated');

-- PHOTOS TABLE
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  caption text,
  submitted_by text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- **SECURITY UPDATE: Remove old public direct INSERT policies.**
DROP POLICY IF EXISTS "Public can submit photos" ON photos;

-- Public can read approved photos
DROP POLICY IF EXISTS "Public can read approved photos" ON photos;
CREATE POLICY "Public can read approved photos"
ON photos FOR SELECT
USING (status = 'approved');

-- Admins can read all photos
DROP POLICY IF EXISTS "Admins can read all photos" ON photos;
CREATE POLICY "Admins can read all photos"
ON photos FOR SELECT
USING (auth.role() = 'authenticated');

-- Admins can update photo status
DROP POLICY IF EXISTS "Admins can update photo status" ON photos;
CREATE POLICY "Admins can update photo status"
ON photos FOR UPDATE
USING (auth.role() = 'authenticated');

-- Admins can delete photos
DROP POLICY IF EXISTS "Admins can delete photos" ON photos;
CREATE POLICY "Admins can delete photos"
ON photos FOR DELETE
USING (auth.role() = 'authenticated');

-- STORAGE BUCKETS
-- 1. Create a bucket named "photos" (Make it PUBLIC)
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create a bucket named "pending-photos" (Make it PRIVATE)
INSERT INTO storage.buckets (id, name, public) VALUES ('pending-photos', 'pending-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for 'photos' (Public bucket)
-- Also remove the old pending photos public upload policy if it exists on the 'photos' bucket
DROP POLICY IF EXISTS "Public can upload pending photos" ON storage.objects;

-- Public can read from 'approved/' folder
DROP POLICY IF EXISTS "Public can read approved photos" ON storage.objects;
CREATE POLICY "Public can read approved photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = 'approved');

-- Admins have full access to 'photos' bucket
DROP POLICY IF EXISTS "Admins can manage photos" ON storage.objects;
CREATE POLICY "Admins can manage photos"
ON storage.objects FOR ALL
USING (auth.role() = 'authenticated' AND bucket_id = 'photos');


-- Storage RLS Policies for 'pending-photos' (Private bucket)
-- Public can ONLY upload images
DROP POLICY IF EXISTS "Public can upload pending photos safely" ON storage.objects;
CREATE POLICY "Public can upload pending photos safely"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pending-photos' AND 
  (storage.foldername(name))[1] = 'pending' AND 
  (
    storage.extension(name) = 'jpg' OR 
    storage.extension(name) = 'jpeg' OR 
    storage.extension(name) = 'png' OR 
    storage.extension(name) = 'webp' OR 
    storage.extension(name) = 'gif'
  )
);

-- Admins have full access to 'pending-photos' bucket
DROP POLICY IF EXISTS "Admins can manage pending photos" ON storage.objects;
CREATE POLICY "Admins can manage pending photos"
ON storage.objects FOR ALL
USING (auth.role() = 'authenticated' AND bucket_id = 'pending-photos');
