import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wand2, FileText } from 'lucide-react';
import { SortableFieldItem } from './SortableFieldItem';
import type { FormField } from '@/types/form-builder';
import { cn } from '@/lib/utils';

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  onDeleteField: (fieldId: string) => void;
  onOpenTemplateSelector?: () => void;
}

export function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onOpenTemplateSelector,
}: FormCanvasProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Form Builder Canvas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {fields.length} field{fields.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          {fields.length === 0 && onOpenTemplateSelector && (
            <Button variant="outline" size="sm" onClick={onOpenTemplateSelector}>
              <Wand2 className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center py-20 text-center',
              'border-2 border-dashed rounded-lg',
              'bg-muted/20 dark:bg-muted/10',
              'transition-all hover:border-primary/30'
            )}
          >
            <div className="mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No fields yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md leading-relaxed">
              Start building your form by clicking on a field type from the{' '}
              <span className="font-semibold text-foreground">Field Library</span>,
              <br />
              or use a pre-built template to get started quickly.
            </p>
            {onOpenTemplateSelector && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenTemplateSelector}
                className="mt-2"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            )}
          </div>
        ) : (
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {fields.map((field) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={() => onSelectField(field.id)}
                  onDelete={() => onDeleteField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        )}

        {fields.length > 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Drag fields to reorder • Click to edit • Total: {fields.length} field
              {fields.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
