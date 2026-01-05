import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Save, Eye, ArrowLeft, Loader2, AlertCircle, Maximize2, Minimize2, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FieldLibrary } from '@/components/form-builder/FieldLibrary';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { LivePreview } from '@/components/form-builder/LivePreview';
import { FieldConfigPanel } from '@/components/form-builder/FieldConfigPanel';
import { TemplateSelector } from '@/components/form-builder/TemplateSelector';
import { useFormConfiguration } from '@/hooks/useFormConfiguration';
import type { FormField, FormSchema, FieldType, FIELD_TYPES } from '@/types/form-builder';

export default function FormBuilder() {
  const { productUuid } = useParams<{ productUuid: string }>();
  const navigate = useNavigate();

  const {
    configuration,
    isLoading,
    isSaving,
    error,
    saveConfiguration,
    updateConfiguration,
  } = useFormConfiguration(productUuid);

  const [formSchema, setFormSchema] = useState<FormSchema>({
    version: '1.0',
    title: 'Product Order Form',
    description: '',
    fields: [],
  });

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (configuration?.formSchema) {
      setFormSchema(configuration.formSchema);
      setHasUnsavedChanges(false);
    }
  }, [configuration]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormSchema((prev) => {
        const oldIndex = prev.fields.findIndex((f) => f.id === active.id);
        const newIndex = prev.fields.findIndex((f) => f.id === over.id);

        const reorderedFields = arrayMove(prev.fields, oldIndex, newIndex);

        reorderedFields.forEach((field, index) => {
          field.order = index + 1;
        });

        setHasUnsavedChanges(true);
        return { ...prev, fields: reorderedFields };
      });
    }
  };

  const handleAddField = (fieldType: FieldType) => {
    const fieldTypeDefinition = (window as any).FIELD_TYPES?.find((ft: any) => ft.type === fieldType);
    
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      name: `field_${formSchema.fields.length + 1}`,
      label: fieldTypeDefinition?.label || `New ${fieldType} Field`,
      placeholder: '',
      required: false,
      order: formSchema.fields.length + 1,
      validation: {},
      ...fieldTypeDefinition?.defaultConfig,
    };

    setFormSchema((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));

    setSelectedFieldId(newField.id);
    setHasUnsavedChanges(true);
    toast.success(`${fieldTypeDefinition?.label || fieldType} field added`);
  };

  const handleDeleteField = (fieldId: string) => {
    const field = formSchema.fields.find((f) => f.id === fieldId);
    
    setFormSchema((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId)
        .map((f, index) => ({ ...f, order: index + 1 })),
    }));

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }

    setHasUnsavedChanges(true);
    toast.success(`Field "${field?.label}" deleted`);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormSchema((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!productUuid) {
      toast.error('Product UUID is missing');
      return;
    }

    try {
      if (configuration) {
        await updateConfiguration({
          form_schema: formSchema,
        });
      } else {
        await saveConfiguration({
          form_schema: formSchema,
          is_default: false,
        });
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const handleApplyTemplate = (templateSchema: FormSchema) => {
    setFormSchema(templateSchema);
    setHasUnsavedChanges(true);
    setSelectedFieldId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading form configuration...</p>
        </div>
      </div>
    );
  }

  const selectedField = formSchema.fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">Form Builder</h1>
              <p className="text-sm text-muted-foreground">
                Configure product order form
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-sm text-muted-foreground mr-2">Unsaved changes</span>
            )}
            <TemplateSelector 
              open={templateSelectorOpen}
              onOpenChange={setTemplateSelectorOpen}
              onApplyTemplate={handleApplyTemplate} 
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewDialogOpen(true)}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
            >
              {isFullscreenPreview ? (
                <>
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Full Preview
                </>
              )}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="container px-4 md:px-6 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {!isFullscreenPreview ? (
        <div className="container px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-3">
              <FieldLibrary onAddField={handleAddField} />
            </aside>

            <main className="lg:col-span-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <FormCanvas
                  fields={formSchema.fields}
                  selectedFieldId={selectedFieldId}
                  onSelectField={setSelectedFieldId}
                  onDeleteField={handleDeleteField}
                  onOpenTemplateSelector={() => setTemplateSelectorOpen(true)}
                />
              </DndContext>
            </main>

            <aside className="lg:col-span-3">
              {selectedField ? (
                <FieldConfigPanel
                  field={selectedField}
                  onUpdate={(updates) => handleUpdateField(selectedField.id, updates)}
                  onClose={() => setSelectedFieldId(null)}
                />
              ) : (
                <LivePreview formSchema={formSchema} />
              )}
            </aside>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-50 bg-background p-4">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Full Preview</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreenPreview(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-auto pt-4">
              <LivePreview formSchema={formSchema} fullSize />
            </div>
          </div>
        </div>
      )}

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Form Preview
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-5rem)] p-6">
            <LivePreview formSchema={formSchema} fullSize dialogMode />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
