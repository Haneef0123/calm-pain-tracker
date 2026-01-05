import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

const PAIN_TYPE_INFO_LIST = [
  {
    title: 'Dull / Aching',
    description: 'A constant, sore, or heavy feeling. Often linked to muscle fatigue or prolonged posture.',
  },
  {
    title: 'Sharp / Stabbing',
    description: 'Sudden, intense pain that comes and goes. Common with movement or specific positions.',
  },
  {
    title: 'Burning',
    description: 'A warm or burning sensation. May indicate nerve irritation or inflammation.',
  },
  {
    title: 'Tingling / Pins & Needles',
    description: 'Light prickling or buzzing sensation. Often related to nerve compression.',
  },
  {
    title: 'Numbness',
    description: 'Reduced or absent sensation. Can occur when nerves are under pressure.',
  },
  {
    title: 'Radiating',
    description: 'Pain that travels from the back into the leg or foot. Common in disc-related nerve involvement.',
  },
];

interface PainTypeAllInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PainTypeAllInfoSheet({ open, onOpenChange }: PainTypeAllInfoSheetProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="space-y-5">
      {PAIN_TYPE_INFO_LIST.map((item) => (
        <div key={item.title} className="space-y-1">
          <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
          <p className="text-sm font-light text-secondary leading-relaxed">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-card border-border max-h-[85vh]">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-base font-medium text-foreground">
              Pain Types
            </DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-6 max-h-[60vh]">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-foreground">
            Pain Types
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {content}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
