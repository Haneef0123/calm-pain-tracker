'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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

export default function History() {
    const { entries, deleteEntry } = usePainEntries();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const getPainClass = (level: number) => {
        if (level <= 3) return 'text-foreground';
        if (level <= 6) return 'text-foreground';
        return 'text-destructive';
    };

    if (entries.length === 0) {
        return (
            <PageLayout>
                <div className="pt-8 animate-fade-in">
                    <header className="mb-8">
                        <h1 className="text-heading">History</h1>
                    </header>
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No entries yet.</p>
                        <p className="text-label mt-2">Start tracking your pain on the Today tab.</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="pt-8 animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-heading">History</h1>
                    <p className="text-label mt-1">{entries.length} entries</p>
                </header>

                <div className="space-y-1">
                    {entries.map((entry) => {
                        const isExpanded = expandedId === entry.id;
                        const date = new Date(entry.timestamp);

                        return (
                            <div key={entry.id} className="border-b border-border">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                    className="w-full py-4 flex items-center gap-4 text-left transition-opacity duration-100 hover:opacity-75"
                                >
                                    {/* Pain number */}
                                    <span className={cn('text-4xl font-semibold tabular-nums w-12', getPainClass(entry.painLevel))}>
                                        {entry.painLevel}
                                    </span>

                                    {/* Date and preview */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                            {format(date, 'MMM d, yyyy')}
                                        </p>
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

                                        {entry.radiating && (
                                            <p className="text-sm">Radiating pain</p>
                                        )}

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
                                                        This will permanently remove this pain entry. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteEntry(entry.id)}
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
                    })}
                </div>
            </div>
        </PageLayout>
    );
}
