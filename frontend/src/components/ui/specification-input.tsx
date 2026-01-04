import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TagInput } from '@/components/ui/tag-input';
import { cn } from '@/lib/utils';

export type SpecificationValue = 
  | string 
  | string[] 
  | Record<string, string[]>;

interface SpecificationInputProps {
  value: { key: string; value: any };
  onChange: (spec: { key: string; value: any }) => void;
  onRemove: () => void;
  index: number;
}

export const SpecificationInput: React.FC<SpecificationInputProps> = ({
  value,
  onChange,
  onRemove,
  index,
}) => {
  const [isArray, setIsArray] = useState(() => {
    if (!value.value) return false;
    if (typeof value.value === 'string') return false;
    return Array.isArray(value.value) || typeof value.value === 'object';
  });
  
  const [isKeyValue, setIsKeyValue] = useState(() => {
    if (!value.value || typeof value.value === 'string') return false;
    if (Array.isArray(value.value)) return false;
    return typeof value.value === 'object';
  });

  const parseValue = (val: any): { type: 'text' | 'array' | 'keyvalue'; data: any } => {
    if (!val) return { type: 'text', data: '' };
    if (typeof val === 'string') return { type: 'text', data: val };
    if (Array.isArray(val)) return { type: 'array', data: val };
    if (typeof val === 'object') return { type: 'keyvalue', data: val };
    return { type: 'text', data: String(val) };
  };

  const parsed = parseValue(value.value);
  const [currentValue, setCurrentValue] = useState(() => {
    if (parsed.type === 'text') return parsed.data;
    if (parsed.type === 'array') return parsed.data;
    if (parsed.type === 'keyvalue') return parsed.data;
    return '';
  });

  const handleArrayToggle = (checked: boolean) => {
    setIsArray(checked);
    if (!checked) {
      setIsKeyValue(false);
      onChange({ key: value.key, value: '' });
      setCurrentValue('');
    } else {
      onChange({ key: value.key, value: [] });
      setCurrentValue([]);
    }
  };

  const handleKeyValueToggle = (checked: boolean) => {
    setIsKeyValue(checked);
    if (checked) {
      onChange({ key: value.key, value: {} });
      setCurrentValue({});
    } else {
      onChange({ key: value.key, value: [] });
      setCurrentValue([]);
    }
  };

  const handleSimpleArrayChange = (tags: string[]) => {
    setCurrentValue(tags);
    onChange({ key: value.key, value: tags });
  };

  const handleKeyValueArrayChange = (subKey: string, tags: string[]) => {
    const newValue = { ...currentValue, [subKey]: tags };
    setCurrentValue(newValue);
    onChange({ key: value.key, value: newValue });
  };

  const handleAddKeyValue = () => {
    const newValue = { ...currentValue, '': [] };
    setCurrentValue(newValue);
    onChange({ key: value.key, value: newValue });
  };

  const handleRemoveKeyValue = (keyToRemove: string) => {
    const newValue = { ...currentValue };
    delete newValue[keyToRemove];
    setCurrentValue(newValue);
    onChange({ key: value.key, value: newValue });
  };

  const handleKeyValueKeyChange = (oldKey: string, newKey: string) => {
    const newValue: Record<string, string[]> = {};
    Object.entries(currentValue).forEach(([k, v]) => {
      if (k === oldKey) {
        newValue[newKey] = v as string[];
      } else {
        newValue[k] = v as string[];
      }
    });
    setCurrentValue(newValue);
    onChange({ key: value.key, value: newValue });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Spesifikasi #{index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`spec-key-${index}`}>Nama Spesifikasi</Label>
        <Input
          id={`spec-key-${index}`}
          placeholder="e.g., Dimensi, Material, Warna"
          value={value.key}
          onChange={(e) => onChange({ key: e.target.value, value: value.value })}
        />
      </div>

      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor={`spec-array-${index}`} className="text-sm">Data berupa Array/List?</Label>
          <Switch
            id={`spec-array-${index}`}
            checked={isArray}
            onCheckedChange={handleArrayToggle}
          />
        </div>

        {!isArray ? (
          <div className="space-y-2">
            <Label htmlFor={`spec-value-${index}`}>Value</Label>
            <Input
              id={`spec-value-${index}`}
              placeholder="Enter value"
              value={typeof currentValue === 'string' ? currentValue : ''}
              onChange={(e) => {
                setCurrentValue(e.target.value);
                onChange({ key: value.key, value: e.target.value });
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor={`spec-keyvalue-${index}`} className="text-sm">Array dengan Key-Value?</Label>
              <Switch
                id={`spec-keyvalue-${index}`}
                checked={isKeyValue}
                onCheckedChange={handleKeyValueToggle}
              />
            </div>

            {!isKeyValue ? (
              <div className="space-y-2">
                <Label>Values (Tag Input)</Label>
                <TagInput
                  value={Array.isArray(currentValue) ? currentValue : []}
                  onChange={handleSimpleArrayChange}
                  placeholder="Type and press Enter to add"
                />
                <p className="text-xs text-muted-foreground">
                  Ketik value dan tekan Enter untuk menambahkan
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Key-Value Pairs</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddKeyValue}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Item
                  </Button>
                </div>

                {typeof currentValue === 'object' && !Array.isArray(currentValue) && (
                  <div className="space-y-3">
                    {Object.entries(currentValue).map(([subKey, subValues], idx) => (
                      <div key={idx} className="border rounded p-3 space-y-2 bg-background">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Key"
                            value={subKey}
                            onChange={(e) => handleKeyValueKeyChange(subKey, e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveKeyValue(subKey)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <TagInput
                          value={Array.isArray(subValues) ? subValues : []}
                          onChange={(tags) => handleKeyValueArrayChange(subKey, tags)}
                          placeholder="Type values and press Enter"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
