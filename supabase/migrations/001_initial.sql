-- ============================================
-- LexiFlow — Database Migration (001)
-- ============================================
-- Run this SQL in your Supabase SQL Editor or via CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Words table
-- ============================================
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  word TEXT NOT NULL,
  pos TEXT,
  ipa TEXT,
  meaning TEXT NOT NULL,
  phrase TEXT,
  example TEXT,
  family TEXT,
  topic TEXT,
  note TEXT,
  source TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, word)
);

-- ============================================
-- Reviews table (SM-2 algorithm state)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  last_review TIMESTAMPTZ,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  wrong_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);
CREATE INDEX IF NOT EXISTS idx_words_topic ON words(topic);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_favorite ON words(favorite) WHERE favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_next_review ON reviews(next_review);
CREATE INDEX IF NOT EXISTS idx_reviews_word_id ON reviews(word_id);

-- ============================================
-- Trigger: Auto-create review when word is added
-- ============================================
CREATE OR REPLACE FUNCTION create_review_for_word()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reviews (word_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_review ON words;
CREATE TRIGGER trigger_create_review
AFTER INSERT ON words
FOR EACH ROW
EXECUTE FUNCTION create_review_for_word();

-- ============================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_words ON words;
CREATE TRIGGER trigger_update_words
BEFORE UPDATE ON words
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS Policies (for future multi-user support)
-- ============================================
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (single-user MVP)
CREATE POLICY "Allow all for MVP" ON words FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for MVP" ON reviews FOR ALL USING (true) WITH CHECK (true);
