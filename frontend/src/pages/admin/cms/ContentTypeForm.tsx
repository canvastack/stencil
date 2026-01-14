import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  useContentTypeQuery, 
  useCreateContentTypeMutation, 
  useUpdateContentTypeMutation,
} from '@/hooks/cms';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateContentTypeInput, UpdateContentTypeInput } from '@/types/cms';

const contentTypeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  default_url_pattern: z.string().max(255).optional(),
  is_commentable: z.boolean().optional(),
  is_categorizable: z.boolean().optional(),
  is_taggable: z.boolean().optional(),
  is_revisioned: z.boolean().optional(),
});

type ContentTypeFormData = z.infer<typeof contentTypeFormSchema>;

export default function ContentTypeForm() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const isEditing = !!uuid;

  const { data: contentTypeData, isLoading: isLoadingContentType } = useContentTypeQuery(uuid);
  const createMutation = useCreateContentTypeMutation();
  const updateMutation = useUpdateContentTypeMutation();

  const form = useForm<ContentTypeFormData>({
    resolver: zodResolver(contentTypeFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: 'FileText',
      default_url_pattern: '/{slug}',
      is_commentable: false,
      is_categorizable: false,
      is_taggable: false,
      is_revisioned: true,
    },
  });

  useEffect(() => {
    if (contentTypeData?.data && isEditing) {
      const contentType = contentTypeData.data;
      form.reset({
        name: contentType.name || '',
        slug: contentType.slug || '',
        description: contentType.description || '',
        icon: contentType.icon || 'FileText',
        default_url_pattern: contentType.default_url_pattern || '/{slug}',
        is_commentable: contentType.is_commentable || false,
        is_categorizable: contentType.is_categorizable || false,
        is_taggable: contentType.is_taggable || false,
        is_revisioned: contentType.is_revisioned || true,
      });
    }
  }, [contentTypeData, isEditing, form]);

  const onSubmit = async (data: ContentTypeFormData) => {
    try {
      if (isEditing && uuid) {
        await updateMutation.mutateAsync({
          uuid,
          input: data as UpdateContentTypeInput,
        });
      } else {
        await createMutation.mutateAsync(data as CreateContentTypeInput);
      }
      navigate('/admin/cms/content-types');
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    if (!isEditing) {
      form.setValue('slug', generateSlug(name));
    }
  };

  if (isLoadingContentType && isEditing) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/cms/content-types')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Content Type' : 'New Content Type'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing
              ? 'Update the content type configuration'
              : 'Create a new content type for your CMS'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic settings for this content type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Blog Post, News Article"
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Display name for this content type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="blog-post"
                        {...field}
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier (cannot be changed after creation)
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this content type"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description to help identify this content type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input placeholder="FileText" {...field} />
                    </FormControl>
                    <FormDescription>
                      Lucide icon name for visual identification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_url_pattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default URL Pattern</FormLabel>
                    <FormControl>
                      <Input placeholder="/{slug}" {...field} />
                    </FormControl>
                    <FormDescription>
                      Default URL pattern for content of this type. Use {'{slug}'} as placeholder
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>
                Enable or disable features for this content type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="is_commentable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Comments</FormLabel>
                      <FormDescription>
                        Allow users to comment on content
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_categorizable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Categories</FormLabel>
                      <FormDescription>
                        Organize content with categories
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_taggable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tags</FormLabel>
                      <FormDescription>
                        Add tags to content for better organization
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_revisioned"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Revisions</FormLabel>
                      <FormDescription>
                        Keep track of content changes with version history
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/cms/content-types')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update' : 'Create'} Content Type
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
