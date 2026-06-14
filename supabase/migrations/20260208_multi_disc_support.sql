-- Multi-Disc Support Migration
-- Add new columns to pain_entries table for disc-focused clinical tracking

-- Add new columns to pain_entries table
ALTER TABLE pain_entries
  ADD COLUMN IF NOT EXISTS spine_region TEXT CHECK (spine_region IN ('cervical', 'lumbar')),
  ADD COLUMN IF NOT EXISTS discs JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS sensations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS radiation TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS aggravating_positions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS neurological_signs TEXT[] DEFAULT '{}';

-- Add index for filtering by spine region
CREATE INDEX IF NOT EXISTS idx_pain_entries_spine_region ON pain_entries(spine_region) WHERE spine_region IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN pain_entries.spine_region IS 'Cervical or lumbar spine region';
COMMENT ON COLUMN pain_entries.discs IS 'JSONB array of disc entries: [{level: "L5-S1", role: "primary"}, ...]';
COMMENT ON COLUMN pain_entries.sensations IS 'Pain sensations: sharp, burning, tingling, electric_shock, etc.';
COMMENT ON COLUMN pain_entries.radiation IS 'Radiation path: shoulder, arm, hand (cervical) or buttock, thigh, foot (lumbar)';
COMMENT ON COLUMN pain_entries.aggravating_positions IS 'Positions that aggravate pain: sitting, bending_forward, etc.';
COMMENT ON COLUMN pain_entries.neurological_signs IS 'Neurological symptoms: numbness, weakness, balance_issues, etc.';
