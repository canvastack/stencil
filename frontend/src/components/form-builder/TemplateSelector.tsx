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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Form Templates
          </DialogTitle>
          <DialogDescription>
            Choose a pre-built template to quickly set up your form configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="system" className="w-full flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="system">
                System Templates ({systemTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="custom">
                Custom Templates ({customTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="system" className="flex-1 overflow-hidden mt-4">
              <TemplateList
                templates={systemTemplates}
                isLoading={isLoading}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </TabsContent>

            <TabsContent value="custom" className="flex-1 overflow-hidden mt-4">
              <TemplateList
                templates={customTemplates}
                isLoading={isLoading}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </TabsContent>
          </Tabs>

          <Separator className="flex-shrink-0" />

          <div className="flex items-center justify-between flex-shrink-0">
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
    <ScrollArea className="h-[350px] pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
        {templates.map((template) => (
          <button
            key={template.uuid}
            onClick={() => onSelectTemplate(template)}
            className={cn(
              'text-left p-5 rounded-lg border-2 transition-all hover:shadow-lg',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'relative overflow-hidden group',
              selectedTemplate?.uuid === template.uuid
                ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-accent/5'
            )}
          >
            <div className="space-y-3">
              {/* Header with title and check icon */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base leading-tight mb-1 truncate">
                    {template.name}
                  </h4>
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  )}
                </div>
                {selectedTemplate?.uuid === template.uuid && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Metadata badges */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Badge variant="outline" className="text-xs font-medium">
                  {template.category}
                </Badge>
                {template.isSystem && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    System
                  </Badge>
                )}
                {template.formSchema?.fields && (
                  <Badge variant="outline" className="text-xs font-normal bg-muted/50">
                    {template.formSchema.fields.length} field
                    {template.formSchema.fields.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* Tags - limited to 2 visible */}
              {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {template.tags.slice(0, 2).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 font-normal bg-background"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 2 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 font-normal bg-muted/30"
                    >
                      +{template.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Hover effect overlay */}
            <div className={cn(
              "absolute inset-0 border-2 border-primary rounded-lg opacity-0 transition-opacity pointer-events-none",
              "group-hover:opacity-100"
            )} />
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
