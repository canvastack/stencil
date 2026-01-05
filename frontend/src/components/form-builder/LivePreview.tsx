import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye, Smartphone, Monitor } from 'lucide-react';
import type { FormSchema, FormField } from '@/types/form-builder';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  formSchema: FormSchema;
  fullSize?: boolean;
  dialogMode?: boolean;
}

export function LivePreview({ formSchema, fullSize = false, dialogMode = false }: LivePreviewProps) {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');

  const renderField = (field: FormField) => {
    const baseClasses = 'space-y-2';

    return (
      <div key={field.id} className={baseClasses}>
        <Label htmlFor={`preview-${field.id}`} className="flex items-center gap-2">
          {field.label}
          {field.required && <Badge variant="destructive" className="text-xs px-1.5">Required</Badge>}
        </Label>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
        {renderFieldInput(field)}
      </div>
    );
  };

  const renderFieldInput = (field: FormField) => {
    const id = `preview-${field.id}`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
      case 'number':
        return (
          <Input
            id={id}
            type={field.type === 'text' ? 'text' : field.type}
            placeholder={field.placeholder}
            disabled
            className="bg-muted/50"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={id}
            placeholder={field.placeholder}
            disabled
            className="bg-muted/50 min-h-[100px]"
          />
        );

      case 'date':
        return (
          <Input
            id={id}
            type="date"
            disabled
            className="bg-muted/50"
          />
        );

      case 'select':
        return (
          <Select disabled>
            <SelectTrigger id={id} className="bg-muted/50">
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup disabled className="space-y-2">
            {(field.options || []).map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
                <Label htmlFor={`${id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox id={`${id}-${option.value}`} disabled />
                <Label htmlFor={`${id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <Input
              id={id}
              type="color"
              disabled
              className="w-20 h-10 p-1 bg-muted/50"
              defaultValue={field.defaultValue as string || '#000000'}
            />
            <Input
              type="text"
              disabled
              className="flex-1 bg-muted/50"
              value={field.defaultValue as string || '#000000'}
            />
          </div>
        );

      case 'file':
        return (
          <Input
            id={id}
            type="file"
            disabled
            className="bg-muted/50"
          />
        );

      case 'wysiwyg':
        return (
          <div className="border rounded-md p-3 bg-muted/50 min-h-[150px]">
            <p className="text-sm text-muted-foreground">Rich text editor (WYSIWYG)</p>
          </div>
        );

      case 'repeater':
        const nestedFields = field.fields || field.repeaterFields || [];
        return (
          <div className="border-2 border-dashed rounded-md p-4 bg-muted/20 space-y-4">
            {nestedFields.length > 0 ? (
              <>
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  Preview of one {field.label} item:
                </div>
                {nestedFields.map((nestedField) => (
                  <div key={nestedField.id} className="space-y-2 pl-4 border-l-2 border-muted">
                    <Label htmlFor={`preview-${nestedField.id}`} className="flex items-center gap-2">
                      {nestedField.label}
                      {nestedField.required && <Badge variant="destructive" className="text-xs px-1.5">Required</Badge>}
                    </Label>
                    {nestedField.description && (
                      <p className="text-sm text-muted-foreground">{nestedField.description}</p>
                    )}
                    {renderFieldInput(nestedField)}
                  </div>
                ))}
                <Button variant="outline" size="sm" disabled className="w-full mt-3">
                  {field.addButtonText || '+ Add Item'}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                No nested fields configured
              </p>
            )}
          </div>
        );

      default:
        return (
          <Input
            id={id}
            placeholder={field.placeholder}
            disabled
            className="bg-muted/50"
          />
        );
    }
  };

  const sortedFields = [...formSchema.fields].sort((a, b) => a.order - b.order);

  const content = (
    <div className="space-y-6">
      {formSchema.title && (
        <div>
          <h2 className="text-2xl font-bold">{formSchema.title}</h2>
          {formSchema.description && (
            <p className="text-muted-foreground mt-1">{formSchema.description}</p>
          )}
        </div>
      )}

      {sortedFields.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No fields to preview. Add fields to see the live preview.
          </p>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {sortedFields.map((field) => renderField(field))}

          <div className="pt-4">
            <Button
              type="submit"
              disabled
              className={cn(
                formSchema.submitButton?.position === 'center' && 'mx-auto block',
                formSchema.submitButton?.position === 'right' && 'ml-auto block'
              )}
            >
              {formSchema.submitButton?.text || 'Submit'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );

  if (fullSize) {
    return (
      <div className="space-y-4">
        {!dialogMode && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Form Preview
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('desktop')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>
          </div>
        )}

        {dialogMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 pb-4">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('desktop')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>
            <div className="flex justify-center">
              <div
                className={cn(
                  'bg-background border rounded-lg p-6 transition-all',
                  viewMode === 'mobile' ? 'max-w-md w-full' : 'w-full'
                )}
              >
                {content}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center bg-muted/30 p-8 rounded-lg">
            <div
              className={cn(
                'bg-background border rounded-lg shadow-lg p-8 transition-all',
                viewMode === 'mobile' ? 'max-w-md w-full' : 'max-w-3xl w-full'
              )}
            >
              {content}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="sticky top-20 h-[calc(100vh-6rem)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Live Preview
        </CardTitle>
        <p className="text-sm text-muted-foreground">Real-time form preview</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-14rem)] px-6 pb-6">
          {content}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
