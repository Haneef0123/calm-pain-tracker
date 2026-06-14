'use client';

import { format } from 'date-fns';
import { getPainColor } from '@/lib/utils';
import type { PainEntry } from '@/types/pain-entry';
import {
  isDiscEntry,
  getPrimaryDisc,
  getSensationLabel,
} from '@/types/pain-entry';

const CONTENT = {
  labels: {
    time: 'TIME',
    feelsLike: 'FEELS LIKE',
  },
  deleteButton: 'Delete entry',
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
  const timeLabel = format(date, 'h:mm a');
  const regionLabel =
    entry.spineRegion === 'cervical'
      ? 'Cervical'
      : entry.spineRegion === 'lumbar'
        ? 'Lumbar'
        : entry.locations[0] ?? 'General';
  const feelsLikeLabel = entry.sensations?.length
    ? entry.sensations.map(getSensationLabel).join(', ')
    : entry.types.length
      ? entry.types.join(', ')
      : '—';
  const notes = entry.notes.trim();

  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
      <button
        onClick={onToggle}
        type="button"
        className="flex w-full items-center gap-[14px] bg-transparent px-[18px] py-[15px] text-left transition-colors hover:bg-[#fafbfa]"
      >
        <span
          className="w-[34px] flex-none font-mono text-[26px] font-semibold leading-none tabular-nums"
          style={{ color: getPainColor(entry.painLevel) }}
        >
          {entry.painLevel}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="text-sm font-semibold text-[#1c211d]">
            {format(date, 'MMM d, yyyy')}
          </span>
          <span className="flex min-w-0 items-center gap-[6px]">
            {primaryDisc && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f1] px-[9px] py-[2px] text-[11px] font-semibold text-[#3b3b3b]">
                <svg
                  aria-hidden="true"
                  width="9"
                  height="9"
                  viewBox="0 0 20 20"
                  fill="#dfb437"
                >
                  <path d="M10 1.8l2.5 5.1 5.6 0.8-4 4 0.9 5.6L10 14.6l-5 2.7 0.9-5.6-4-4 5.6-0.8z" />
                </svg>
                {primaryDisc.level}
              </span>
            )}
            <span className="min-w-0 truncate text-[12px] text-[#919191]">
              {`${regionLabel} · ${timeLabel}`}
            </span>
          </span>
        </span>

        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="#ababab"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {isExpanded && (
        <div className="animate-fade-up-fast flex flex-col gap-[10px] border-t border-[#f0f2f0] px-[18px] pb-[16px] pt-[14px]">
          <div className="flex gap-[18px]">
            <span className="flex flex-col gap-[2px]">
              <span className="text-[10px] font-semibold tracking-[0.1em] text-[#ababab]">
                {CONTENT.labels.time}
              </span>
              <span className="text-[13px] text-[#3b3b3b]">{timeLabel}</span>
            </span>
            <span className="flex flex-col gap-[2px]">
              <span className="text-[10px] font-semibold tracking-[0.1em] text-[#ababab]">
                {CONTENT.labels.feelsLike}
              </span>
              <span className="text-[13px] text-[#3b3b3b]">{feelsLikeLabel}</span>
            </span>
          </div>

          {notes && (
            <div>
              <p className="text-[13px] italic leading-[19px] text-[#777777]">
                &ldquo;{notes}&rdquo;
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onDelete}
            className="-ml-[10px] inline-flex items-center gap-[6px] self-start rounded-full bg-transparent px-[10px] py-[6px] text-[13px] font-semibold text-[#d53627] transition-colors hover:bg-[#fcebe9]"
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2.5 0-.7 9A1.8 1.8 0 0 1 12 16.7H8A1.8 1.8 0 0 1 6.2 15l-.7-9" />
            </svg>
            {CONTENT.deleteButton}
          </button>
        </div>
      )}
    </div>
  );
}
