// Mock data for E2E testing
// This file provides mock pain entries when E2E_TEST_MODE is enabled

import type { PainEntry } from '@/types/pain-entry';

// Check if we're in E2E test mode (works on both server and client)
export function isE2ETestMode(): boolean {
  // NEXT_PUBLIC_ prefix makes this available on both server and client
  if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') {
    return true;
  }
  return false;
}

// Generate a realistic timestamp for the past N days at a random time
function generateTimestamp(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 12) + 8); // 8 AM to 8 PM
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
}

// Mock entries for E2E testing - includes both legacy and new disc-focused entries
export const MOCK_PAIN_ENTRIES: PainEntry[] = [
  // New disc-focused entries
  {
    id: 'e2e-disc-1',
    timestamp: generateTimestamp(0), // Today
    painLevel: 6,
    locations: ['Lower Back'], // Legacy field for backward compat
    types: ['Burning', 'Tingling'], // Legacy field
    radiating: true,
    notes: 'Pain worse after sitting for 2 hours. Stretching helped temporarily.',
    spineRegion: 'lumbar',
    discs: [
      { level: 'L4-L5', role: 'primary' },
      { level: 'L5-S1', role: 'secondary' },
    ],
    sensations: ['burning', 'tingling', 'numbness'],
    radiation: ['buttock', 'thigh', 'calf'],
    aggravatingPositions: ['sitting', 'bending_forward'],
    neurologicalSigns: [],
  },
  {
    id: 'e2e-disc-2',
    timestamp: generateTimestamp(1), // Yesterday
    painLevel: 4,
    locations: ['Lower Back'],
    types: ['Deep aching'],
    radiating: true,
    notes: 'Better than yesterday. Walking helped.',
    spineRegion: 'lumbar',
    discs: [
      { level: 'L4-L5', role: 'primary' },
    ],
    sensations: ['deep_aching', 'pressure'],
    radiation: ['buttock'],
    aggravatingPositions: ['sitting', 'long_travel'],
    neurologicalSigns: [],
  },
  {
    id: 'e2e-disc-3',
    timestamp: generateTimestamp(2),
    painLevel: 7,
    locations: ['Neck'],
    types: ['Sharp', 'Electric shock'],
    radiating: true,
    notes: 'Woke up with severe pain. Possibly slept wrong.',
    spineRegion: 'cervical',
    discs: [
      { level: 'C5-C6', role: 'primary' },
      { level: 'C6-C7', role: 'secondary' },
    ],
    sensations: ['sharp', 'electric_shock', 'numbness'],
    radiation: ['shoulder', 'upper_arm', 'forearm'],
    aggravatingPositions: ['looking_down', 'screen_usage'],
    neurologicalSigns: ['arm_weakness'],
  },
  {
    id: 'e2e-disc-4',
    timestamp: generateTimestamp(3),
    painLevel: 5,
    locations: ['Lower Back'],
    types: ['Deep aching'],
    radiating: false,
    notes: 'Mild day. Stayed active.',
    spineRegion: 'lumbar',
    discs: [
      { level: 'L5-S1', role: 'primary' },
    ],
    sensations: ['deep_aching'],
    radiation: [],
    aggravatingPositions: ['end_of_day'],
    neurologicalSigns: [],
  },
  // Legacy entries (before multi-disc support)
  {
    id: 'e2e-legacy-1',
    timestamp: generateTimestamp(5),
    painLevel: 6,
    locations: ['Lower Back', 'Hip'],
    types: ['Aching', 'Burning'],
    radiating: true,
    notes: 'Old format entry before disc tracking was added.',
  },
  {
    id: 'e2e-legacy-2',
    timestamp: generateTimestamp(7),
    painLevel: 4,
    locations: ['Upper Back'],
    types: ['Sharp'],
    radiating: false,
    notes: 'Another legacy entry.',
  },
];

// Get mock entries sorted by timestamp (most recent first)
export function getMockEntries(): PainEntry[] {
  return [...MOCK_PAIN_ENTRIES].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
