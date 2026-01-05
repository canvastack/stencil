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

  const handleAddNestedField = () => {
    const newField: Partial<FormField> = {
      id: `field_${Date.now()}`,
      type: 'text',
      name: `field_${Date.now()}`,
      label: 'New Field',
      required: false,
      order: (localField.fields?.length || 0) + 1,
    };
    const updated = [...(localField.fields || localField.repeaterFields || []), newField as FormField];
    handleChange('fields', updated);
    handleChange('repeaterFields', updated);
  };

  const handleUpdateNestedField = (index: number, updates: Partial<FormField>) => {
    const fields = [...(localField.fields || localField.repeaterFields || [])];
    fields[index] = { ...fields[index], ...updates };
    handleChange('fields', fields);
    handleChange('repeaterFields', fields);
  };

  const handleDeleteNestedField = (index: number) => {
    const fields = (localField.fields || localField.repeaterFields || []).filter((_, i) => i !== index);
    handleChange('fields', fields);
    handleChange('repeaterFields', fields);
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
          <TabsList className={`grid w-full mx-6 ${field.type === 'repeater' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            {field.type === 'repeater' && (
              <TabsTrigger value="nested">Nested Fields</TabsTrigger>
            )}
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Disabled</Label>
                    <div className="text-xs text-muted-foreground">
                      Field is read-only
                    </div>
                  </div>
                  <Switch
                    checked={localField.disabled || false}
                    onCheckedChange={(checked) => handleChange('disabled', checked)}
                  />
                </div>

                {field.type !== 'repeater' && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Repeatable</Label>
                      <div className="text-xs text-muted-foreground">
                        Allow users to add multiple entries
                      </div>
                    </div>
                    <Switch
                      checked={localField.repeatable || false}
                      onCheckedChange={(checked) => handleChange('repeatable', checked)}
                    />
                  </div>
                )}

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

                {(localField.repeatable || field.type === 'repeater') && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Dynamic Field Settings</Label>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="minItems">Min Items</Label>
                          <Input
                            id="minItems"
                            type="number"
                            min="0"
                            value={localField.minItems || 0}
                            onChange={(e) => handleChange('minItems', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxItems">Max Items</Label>
                          <Input
                            id="maxItems"
                            type="number"
                            min="1"
                            value={localField.maxItems || 10}
                            onChange={(e) => handleChange('maxItems', parseInt(e.target.value) || 10)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="addButtonText">Add Button Text</Label>
                        <Input
                          id="addButtonText"
                          value={localField.addButtonText || ''}
                          onChange={(e) => handleChange('addButtonText', e.target.value)}
                          placeholder="+ Add Item"
                        />
                      </div>
                    </div>
                  </>
                )}

                {field.type === 'file' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="accept">Accepted File Types</Label>
                      <Input
                        id="accept"
                        value={localField.accept || ''}
                        onChange={(e) => handleChange('accept', e.target.value)}
                        placeholder="e.g. image/*"
                      />
                      <p className="text-xs text-muted-foreground">
                        MIME types or file extensions
                      </p>
                    </div>
                  </>
                )}

                {field.type === 'color' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="presetColors">Preset Colors</Label>
                      <Textarea
                        id="presetColors"
                        value={(localField.presetColors || []).join(', ')}
                        onChange={(e) =>
                          handleChange(
                            'presetColors',
                            e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        placeholder="#FFFFFF, #000000, #FF0000"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated hex color codes
                      </p>
                    </div>
                  </>
                )}

                {field.type === 'wysiwyg' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="maxLength">Max Length</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        min="1"
                        value={localField.maxLength || ''}
                        onChange={(e) => handleChange('maxLength', parseInt(e.target.value) || undefined)}
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toolbar">Toolbar Options</Label>
                      <Textarea
                        id="toolbar"
                        value={(localField.toolbar || []).join(', ')}
                        onChange={(e) =>
                          handleChange(
                            'toolbar',
                            e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        placeholder="bold, italic, underline, heading"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: bold, italic, underline, strikethrough, heading, bulletList, orderedList, link, blockquote, codeBlock, undo, redo
                      </p>
                    </div>
                  </>
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

              {field.type === 'repeater' && (
                <TabsContent value="nested" className="space-y-4 mt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Nested Fields</Label>
                      <Button variant="outline" size="sm" onClick={handleAddNestedField}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Field
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(localField.fields || localField.repeaterFields || []).map((nestedField, index) => (
                        <div
                          key={nestedField.id || index}
                          className="p-3 border border-border rounded-lg space-y-3 bg-muted/20"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              Field #{index + 1}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteNestedField(index)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Field Type</Label>
                              <select
                                value={nestedField.type}
                                onChange={(e) =>
                                  handleUpdateNestedField(index, { type: e.target.value as any })
                                }
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              >
                                <option value="text">Text</option>
                                <option value="textarea">Textarea</option>
                                <option value="number">Number</option>
                                <option value="email">Email</option>
                                <option value="tel">Phone</option>
                                <option value="url">URL</option>
                                <option value="date">Date</option>
                                <option value="select">Select</option>
                                <option value="multiselect">Multi Select</option>
                                <option value="radio">Radio</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="color">Color</option>
                                <option value="file">File</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Field Name</Label>
                              <Input
                                value={nestedField.name}
                                onChange={(e) =>
                                  handleUpdateNestedField(index, { name: e.target.value })
                                }
                                placeholder="field_name"
                                className="h-9 text-xs font-mono"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Field Label</Label>
                            <Input
                              value={nestedField.label}
                              onChange={(e) =>
                                handleUpdateNestedField(index, { label: e.target.value })
                              }
                              placeholder="Field Label"
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Placeholder</Label>
                            <Input
                              value={nestedField.placeholder || ''}
                              onChange={(e) =>
                                handleUpdateNestedField(index, { placeholder: e.target.value })
                              }
                              placeholder="Placeholder text"
                              className="h-9"
                            />
                          </div>

                          <div className="flex items-center justify-between py-1">
                            <Label className="text-xs">Required</Label>
                            <Switch
                              checked={nestedField.required || false}
                              onCheckedChange={(checked) =>
                                handleUpdateNestedField(index, { required: checked })
                              }
                            />
                          </div>

                          {['select', 'multiselect', 'radio', 'checkbox'].includes(nestedField.type) && (
                            <div className="space-y-2">
                              <Label className="text-xs">Options</Label>
                              <Textarea
                                value={(nestedField.options || [])
                                  .map((opt) => `${opt.value}:${opt.label}`)
                                  .join('\n')}
                                onChange={(e) => {
                                  const lines = e.target.value.split('\n').filter(Boolean);
                                  const options = lines.map((line) => {
                                    const [value, label] = line.split(':');
                                    return {
                                      value: value?.trim() || '',
                                      label: label?.trim() || value?.trim() || '',
                                    };
                                  });
                                  handleUpdateNestedField(index, { options });
                                }}
                                placeholder="value1:Label 1&#10;value2:Label 2"
                                rows={3}
                                className="text-xs font-mono"
                              />
                              <p className="text-xs text-muted-foreground">
                                One per line, format: value:label
                              </p>
                            </div>
                          )}

                          {nestedField.type === 'color' && (
                            <div className="space-y-1">
                              <Label className="text-xs">Default Color</Label>
                              <Input
                                type="color"
                                value={nestedField.defaultValue as string || '#000000'}
                                onChange={(e) =>
                                  handleUpdateNestedField(index, { defaultValue: e.target.value })
                                }
                                className="h-9"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {(localField.fields || localField.repeaterFields || []).length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">
                            No nested fields yet
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click "Add Field" to add fields to this repeater group
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
