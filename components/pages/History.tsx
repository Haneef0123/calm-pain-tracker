'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { HistoryEntryCard } from '@/components/pain/HistoryEntryCard';
import type { PainEntry } from '@/types/pain-entry';

interface HistoryProps {
    initialEntries?: PainEntry[];
}

export default function History({ initialEntries = [] }: HistoryProps) {
    const { entries, deleteEntry } = usePainEntries(initialEntries);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (entries.length === 0) {
        return (
            <PageLayout>
                <div className="pt-8 animate-fade-in">
                    <header className="mb-8">
                        <h1 className="text-heading">Past days</h1>
                    </header>
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">Once you log a few days, patterns will start to appear here.</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="pt-8 animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-heading">Past days</h1>
                    <p className="text-label mt-1">{entries.length} entries</p>
                </header>

                <div className="space-y-1">
                    {entries.map((entry) => (
                        <HistoryEntryCard
                            key={entry.id}
                            entry={entry}
                            isExpanded={expandedId === entry.id}
                            onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                            onDelete={() => deleteEntry(entry.id)}
                        />
                    ))}
                </div>
            </div>
        </PageLayout>
    );
}
