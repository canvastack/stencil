import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Maximize2, Minimize2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoryTreeQuery, useContentTypesQuery } from '@/hooks/cms';
import { useCategoryStore } from '@/stores/cms';
import { CategoryTree } from '@/components/cms/CategoryTree';
import { CategoryFormDialog } from '@/components/cms/CategoryFormDialog';
import type { CategoryTreeNode } from '@/types/cms';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CategoryManagement() {
  const { data, isLoading } = useCategoryTreeQuery();
  const { data: contentTypesData } = useContentTypesQuery();
  const { expandAll, collapseAll } = useCategoryStore();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode | null>(null);
  const [parentUuid, setParentUuid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<string>('all');

  const categories = data?.data || [];
  const contentTypes = contentTypesData?.data || [];
  const activeContentType = contentTypes.find(ct => ct.is_active && ct.uuid === selectedContentType);

  const handleAdd = (parent: string | null = null) => {
    setEditingCategory(null);
    setParentUuid(parent);
    setDialogOpen(true);
  };

  const handleEdit = (category: CategoryTreeNode) => {
    setEditingCategory(category);
    setParentUuid(null);
    setDialogOpen(true);
  };

  const handleDelete = (uuid: string) => {
    console.log('Category deleted:', uuid);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setParentUuid(null);
  };

  const filterCategories = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
    if (!searchQuery) return nodes;
    
    const query = searchQuery.toLowerCase();
    return nodes
      .map(node => {
        const matches = node.name.toLowerCase().includes(query) || 
                       node.slug.toLowerCase().includes(query);
        const filteredChildren = filterCategories(node.children || []);
        
        if (matches || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as CategoryTreeNode[];
  };

  const filteredCategories = filterCategories(categories);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organize your content with hierarchical categories
          </p>
        </div>
        <Button onClick={() => handleAdd()}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select value={selectedContentType} onValueChange={setSelectedContentType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Content Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content Types</SelectItem>
            {contentTypes.map((ct) => (
              <SelectItem key={ct.uuid} value={ct.uuid}>
                {ct.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <Minimize2 className="h-4 w-4 mr-2" />
            Collapse All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Category Tree</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CategoryTree 
            nodes={filteredCategories}
            onEdit={handleEdit}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {contentTypes.length > 0 && (
        <CategoryFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          category={editingCategory}
          parentUuid={parentUuid}
          contentTypeUuid={activeContentType?.uuid || contentTypes[0]?.uuid || ''}
          categories={categories}
        />
      )}
    </div>
  );
}
