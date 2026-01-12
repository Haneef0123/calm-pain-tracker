import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the appropriate CSS class for pain level coloring.
 * Levels 0-6 use normal text, levels 7-10 use destructive/warning color.
 */
export function getPainLevelClass(level: number): string {
  return level <= 6 ? 'text-foreground' : 'text-destructive';
}
