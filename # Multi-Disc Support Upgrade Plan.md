# Multi-Disc Support Upgrade Plan
## Disc-Focused Clinical Tracking Transformation

This document is the single source of truth for upgrading Calm Pain Tracker from a generic pain logger to a disc-focused clinical tracking tool that supports multi-disc conditions, spine region awareness, and medically meaningful data capture.

---

## 1) Executive Intent

### Primary Objective
Transform the app to support REAL disc conditions where pain originates from MORE THAN ONE disc level (adjacent or non-adjacent), while keeping logging simple and medically meaningful.

### Core Principles
1. **Multi-disc is a first-class case** - Users can select 1 or more discs per entry
2. **Primary disc drives pain score** - One disc is marked as PRIMARY (most painful), others are SECONDARY
3. **Spine region awareness** - Cervical and lumbar have different disc levels, radiation paths, and aggravators
4. **Backward compatibility** - Existing entries continue to work without migration
5. **Doctor-ready output** - Weekly summaries readable in < 30 seconds

### Success Criteria
- Supports real MRI scenarios (multiple disc involvement)
- Does not overwhelm users (max 3 discs per entry)
- Maintains disc-first clarity
- Doctor can read summary in < 30 seconds
- AI can reason about disc progression over time

---

## 2) Current State (Codebase Reality)

### Implemented Today
- **Data Model**: Flat `pain_entries` table with:
  - `locations` TEXT[] (L1-S1, hips, legs, sciatic nerve)
  - `types` TEXT[] (Dull, Sharp, Burning, Tingling, Aching)
  - `radiating` BOOLEAN
  - `pain_level` INTEGER (0-10)
  - `notes` TEXT
- **Entry Form**: `components/pages/DailyEntry.tsx` with chip selectors for locations/types
- **History**: `components/pages/History.tsx` with expandable cards
- **Trends**: `components/pages/Trends.tsx` with Recharts line chart
- **CRUD**: `hooks/use-pain-entries.ts` with React Query + optimistic updates
- **CSV Export**: Basic export in Settings page

### Not Implemented (Critical Gaps)
- No spine region concept (cervical vs lumbar)
- No disc-level tracking (C2-C3, L4-L5, etc.)
- No primary/secondary disc roles
- No disc-specific sensations (electric shock, numbness, pressure)
- No region-aware radiation paths (shoulder/arm/hand vs buttock/thigh/foot)
- No aggravating positions (looking down, bending forward, etc.)
- No neurological signs tracking (weakness, balance issues)
- No multi-disc insights or progression detection

**Conclusion**: Foundation exists for pain tracking, but lacks disc-focused clinical structure.

---

## 3) Target Architecture

### Architecture Goals
- Keep existing Next.js 15 + Supabase + React Query foundation
- Add new columns alongside existing ones (additive migration)
- Preserve backward compatibility with existing entries
- Maintain performance and optimistic UI updates

### Data Model Transformation

**Old Schema** (existing):
```sql
pain_entries (
  id UUID,
  user_id UUID,
  timestamp TIMESTAMPTZ,
  pain_level INTEGER,
  locations TEXT[],      -- ['L1', 'L2', 'S1']
  types TEXT[],         -- ['Sharp', 'Burning']
  radiating BOOLEAN,
  notes TEXT
)
```

**New Schema** (additive):
```sql
pain_entries (
  -- Existing columns (unchanged)
  id UUID,
  user_id UUID,
  timestamp TIMESTAMPTZ,
  pain_level INTEGER,
  locations TEXT[],      -- Still populated for backward compat
  types TEXT[],         -- Still populated for backward compat
  radiating BOOLEAN,    -- Still populated for backward compat
  notes TEXT,
  
  -- New disc-focused columns
  spine_region TEXT CHECK (spine_region IN ('cervical', 'lumbar')),
  discs JSONB DEFAULT '[]',  -- [{level: 'L5-S1', role: 'primary'}, {level: 'L4-L5', role: 'secondary'}]
  sensations TEXT[] DEFAULT '{}',  -- ['burning', 'tingling', 'electric_shock']
  radiation TEXT[] DEFAULT '{}',   -- ['shoulder', 'arm', 'hand'] or ['buttock', 'thigh', 'foot']
  aggravating_positions TEXT[] DEFAULT '{}',  -- ['sitting', 'looking_down', 'bending_forward']
  neurological_signs TEXT[] DEFAULT '{}'      -- ['numbness', 'arm_weakness', 'balance_issues']
)
```

### Entry Format Detection
- **Old entries**: `spine_region IS NULL` → use `locations`/`types`/`radiating`
- **New entries**: `spine_region IS NOT NULL` → use disc-focused fields
- Helper function `isDiscEntry(entry)` drives conditional rendering

---

## 4) Implementation Phases

### Phase 1: Database Migration

**File**: Create migration SQL file or run in Supabase dashboard

```sql
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
```

**Validation**: All columns nullable/defaulted, existing entries unaffected.

---

### Phase 2: Type System Overhaul

**File**: `types/pain-entry.ts`

**New Types**:
```typescript
export type SpineRegion = 'cervical' | 'lumbar';
export type DiscRole = 'primary' | 'secondary';

export interface DiscEntry {
  level: string;  // 'C5-C6', 'L4-L5', etc.
  role: DiscRole;
}

export interface PainEntry {
  // Existing fields
  id: string;
  timestamp: string;
  painLevel: number;
  locations: string[];
  types: string[];
  radiating: boolean;
  notes: string;
  
  // New disc-focused fields (optional for backward compat)
  spineRegion?: SpineRegion;
  discs?: DiscEntry[];
  sensations?: string[];
  radiation?: string[];
  aggravatingPositions?: string[];
  neurologicalSigns?: string[];
}
```

**Constants**:
```typescript
export const CERVICAL_DISCS = ['C2-C3', 'C3-C4', 'C4-C5', 'C5-C6', 'C6-C7', 'C7-T1'] as const;
export const LUMBAR_DISCS = ['L1-L2', 'L2-L3', 'L3-L4', 'L4-L5', 'L5-S1'] as const;

export const SENSATIONS = [
  'sharp',
  'burning',
  'tingling',
  'electric_shock',
  'deep_aching',
  'numbness',
  'pressure',
  'pulling_along_nerve'
] as const;

export const CERVICAL_RADIATION = ['shoulder', 'upper_arm', 'forearm', 'hand', 'fingers'] as const;
export const LUMBAR_RADIATION = ['buttock', 'thigh', 'calf', 'foot', 'toes'] as const;

export const COMMON_AGGRAVATORS = ['sitting', 'long_travel', 'end_of_day', 'after_waking'] as const;
export const CERVICAL_AGGRAVATORS = ['looking_down', 'looking_up', 'screen_usage'] as const;
export const LUMBAR_AGGRAVATORS = ['bending_forward', 'bending_backward', 'lifting'] as const;

export const NEUROLOGICAL_SIGNS = [
  'increasing_numbness',
  'arm_weakness',      // cervical only
  'leg_weakness',      // lumbar only
  'reduced_grip_strength',
  'balance_issues'
] as const;
```

**Helper Functions**:
```typescript
export function isDiscEntry(entry: PainEntry): boolean {
  return entry.spineRegion !== undefined && entry.spineRegion !== null;
}

export function validateDiscEntry(entry: Partial<PainEntry>): { valid: boolean; error?: string } {
  if (!entry.spineRegion) return { valid: false, error: 'Spine region required' };
  if (!entry.discs || entry.discs.length === 0) return { valid: false, error: 'At least one disc required' };
  if (entry.discs.length > 3) return { valid: false, error: 'Maximum 3 discs allowed' };
  
  const primaryCount = entry.discs.filter(d => d.role === 'primary').length;
  if (primaryCount !== 1) return { valid: false, error: 'Exactly one primary disc required' };
  
  // Validate disc levels match spine region
  const validLevels = entry.spineRegion === 'cervical' ? CERVICAL_DISCS : LUMBAR_DISCS;
  const invalidDisc = entry.discs.find(d => !validLevels.includes(d.level as any));
  if (invalidDisc) return { valid: false, error: `Disc level ${invalidDisc.level} does not match spine region` };
  
  return { valid: true };
}
```

**Converters**: Update `dbToClient` and `clientToDb` to handle new JSONB `discs` field and new arrays.

---

### Phase 3: New UI Components

**File**: `components/pain/SpineRegionSelector.tsx`

Two-option segmented control (Cervical / Lumbar):
- Styled as pill toggle matching existing design system
- Selecting a region resets disc selection state
- Required field with visual indicator

**File**: `components/pain/DiscLevelSelector.tsx`

Multi-select disc level picker:
- Shows disc levels based on selected spine region
- Vertical list of checkboxes with labels (C2-C3, C3-C4, etc.)
- Max 3 discs enforced (disable remaining when 3 selected)
- Each selected disc shows a star icon toggle for primary marking
- Default: first selected disc automatically becomes primary
- Visual feedback: primary disc highlighted/bolded, secondary discs normal
- Validation messages inline

**File**: `components/pain/RadiationSelector.tsx`

Wrapper around existing `ChipSelect`:
- Filters options by spine region (cervical vs lumbar)
- Uses existing chip styling and multi-select behavior

**File**: `components/pain/AggravatorSelector.tsx`

Wrapper around existing `ChipSelect`:
- Shows common aggravators + region-specific ones
- Combines `COMMON_AGGRAVATORS` with region-specific array

**File**: `components/pain/NeurologicalSignsSelector.tsx`

Wrapper around existing `ChipSelect`:
- Filters by region (arm weakness for cervical, leg weakness for lumbar)
- Optional section (collapsible feel, not required)

---

### Phase 4: Entry Form Rewrite

**File**: `components/pages/DailyEntry.tsx`

**New Form Flow** (top to bottom):

1. **Date Header** (unchanged)
   - Day name + full date

2. **Spine Region Selector** (required)
   - Cervical / Lumbar toggle
   - Visual indicator for required field

3. **Disc Level Selector** (required, 1-3 discs)
   - Multi-select with primary star marking
   - Shows appropriate disc levels based on region
   - Inline validation messages

4. **Pain Level Slider** (unchanged)
   - Label: "Primary disc pain level"
   - Same 0-10 slider with ruler ticks

5. **Pain Sensations** (replaces old "Type" section)
   - Expanded options: Sharp, Burning, Tingling, Electric shock, Deep aching, Numbness, Pressure, Pulling along nerve
   - Multi-select chips

6. **Radiation Path** (replaces old radiating toggle)
   - Region-aware options
   - Cervical: Shoulder, Upper arm, Forearm, Hand, Fingers
   - Lumbar: Buttock, Thigh, Calf, Foot, Toes
   - Multi-select chips

7. **Aggravating Positions** (new section)
   - Common: Sitting, Long travel, End of day, After waking up
   - Region-specific added automatically
   - Multi-select chips

8. **Neurological Signs** (new section, optional)
   - Increasing numbness, Arm weakness (cervical), Leg weakness (lumbar), Reduced grip strength, Balance issues
   - Multi-select chips
   - Subtle styling to indicate optionality

9. **Notes** (unchanged)
   - Textarea with placeholder

10. **Log Today Button** (unchanged)
    - Disabled until validation passes

**Form State**:
```typescript
const [spineRegion, setSpineRegion] = useState<SpineRegion | null>(null);
const [discs, setDiscs] = useState<DiscEntry[]>([]);
const [painLevel, setPainLevel] = useState(0);
const [sensations, setSensations] = useState<string[]>([]);
const [radiation, setRadiation] = useState<string[]>([]);
const [aggravatingPositions, setAggravatingPositions] = useState<string[]>([]);
const [neurologicalSigns, setNeurologicalSigns] = useState<string[]>([]);
const [notes, setNotes] = useState('');
```

**Validation**:
- `spineRegion` required
- At least 1 disc required
- Exactly 1 primary disc required
- Max 3 discs
- `painLevel > 0` required
- Disc levels must match spine region

---

### Phase 5: CRUD Layer Update

**File**: `hooks/use-pain-entries.ts`

**Changes**:
1. **Add Mutation**: `clientToDb` already handles new fields via type extension
2. **Update Mutation**: Add new field mappings to `dbUpdates` object:
   ```typescript
   if (updates.spineRegion !== undefined) dbUpdates.spine_region = updates.spineRegion;
   if (updates.discs !== undefined) dbUpdates.discs = updates.discs;
   if (updates.sensations !== undefined) dbUpdates.sensations = updates.sensations;
   // ... etc
   ```
3. **CSV Export**: Update `exportToCsv` function:
   - New columns: Spine Region, Primary Disc, Secondary Discs, Sensations, Radiation, Aggravators, Neurological Signs
   - Handle old entries: Show "N/A" for spine region, "-" for discs, map old `locations`/`types` to appropriate columns

**File**: `lib/data/pain-entries.ts`

No changes needed - uses `select('*')` which automatically includes new columns.

---

### Phase 6: History Display Update

**File**: `components/pain/HistoryEntryCard.tsx`

**Collapsed View**:
- Show primary disc level instead of locations (e.g., "L5-S1" instead of "L1, L2, S1")
- Fallback to old format for legacy entries

**Expanded View**:
- **New format entries** (disc-focused):
  - Spine region + disc levels (primary marked with ⭐)
  - Sensations
  - Radiation path
  - Aggravating positions
  - Neurological signs (only if present)
- **Old format entries** (backward compat):
  - Locations
  - Types
  - Radiating (Yes/No)
- Notes always shown

**Helper Logic**:
```typescript
const isDisc = isDiscEntry(entry);
const primaryDisc = entry.discs?.find(d => d.role === 'primary');
const secondaryDiscs = entry.discs?.filter(d => d.role === 'secondary');
```

---

### Phase 7: Patterns/Trends Update

**File**: `components/pages/Trends.tsx`

**Chart Tooltip Updates**:
- Show primary disc + secondary discs instead of locations
- Example: "Primary: L5-S1, Secondary: L4-L5"
- Fallback to locations for old entries

**Chart Data Point Enrichment**:
```typescript
interface ChartDataPoint {
  date: string;
  fullDate: string;
  pain: number;
  timestamp: string;
  // Old format
  locations?: string[];
  types?: string[];
  // New format
  spineRegion?: string;
  primaryDisc?: string;
  secondaryDiscs?: string[];
  sensations?: string[];
  radiation?: string[];
  notes: string;
}
```

**Stats**: Unchanged (avg/worst/best pain score)

**Future Enhancement** (not blocking): Add disc-level filter dropdown to filter chart by specific disc.

---

### Phase 8: Insights Logic (Stretch Goal)

**File**: `lib/insights.ts` (new)

**Weekly Pattern Detection**:
```typescript
export interface WeeklyInsight {
  type: 'stable_primary' | 'disc_shift' | 'radiation_change' | 'recovery_signal';
  message: string;
  confidence: 'high' | 'medium' | 'low';
}

export function analyzeWeeklyPatterns(entries: PainEntry[]): WeeklyInsight[] {
  // Analyze last 7 days of disc entries
  // Detect:
  // 1. Stable primary disc with secondary persistence
  // 2. Primary disc shift over time
  // 3. Expanding/contracting radiation
  // 4. Pain reduction with same disc set (recovery signal)
}
```

**Surface on Patterns Page**:
- Add insights section below chart
- Show 1-3 most relevant insights
- Simple text-based rules, no AI needed for V1

---

### Phase 9: Doctor Summary Export

**File**: `hooks/use-pain-entries.ts` (CSV export function)

**New CSV Columns**:
```
Date, Time, Spine Region, Primary Disc, Secondary Discs, Pain Level, Sensations, Radiation, Aggravators, Neurological Signs, Notes
```

**Old Entry Handling**:
- Spine Region: "N/A"
- Primary Disc: "-"
- Secondary Discs: "-"
- Sensations: Map from old `types` array
- Radiation: "Yes" or "No" based on old `radiating` boolean
- Aggravators: "-"
- Neurological Signs: "-"

**Example Row** (new format):
```
2026-02-08, 14:30, lumbar, L5-S1, L4-L5, 7, burning;tingling, thigh;calf, sitting;bending_forward, numbness,
```

**Example Row** (old format):
```
2026-02-01, 10:15, N/A, -, -, 5, Sharp;Burning, Yes, -, -, "Worse in morning"
```

---

## 5) Backward Compatibility Strategy

### Display Logic
- Use `isDiscEntry(entry)` helper throughout UI
- Old entries: Render using `locations`/`types`/`radiating`
- New entries: Render using disc-focused fields

### Data Population
- New entries populate BOTH old and new fields where overlap exists:
  - Map `sensations` back to `types` array (for backward compat)
  - Map `radiation.length > 0` to `radiating` boolean
  - This allows rollback if needed

### Migration Path
- No forced migration of existing entries
- Users can continue using old format if desired (though new entries will use disc format)
- Future: Optional "upgrade old entries" feature (not in scope)

---

## 6) Validation Rules

### Entry Validation
1. `spineRegion` MUST be 'cervical' or 'lumbar'
2. `discs.length` MUST be >= 1 and <= 3
3. Exactly ONE disc MUST have `role: 'primary'`
4. Disc levels MUST match spine region:
   - Cervical: C2-C3 through C7-T1 only
   - Lumbar: L1-L2 through L5-S1 only
5. `painLevel` MUST be > 0 (enforced by existing validation)
6. `sensations`, `radiation`, `aggravatingPositions`, `neurologicalSigns` are optional arrays

### Database Constraints
- `spine_region` CHECK constraint: 'cervical' | 'lumbar' | NULL
- `discs` JSONB array with schema validation (enforced in application layer)
- All new columns nullable for backward compatibility

---

## 7) File Change Summary

| File | Change Type | Complexity |
|------|------------|------------|
| `types/pain-entry.ts` | Major rewrite | High - New types, constants, validators, converters |
| `components/pages/DailyEntry.tsx` | Major rewrite | High - New form flow, state management |
| `components/pain/SpineRegionSelector.tsx` | New file | Medium - Segmented control component |
| `components/pain/DiscLevelSelector.tsx` | New file | High - Multi-select with primary marking, max 3 enforcement |
| `components/pain/RadiationSelector.tsx` | New file | Low - Wrapper around ChipSelect |
| `components/pain/AggravatorSelector.tsx` | New file | Low - Wrapper around ChipSelect |
| `components/pain/NeurologicalSignsSelector.tsx` | New file | Low - Wrapper around ChipSelect |
| `components/pain/ChipSelect.tsx` | No changes | - Reusable as-is |
| `components/pain/PainTypeInfo.tsx` | Update | Low - Expand descriptions for new sensations |
| `hooks/use-pain-entries.ts` | Medium update | Medium - Mutations, CSV export |
| `components/pain/HistoryEntryCard.tsx` | Medium update | Medium - Dual-format display |
| `components/pages/Trends.tsx` | Medium update | Medium - Tooltip + data enrichment |
| `components/pages/History.tsx` | No changes | - No structural changes |
| `lib/data/pain-entries.ts` | No changes | - Uses select('*') |
| `lib/insights.ts` | New file (stretch) | Medium - Pattern detection logic |

---

## 8) Testing Strategy

### Unit Tests
- `validateDiscEntry()` function
- `isDiscEntry()` helper
- `dbToClient` / `clientToDb` converters with new fields

### Integration Tests
- Entry creation with disc-focused fields
- Entry update preserving old format
- CSV export with mixed old/new entries
- History display with mixed entries

### Manual Testing Checklist
- [ ] Create new entry with cervical region, 2 discs (1 primary)
- [ ] Create new entry with lumbar region, 3 discs (1 primary, 2 secondary)
- [ ] Validate max 3 discs enforcement
- [ ] Validate primary disc requirement
- [ ] Validate disc levels match spine region
- [ ] View history with old entries (backward compat)
- [ ] View history with new entries (disc-focused display)
- [ ] View trends chart with mixed entries
- [ ] Export CSV with mixed entries
- [ ] Update old entry (should preserve old format)
- [ ] Update new entry (should preserve disc format)

---

## 9) Rollout Plan

### Phase 1: Database Migration (Day 1)
- Run SQL migration in Supabase dashboard
- Verify existing entries unaffected
- No app changes yet

### Phase 2: Type System + Components (Days 2-3)
- Update types/pain-entry.ts
- Build new UI components
- Test components in isolation

### Phase 3: Entry Form (Day 4)
- Rewrite DailyEntry.tsx
- Test form validation
- Test entry creation

### Phase 4: History + Trends (Day 5)
- Update HistoryEntryCard.tsx
- Update Trends.tsx
- Test backward compatibility

### Phase 5: CSV Export (Day 6)
- Update CSV export function
- Test with mixed entries

### Phase 6: Insights (Day 7, stretch)
- Build insights.ts
- Surface on Patterns page

### Phase 7: Testing + Polish (Days 8-9)
- Full integration testing
- UI polish
- Error handling

### Phase 8: Deployment (Day 10)
- Deploy to production
- Monitor for errors
- Gather user feedback

---

## 10) Success Metrics

### Technical Metrics
- Zero data loss during migration
- 100% backward compatibility with existing entries
- All validation rules enforced
- CSV export includes all new fields

### User Experience Metrics
- Entry creation time < 2 minutes (target)
- Form validation errors clear and actionable
- History view clearly shows disc information
- Doctor summary readable in < 30 seconds

### Clinical Value Metrics
- Multi-disc entries represent > 30% of new entries (target)
- Users report improved doctor communication
- CSV exports used for medical appointments

---

## 11) Future Enhancements (Out of Scope)

- Disc-level filtering in Trends chart
- Disc progression visualization (timeline view)
- MRI image upload/annotation
- Treatment correlation (medication, PT, injections)
- AI-powered pattern detection (beyond rule-based insights)
- Multi-language support for medical terms
- Integration with health records (HL7, FHIR)

---

## Appendix A: Disc Level Reference

### Cervical Discs
- C2-C3: Between 2nd and 3rd cervical vertebrae
- C3-C4: Between 3rd and 4th cervical vertebrae
- C4-C5: Between 4th and 5th cervical vertebrae (common site)
- C5-C6: Between 5th and 6th cervical vertebrae (most common)
- C6-C7: Between 6th and 7th cervical vertebrae (common site)
- C7-T1: Between 7th cervical and 1st thoracic vertebrae

### Lumbar Discs
- L1-L2: Between 1st and 2nd lumbar vertebrae
- L2-L3: Between 2nd and 3rd lumbar vertebrae
- L3-L4: Between 3rd and 4th lumbar vertebrae
- L4-L5: Between 4th and 5th lumbar vertebrae (most common)
- L5-S1: Between 5th lumbar and 1st sacral vertebrae (most common)

---

## Appendix B: Sensation Descriptions

- **Sharp**: Sudden, intense pain that comes and goes
- **Burning**: Warm or burning sensation, indicates nerve irritation
- **Tingling**: Light prickling or buzzing sensation, nerve compression
- **Electric shock**: Sudden jolt-like sensation, nerve root irritation
- **Deep aching**: Constant, sore feeling, muscle or disc pressure
- **Numbness**: Reduced or absent sensation, nerve pressure
- **Pressure**: Heavy or compressed feeling
- **Pulling along nerve**: Sensation following nerve pathway

---

## Appendix C: Radiation Path Reference

### Cervical (Upper Body)
- Shoulder → Upper arm → Forearm → Hand → Fingers
- Typically follows C5-C7 nerve roots

### Lumbar (Lower Body)
- Buttock → Thigh → Calf → Foot → Toes
- Typically follows L4-S1 nerve roots (sciatic nerve)

---

**Document Version**: 1.0  
**Last Updated**: February 8, 2026  
**Status**: Ready for Implementation
