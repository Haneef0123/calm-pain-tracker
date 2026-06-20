'use client';

import { useState } from 'react';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { TrackShell } from './TrackShell';
import { TrackHeader } from './TrackHeader';
import { PainSlider } from '@/components/pain/PainSlider';
import { SpineRegionSelector } from '@/components/pain/SpineRegionSelector';
import { DiscLevelSelector } from '@/components/pain/DiscLevelSelector';
import { SensationSelector } from '@/components/pain/SensationSelector';
import { RadiationSelector } from '@/components/pain/RadiationSelector';
import { AggravatorSelector } from '@/components/pain/AggravatorSelector';
import { NeurologicalSignsSelector } from '@/components/pain/NeurologicalSignsSelector';
import { LastEntryCard } from '@/components/home/LastEntryCard';
import { RotatingTips } from '@/components/home/RotatingTips';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { useActionOverlay } from '@/components/ui/action-overlay';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { usePainEntryForm } from '@/hooks/use-pain-entry-form';
import { toast } from '@/hooks/use-toast';
import { getPainLevelVisuals } from '@/lib/utils';

const FORM_CONTENT = {
  painLevel: { label: 'How much pain?' },
  details: {
    trigger: 'Add details',
    title: 'Details',
    description: 'Disc, symptoms, and notes',
    done: 'Done',
  },
  notes: {
    label: 'Anything worth noting?',
    placeholder: 'Sleep, posture, stress, travel, activity — whatever stands out.',
  },
  submit: {
    label: 'Log today',
    successMessage: 'Noted.',
    successSubtitle: 'Logged for today',
  },
} as const;

function getDetailCount(form: {
  sensations: string[];
  radiation: string[];
  aggravators: string[];
  neuroSigns: string[];
  notes: string;
}): number {
  let count = 0;
  if (form.sensations.length > 0) count++;
  if (form.radiation.length > 0) count++;
  if (form.aggravators.length > 0) count++;
  if (form.neuroSigns.length > 0) count++;
  if (form.notes.trim().length > 0) count++;
  return count;
}

export default function TrackEntry() {
  const { addEntry, isAddingEntry } = usePainEntries();
  const { showOverlay, clearOverlay, isVisible: isActionOverlayVisible } = useActionOverlay();
  const form = usePainEntryForm();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const today = new Date();
  const detailCount = getDetailCount(form);
  const painVisuals = getPainLevelVisuals(form.painLevel);

  const handleSave = async () => {
    const entryData = form.getEntryData();
    if (!entryData || !form.isValid) return;

    try {
      const savedAccent = getPainLevelVisuals(entryData.painLevel).accent;
      await addEntry(entryData);
      form.reset();
      setDrawerOpen(false);
      showOverlay({
        accent: savedAccent,
        title: FORM_CONTENT.submit.successMessage,
        subtitle: FORM_CONTENT.submit.successSubtitle,
      });
    } catch {
      clearOverlay();
      toast({
        title: 'Failed to save entry',
        variant: 'destructive',
      });
    }
  };

  return (
    <TrackShell>
      <div className="page-shell page-stack">
        <TrackHeader today={today} />

        {/* Pain level card */}
        <div className="rounded-[18px] border border-black/5 bg-[var(--pain-card)] p-5 shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
          <div className="space-y-[14px]">
            <p className="text-[13px] text-muted-foreground">
              {FORM_CONTENT.painLevel.label}
            </p>
            <div className="flex items-center justify-between gap-4">
              <p
                className="text-[58px] font-semibold leading-none tracking-[-0.02em] tabular-nums"
                style={{ color: painVisuals.accent }}
              >
                {form.painLevel}
              </p>
              <span
                className="inline-flex rounded-full px-[14px] py-[6px] text-[13px] font-semibold leading-none"
                style={{
                  backgroundColor: painVisuals.surface,
                  color: painVisuals.accent,
                }}
              >
                {painVisuals.severity}
              </span>
            </div>
            <PainSlider value={form.painLevel} onChange={form.setPainLevel} />
          </div>
        </div>

        {/* Area selector */}
        <SpineRegionSelector
          value={form.spineRegion}
          onChange={form.setSpineRegion}
        />

        {/* Action buttons */}
        <div className="flex gap-[10px]">
          <Button
            onClick={handleSave}
            disabled={!form.isValid || isAddingEntry || isActionOverlayVisible}
            className="h-[52px] flex-[1.3] rounded-full bg-[#181b19] text-[15px] font-semibold text-white hover:bg-[#2c302d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAddingEntry ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              FORM_CONTENT.submit.label
            )}
          </Button>

          <Button
            variant="outline"
            disabled={!form.spineRegion}
            onClick={() => setDrawerOpen(true)}
            className="h-[52px] flex-1 rounded-full border border-[#dde2dd] bg-white text-[14px] font-semibold text-[#3b3b3b] hover:bg-[#f7f9f7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {FORM_CONTENT.details.trigger}
            {detailCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#181b19] px-1 text-[11px] font-semibold text-white">
                {detailCount}
              </span>
            )}
          </Button>
        </div>

        {/* Validation error hint */}
        {!form.isValid && form.spineRegion && form.validationError && (
          <p className="text-center text-xs text-destructive">
            {form.validationError}
          </p>
        )}

        {/* Context cards */}
        <div className="animate-fade-in space-y-[14px]">
          <LastEntryCard />
          <RotatingTips />
        </div>
      </div>

      {/* Details drawer (bottom sheet) */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[88vh] overflow-hidden bg-white shadow-[0_-8px_40px_rgba(12,12,12,0.18)]">
          <DrawerHeader className="gap-1 border-b border-[#eef1ee] px-6 pb-6 pt-5 text-left">
            <DrawerTitle className="text-[17px] font-semibold leading-none tracking-[-0.01em] text-[#1c211d]">
              {FORM_CONTENT.details.title}
            </DrawerTitle>
            <DrawerDescription className="text-[12.5px] text-[#919191]">
              {FORM_CONTENT.details.description}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-10 overflow-y-auto px-6 py-[22px]">
            {form.spineRegion && (
              <DiscLevelSelector
                spineRegion={form.spineRegion}
                value={form.discs}
                onChange={form.setDiscs}
              />
            )}
            <SensationSelector value={form.sensations} onChange={form.setSensations} />
            {form.spineRegion && (
              <RadiationSelector
                spineRegion={form.spineRegion}
                value={form.radiation}
                onChange={form.setRadiation}
              />
            )}
            {form.spineRegion && (
              <AggravatorSelector
                spineRegion={form.spineRegion}
                value={form.aggravators}
                onChange={form.setAggravators}
              />
            )}
            {form.spineRegion && (
              <NeurologicalSignsSelector
                spineRegion={form.spineRegion}
                value={form.neuroSigns}
                onChange={form.setNeuroSigns}
              />
            )}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-label text-[#1c211d]">
                {FORM_CONTENT.notes.label}
              </Label>
              <Textarea
                id="notes"
                placeholder={FORM_CONTENT.notes.placeholder}
                value={form.notes}
                onChange={(e) => form.setNotes(e.target.value)}
                className="min-h-[92px] resize-none rounded-[14px] border-[#e1e4e1] bg-[#fafbfa] px-[14px] py-3 text-[13.5px] leading-5 text-[#1c211d] placeholder:text-[#9aa09a] focus-visible:ring-1 focus-visible:ring-[#008391] focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <DrawerFooter className="border-t border-[#f0f2f0] px-6 pb-6 pt-4">
            <DrawerClose asChild>
              <Button className="h-[52px] w-full rounded-full bg-[#181b19] text-[15px] font-semibold text-white hover:bg-[#2c302d]">
                {FORM_CONTENT.details.done}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </TrackShell>
  );
}
