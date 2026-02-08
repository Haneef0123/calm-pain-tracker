'use client';

import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Trash2, Star } from 'lucide-react';
import { cn, getPainLevelClass } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { PainEntry } from '@/types/pain-entry';
import {
  isDiscEntry,
  getPrimaryDisc,
  getSecondaryDiscs,
  getSensationLabel,
  getRadiationLabel,
  getAggravatorLabel,
  getNeuroSignLabel,
} from '@/types/pain-entry';

// Content separated from JSX
const CONTENT = {
  deleteButton: 'Delete',
  deleteDialog: {
    title: 'Delete entry?',
    description: 'This will permanently remove this pain entry. This action cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Delete',
  },
  labels: {
    locations: 'Locations',
    type: 'Type',
    radiating: 'Radiating pain',
    notes: 'Notes',
    spineRegion: 'Spine Region',
    discLevels: 'Disc Levels',
    sensations: 'Sensations',
    radiation: 'Radiation',
    aggravators: 'Aggravators',
    neuroSigns: 'Neurological Signs',
  },
} as const;

interface HistoryEntryCardProps {
  entry: PainEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function HistoryEntryCard({
  entry,
  isExpanded,
  onToggle,
  onDelete,
}: HistoryEntryCardProps) {
  const date = new Date(entry.timestamp);
  const isDisc = isDiscEntry(entry);
  const primaryDisc = isDisc ? getPrimaryDisc(entry) : null;
  const secondaryDiscs = isDisc ? getSecondaryDiscs(entry) : [];

  // Collapsed preview text
  const previewText = isDisc
    ? primaryDisc?.level ?? 'No disc selected'
    : entry.locations.length > 0
    ? entry.locations.slice(0, 3).join(', ')
    : format(date, 'h:mm a');

  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-center gap-4 text-left transition-opacity duration-100 hover:opacity-75"
      >
        {/* Pain number */}
        <span
          className={cn(
            'text-4xl font-semibold tabular-nums w-12',
            getPainLevelClass(entry.painLevel)
          )}
        >
          {entry.painLevel}
        </span>

        {/* Date and preview */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{format(date, 'MMM d, yyyy')}</p>
          <p className="text-label truncate flex items-center gap-1">
            {isDisc && primaryDisc && (
              <Star className="w-3 h-3 text-yellow-500 inline-block flex-shrink-0" fill="currentColor" />
            )}
            {previewText}
            {isDisc && secondaryDiscs.length > 0 && (
              <span className="text-muted-foreground">
                +{secondaryDiscs.length}
              </span>
            )}
          </p>
        </div>

        {/* Expand icon */}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="pb-4 pl-16 pr-4 space-y-3 animate-fade-in">
          <p className="text-label">
            {format(date, 'EEEE, MMMM d, yyyy • h:mm a')}
          </p>

          {isDisc ? (
            // New disc-focused format
            <>
              {/* Spine Region */}
              <div>
                <p className="text-label mb-1">{CONTENT.labels.spineRegion}</p>
                <p className="text-sm capitalize">{entry.spineRegion}</p>
              </div>

              {/* Disc Levels */}
              <div>
                <p className="text-label mb-1">{CONTENT.labels.discLevels}</p>
                <div className="flex flex-wrap gap-2">
                  {primaryDisc && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-foreground text-background rounded-sm text-sm">
                      <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                      {primaryDisc.level}
                    </span>
                  )}
                  {secondaryDiscs.map((disc) => (
                    <span
                      key={disc.level}
                      className="px-2 py-0.5 bg-muted text-foreground rounded-sm text-sm"
                    >
                      {disc.level}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sensations */}
              {entry.sensations && entry.sensations.length > 0 && (
                <div>
                  <p className="text-label mb-1">{CONTENT.labels.sensations}</p>
                  <p className="text-sm">
                    {entry.sensations.map(getSensationLabel).join(', ')}
                  </p>
                </div>
              )}

              {/* Radiation */}
              {entry.radiation && entry.radiation.length > 0 && (
                <div>
                  <p className="text-label mb-1">{CONTENT.labels.radiation}</p>
                  <p className="text-sm">
                    {entry.radiation.map(getRadiationLabel).join(' → ')}
                  </p>
                </div>
              )}

              {/* Aggravating Positions */}
              {entry.aggravatingPositions && entry.aggravatingPositions.length > 0 && (
                <div>
                  <p className="text-label mb-1">{CONTENT.labels.aggravators}</p>
                  <p className="text-sm">
                    {entry.aggravatingPositions.map(getAggravatorLabel).join(', ')}
                  </p>
                </div>
              )}

              {/* Neurological Signs */}
              {entry.neurologicalSigns && entry.neurologicalSigns.length > 0 && (
                <div>
                  <p className="text-label mb-1 text-destructive">
                    {CONTENT.labels.neuroSigns}
                  </p>
                  <p className="text-sm text-destructive">
                    {entry.neurologicalSigns.map(getNeuroSignLabel).join(', ')}
                  </p>
                </div>
              )}
            </>
          ) : (
            // Legacy format
            <>
              {entry.locations.length > 0 && (
                <div>
                  <p className="text-label mb-1">{CONTENT.labels.locations}</p>
                  <p className="text-sm">{entry.locations.join(', ')}</p>
                </div>
              )}

              {entry.types.length > 0 && (
                <div>
                  <p className="text-label mb-1">{CONTENT.labels.type}</p>
                  <p className="text-sm">{entry.types.join(', ')}</p>
                </div>
              )}

              {entry.radiating && (
                <p className="text-sm">{CONTENT.labels.radiating}</p>
              )}
            </>
          )}

          {/* Notes (always shown for both formats) */}
          {entry.notes && (
            <div>
              <p className="text-label mb-1">{CONTENT.labels.notes}</p>
              <p className="text-sm">{entry.notes}</p>
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2 mt-2"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {CONTENT.deleteButton}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>{CONTENT.deleteDialog.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {CONTENT.deleteDialog.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{CONTENT.deleteDialog.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {CONTENT.deleteDialog.confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
