// ============================================================================
// SPINE REGIONS AND DISC TYPES
// ============================================================================

export type SpineRegion = 'cervical' | 'lumbar';
export type DiscRole = 'primary' | 'secondary';

export interface DiscEntry {
  level: string; // 'C5-C6', 'L4-L5', etc.
  role: DiscRole;
}

// ============================================================================
// DISC LEVEL CONSTANTS
// ============================================================================

export const CERVICAL_DISCS = [
  'C2-C3',
  'C3-C4',
  'C4-C5',
  'C5-C6',
  'C6-C7',
  'C7-T1',
] as const;

export const LUMBAR_DISCS = [
  'L1-L2',
  'L2-L3',
  'L3-L4',
  'L4-L5',
  'L5-S1',
] as const;

export type CervicalDisc = (typeof CERVICAL_DISCS)[number];
export type LumbarDisc = (typeof LUMBAR_DISCS)[number];

// ============================================================================
// SENSATION CONSTANTS
// ============================================================================

export const SENSATIONS = [
  'sharp',
  'burning',
  'tingling',
  'electric_shock',
  'deep_aching',
  'numbness',
  'pressure',
  'pulling_along_nerve',
] as const;

export type Sensation = (typeof SENSATIONS)[number];

export const SENSATION_LABELS: Record<Sensation, string> = {
  sharp: 'Sharp',
  burning: 'Burning',
  tingling: 'Tingling',
  electric_shock: 'Electric shock',
  deep_aching: 'Deep aching',
  numbness: 'Numbness',
  pressure: 'Pressure',
  pulling_along_nerve: 'Pulling along nerve',
};

export const SENSATION_DESCRIPTIONS: Record<Sensation, string> = {
  sharp: 'Sudden, intense pain that comes and goes',
  burning: 'Warm or burning sensation, indicates nerve irritation',
  tingling: 'Light prickling or buzzing sensation, nerve compression',
  electric_shock: 'Sudden jolt-like sensation, nerve root irritation',
  deep_aching: 'Constant, sore feeling, muscle or disc pressure',
  numbness: 'Reduced or absent sensation, nerve pressure',
  pressure: 'Heavy or compressed feeling',
  pulling_along_nerve: 'Sensation following nerve pathway',
};

// ============================================================================
// RADIATION PATH CONSTANTS
// ============================================================================

export const CERVICAL_RADIATION = [
  'shoulder',
  'upper_arm',
  'forearm',
  'hand',
  'fingers',
] as const;

export const LUMBAR_RADIATION = [
  'buttock',
  'thigh',
  'calf',
  'foot',
  'toes',
] as const;

export type CervicalRadiation = (typeof CERVICAL_RADIATION)[number];
export type LumbarRadiation = (typeof LUMBAR_RADIATION)[number];

export const RADIATION_LABELS: Record<CervicalRadiation | LumbarRadiation, string> = {
  shoulder: 'Shoulder',
  upper_arm: 'Upper arm',
  forearm: 'Forearm',
  hand: 'Hand',
  fingers: 'Fingers',
  buttock: 'Buttock',
  thigh: 'Thigh',
  calf: 'Calf',
  foot: 'Foot',
  toes: 'Toes',
};

// ============================================================================
// AGGRAVATING POSITIONS CONSTANTS
// ============================================================================

export const COMMON_AGGRAVATORS = [
  'sitting',
  'long_travel',
  'end_of_day',
  'after_waking',
] as const;

export const CERVICAL_AGGRAVATORS = [
  'looking_down',
  'looking_up',
  'screen_usage',
] as const;

export const LUMBAR_AGGRAVATORS = [
  'bending_forward',
  'bending_backward',
  'lifting',
] as const;

export type CommonAggravator = (typeof COMMON_AGGRAVATORS)[number];
export type CervicalAggravator = (typeof CERVICAL_AGGRAVATORS)[number];
export type LumbarAggravator = (typeof LUMBAR_AGGRAVATORS)[number];

export const AGGRAVATOR_LABELS: Record<
  CommonAggravator | CervicalAggravator | LumbarAggravator,
  string
> = {
  sitting: 'Sitting',
  long_travel: 'Long travel',
  end_of_day: 'End of day',
  after_waking: 'After waking up',
  looking_down: 'Looking down',
  looking_up: 'Looking up',
  screen_usage: 'Screen usage',
  bending_forward: 'Bending forward',
  bending_backward: 'Bending backward',
  lifting: 'Lifting',
};

// ============================================================================
// NEUROLOGICAL SIGNS CONSTANTS
// ============================================================================

export const NEUROLOGICAL_SIGNS = [
  'increasing_numbness',
  'arm_weakness',
  'leg_weakness',
  'reduced_grip_strength',
  'balance_issues',
] as const;

export type NeurologicalSign = (typeof NEUROLOGICAL_SIGNS)[number];

// Signs relevant to each spine region
export const CERVICAL_NEURO_SIGNS: NeurologicalSign[] = [
  'increasing_numbness',
  'arm_weakness',
  'reduced_grip_strength',
  'balance_issues',
];

export const LUMBAR_NEURO_SIGNS: NeurologicalSign[] = [
  'increasing_numbness',
  'leg_weakness',
  'balance_issues',
];

export const NEUROLOGICAL_SIGN_LABELS: Record<NeurologicalSign, string> = {
  increasing_numbness: 'Increasing numbness',
  arm_weakness: 'Arm weakness',
  leg_weakness: 'Leg weakness',
  reduced_grip_strength: 'Reduced grip strength',
  balance_issues: 'Balance issues',
};

// ============================================================================
// LEGACY PAIN LOCATIONS AND TYPES (for backward compatibility)
// ============================================================================

export const PAIN_LOCATIONS = [
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
  'S1',
  'Sciatic nerve',
  'Left hip',
  'Right hip',
  'Left leg',
  'Right leg',
  'Buttocks',
] as const;

export const PAIN_TYPES = [
  'Dull',
  'Sharp',
  'Burning',
  'Tingling',
  'Aching',
] as const;

export type PainLocation = (typeof PAIN_LOCATIONS)[number];
export type PainType = (typeof PAIN_TYPES)[number];

// ============================================================================
// DATABASE SCHEMA TYPES (snake_case to match PostgreSQL)
// ============================================================================

export interface DbPainEntry {
  id: string;
  user_id: string;
  timestamp: string;
  pain_level: number;
  // Legacy fields (still populated for backward compat)
  locations: string[];
  types: string[];
  radiating: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  // New disc-focused fields
  spine_region?: SpineRegion | null;
  discs?: DiscEntry[] | null;
  sensations?: string[] | null;
  radiation?: string[] | null;
  aggravating_positions?: string[] | null;
  neurological_signs?: string[] | null;
}

// ============================================================================
// CLIENT-SIDE TYPES (camelCase for React components)
// ============================================================================

export interface PainEntry {
  id: string;
  timestamp: string;
  painLevel: number;
  // Legacy fields (still used for old entries)
  locations: string[];
  types: string[];
  radiating: boolean;
  notes: string;
  // New disc-focused fields (optional for backward compat)
  spineRegion?: SpineRegion | null;
  discs?: DiscEntry[];
  sensations?: string[];
  radiation?: string[];
  aggravatingPositions?: string[];
  neurologicalSigns?: string[];
}

// Type for creating new entries (fields handled by DB omitted)
export type NewPainEntry = Omit<PainEntry, 'id' | 'timestamp'>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines if an entry uses the new disc-focused format
 */
export function isDiscEntry(entry: PainEntry): boolean {
  return entry.spineRegion !== undefined && entry.spineRegion !== null;
}

/**
 * Gets the primary disc from a disc entry
 */
export function getPrimaryDisc(entry: PainEntry): DiscEntry | undefined {
  return entry.discs?.find((d) => d.role === 'primary');
}

/**
 * Gets secondary discs from a disc entry
 */
export function getSecondaryDiscs(entry: PainEntry): DiscEntry[] {
  return entry.discs?.filter((d) => d.role === 'secondary') ?? [];
}

/**
 * Gets disc levels for a given spine region
 */
export function getDiscLevelsForRegion(region: SpineRegion): readonly string[] {
  return region === 'cervical' ? CERVICAL_DISCS : LUMBAR_DISCS;
}

/**
 * Gets radiation options for a given spine region
 */
export function getRadiationOptionsForRegion(region: SpineRegion): readonly string[] {
  return region === 'cervical' ? CERVICAL_RADIATION : LUMBAR_RADIATION;
}

/**
 * Gets aggravator options for a given spine region (common + region-specific)
 */
export function getAggravatorsForRegion(region: SpineRegion): readonly string[] {
  const regionSpecific = region === 'cervical' ? CERVICAL_AGGRAVATORS : LUMBAR_AGGRAVATORS;
  return [...COMMON_AGGRAVATORS, ...regionSpecific];
}

/**
 * Gets neurological sign options for a given spine region
 */
export function getNeuroSignsForRegion(region: SpineRegion): NeurologicalSign[] {
  return region === 'cervical' ? CERVICAL_NEURO_SIGNS : LUMBAR_NEURO_SIGNS;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a disc-focused entry
 */
export function validateDiscEntry(entry: Partial<PainEntry>): ValidationResult {
  if (!entry.spineRegion) {
    return { valid: false, error: 'Spine region required' };
  }

  if (!entry.discs || entry.discs.length === 0) {
    return { valid: false, error: 'At least one disc required' };
  }

  if (entry.discs.length > 3) {
    return { valid: false, error: 'Maximum 3 discs allowed' };
  }

  const primaryCount = entry.discs.filter((d) => d.role === 'primary').length;
  if (primaryCount !== 1) {
    return { valid: false, error: 'Exactly one primary disc required' };
  }

  // Validate disc levels match spine region
  const validLevels = getDiscLevelsForRegion(entry.spineRegion);
  const invalidDisc = entry.discs.find(
    (d) => !validLevels.includes(d.level)
  );
  if (invalidDisc) {
    return {
      valid: false,
      error: `Disc level ${invalidDisc.level} does not match spine region`,
    };
  }

  if (entry.painLevel === undefined || entry.painLevel <= 0) {
    return { valid: false, error: 'Pain level must be greater than 0' };
  }

  return { valid: true };
}

// ============================================================================
// CONVERTERS
// ============================================================================

/**
 * Convert database row to client format
 */
export function dbToClient(db: DbPainEntry): PainEntry {
  return {
    id: db.id,
    timestamp: db.timestamp,
    painLevel: db.pain_level,
    locations: db.locations ?? [],
    types: db.types ?? [],
    radiating: db.radiating ?? false,
    notes: db.notes ?? '',
    // New disc-focused fields
    spineRegion: db.spine_region ?? null,
    discs: db.discs ?? undefined,
    sensations: db.sensations ?? undefined,
    radiation: db.radiation ?? undefined,
    aggravatingPositions: db.aggravating_positions ?? undefined,
    neurologicalSigns: db.neurological_signs ?? undefined,
  };
}

/**
 * Convert client format to database insert format
 */
export function clientToDb(
  client: NewPainEntry
): Omit<DbPainEntry, 'id' | 'user_id' | 'timestamp' | 'created_at' | 'updated_at'> {
  // For disc entries, also populate legacy fields for backward compat
  const isDisc = client.spineRegion !== undefined && client.spineRegion !== null;

  // Map sensations back to legacy types if needed
  let legacyTypes = client.types ?? [];
  if (isDisc && client.sensations && client.sensations.length > 0) {
    // Map new sensations to old types where possible
    const sensationToType: Record<string, string> = {
      sharp: 'Sharp',
      burning: 'Burning',
      tingling: 'Tingling',
      deep_aching: 'Aching',
    };
    legacyTypes = client.sensations
      .map((s) => sensationToType[s])
      .filter((t): t is string => t !== undefined);
  }

  // Map radiation presence to legacy radiating boolean
  const legacyRadiating = isDisc
    ? (client.radiation && client.radiation.length > 0) ?? false
    : client.radiating;

  return {
    pain_level: client.painLevel,
    locations: client.locations ?? [],
    types: legacyTypes,
    radiating: legacyRadiating,
    notes: client.notes ?? '',
    // New disc-focused fields
    spine_region: client.spineRegion ?? null,
    discs: client.discs ?? null,
    sensations: client.sensations ?? null,
    radiation: client.radiation ?? null,
    aggravating_positions: client.aggravatingPositions ?? null,
    neurological_signs: client.neurologicalSigns ?? null,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Gets a display label for a sensation
 */
export function getSensationLabel(sensation: string): string {
  return SENSATION_LABELS[sensation as Sensation] ?? sensation;
}

/**
 * Gets a display label for a radiation path
 */
export function getRadiationLabel(radiation: string): string {
  return RADIATION_LABELS[radiation as CervicalRadiation | LumbarRadiation] ?? radiation;
}

/**
 * Gets a display label for an aggravator
 */
export function getAggravatorLabel(aggravator: string): string {
  return (
    AGGRAVATOR_LABELS[
      aggravator as CommonAggravator | CervicalAggravator | LumbarAggravator
    ] ?? aggravator
  );
}

/**
 * Gets a display label for a neurological sign
 */
export function getNeuroSignLabel(sign: string): string {
  return NEUROLOGICAL_SIGN_LABELS[sign as NeurologicalSign] ?? sign;
}
