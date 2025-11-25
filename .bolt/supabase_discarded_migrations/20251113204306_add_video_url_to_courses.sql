/*
  # Add video_url column to courses table

  1. Changes
    - Add `video_url` column to `courses` table
      - Type: text (nullable to support existing courses)
      - Stores YouTube video URLs for course content
  
  2. Notes
    - Existing courses will have NULL video_url by default
    - Courses can have either pdf_url or video_url or both
*/

-- Add video_url column to courses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE courses ADD COLUMN video_url text;
  END IF;
END $$;