'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { SENSATIONS, SENSATION_LABELS, SENSATION_DESCRIPTIONS, type Sensation } from '@/types/pain-entry';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

interface SensationSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function SensationSelector({ value, onChange }: SensationSelectorProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  const toggleSensation = (sensation: string) => {
    if (value.includes(sensation)) {
      onChange(value.filter((s) => s !== sensation));
    } else {
      onChange([...value, sensation]);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-label">Sensations</span>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="inline-flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground transition-colors duration-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground rounded-full"
            aria-label="More information about pain sensations"
          >
            <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {SENSATIONS.map((sensation) => {
            const isSelected = value.includes(sensation);
            return (
              <button
                key={sensation}
                type="button"
                onClick={() => toggleSensation(sensation)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-sm border transition-all duration-100',
                  isSelected
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-foreground border-border hover:border-foreground'
                )}
              >
                {SENSATION_LABELS[sensation]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Drawer */}
      <Drawer open={infoOpen} onOpenChange={setInfoOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Pain Sensations</DrawerTitle>
            <DrawerDescription>
              Different sensations can indicate different types of nerve or tissue involvement.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto space-y-4">
            {SENSATIONS.map((sensation) => (
              <div key={sensation} className="border-b border-border pb-4 last:border-0">
                <h3 className="text-sm font-medium mb-1">{SENSATION_LABELS[sensation]}</h3>
                <p className="text-sm text-muted-foreground">
                  {SENSATION_DESCRIPTIONS[sensation]}
                </p>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
