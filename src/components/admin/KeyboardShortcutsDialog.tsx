import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';

interface Shortcut {
  keys: string[];
  description: string;
  section: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'K'], description: 'Focus search', section: 'Navigation' },
  { keys: ['Ctrl', 'N'], description: 'New product', section: 'Actions' },
  { keys: ['Ctrl', 'F'], description: 'Toggle filters', section: 'Navigation' },
  { keys: ['Ctrl', 'R'], description: 'Refresh products', section: 'Actions' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Clear filters', section: 'Actions' },
  { keys: ['Ctrl', 'Shift', 'S'], description: 'Toggle selection mode', section: 'Actions' },
  { keys: ['Escape'], description: 'Close dialogs', section: 'Navigation' },
  { keys: ['?'], description: 'Show keyboard shortcuts', section: 'Help' },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const sections = Array.from(new Set(shortcuts.map(s => s.section)));
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {sections.map(section => (
            <div key={section}>
              <h3 className="font-semibold mb-3 text-base">{section}</h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.section === section)
                  .map((shortcut, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50">
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, j) => (
                          <Kbd key={j}>{key}</Kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
          Press <Kbd>?</Kbd> anytime to show this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
