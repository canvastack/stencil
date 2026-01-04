import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Settings } from 'lucide-react';
import type { FormField, FieldOption } from '@/types/form-builder';

interface FieldConfigPanelProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}

export function FieldConfigPanel({ field, onUpdate, onClose }: FieldConfigPanelProps) {
  const [localField, setLocalField] = useState(field);

  useEffect(() => {
    setLocalField(field);
  }, [field]);

  const handleChange = (key: keyof FormField, value: any) => {
    const updated = { ...localField, [key]: value };
    setLocalField(updated);
    onUpdate({ [key]: value });
  };

  const handleValidationChange = (key: string, value: any) => {
    const updated = {
      ...localField,
      validation: { ...localField.validation, [key]: value },
    };
    setLocalField(updated);
    onUpdate({ validation: updated.validation });
  };

  const handleAddOption = () => {
    const newOption: FieldOption = { value: `option_${Date.now()}`, label: 'New Option' };
    const updated = [...(localField.options || []), newOption];
    handleChange('options', updated);
  };

  const handleUpdateOption = (index: number, key: 'value' | 'label', value: string) => {
    const options = [...(localField.options || [])];
    options[index] = { ...options[index], [key]: value };
    handleChange('options', options);
  };

  const handleDeleteOption = (index: number) => {
    const options = (localField.options || []).filter((_, i) => i !== index);
    handleChange('options', options);
  };

  const needsOptions = ['select', 'multiselect', 'radio', 'checkbox'].includes(field.type);

  return (
    <Card className="sticky top-20 h-[calc(100vh-6rem)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Field Configuration
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Editing: <span className="font-semibold">{field.label}</span>
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-18rem)]">
            <div className="px-6 py-4">
              <TabsContent value="general" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="label">Field Label *</Label>
                  <Input
                    id="label"
                    value={localField.label}
                    onChange={(e) => handleChange('label', e.target.value)}
                    placeholder="Enter field label"
                  />
                  <p className="text-xs text-muted-foreground">Displayed to users</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Field Name (Key) *</Label>
                  <Input
                    id="name"
                    value={localField.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="field_name"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used as the field identifier in form data
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeholder">Placeholder</Label>
                  <Input
                    id="placeholder"
                    value={localField.placeholder || ''}
                    onChange={(e) => handleChange('placeholder', e.target.value)}
                    placeholder="Enter placeholder text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Help Text)</Label>
                  <Textarea
                    id="description"
                    value={localField.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Help text for this field"
                    rows={2}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Required Field</Label>
                    <div className="text-xs text-muted-foreground">
                      User must fill this field
                    </div>
                  </div>
                  <Switch
                    checked={localField.required || false}
                    onCheckedChange={(checked) => handleChange('required', checked)}
                  />
                </div>

                {!needsOptions && !['file', 'wysiwyg', 'repeater'].includes(field.type) && (
                  <div className="space-y-2">
                    <Label htmlFor="defaultValue">Default Value</Label>
                    <Input
                      id="defaultValue"
                      value={(localField.defaultValue as string) || ''}
                      onChange={(e) => handleChange('defaultValue', e.target.value)}
                      placeholder="Default value"
                    />
                  </div>
                )}

                {needsOptions && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      <Button variant="outline" size="sm" onClick={handleAddOption}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(localField.options || []).map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="Value"
                            value={option.value}
                            onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                            className="flex-1 font-mono text-xs"
                          />
                          <Input
                            placeholder="Label"
                            value={option.label}
                            onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 flex-shrink-0"
                            onClick={() => handleDeleteOption(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {(localField.options || []).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded">
                          No options yet. Click "Add" to create options.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="validation" className="space-y-4 mt-0">
                {['text', 'textarea'].includes(field.type) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="minLength">Minimum Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        min="0"
                        value={localField.validation?.minLength || ''}
                        onChange={(e) =>
                          handleValidationChange(
                            'minLength',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="e.g. 3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxLength">Maximum Length</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        min="1"
                        value={localField.validation?.maxLength || ''}
                        onChange={(e) =>
                          handleValidationChange(
                            'maxLength',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="e.g. 255"
                      />
                    </div>
                  </>
                )}

                {field.type === 'number' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="min">Minimum Value</Label>
                      <Input
                        id="min"
                        type="number"
                        value={localField.validation?.min || ''}
                        onChange={(e) =>
                          handleValidationChange(
                            'min',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max">Maximum Value</Label>
                      <Input
                        id="max"
                        type="number"
                        value={localField.validation?.max || ''}
                        onChange={(e) =>
                          handleValidationChange(
                            'max',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="e.g. 100"
                      />
                    </div>
                  </>
                )}

                {['text', 'textarea', 'email', 'tel', 'url'].includes(field.type) && (
                  <div className="space-y-2">
                    <Label htmlFor="pattern">Validation Pattern (Regex)</Label>
                    <Input
                      id="pattern"
                      value={localField.validation?.pattern || ''}
                      onChange={(e) => handleValidationChange('pattern', e.target.value)}
                      placeholder="e.g. ^[a-zA-Z0-9]+$"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Regular expression for custom validation
                    </p>
                  </div>
                )}

                {field.type === 'file' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="maxSize">Max File Size (bytes)</Label>
                      <Input
                        id="maxSize"
                        type="number"
                        min="1"
                        value={localField.validation?.maxSize || ''}
                        onChange={(e) =>
                          handleValidationChange(
                            'maxSize',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="e.g. 10485760 (10MB)"
                      />
                      <p className="text-xs text-muted-foreground">
                        {localField.validation?.maxSize
                          ? `${(localField.validation.maxSize / 1024 / 1024).toFixed(2)} MB`
                          : 'No limit'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fileTypes">Allowed File Types</Label>
                      <Input
                        id="fileTypes"
                        value={(localField.validation?.allowedFileTypes || []).join(', ')}
                        onChange={(e) =>
                          handleValidationChange(
                            'allowedFileTypes',
                            e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        placeholder="e.g. image/*, .pdf, .doc"
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated MIME types or extensions
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="errorMessage">Custom Error Message</Label>
                  <Textarea
                    id="errorMessage"
                    value={localField.validation?.errorMessage || ''}
                    onChange={(e) => handleValidationChange('errorMessage', e.target.value)}
                    placeholder="Error message shown when validation fails"
                    rows={2}
                  />
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
