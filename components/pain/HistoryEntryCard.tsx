'use client';

import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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
                    <p className="text-label truncate">
                        {entry.locations.length > 0
                            ? entry.locations.slice(0, 3).join(', ')
                            : format(date, 'h:mm a')}
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

                    {entry.locations.length > 0 && (
                        <div>
                            <p className="text-label mb-1">Locations</p>
                            <p className="text-sm">{entry.locations.join(', ')}</p>
                        </div>
                    )}

                    {entry.types.length > 0 && (
                        <div>
                            <p className="text-label mb-1">Type</p>
                            <p className="text-sm">{entry.types.join(', ')}</p>
                        </div>
                    )}

                    {entry.radiating && <p className="text-sm">Radiating pain</p>}

                    {entry.notes && (
                        <div>
                            <p className="text-label mb-1">Notes</p>
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
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove this pain entry. This action
                                    cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={onDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    );
}
