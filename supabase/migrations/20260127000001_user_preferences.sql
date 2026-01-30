-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- User Profile & Brand Identity
  brand_name TEXT,
  niche TEXT, -- e.g., "Technology", "Fashion", "Finance", "Travel"
  target_audience TEXT, -- e.g., "Young professionals", "Tech enthusiasts"
  brand_voice TEXT, -- e.g., "Professional", "Casual", "Humorous", "Inspirational"
  tone TEXT, -- e.g., "Friendly", "Authoritative", "Educational"
  
  -- Content Preferences
  content_style TEXT, -- e.g., "Story-driven", "Data-driven", "Visual-heavy"
  preferred_hashtags TEXT[], -- Array of favorite hashtags
  avoid_topics TEXT[], -- Topics to avoid
  keywords TEXT[], -- Keywords to emphasize
  
  -- Platform-Specific Settings
  platform_preferences JSONB DEFAULT '{}'::jsonb, -- Different settings per platform
  
  -- Viral Content Settings
  fetch_viral_content BOOLEAN DEFAULT true,
  viral_content_sources TEXT[] DEFAULT ARRAY['twitter', 'instagram', 'linkedin'], -- Which platforms to fetch from
  viral_content_relevance INTEGER DEFAULT 7, -- 1-10 scale for how closely viral content should match niche
  
  -- AI Generation Settings
  creativity_level INTEGER DEFAULT 7, -- 1-10 scale (higher = more creative)
  post_length TEXT DEFAULT 'medium', -- 'short', 'medium', 'long'
  emoji_usage TEXT DEFAULT 'moderate', -- 'none', 'minimal', 'moderate', 'heavy'
  call_to_action_preference TEXT DEFAULT 'moderate', -- 'none', 'subtle', 'moderate', 'strong'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- RLS Policies
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only view their own preferences
-- CREATE POLICY "Users can view own preferences"
--   ON user_preferences
--   FOR SELECT
--   USING (auth.uid() = user_id);

-- Users can insert their own preferences
-- CREATE POLICY "Users can insert own preferences"
--   ON user_preferences
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
-- CREATE POLICY "Users can update own preferences"
--   ON user_preferences
--   FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
-- CREATE POLICY "Users can delete own preferences"
--   ON user_preferences
--   FOR DELETE
--   USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_preferences_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Fix user_preferences foreign key to reference profiles instead of auth.users
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;
