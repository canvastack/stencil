import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category, CategoryTreeNode, CreateCategoryInput, UpdateCategoryInput } from '@/types/cms';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '@/hooks/cms';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug is too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  parent_uuid: z.string().optional().nullable(),
  sort_order: z.number().min(0).optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryTreeNode | null;
  parentUuid?: string | null;
  contentTypeUuid: string;
  categories: CategoryTreeNode[];
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  parentUuid,
  contentTypeUuid,
  categories,
}: CategoryFormDialogProps) {
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      parent_uuid: parentUuid || null,
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parent_uuid: category.parent_uuid,
        sort_order: category.sort_order,
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        parent_uuid: parentUuid || null,
        sort_order: 0,
      });
    }
  }, [category, parentUuid, form]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    if (!isEditing) {
      const slug = generateSlug(value);
      form.setValue('slug', slug);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing && category) {
        const updateInput: UpdateCategoryInput = {
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
        };
        await updateMutation.mutateAsync({
          uuid: category.uuid,
          input: updateInput,
        });
      } else {
        const createInput: CreateCategoryInput = {
          content_type_uuid: contentTypeUuid,
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
          parent_uuid: data.parent_uuid || undefined,
          sort_order: data.sort_order || 0,
        };
        await createMutation.mutateAsync(createInput);
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const flattenCategories = (nodes: CategoryTreeNode[], prefix = ''): Array<{ uuid: string; label: string }> => {
    const result: Array<{ uuid: string; label: string }> = [];
    
    nodes.forEach((node) => {
      if (!category || node.uuid !== category.uuid) {
        result.push({
          uuid: node.uuid,
          label: prefix + node.name,
        });
        
        if (node.children && node.children.length > 0) {
          result.push(...flattenCategories(node.children, prefix + node.name + ' / '));
        }
      }
    });
    
    return result;
  };

  const availableParents = flattenCategories(categories);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'Create Category'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category information below.'
              : 'Create a new category to organize your content.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Category name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="category-slug" />
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier (lowercase, hyphens only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Brief description of this category"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_uuid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category (Optional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category (none for root)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">None (Root Level)</SelectItem>
                      {availableParents.map((parent) => (
                        <SelectItem key={parent.uuid} value={parent.uuid}>
                          {parent.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose a parent to create a nested category structure
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
