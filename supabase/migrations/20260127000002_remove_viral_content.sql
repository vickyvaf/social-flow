-- Remove viral content columns from user_preferences
-- This migration removes the scraping feature columns that are no longer used

-- Drop viral content related columns if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'user_preferences' 
             AND column_name = 'fetch_viral_content') THEN
    ALTER TABLE public.user_preferences DROP COLUMN fetch_viral_content;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'user_preferences' 
             AND column_name = 'viral_content_sources') THEN
    ALTER TABLE public.user_preferences DROP COLUMN viral_content_sources;
  END IF;
END $$;
