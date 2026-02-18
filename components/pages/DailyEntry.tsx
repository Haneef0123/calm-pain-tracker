'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { SlidersHorizontal } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
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
import { usePainEntries } from '@/hooks/use-pain-entries';
import { usePainEntryForm } from '@/hooks/use-pain-entry-form';
import { toast } from '@/hooks/use-toast';
import { cn, getPainLevelClass } from '@/lib/utils';

// Content separated from JSX
const FORM_CONTENT = {
  dateHeader: {
    formatDay: 'EEEE',
    formatFull: 'MMMM d, yyyy',
  },
  painLevel: {
    label: 'How much pain?',
  },
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
  },
} as const;

/** Count how many optional detail fields the user has customized */
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

export default function DailyEntry() {
  const { entries, addEntry } = usePainEntries();
  const form = usePainEntryForm();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const today = new Date();
  const entryCount = entries?.length ?? 0;
  const detailCount = getDetailCount(form);

  const handleSave = async () => {
    const entryData = form.getEntryData();
    if (!entryData || !form.isValid) return;

    try {
      await addEntry(entryData);
      form.reset();
      setDrawerOpen(false);

      toast({
        title: FORM_CONTENT.submit.successMessage,
      });
    } catch {
      toast({
        title: 'Failed to save entry',
        variant: 'destructive',
      });
    }
  };

  return (
    <PageLayout>
      <div className="pt-8 space-y-8 animate-fade-in">
        {/* Date header */}
        <header className="space-y-1">
          <p className="text-label uppercase tracking-wider">
            {format(today, FORM_CONTENT.dateHeader.formatDay)}
          </p>
          <h1 className="text-heading">
            {format(today, FORM_CONTENT.dateHeader.formatFull)}
          </h1>
        </header>


        <div className="divider" />

        {/* Pain Level — always visible, default 5 */}
        <div className="text-center space-y-2">
          <p className="text-label">
            {FORM_CONTENT.painLevel.label}
          </p>
          <p className={cn('text-display', getPainLevelClass(form.painLevel))}>
            {form.painLevel}
          </p>
        </div>

        <PainSlider value={form.painLevel} onChange={form.setPainLevel} />

        <div className="divider" />

        {/* Area selector — always visible, plain language */}
        <SpineRegionSelector
          value={form.spineRegion}
          onChange={form.setSpineRegion}
        />

        {/* Two buttons side by side: Log today (primary) + Add details (secondary) */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={!form.isValid}
            className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 transition-opacity duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {FORM_CONTENT.submit.label}
          </Button>

          <Button
            variant="outline"
            disabled={!form.spineRegion}
            onClick={() => setDrawerOpen(true)}
            className="flex-1 h-12 border-border hover:bg-card transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {FORM_CONTENT.details.trigger}
            {detailCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background text-xs font-medium">
                {detailCount}
              </span>
            )}
          </Button>
        </div>

        {/* Validation error hint */}
        {!form.isValid && form.spineRegion && form.validationError && (
          <p className="text-xs text-destructive text-center">
            {form.validationError}
          </p>
        )}

        <div className="divider" />

        {/* Context cards — always visible below */}
        <div className="space-y-6 animate-fade-in">
          <LastEntryCard />
          <RotatingTips />
        </div>
      </div>

      {/* Details Drawer (bottom sheet) */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{FORM_CONTENT.details.title}</DrawerTitle>
            <DrawerDescription>{FORM_CONTENT.details.description}</DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-4 space-y-8">
            {/* Disc Level (smart default pre-selected) */}
            {form.spineRegion && (
              <DiscLevelSelector
                spineRegion={form.spineRegion}
                value={form.discs}
                onChange={form.setDiscs}
              />
            )}

            <div className="divider" />

            {/* Sensations */}
            <SensationSelector value={form.sensations} onChange={form.setSensations} />

            <div className="divider" />

            {/* Radiation Path */}
            {form.spineRegion && (
              <RadiationSelector
                spineRegion={form.spineRegion}
                value={form.radiation}
                onChange={form.setRadiation}
              />
            )}

            <div className="divider" />

            {/* Aggravating Positions */}
            {form.spineRegion && (
              <AggravatorSelector
                spineRegion={form.spineRegion}
                value={form.aggravators}
                onChange={form.setAggravators}
              />
            )}

            <div className="divider" />

            {/* Neurological Signs */}
            {form.spineRegion && (
              <NeurologicalSignsSelector
                spineRegion={form.spineRegion}
                value={form.neuroSigns}
                onChange={form.setNeuroSigns}
              />
            )}

            <div className="divider" />

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-label">
                {FORM_CONTENT.notes.label}
              </Label>
              <Textarea
                id="notes"
                placeholder={FORM_CONTENT.notes.placeholder}
                value={form.notes}
                onChange={(e) => form.setNotes(e.target.value)}
                className="min-h-24 bg-card border-border resize-none"
              />
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button className="w-full h-12 bg-foreground text-background hover:bg-foreground/90">
                {FORM_CONTENT.details.done}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PageLayout>
  );
}
