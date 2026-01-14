import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderTree, GripVertical, Edit, Trash2, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CategoryTreeNode } from '@/types/cms';
import { useCategoryStore } from '@/stores/cms';
import { useMoveCategoryMutation, useReorderCategoryMutation, useDeleteCategoryMutation } from '@/hooks/cms';

interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  onEdit?: (category: CategoryTreeNode) => void;
  onAdd?: (parentUuid: string | null) => void;
  onDelete?: (uuid: string) => void;
  className?: string;
}

export function CategoryTree({ nodes, onEdit, onAdd, onDelete, className }: CategoryTreeProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">No categories found</p>
        <p className="text-sm mt-1">Create your first category to organize content</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {nodes.map((node) => (
        <CategoryTreeNode 
          key={node.uuid} 
          node={node} 
          onEdit={onEdit}
          onAdd={onAdd}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface CategoryTreeNodeProps {
  node: CategoryTreeNode;
  onEdit?: (category: CategoryTreeNode) => void;
  onAdd?: (parentUuid: string | null) => void;
  onDelete?: (uuid: string) => void;
}

function CategoryTreeNode({ node, onEdit, onAdd, onDelete }: CategoryTreeNodeProps) {
  const { expandedNodes, toggleNode, selectedCategoryId, setSelectedCategoryId } = useCategoryStore();
  const deleteMutation = useDeleteCategoryMutation();
  
  const isExpanded = expandedNodes.has(node.uuid);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedCategoryId === node.uuid;

  const handleToggle = () => {
    if (hasChildren) {
      toggleNode(node.uuid);
    }
  };

  const handleSelect = () => {
    setSelectedCategoryId(node.uuid);
  };

  const handleEdit = () => {
    onEdit?.(node);
  };

  const handleAddChild = () => {
    onAdd?.(node.uuid);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${node.name}"? This will also delete all subcategories.`)) {
      deleteMutation.mutate(node.uuid);
      onDelete?.(node.uuid);
    }
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors group",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${node.depth * 20 + 12}px` }}
      >
        <button
          onClick={handleToggle}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent rounded-sm transition-colors"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

        <div 
          className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
          onClick={handleSelect}
        >
          <FolderTree className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate">{node.name}</span>
          {node.content_count !== undefined && node.content_count > 0 && (
            <Badge variant="secondary" className="ml-auto flex-shrink-0">
              {node.content_count}
            </Badge>
          )}
        </div>

        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddChild}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subcategory
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNode 
              key={child.uuid} 
              node={child}
              onEdit={onEdit}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
