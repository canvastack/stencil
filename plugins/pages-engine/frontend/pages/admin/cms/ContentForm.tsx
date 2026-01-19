import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Skeleton } from '@canvastencil/ui-components';
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
import { ContentEditor } from '@/components/cms/ContentEditor';
import { 
  useContentQuery, 
  useCreateContentMutation, 
  useUpdateContentMutation,
  usePublishContentMutation,
  useContentTypesQuery,
  useCategoriesQuery,
} from '@/hooks/cms';
import { ArrowLeft, Save, Eye, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateContentInput, UpdateContentInput } from '@/types/cms';

const contentFormSchema = z.object({
  content_type_uuid: z.string().min(1, 'Content type is required'),
  title: z.string().min(1, 'Title is required').max(500),
  slug: z.string().min(1, 'Slug is required').max(500)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  content: z.union([
    z.object({
      wysiwyg: z.string().optional(),
      markdown: z.string().optional(),
    }),
    z.any()
  ]).optional().default({ wysiwyg: '', markdown: '' }),
  excerpt: z.string().max(1000).optional().or(z.literal('')),
  featured_image: z.string().url().optional().or(z.literal('')),
  categories: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.any().optional().default({}),
  editor_format: z.enum(['wysiwyg', 'markdown', 'html']).optional(),
  seo_title: z.string().max(255).optional().or(z.literal('')),
  seo_description: z.string().optional().or(z.literal('')),
  seo_keywords: z.array(z.string()).optional().default([]),
  canonical_url: z.string().url().optional().or(z.literal('')),
  is_featured: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
  is_commentable: z.boolean().optional(),
  custom_url: z.string().max(500).optional().or(z.literal('')),
});

type ContentFormData = z.infer<typeof contentFormSchema>;

export default function ContentForm() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const isEditing = !!uuid;

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedContentTypeUuid, setSelectedContentTypeUuid] = useState<string>('');

  const { data: contentData, isLoading: isLoadingContent } = useContentQuery(uuid);
  const { data: contentTypesData } = useContentTypesQuery();
  const { data: categoriesData } = useCategoriesQuery({ content_type: selectedContentTypeUuid });
  
  const createMutation = useCreateContentMutation();
  const updateMutation = useUpdateContentMutation();
  const publishMutation = usePublishContentMutation();

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      content_type_uuid: '',
      title: '',
      slug: '',
      content: {
        wysiwyg: '',
        markdown: '',
      },
      excerpt: '',
      featured_image: '',
      categories: [],
      tags: [],
      metadata: {},
      editor_format: 'wysiwyg',
      seo_title: '',
      seo_description: '',
      seo_keywords: [],
      canonical_url: '',
      is_featured: false,
      is_pinned: false,
      is_commentable: true,
      custom_url: '',
    },
  });

  useEffect(() => {
    if (contentData?.data) {
      const content = contentData.data;
      const contentObj = typeof content.content === 'object' ? content.content : { wysiwyg: '', markdown: '' };
      
      form.reset({
        content_type_uuid: content.content_type.uuid,
        title: content.title,
        slug: content.slug,
        content: contentObj,
        excerpt: content.excerpt || '',
        featured_image: content.featured_image || '',
        categories: content.categories?.map(c => c.uuid) || [],
        tags: content.tags?.map(t => t.uuid) || [],
        metadata: content.metadata || {},
        editor_format: content.editor_format || 'wysiwyg',
        seo_title: content.seo_title || '',
        seo_description: content.seo_description || '',
        seo_keywords: content.seo_keywords || [],
        canonical_url: content.canonical_url || '',
        is_featured: content.is_featured || false,
        is_pinned: content.is_pinned || false,
        is_commentable: content.is_commentable ?? true,
        custom_url: content.custom_url || '',
      });
      setSelectedCategories(content.categories?.map(c => c.uuid) || []);
      setSelectedContentTypeUuid(content.content_type.uuid);
    }
  }, [contentData, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'content_type_uuid' && value.content_type_uuid) {
        setSelectedContentTypeUuid(value.content_type_uuid);
        setSelectedCategories([]);
        form.setValue('categories', []);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    form.setValue('title', value);
    if (!isEditing) {
      const slug = generateSlug(value);
      form.setValue('slug', slug);
    }
  };

  const onSubmit = async (data: ContentFormData) => {
    console.log('[ContentForm] onSubmit called with data:', data);
    try {
      if (isEditing && uuid) {
        const updateInput: UpdateContentInput = {
          content_type_uuid: data.content_type_uuid,
          title: data.title,
          slug: data.slug,
          content: data.content,
          excerpt: data.excerpt || undefined,
          featured_image: data.featured_image || undefined,
          categories: data.categories,
          tags: data.tags,
          metadata: Array.isArray(data.metadata) ? {} : (data.metadata || {}),
          editor_format: data.editor_format,
          seo_title: data.seo_title || undefined,
          seo_description: data.seo_description || undefined,
          seo_keywords: data.seo_keywords,
          canonical_url: data.canonical_url || undefined,
          is_featured: data.is_featured,
          is_pinned: data.is_pinned,
          is_commentable: data.is_commentable,
          custom_url: data.custom_url || undefined,
        };
        console.log('[ContentForm] Calling updateMutation with:', { uuid, input: updateInput });
        await updateMutation.mutateAsync({ uuid, input: updateInput });
      } else {
        const createInput: CreateContentInput = {
          content_type_uuid: data.content_type_uuid,
          title: data.title,
          slug: data.slug,
          content: data.content,
          excerpt: data.excerpt || undefined,
          featured_image: data.featured_image || undefined,
          categories: data.categories,
          tags: data.tags,
          metadata: Array.isArray(data.metadata) ? {} : (data.metadata || {}),
          editor_format: data.editor_format || 'wysiwyg',
          seo_title: data.seo_title || undefined,
          seo_description: data.seo_description || undefined,
          seo_keywords: data.seo_keywords,
          canonical_url: data.canonical_url || undefined,
          is_featured: data.is_featured,
          is_pinned: data.is_pinned,
          is_commentable: data.is_commentable,
          custom_url: data.custom_url || undefined,
        };
        console.log('[ContentForm] Calling createMutation with:', createInput);
        await createMutation.mutateAsync(createInput);
        navigate('/admin/cms/contents');
      }
    } catch (error) {
      console.error('[ContentForm] Failed to save content:', error);
      toast.error('Gagal menyimpan content', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan'
      });
    }
  };

  const handlePublish = async () => {
    try {
      if (!uuid) {
        toast.error('Cannot publish', {
          description: 'Please save the content first before publishing.'
        });
        return;
      }
      await publishMutation.mutateAsync({ uuid });
    } catch (error) {
      console.error('Failed to publish content:', error);
    }
  };

  const handlePreview = async () => {
    try {
      const formValues = form.getValues();
      
      if (!formValues.slug) {
        toast.error('Cannot preview', {
          description: 'Please add a title to generate a slug first.'
        });
        return;
      }

      if (form.formState.isDirty) {
        toast.info('Saving changes before preview...', {
          description: 'Please wait while we save your changes.'
        });
        await form.handleSubmit(onSubmit)();
      }

      const previewUrl = `/content/contents/${formValues.slug}`;
      window.open(previewUrl, '_blank');
    } catch (error) {
      console.error('[ContentForm] Failed to preview content:', error);
      toast.error('Failed to preview', {
        description: error instanceof Error ? error.message : 'An error occurred while preparing preview.'
      });
    }
  };

  if (isEditing && isLoadingContent) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[800px] w-full" />
      </div>
    );
  }

  const contentTypes = contentTypesData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/admin/cms/contents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? 'Edit Content' : 'Create Content'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? 'Update your content' : 'Create new content for your site'}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form 
          onSubmit={(e) => {
            console.log('[ContentForm] Form submit event triggered');
            console.log('[ContentForm] Form errors:', form.formState.errors);
            console.log('[ContentForm] Form values:', form.getValues());
            form.handleSubmit(onSubmit, (errors) => {
              console.error('[ContentForm] Validation errors:', errors);
              toast.error('Validasi gagal', {
                description: 'Mohon periksa kembali data yang diisi'
              });
            })(e);
          }} 
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content_type_uuid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contentTypes.map((ct) => (
                              <SelectItem key={ct.uuid} value={ct.uuid}>
                                {ct.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Enter content title"
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
                          <Input {...field} placeholder="content-slug" />
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
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Brief summary of the content"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Short description shown in listings (max 1000 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Body</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ContentEditor
                            value={field.value}
                            onChange={field.onChange}
                            height={500}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Title (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="SEO optimized title" maxLength={255} />
                        </FormControl>
                        <FormDescription>
                          Custom title for search engines (max 255 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="SEO meta description"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Meta description for search results
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canonical_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canonical URL (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/canonical-url" type="url" />
                        </FormControl>
                        <FormDescription>
                          Canonical URL to prevent duplicate content issues
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Draft'}
                    </Button>
                    {isEditing && (
                      <Button 
                        type="button" 
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={handlePublish}
                        disabled={publishMutation.isPending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {publishMutation.isPending ? 'Publishing...' : 'Publish'}
                      </Button>
                    )}
                    <Button type="button" variant="outline" className="w-full" onClick={handlePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Featured Content</FormLabel>
                          <FormDescription>
                            Mark as featured content
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

                  <Separator />

                  <FormField
                    control={form.control}
                    name="is_pinned"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Pinned</FormLabel>
                          <FormDescription>
                            Pin to top of list
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

                  <Separator />

                  <FormField
                    control={form.control}
                    name="is_commentable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Allow Comments</FormLabel>
                          <FormDescription>
                            Enable comments for this content
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

              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No categories available</p>
                          ) : (
                            categories.map((category) => (
                              <div key={category.uuid} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`category-${category.uuid}`}
                                  checked={selectedCategories.includes(category.uuid)}
                                  onChange={(e) => {
                                    const newCategories = e.target.checked
                                      ? [...selectedCategories, category.uuid]
                                      : selectedCategories.filter(id => id !== category.uuid);
                                    setSelectedCategories(newCategories);
                                    field.onChange(newCategories);
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <label
                                  htmlFor={`category-${category.uuid}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {category.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
