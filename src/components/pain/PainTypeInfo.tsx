import { Info } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

export const PAIN_TYPE_INFO: Record<string, { title: string; description: string }> = {
  'Dull': {
    title: 'Dull / Aching Pain',
    description: 'A constant, sore, or heavy feeling. Often linked to muscle fatigue or prolonged posture.',
  },
  'Sharp': {
    title: 'Sharp / Stabbing Pain',
    description: 'Sudden, intense pain that comes and goes. Common with movement or specific positions.',
  },
  'Burning': {
    title: 'Burning Pain',
    description: 'A warm or burning sensation. May indicate nerve irritation or inflammation.',
  },
  'Tingling': {
    title: 'Tingling / Pins & Needles',
    description: 'Light prickling or buzzing sensation. Often related to nerve compression.',
  },
  'Aching': {
    title: 'Aching Pain',
    description: 'A constant, sore, or heavy feeling. Often linked to muscle fatigue or prolonged posture.',
  },
  'Numbness': {
    title: 'Numbness',
    description: 'Reduced or absent sensation. Can occur when nerves are under pressure.',
  },
  'Radiating': {
    title: 'Radiating Pain',
    description: 'Pain that travels from the back into the leg or foot. Common in disc-related nerve involvement.',
  },
};

interface PainTypeInfoButtonProps {
  painType: string;
  onOpen: () => void;
}

export function PainTypeInfoButton({ painType, onOpen }: PainTypeInfoButtonProps) {
  const info = PAIN_TYPE_INFO[painType];
  
  if (!info) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          e.preventDefault();
          onOpen();
        }
      }}
      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-secondary hover:text-foreground transition-colors duration-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground rounded-full"
      aria-label={`More information about ${painType}`}
    >
      <Info className="w-3 h-3" strokeWidth={1.5} />
    </button>
  );
}

interface PainTypeInfoSheetProps {
  painType: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PainTypeInfoSheet({ painType, open, onOpenChange }: PainTypeInfoSheetProps) {
  const isMobile = useIsMobile();
  const info = painType ? PAIN_TYPE_INFO[painType] : null;

  if (!info) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader className="text-left pb-6">
            <DrawerTitle className="text-base font-medium text-foreground">
              {info.title}
            </DrawerTitle>
            <DrawerDescription className="text-sm font-light text-secondary mt-2 leading-relaxed">
              {info.description}
            </DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-foreground">
            {info.title}
          </DialogTitle>
          <DialogDescription className="text-sm font-light text-secondary mt-2 leading-relaxed">
            {info.description}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
