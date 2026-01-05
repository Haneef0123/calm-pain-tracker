export interface PainEntry {
  id: string;
  timestamp: string;
  painLevel: number;
  locations: string[];
  types: string[];
  radiating: boolean;
  notes: string;
}

export const PAIN_LOCATIONS = [
  'L1', 'L2', 'L3', 'L4', 'L5', 'S1',
  'Sciatic nerve',
  'Left hip', 'Right hip',
  'Left leg', 'Right leg',
  'Buttocks'
] as const;

export const PAIN_TYPES = [
  'Dull', 'Sharp', 'Burning', 'Tingling', 'Aching'
] as const;

export type PainLocation = typeof PAIN_LOCATIONS[number];
export type PainType = typeof PAIN_TYPES[number];
