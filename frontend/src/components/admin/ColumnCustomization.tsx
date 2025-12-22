import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Columns3, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { announceToScreenReader } from '@/lib/utils/accessibility';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

interface ColumnCustomizationProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  storageKey?: string;
  className?: string;
}

export const ColumnCustomization: React.FC<ColumnCustomizationProps> = ({
  columns,
  onColumnsChange,
  storageKey = 'product-catalog-columns',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const storedColumns = JSON.parse(stored) as ColumnConfig[];
        const mergedColumns = columns.map(col => {
          const storedCol = storedColumns.find(sc => sc.id === col.id);
          return storedCol ? { ...col, visible: storedCol.visible } : col;
        });
        setLocalColumns(mergedColumns);
        onColumnsChange(mergedColumns);
      } catch (error) {
        console.error('Failed to load column preferences:', error);
      }
    }
  }, []);

  const handleToggleColumn = (columnId: string) => {
    const updatedColumns = localColumns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    
    const visibleCount = updatedColumns.filter(col => col.visible).length;
    if (visibleCount === 0) {
      toast.error('At least one column must be visible');
      return;
    }

    setLocalColumns(updatedColumns);
    localStorage.setItem(storageKey, JSON.stringify(updatedColumns));
    onColumnsChange(updatedColumns);
    
    const column = updatedColumns.find(col => col.id === columnId);
    if (column) {
      const action = column.visible ? 'shown' : 'hidden';
      announceToScreenReader(`Column ${column.label} ${action}`);
    }
  };

  const handleReset = () => {
    const resetColumns = columns.map(col => ({ ...col, visible: true }));
    setLocalColumns(resetColumns);
    localStorage.removeItem(storageKey);
    onColumnsChange(resetColumns);
    toast.success('Column preferences reset');
    announceToScreenReader('Column preferences reset to defaults');
  };

  const visibleCount = localColumns.filter(col => col.visible).length;
  const totalCount = localColumns.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          <Columns3 className="h-4 w-4 mr-2" />
          Columns ({visibleCount}/{totalCount})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Customize Columns</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          
          <Separator className="mb-4" />

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {localColumns.map((column) => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`column-${column.id}`}
                  checked={column.visible}
                  onCheckedChange={() => handleToggleColumn(column.id)}
                  disabled={column.required}
                />
                <Label
                  htmlFor={`column-${column.id}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {column.label}
                  {column.required && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Required)
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="text-xs text-muted-foreground">
            {visibleCount} of {totalCount} columns visible
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnCustomization;
