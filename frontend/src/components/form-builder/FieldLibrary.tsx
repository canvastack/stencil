import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Link,
  Calendar,
  ChevronDown,
  ListChecks,
  Circle,
  CheckSquare,
  Palette,
  Upload,
  FileText,
  Copy,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FIELD_TYPES } from '@/types/form-builder';
import type { FieldType as FieldTypeEnum } from '@/types/form-builder';

interface FieldLibraryProps {
  onAddField: (fieldType: FieldTypeEnum) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Type: <Type className="h-4 w-4" />,
  AlignLeft: <AlignLeft className="h-4 w-4" />,
  Hash: <Hash className="h-4 w-4" />,
  Mail: <Mail className="h-4 w-4" />,
  Phone: <Phone className="h-4 w-4" />,
  Link: <Link className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  ChevronDown: <ChevronDown className="h-4 w-4" />,
  ListChecks: <ListChecks className="h-4 w-4" />,
  Circle: <Circle className="h-4 w-4" />,
  CheckSquare: <CheckSquare className="h-4 w-4" />,
  Palette: <Palette className="h-4 w-4" />,
  Upload: <Upload className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Copy: <Copy className="h-4 w-4" />,
};

export function FieldLibrary({ onAddField }: FieldLibraryProps) {
  const basicFields = FIELD_TYPES.filter((f) => f.category === 'basic');
  const selectionFields = FIELD_TYPES.filter((f) => f.category === 'selection');
  const advancedFields = FIELD_TYPES.filter((f) => f.category === 'advanced');

  const FieldButton = ({ field }: { field: typeof FIELD_TYPES[number] }) => (
    <Button
      variant="outline"
      className={cn(
        'w-full justify-start gap-2 h-auto py-3',
        'hover:bg-primary/5 hover:border-primary/20 transition-all',
        'dark:hover:bg-primary/10 dark:hover:border-primary/30'
      )}
      onClick={() => onAddField(field.type)}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center bg-primary/10 text-primary">
          {iconMap[field.icon]}
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-sm">{field.label}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {field.description}
          </div>
        </div>
        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Button>
  );

  return (
    <Card className="sticky top-20 h-[calc(100vh-6rem)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Field Library</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click to add fields to your form
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-14rem)] px-6">
          <div className="space-y-4 pb-4">
            {/* Basic Fields */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Basic Fields
              </h3>
              <div className="space-y-2">
                {basicFields.map((field) => (
                  <FieldButton key={field.type} field={field} />
                ))}
              </div>
            </div>

            <Separator />

            {/* Selection Fields */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Selection Fields
              </h3>
              <div className="space-y-2">
                {selectionFields.map((field) => (
                  <FieldButton key={field.type} field={field} />
                ))}
              </div>
            </div>

            <Separator />

            {/* Advanced Fields */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Advanced Fields
              </h3>
              <div className="space-y-2">
                {advancedFields.map((field) => (
                  <FieldButton key={field.type} field={field} />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
