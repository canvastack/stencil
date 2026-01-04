import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GripVertical,
  Settings,
  Trash2,
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Link as LinkIcon,
  Calendar,
  ChevronDown,
  ListChecks,
  Circle,
  CheckSquare,
  Palette,
  Upload,
  FileText,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormField } from '@/types/form-builder';

interface SortableFieldItemProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  tel: <Phone className="h-4 w-4" />,
  url: <LinkIcon className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  select: <ChevronDown className="h-4 w-4" />,
  multiselect: <ListChecks className="h-4 w-4" />,
  radio: <Circle className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  color: <Palette className="h-4 w-4" />,
  file: <Upload className="h-4 w-4" />,
  wysiwyg: <FileText className="h-4 w-4" />,
  repeater: <Copy className="h-4 w-4" />,
};

export function SortableFieldItem({
  field,
  isSelected,
  onSelect,
  onDelete,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-3 p-4 rounded-lg border-2 bg-card transition-all',
        isSelected && 'border-primary shadow-md ring-2 ring-primary/20',
        !isSelected && 'border-border hover:border-primary/50 hover:shadow-sm',
        isDragging && 'opacity-50 cursor-grabbing z-50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isDragging && 'opacity-100'
        )}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Field Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
            {FIELD_ICONS[field.type] || <Type className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{field.label}</span>
              {field.required && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  Required
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground capitalize">
                {field.type.replace('_', ' ')}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground truncate font-mono">
                {field.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSelect}
          aria-label="Edit field"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          aria-label="Delete field"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
