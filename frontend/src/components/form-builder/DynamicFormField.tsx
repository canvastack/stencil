import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import { Plus, Trash2, Upload, X, File as FileIcon, Loader2 } from 'lucide-react';
import { mediaService } from '@/services/api/media';
import { toast } from 'sonner';
import type { FormField } from '@/types/form-builder';

interface DynamicFormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function DynamicFormField({ field, value, onChange, error }: DynamicFormFieldProps) {
  if (field.repeatable && field.type !== 'repeater') {
    return <RepeatableField field={field} value={value} onChange={onChange} error={error} />;
  }

  if (field.type === 'repeater') {
    return <RepeaterGroup field={field} value={value} onChange={onChange} error={error} />;
  }

  return <SingleField field={field} value={value} onChange={onChange} error={error} />;
}

function SingleField({ field, value, onChange, error }: DynamicFormFieldProps) {
  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            required={field.required}
            pattern={field.validation?.pattern}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            required={field.required}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            rows={4}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={field.disabled}
            required={field.required}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange} disabled={field.disabled}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <Select
            value={Array.isArray(value) ? value.join(',') : ''}
            onValueChange={(val) => onChange(val.split(',').filter(Boolean))}
            disabled={field.disabled}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.id}-${option.value}`}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={field.disabled || option.disabled}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <label htmlFor={`${field.id}-${option.value}`} className="text-sm font-medium">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.id}-${option.value}`}
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...currentValue, option.value]);
                    } else {
                      onChange(currentValue.filter((v) => v !== option.value));
                    }
                  }}
                  disabled={field.disabled || option.disabled}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor={`${field.id}-${option.value}`} className="text-sm font-medium">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'color':
        return (
          <ColorPicker
            value={value || field.defaultValue || '#000000'}
            onChange={onChange}
            presetColors={field.presetColors}
            disabled={field.disabled}
            required={field.required}
          />
        );

      case 'file':
        return (
          <FileUploadInput
            field={field}
            value={value}
            onChange={onChange}
            error={error}
          />
        );

      case 'wysiwyg':
        return (
          <WysiwygEditor
            value={value || ''}
            onChange={onChange}
            placeholder={field.placeholder}
            height={300}
            maxLength={field.maxLength}
            toolbar={field.toolbar}
            disabled={field.disabled}
            required={field.required}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FileUploadInput({ field, value, onChange, error }: DynamicFormFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileUrl = value;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = field.maxSize || 10485760;
    if (file.size > maxSize) {
      toast.error(`Ukuran file maksimal ${maxSize / 1024 / 1024}MB`);
      return;
    }

    if (field.accept) {
      const allowedTypes = field.accept.split(',').map((t) => t.trim());
      const fileExtension = '.' + file.name.split('.').pop();
      if (!allowedTypes.includes(fileExtension)) {
        toast.error(`Tipe file harus salah satu dari: ${field.accept}`);
        return;
      }
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const response = await mediaService.uploadFile(file, {
        folder: 'order-designs',
        onProgress: (progress) => setUploadProgress(progress),
      });

      onChange(response.data.url);
      toast.success('File berhasil diupload');
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.message || 'Gagal mengupload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    if (fileUrl) {
      try {
        const url = new URL(fileUrl);
        const path = url.pathname.replace('/storage/', '');
        await mediaService.deleteFile(path);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {!fileUrl ? (
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id={field.id}
            accept={field.accept}
            onChange={handleFileChange}
            disabled={uploading || field.disabled}
            className="hidden"
          />
          <label htmlFor={field.id} className="cursor-pointer">
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="text-sm text-muted-foreground">
                  Mengupload... {uploadProgress}%
                </div>
                <div className="w-full bg-secondary rounded-full h-2 max-w-xs mx-auto">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground">
                  Klik untuk upload atau drag and drop
                </div>
                {field.accept && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Format: {field.accept}
                  </div>
                )}
                {field.maxSize && (
                  <div className="text-xs text-muted-foreground">
                    Maksimal {field.maxSize / 1024 / 1024}MB
                  </div>
                )}
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <FileIcon className="h-8 w-8 text-primary" />
            <div>
              <div className="text-sm font-medium">File berhasil diupload</div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Lihat file
              </a>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={field.disabled}
            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function RepeatableField({ field, value, onChange, error }: DynamicFormFieldProps) {
  const values = Array.isArray(value) ? value : [];
  const minItems = field.minItems || 1;
  const maxItems = field.maxItems || 10;

  const handleAdd = () => {
    if (values.length < maxItems) {
      onChange([...values, '']);
    }
  };

  const handleRemove = (index: number) => {
    if (values.length > minItems) {
      onChange(values.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, newValue: any) => {
    const newValues = [...values];
    newValues[index] = newValue;
    onChange(newValues);
  };

  React.useEffect(() => {
    if (values.length === 0 && minItems > 0) {
      onChange(Array(minItems).fill(''));
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {values.length < maxItems && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="h-8 gap-1"
          >
            <Plus className="h-3 w-3" />
            {field.addButtonText || 'Add'}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {values.map((val, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1">
              <SingleField
                field={{ ...field, label: '', helpText: '', required: false }}
                value={val}
                onChange={(newValue) => handleChange(index, newValue)}
              />
            </div>
            {values.length > minItems && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="h-9 w-9 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function RepeaterGroup({ field, value, onChange, error }: DynamicFormFieldProps) {
  const values = Array.isArray(value) ? value : [];
  const minItems = field.minItems || 0;
  const maxItems = field.maxItems || 10;
  const repeaterFields = field.fields || field.repeaterFields || [];

  const createEmptyItem = () => {
    const emptyItem: Record<string, any> = {};
    repeaterFields.forEach((f) => {
      emptyItem[f.name] = f.defaultValue || '';
    });
    return emptyItem;
  };

  const handleAdd = () => {
    if (values.length < maxItems) {
      onChange([...values, createEmptyItem()]);
    }
  };

  const handleRemove = (index: number) => {
    if (values.length > minItems) {
      onChange(values.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (itemIndex: number, fieldName: string, newValue: any) => {
    const newValues = [...values];
    newValues[itemIndex] = {
      ...newValues[itemIndex],
      [fieldName]: newValue,
    };
    onChange(newValues);
  };

  React.useEffect(() => {
    if (values.length === 0 && minItems > 0) {
      onChange(Array(minItems).fill(null).map(() => createEmptyItem()));
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {values.length < maxItems && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="h-8 gap-1"
          >
            <Plus className="h-3 w-3" />
            {field.addButtonText || '+ Tambah'}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {values.map((item, itemIndex) => (
          <div
            key={itemIndex}
            className="p-3 border border-border rounded-lg space-y-2 bg-muted/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {field.label} #{itemIndex + 1}
              </span>
              {values.length > minItems && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(itemIndex)}
                  className="h-6 w-6"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            {repeaterFields.map((repeaterField) => (
              <DynamicFormField
                key={repeaterField.id || repeaterField.name}
                field={repeaterField}
                value={item[repeaterField.name]}
                onChange={(newValue) =>
                  handleFieldChange(itemIndex, repeaterField.name, newValue)
                }
              />
            ))}
          </div>
        ))}
      </div>

      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
