import { useState } from 'react';
import { format } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { PainSlider } from '@/components/pain/PainSlider';
import { ChipSelect } from '@/components/pain/ChipSelect';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { PAIN_LOCATIONS, PAIN_TYPES } from '@/types/pain-entry';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function DailyEntry() {
  const { addEntry } = usePainEntries();
  const [painLevel, setPainLevel] = useState(0);
  const [locations, setLocations] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [radiating, setRadiating] = useState(false);
  const [notes, setNotes] = useState('');

  const today = new Date();

  const handleSave = () => {
    addEntry({
      painLevel,
      locations,
      types,
      radiating,
      notes,
    });

    // Reset form
    setPainLevel(0);
    setLocations([]);
    setTypes([]);
    setRadiating(false);
    setNotes('');

    toast({
      title: 'Entry saved',
      description: 'Your pain entry has been recorded.',
    });
  };

  const getPainClass = (level: number) => {
    if (level <= 3) return 'text-foreground';
    if (level <= 6) return 'text-foreground';
    return 'text-destructive';
  };

  return (
    <PageLayout>
      <div className="pt-8 space-y-10 animate-fade-in">
        {/* Date header */}
        <header className="space-y-1">
          <p className="text-label uppercase tracking-wider">
            {format(today, 'EEEE')}
          </p>
          <h1 className="text-heading">
            {format(today, 'MMMM d, yyyy')}
          </h1>
        </header>

        <div className="divider" />

        {/* Pain level display */}
        <div className="text-center space-y-2">
          <p className="text-label">Pain Level</p>
          <p className={cn('text-display', getPainClass(painLevel))}>
            {painLevel}
          </p>
        </div>

        {/* Pain slider */}
        <PainSlider value={painLevel} onChange={setPainLevel} />

        <div className="divider" />

        {/* Pain locations */}
        <ChipSelect
          label="Location"
          options={PAIN_LOCATIONS}
          selected={locations}
          onChange={setLocations}
        />

        <div className="divider" />

        {/* Pain types */}
        <ChipSelect
          label="Type"
          options={PAIN_TYPES}
          selected={types}
          onChange={setTypes}
          showInfoIcons
        />

        <div className="divider" />

        {/* Radiating toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="radiating" className="text-label cursor-pointer">
            Radiating pain
          </Label>
          <Switch
            id="radiating"
            checked={radiating}
            onCheckedChange={setRadiating}
          />
        </div>

        <div className="divider" />

        {/* Notes */}
        <div className="space-y-3">
          <Label htmlFor="notes" className="text-label">
            Notes (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="How are you feeling today?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-24 bg-card border-border resize-none"
          />
        </div>

        {/* Save button */}
        <Button 
          onClick={handleSave}
          className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 transition-opacity duration-100"
        >
          Save Entry
        </Button>
      </div>
    </PageLayout>
  );
}
