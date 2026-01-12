// Database schema types (snake_case to match PostgreSQL)
export interface DbPainEntry {
  id: string;
  user_id: string;
  timestamp: string;
  pain_level: number;
  locations: string[];
  types: string[];
  radiating: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Client-side types (camelCase for React components)
export interface PainEntry {
  id: string;
  timestamp: string;
  painLevel: number;
  locations: string[];
  types: string[];
  radiating: boolean;
  notes: string;
}

// Type for creating new entries (fields handled by DB omitted)
export type NewPainEntry = Omit<PainEntry, 'id' | 'timestamp'>;

// Convert database row to client format
export function dbToClient(db: DbPainEntry): PainEntry {
  return {
    id: db.id,
    timestamp: db.timestamp,
    painLevel: db.pain_level,
    locations: db.locations,
    types: db.types,
    radiating: db.radiating,
    notes: db.notes,
  };
}

// Convert client format to database insert format
export function clientToDb(client: NewPainEntry): Omit<DbPainEntry, 'id' | 'user_id' | 'timestamp' | 'created_at' | 'updated_at'> {
  return {
    pain_level: client.painLevel,
    locations: client.locations,
    types: client.types,
    radiating: client.radiating,
    notes: client.notes,
  };
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
