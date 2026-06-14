'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { HistoryEntryCard } from '@/components/pain/HistoryEntryCard';
import type { PainEntry } from '@/types/pain-entry';

interface HistoryProps {
    initialEntries: PainEntry[];
}

export default function History({ initialEntries }: HistoryProps) {
    const { entries, deleteEntry } = usePainEntries(initialEntries);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (entries.length === 0) {
        return (
            <PageLayout>
                <div className="animate-fade-up flex flex-col gap-[14px] pt-7 pb-6">
                    <header className="page-header">
                        <h1 className="page-title">Past days</h1>
                    </header>
                    <div className="text-center py-16 space-y-4">
                        <p className="text-[15px] font-medium text-[#1c211d]">No entries yet.</p>
                        <Link
                            href="/"
                            className="inline-block text-[13px] text-[#8a908b] underline underline-offset-4 transition-colors hover:text-[#6f756f]"
                        >
                            Log your first check-in (10 seconds) →
                        </Link>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="animate-fade-up flex flex-col gap-[14px] pt-7 pb-6">
                <header className="page-header">
                    <h1 className="page-title">Past days</h1>
                    <p className="page-subtitle">{entries.length} entries</p>
                </header>

                <div className="flex flex-col gap-[10px]">
                    {entries.map((entry) => (
                        <HistoryEntryCard
                            key={entry.id}
                            entry={entry}
                            isExpanded={expandedId === entry.id}
                            onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                            onDelete={() => {
                                setExpandedId((currentId) => (currentId === entry.id ? null : currentId));
                                deleteEntry(entry.id);
                            }}
                        />
                    ))}
                </div>
            </div>
        </PageLayout>
    );
}
