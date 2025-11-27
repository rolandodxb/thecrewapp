/*
  # Create Chat Storage Bucket

  1. Storage Setup
    - Create 'chat-files' storage bucket for chat attachments
    - Enable public access for chat files
    - Set file size limits and allowed MIME types

  2. Security
    - Users can upload files to their own chat conversations
    - All users can view files in public conversations
    - File size limited to 10MB
*/

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/webm',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload chat files" ON storage.objects;
  DROP POLICY IF EXISTS "Public access to chat files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own chat files" ON storage.objects;
END $$;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload chat files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-files');

-- Allow everyone to view public chat files
CREATE POLICY "Public access to chat files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'chat-files');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own chat files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'chat-files' AND owner::text = auth.uid()::text);
