-- ============================================================================
-- CALM PAIN TRACKER — COMPLETE INITIAL SCHEMA
-- Run this in Supabase SQL Editor on a fresh project
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: pain_entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pain_entries (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp             TIMESTAMPTZ NOT NULL DEFAULT now(),
  pain_level            INTEGER NOT NULL CHECK (pain_level >= 0 AND pain_level <= 10),
  -- Legacy fields (kept for backward compatibility with early entries)
  locations             TEXT[] NOT NULL DEFAULT '{}',
  types                 TEXT[] NOT NULL DEFAULT '{}',
  radiating             BOOLEAN NOT NULL DEFAULT false,
  notes                 TEXT NOT NULL DEFAULT '',
  -- Disc-focused clinical fields
  spine_region          TEXT CHECK (spine_region IN ('cervical', 'lumbar')),
  discs                 JSONB DEFAULT '[]',
  sensations            TEXT[] DEFAULT '{}',
  radiation             TEXT[] DEFAULT '{}',
  aggravating_positions TEXT[] DEFAULT '{}',
  neurological_signs    TEXT[] DEFAULT '{}',
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Column comments
COMMENT ON COLUMN public.pain_entries.spine_region         IS 'Cervical or lumbar spine region';
COMMENT ON COLUMN public.pain_entries.discs                IS 'JSONB array of disc entries: [{level: "L5-S1", role: "primary"}, ...]';
COMMENT ON COLUMN public.pain_entries.sensations           IS 'Pain sensations: sharp, burning, tingling, electric_shock, etc.';
COMMENT ON COLUMN public.pain_entries.radiation            IS 'Radiation path: shoulder, arm, hand (cervical) or buttock, thigh, foot (lumbar)';
COMMENT ON COLUMN public.pain_entries.aggravating_positions IS 'Positions that aggravate pain: sitting, bending_forward, etc.';
COMMENT ON COLUMN public.pain_entries.neurological_signs   IS 'Neurological symptoms: numbness, weakness, balance_issues, etc.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pain_entries_user_id
  ON public.pain_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_pain_entries_timestamp
  ON public.pain_entries(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_pain_entries_created_at
  ON public.pain_entries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pain_entries_spine_region
  ON public.pain_entries(spine_region)
  WHERE spine_region IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER pain_entries_set_updated_at
  BEFORE UPDATE ON public.pain_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY: pain_entries
-- ============================================================================

ALTER TABLE public.pain_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pain entries"
  ON public.pain_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pain entries"
  ON public.pain_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pain entries"
  ON public.pain_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pain entries"
  ON public.pain_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RPC FUNCTION: delete_user
-- Deletes the calling user's data and auth account
-- Called from Settings page via supabase.rpc('delete_user')
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all pain entries (cascade would handle this too, but explicit is clearer)
  DELETE FROM public.pain_entries WHERE user_id = auth.uid();

  -- Delete the auth user account
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
