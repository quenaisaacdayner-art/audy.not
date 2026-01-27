-- Phase 3: Monitoring Engine Database Schema
-- This migration adds tables for mentions tracking and monitoring state

-- ============================================================================
-- MENTIONS TABLE
-- ============================================================================
-- Stores Reddit mentions matched against user products
CREATE TABLE public.mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reddit_post_id TEXT NOT NULL,
  reddit_permalink TEXT NOT NULL,
  reddit_title TEXT NOT NULL,
  reddit_content TEXT,
  reddit_author TEXT NOT NULL,
  reddit_subreddit TEXT NOT NULL,
  reddit_created_at TIMESTAMPTZ NOT NULL,
  intent TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  draft_reply TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Composite unique constraint for deduplication
  UNIQUE(product_id, reddit_post_id),
  -- Validation constraints
  CONSTRAINT mentions_confidence_range CHECK (confidence >= 0 AND confidence <= 100),
  CONSTRAINT mentions_status_check CHECK (status IN ('pending', 'approved', 'discarded', 'regenerated')),
  CONSTRAINT mentions_intent_check CHECK (intent IN ('pain_point', 'recommendation_request'))
);

-- Add comment for documentation
COMMENT ON TABLE public.mentions IS 'Reddit mentions matched against user products with AI classification and draft replies';

-- Enable RLS
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentions (4 CRUD policies)
CREATE POLICY "Users can view own mentions"
  ON public.mentions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mentions"
  ON public.mentions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentions"
  ON public.mentions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mentions"
  ON public.mentions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_mentions_user_status ON public.mentions(user_id, status);
CREATE INDEX idx_mentions_product ON public.mentions(product_id);
-- Note: Unique constraint on (product_id, reddit_post_id) creates implicit index

-- Updated_at trigger (reuses handle_updated_at function from migration 00001)
CREATE TRIGGER on_mention_updated
  BEFORE UPDATE ON public.mentions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ============================================================================
-- MONITORING STATE TABLE
-- ============================================================================
-- Singleton table to track last monitoring run (service role access only)
CREATE TABLE public.monitoring_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_checked_at TIMESTAMPTZ,
  last_run_stats JSONB,
  CONSTRAINT monitoring_state_singleton CHECK (id = 1)
);

-- Add comment for documentation
COMMENT ON TABLE public.monitoring_state IS 'Singleton table tracking last monitoring run timestamp and stats';

-- Enable RLS (no authenticated user policies - service role only)
ALTER TABLE public.monitoring_state ENABLE ROW LEVEL SECURITY;

-- Insert initial singleton row
INSERT INTO public.monitoring_state (id) VALUES (1);
