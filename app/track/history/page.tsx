'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TrackShell } from '@/components/track/TrackShell';
import { HistoryEntryCard } from '@/components/pain/HistoryEntryCard';
import { usePainEntries } from '@/hooks/use-pain-entries';

export default function TrackHistoryPage() {
  const router = useRouter();
  const { entries, deleteEntry, isLoaded } = usePainEntries();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <TrackShell>
      <div className="page-shell page-stack">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full text-[#919191] hover:bg-[#eef1ee] hover:text-[#1c211d]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">Past days</h1>
            {isLoaded && entries.length > 0 && (
              <p className="page-subtitle">{entries.length} entries</p>
            )}
          </div>
        </header>

        {!isLoaded ? (
          <div className="flex flex-col gap-[10px]" aria-label="Loading entries" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[62px] animate-pulse rounded-[18px] bg-[#f0f2f0]" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="space-y-4 py-16 text-center">
            <p className="text-[15px] font-medium text-[#1c211d]">No entries yet.</p>
            <Link
              href="/track"
              className="inline-block text-[13px] text-[#8a908b] underline underline-offset-4 transition-colors hover:text-[#6f756f]"
            >
              Log your first check-in →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {entries.map((entry) => (
              <HistoryEntryCard
                key={entry.id}
                entry={entry}
                isExpanded={expandedId === entry.id}
                onToggle={() =>
                  setExpandedId(expandedId === entry.id ? null : entry.id)
                }
                onDelete={async () => {
                  setExpandedId((current) =>
                    current === entry.id ? null : current
                  );
                  try {
                    await deleteEntry(entry.id);
                  } catch {
                    // Error toast handled in the hook
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </TrackShell>
  );
}
