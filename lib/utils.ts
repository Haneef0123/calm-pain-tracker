import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PAIN_COLOR_RAMP = [
  '#008858',
  '#008858',
  '#09a570',
  '#09a570',
  '#b29334',
  '#b29334',
  '#c96a2b',
  '#e75f53',
  '#d53627',
  '#9e1407',
  '#9e1407',
] as const;

export interface PainLevelVisuals {
  accent: string;
  surface: string;
  severity: string;
}

export function getPainColor(level: number): string {
  const normalizedLevel = Math.max(0, Math.min(10, Math.round(level)));
  return PAIN_COLOR_RAMP[normalizedLevel];
}

export function getPainLevelVisuals(level: number): PainLevelVisuals {
  if (level === 0) {
    return {
      accent: 'var(--pain-accent-green)',
      surface: 'var(--pain-surface-green)',
      severity: 'No pain',
    };
  }

  if (level <= 3) {
    return {
      accent: 'var(--pain-accent-green)',
      surface: 'var(--pain-surface-green)',
      severity: 'Mild',
    };
  }

  if (level <= 6) {
    return {
      accent: 'var(--pain-accent-amber)',
      surface: 'var(--pain-surface-amber)',
      severity: 'Moderate',
    };
  }

  if (level <= 8) {
    return {
      accent: 'var(--pain-accent-red)',
      surface: 'var(--pain-surface-red)',
      severity: 'Severe',
    };
  }

  return {
    accent: 'var(--pain-accent-deep-red)',
    surface: 'var(--pain-surface-deep-red)',
    severity: 'Very severe',
  };
}
