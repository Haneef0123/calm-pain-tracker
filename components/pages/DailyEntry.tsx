'use client';

import { format } from 'date-fns';
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
    label: 'Primary disc pain level',
    required: true,
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

export default function DailyEntry() {
  const { addEntry } = usePainEntries();
  const form = usePainEntryForm();

  const today = new Date();

  const handleSave = async () => {
    const entryData = form.getEntryData();
    if (!entryData || !form.isValid) return;

    try {
      await addEntry(entryData);
      form.reset();

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

        {/* Step 1: Spine Region */}
        <SpineRegionSelector
          value={form.spineRegion}
          onChange={form.setSpineRegion}
          required
        />

        {/* Initial State: Show tips and last entry when no region selected */}
        {!form.spineRegion && (
          <div className="space-y-6 animate-fade-in">
            <LastEntryCard />
            <RotatingTips />
          </div>
        )}

        {/* Step 2: Disc Level (only show after region selected) */}
        {form.spineRegion && (
          <>
            <div className="divider" />
            <DiscLevelSelector
              spineRegion={form.spineRegion}
              value={form.discs}
              onChange={form.setDiscs}
              required
            />
          </>
        )}

        {/* Step 3: Pain Level (only show after disc selected) */}
        {form.discs.length > 0 && (
          <>
            <div className="divider" />

            <div className="text-center space-y-2">
              <p className="text-label">
                {FORM_CONTENT.painLevel.label}
                {form.primaryDisc && (
                  <span className="text-muted-foreground ml-1">
                    ({form.primaryDisc.level})
                  </span>
                )}
                <span className="text-destructive ml-1">*</span>
              </p>
              <p className={cn('text-display', getPainLevelClass(form.painLevel))}>
                {form.painLevel}
              </p>
            </div>

            <PainSlider value={form.painLevel} onChange={form.setPainLevel} />
          </>
        )}

        {/* Step 4+: Additional fields (only show after pain level set) */}
        {form.painLevel > 0 && form.spineRegion && (
          <>
            <div className="divider" />

            {/* Sensations */}
            <SensationSelector value={form.sensations} onChange={form.setSensations} />

            <div className="divider" />

            {/* Radiation Path */}
            <RadiationSelector
              spineRegion={form.spineRegion}
              value={form.radiation}
              onChange={form.setRadiation}
            />

            <div className="divider" />

            {/* Aggravating Positions */}
            <AggravatorSelector
              spineRegion={form.spineRegion}
              value={form.aggravators}
              onChange={form.setAggravators}
            />

            <div className="divider" />

            {/* Neurological Signs (optional) */}
            <NeurologicalSignsSelector
              spineRegion={form.spineRegion}
              value={form.neuroSigns}
              onChange={form.setNeuroSigns}
            />

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

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={!form.isValid}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 transition-opacity duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {FORM_CONTENT.submit.label}
            </Button>

            {/* Validation error hint */}
            {!form.isValid && form.validationError && (
              <p className="text-xs text-destructive text-center">
                {form.validationError}
              </p>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
