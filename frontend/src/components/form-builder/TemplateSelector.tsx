import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2, Search, Sparkles, FileText, Check } from 'lucide-react';
import { useFormConfiguration } from '@/hooks/useFormConfiguration';
import type { FormSchema, FormTemplate } from '@/types/form-builder';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TemplateSelectorProps {
  onApplyTemplate: (schema: FormSchema) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TemplateSelector({ onApplyTemplate, open: controlledOpen, onOpenChange }: TemplateSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const { templates, isLoading, fetchTemplates } = useFormConfiguration();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (open && templates.length === 0) {
      fetchTemplates({ per_page: 50, include_schema: true });
    }
  }, [open, templates.length, fetchTemplates]);

  const handleApply = () => {
    if (selectedTemplate && selectedTemplate.formSchema) {
      onApplyTemplate(selectedTemplate.formSchema);
      toast.success(`Template "${selectedTemplate.name}" applied successfully`);
      setOpen(false);
      setSelectedTemplate(null);
    } else if (selectedTemplate && !selectedTemplate.formSchema) {
      toast.error('Template tidak memiliki konfigurasi form yang valid');
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query) ||
      (Array.isArray(template.tags) ? template.tags : []).some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const systemTemplates = filteredTemplates.filter((t) => t.isSystem);
  const customTemplates = filteredTemplates.filter((t) => !t.isSystem);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wand2 className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Form Templates
          </DialogTitle>
          <DialogDescription>
            Choose a pre-built template to quickly set up your form configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="system" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="system">
                System Templates ({systemTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="custom">
                Custom Templates ({customTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="system">
              <TemplateList
                templates={systemTemplates}
                isLoading={isLoading}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </TabsContent>

            <TabsContent value="custom">
              <TemplateList
                templates={customTemplates}
                isLoading={isLoading}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedTemplate ? (
                <>
                  Selected: <span className="font-semibold">{selectedTemplate.name}</span>
                </>
              ) : (
                'Select a template to continue'
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={!selectedTemplate}>
                <Check className="h-4 w-4 mr-2" />
                Apply Template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateListProps {
  templates: FormTemplate[];
  isLoading: boolean;
  selectedTemplate: FormTemplate | null;
  onSelectTemplate: (template: FormTemplate) => void;
}

function TemplateList({
  templates,
  isLoading,
  selectedTemplate,
  onSelectTemplate,
}: TemplateListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No templates found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => (
          <button
            key={template.uuid}
            onClick={() => onSelectTemplate(template)}
            className={cn(
              'text-left p-4 rounded-lg border-2 transition-all hover:shadow-md',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              selectedTemplate?.uuid === template.uuid
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm leading-tight">{template.name}</h4>
                {selectedTemplate?.uuid === template.uuid && (
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>

              {template.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
                {template.isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
                {template.formSchema?.fields && (
                  <span className="text-xs text-muted-foreground">
                    {template.formSchema.fields.length} field
                    {template.formSchema.fields.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{template.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
