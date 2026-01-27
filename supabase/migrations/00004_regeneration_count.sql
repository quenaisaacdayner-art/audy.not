-- Add regeneration count to mentions
-- Tracks how many times a user has regenerated the draft reply for a mention
-- Max 3 attempts per CONTEXT.md

ALTER TABLE mentions ADD COLUMN regeneration_count INTEGER DEFAULT 0 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN mentions.regeneration_count IS 'Number of times draft has been regenerated, max 3';
