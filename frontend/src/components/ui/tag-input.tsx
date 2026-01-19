import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder = 'Type and press Enter...',
  className,
  disabled = false,
}) => {
  const safeValue = Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!safeValue.includes(newTag)) {
        onChange([...safeValue, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && safeValue.length > 0) {
      onChange(safeValue.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(safeValue.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={cn('flex flex-wrap gap-2 p-2 border rounded-md bg-background', className)}>
      {safeValue.map((tag, index) => (
        <Badge key={index} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            disabled={disabled}
            className="ml-1 hover:bg-muted rounded-sm p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={safeValue.length === 0 ? placeholder : ''}
        disabled={disabled}
        className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
      />
    </div>
  );
};
