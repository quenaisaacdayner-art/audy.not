-- Phase 2: Onboarding and Products Database Schema
-- This migration adds tables for personas, telegram connections, and products

-- ============================================================================
-- PERSONAS TABLE
-- ============================================================================
-- Stores user persona configuration for AI-generated content
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expertise TEXT,
  tone TEXT, -- 'professional' | 'casual' | 'friendly' | 'technical' | 'witty' | custom text
  phrases_to_avoid TEXT,
  target_audience TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id) -- One persona per user
);

-- Add comment for documentation
COMMENT ON TABLE public.personas IS 'User personas for AI content generation with expertise, tone, and target audience';

-- Enable RLS
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personas
CREATE POLICY "Users can view own persona"
  ON public.personas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own persona"
  ON public.personas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own persona"
  ON public.personas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own persona"
  ON public.personas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger (reuses handle_updated_at function from migration 00001)
CREATE TRIGGER on_persona_updated
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ============================================================================
-- TELEGRAM CONNECTIONS TABLE
-- ============================================================================
-- Stores the link between user accounts and their Telegram chat
CREATE TABLE public.telegram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  telegram_user_id BIGINT,
  connected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id), -- One connection per user
  UNIQUE(telegram_chat_id) -- One user per chat
);

-- Add comment for documentation
COMMENT ON TABLE public.telegram_connections IS 'Links user accounts to their Telegram chat for notifications';

-- Enable RLS
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_connections
CREATE POLICY "Users can view own telegram connection"
  ON public.telegram_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own telegram connection"
  ON public.telegram_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram connection"
  ON public.telegram_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram connection"
  ON public.telegram_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookup by chat_id (used in webhook handler)
CREATE INDEX idx_telegram_connections_chat_id ON public.telegram_connections(telegram_chat_id);

-- ============================================================================
-- TELEGRAM CONNECTION TOKENS TABLE
-- ============================================================================
-- Temporary tokens for Telegram deep link connection flow
CREATE TABLE public.telegram_connection_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE public.telegram_connection_tokens IS 'Short-lived tokens for Telegram deep link connection flow';

-- Enable RLS
ALTER TABLE public.telegram_connection_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_connection_tokens
CREATE POLICY "Users can view own tokens"
  ON public.telegram_connection_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tokens"
  ON public.telegram_connection_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON public.telegram_connection_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast token lookup (webhook handler needs this without user context)
CREATE INDEX idx_telegram_tokens_token ON public.telegram_connection_tokens(token);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
-- Stores user products for monitoring keywords and subreddits
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  keywords TEXT[] DEFAULT '{}',
  subreddits TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.products IS 'User products with keywords and subreddits for monitoring';

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger (reuses handle_updated_at function from migration 00001)
CREATE TRIGGER on_product_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ============================================================================
-- PROFILES TABLE UPDATE
-- ============================================================================
-- Add onboarding_step column to track user progress in onboarding flow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'persona';
