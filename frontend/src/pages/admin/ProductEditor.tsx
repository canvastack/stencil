import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts, useProduct } from '@/hooks/useProducts';
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { resolveImageUrl } from '@/utils/imageUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, X, Plus, Image as ImageIcon, Trash2, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ColorPicker } from '@/components/ui/color-picker';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import { LivePreview } from '@/components/admin/LivePreview';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ZodError } from 'zod';

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  // Only fetch product data when editing an existing product
  const { product, isLoading } = useProduct(isNew ? '' : (id || ''));
  const { createProduct, updateProduct } = useProducts();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategoriesQuery({ per_page: 100, is_active: true });
  const categories = categoriesData?.data || [];
  
  // Debug: log categories structure
  React.useEffect(() => {
    if (categories.length > 0) {
      console.log('Categories loaded:', { 
        count: categories.length, 
        first: categories[0],
        hasId: 'id' in categories[0],
        hasUuid: 'uuid' in categories[0]
      });
    }
  }, [categories]);

  const defaultFormData = {
    name: '',
    slug: '',
    description: '',
    longDescription: '',
    categoryId: '',
    subcategory: '',
    tags: [] as string[],
    material: '',
    price: 1,
    currency: 'IDR',
    priceUnit: 'per pcs',
    minOrder: 1,
    specifications: [] as Array<{ key: string; value: string }>,
    customizable: false,
    customOptions: [] as Array<any>,
    inStock: true,
    stockQuantity: 0,
    leadTime: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [] as string[],
    status: 'draft',
    featured: false,
    images: [] as string[],
    // Business logic fields
    productionType: 'internal' as 'internal' | 'vendor',
    quotationRequired: false,
    vendorPrice: null as number | null,
    markupPercentage: 0,
    // Form order fields with default values
    productType: '',
    size: '',
    bahan: '',
    bahanOptions: [] as string[],
    kualitas: 'standard', // Default to standard quality
    kualitasOptions: [] as string[],
    ketebalan: '1mm', // Default thickness
    ketebalanOptions: [] as string[],
    ukuran: '15x20', // Default to recommended size
    ukuranOptions: [] as string[],
    warnaBackground: '#FFFFFF', // Default to white background
    designFileUrl: '',
    customTexts: [] as Array<{ text: string; placement: string; position: string; color: string }>,
    notesWysiwyg: '',
  };
  
  const [formData, setFormData] = useState(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');

  const fieldToTabMap: Record<string, string> = {
    name: 'basic',
    slug: 'basic',
    description: 'basic',
    longDescription: 'basic',
    categoryId: 'basic',
    category: 'basic',
    subcategory: 'basic',
    tags: 'basic',
    material: 'basic',
    featured: 'basic',
    price: 'pricing',
    currency: 'pricing',
    priceUnit: 'pricing',
    minOrder: 'pricing',
    maxOrder: 'pricing',
    stockQuantity: 'pricing',
    leadTime: 'pricing',
    inStock: 'pricing',
    vendorPrice: 'pricing',
    markupPercentage: 'pricing',
    productionType: 'pricing',
    quotationRequired: 'pricing',
    specifications: 'specifications',
    customizable: 'customization',
    customOptions: 'customization',
    productType: 'customization',
    size: 'customization',
    bahan: 'customization',
    kualitas: 'customization',
    ketebalan: 'customization',
    ukuran: 'customization',
    warnaBackground: 'customization',
    designFileUrl: 'customization',
    customTexts: 'customization',
    notesWysiwyg: 'customization',
    images: 'images',
    seoTitle: 'seo',
    seoDescription: 'seo',
    seoKeywords: 'seo',
    status: 'seo',
  };

  const getErrorsForTab = (tab: string): string[] => {
    return Object.entries(validationErrors)
      .filter(([field]) => fieldToTabMap[field] === tab)
      .map(([, message]) => message);
  };

  const hasErrorsInTab = (tab: string): boolean => {
    return Object.keys(validationErrors).some(field => fieldToTabMap[field] === tab);
  };

  const parseValidationError = (error: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        errors[field] = err.message;
      });
    } else if (error?.message) {
      const message = error.message;
      Object.keys(fieldToTabMap).forEach(field => {
        if (message.toLowerCase().includes(field.toLowerCase())) {
          errors[field] = message;
        }
      });
      if (Object.keys(errors).length === 0) {
        errors['general'] = message;
      }
    }
    
    return errors;
  };

  useEffect(() => {
    if (isNew) {
      // For new products, set default form values
      setFormData(defaultFormData);
    } else if (product && categories.length > 0) {
      // For existing products, merge product data with defaults
      // Handle category field - map category object to category ID
      let categoryId = '';
      if (product.category) {
        const matchingCategory = categories.find(
          (cat) => cat.uuid === product.category?.uuid || cat.id === product.category?.uuid
        );
        categoryId = matchingCategory ? String(matchingCategory.id) : '';
        console.log('Category mapping:', { productCategory: product.category, matchingCategory, categoryId });
      }
      
      // Handle specifications - backend returns object, form needs array
      let specificationsArray: Array<{ key: string; value: string }> = [];
      if (product.specifications) {
        if (Array.isArray(product.specifications)) {
          specificationsArray = product.specifications;
        } else if (typeof product.specifications === 'object') {
          // Convert object to array format
          specificationsArray = Object.entries(product.specifications).map(([key, value]) => ({
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value)
          }));
        }
      }
      
      setFormData({
        name: product.name ?? '',
        slug: product.slug ?? '',
        description: product.description ?? '',
        longDescription: product.longDescription ?? '',
        categoryId: categoryId,
        subcategory: product.subcategory ?? '',
        tags: product.tags ?? [],
        material: product.material ?? '',
        price: product.price ?? 0,
        currency: product.currency ?? 'IDR',
        priceUnit: product.priceUnit ?? 'per pcs',
        minOrder: product.minOrder ?? 1,
        specifications: specificationsArray,
        customizable: product.customizable ?? false,
        customOptions: product.customOptions ?? [],
        inStock: product.inStock ?? true,
        stockQuantity: product.stockQuantity ?? 0,
        leadTime: product.leadTime ?? '',
        seoTitle: product.seoTitle ?? '',
        seoDescription: product.seoDescription ?? '',
        seoKeywords: product.seoKeywords ?? [],
        status: product.status ?? 'draft',
        featured: product.featured ?? false,
        images: product.images ?? [],
        productionType: product.productionType ?? 'internal',
        quotationRequired: product.quotationRequired ?? false,
        vendorPrice: product.vendorPrice ?? null,
        markupPercentage: product.markupPercentage ?? 0,
        productType: product.productType ?? '',
        size: product.size ?? '',
        bahan: product.bahan ?? '',
        bahanOptions: product.bahanOptions ?? [],
        kualitas: product.kualitas ?? 'standard',
        kualitasOptions: product.kualitasOptions ?? [],
        ketebalan: product.ketebalan ?? '1mm',
        ketebalanOptions: product.ketebalanOptions ?? [],
        ukuran: product.ukuran ?? '15x20',
        ukuranOptions: product.ukuranOptions ?? [],
        warnaBackground: product.warnaBackground ?? '#FFFFFF',
        designFileUrl: product.designFileUrl ?? '',
        customTexts: product.customTexts ?? [],
        notesWysiwyg: product.notesWysiwyg ?? '',
      });
    }
  }, [product, isNew, categories]);

  const handleSave = async () => {
    setValidationErrors({});
    
    const errors: Record<string, string> = {};
    
    if (!formData.name || formData.name.trim().length < 3) {
      errors.name = 'Product name must be at least 3 characters';
    }
    if (!formData.slug || formData.slug.trim().length < 3) {
      errors.slug = 'Slug must be at least 3 characters';
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }
    if (!formData.material || formData.material.trim().length === 0) {
      errors.material = 'Material is required';
    }
    if (formData.images.length === 0) {
      errors.images = 'At least one image is required';
    }
    
    if (formData.productionType === 'internal') {
      if (!formData.price || formData.price <= 0) {
        errors.price = 'Price is required for internal production and must be greater than 0';
      }
      if (formData.stockQuantity === null || formData.stockQuantity === undefined || formData.stockQuantity < 0) {
        errors.stockQuantity = 'Stock quantity is required for internal production';
      }
    }
    
    if (formData.seoTitle && formData.seoTitle.length > 60) {
      errors.seoTitle = 'SEO title must be less than 60 characters';
    }
    
    if (formData.seoDescription && formData.seoDescription.length > 160) {
      errors.seoDescription = 'SEO description must be less than 160 characters';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstErrorField = Object.keys(errors)[0];
      const firstErrorTab = fieldToTabMap[firstErrorField] || 'basic';
      setActiveTab(firstErrorTab);
      
      const errorCount = Object.keys(errors).length;
      toast.error(`Found ${errorCount} validation error${errorCount > 1 ? 's' : ''}. Please check the highlighted fields.`, {
        duration: 5000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const specificationsObject: Record<string, any> = {};
      formData.specifications.forEach((spec: { key: string; value: string }) => {
        if (spec.key) {
          specificationsObject[spec.key] = spec.value;
        }
      });

      if (isNew) {
        await createProduct({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          longDescription: formData.longDescription,
          price: formData.productionType === 'internal' ? formData.price : null,
          currency: formData.currency,
          priceUnit: formData.priceUnit,
          minOrder: formData.minOrder,
          category_id: parseInt(formData.categoryId),
          subcategory: formData.subcategory,
          tags: formData.tags,
          material: formData.material,
          images: formData.images.length > 0 ? formData.images : [],
          inStock: formData.inStock,
          stockQuantity: formData.productionType === 'internal' ? formData.stockQuantity : 0,
          leadTime: formData.leadTime,
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          seoKeywords: formData.seoKeywords,
          status: formData.status,
          featured: formData.featured,
          specifications: specificationsObject,
          customizable: formData.customizable,
          customOptions: formData.customOptions,
          productionType: formData.productionType,
          quotationRequired: formData.quotationRequired,
          vendorPrice: formData.vendorPrice,
          markupPercentage: formData.markupPercentage,
        });
      } else {
        await updateProduct(id || '', {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          longDescription: formData.longDescription,
          price: formData.productionType === 'internal' ? formData.price : null,
          currency: formData.currency,
          priceUnit: formData.priceUnit,
          minOrder: formData.minOrder,
          category_id: parseInt(formData.categoryId),
          subcategory: formData.subcategory,
          tags: formData.tags,
          material: formData.material,
          images: formData.images.length > 0 ? formData.images : [],
          inStock: formData.inStock,
          stockQuantity: formData.productionType === 'internal' ? formData.stockQuantity : 0,
          leadTime: formData.leadTime,
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          seoKeywords: formData.seoKeywords,
          status: formData.status,
          featured: formData.featured,
          specifications: specificationsObject,
          customizable: formData.customizable,
          customOptions: formData.customOptions,
          productionType: formData.productionType,
          quotationRequired: formData.quotationRequired,
          vendorPrice: formData.vendorPrice,
          markupPercentage: formData.markupPercentage,
        });
      }
      setValidationErrors({});
      toast.success(isNew ? 'Product created successfully' : 'Product updated successfully');
      navigate('/admin/products/catalog');
    } catch (error) {
      console.error('Save error:', error);
      
      const parsedErrors = parseValidationError(error);
      setValidationErrors(parsedErrors);
      
      if (Object.keys(parsedErrors).length > 0) {
        const firstErrorField = Object.keys(parsedErrors)[0];
        const firstErrorTab = fieldToTabMap[firstErrorField] || 'basic';
        setActiveTab(firstErrorTab);
        
        const errorCount = Object.keys(parsedErrors).length;
        toast.error(`Found ${errorCount} validation error${errorCount > 1 ? 's' : ''}. Please check the highlighted fields.`, {
          duration: 5000,
        });
      } else {
        toast.error('Failed to save product. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSpecification = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: '', value: '' }],
    });
  };

  const handleRemoveSpecification = (index: number) => {
    setFormData({
      ...formData,
      specifications: formData.specifications.filter((_, i) => i !== index),
    });
  };

  // Only show loading when fetching existing product
  if (isLoading && !isNew) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <Skeleton className="h-10 w-full" />

        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-32 w-full" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            <Skeleton className="h-6 w-40" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products/catalog')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isNew ? 'New Product' : 'Edit Product'}</h1>
            <p className="text-muted-foreground">
              {isNew ? 'Create a new product' : 'Update product details'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/products/catalog')}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              // Generate a temporary slug for new products
              const previewSlug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
              const previewPath = `/products/${previewSlug}?preview=true`;

              // Resolve app base: prefer build-time BASE_URL, otherwise infer from current path
              const getAppBase = () => {
                const base = import.meta.env.BASE_URL || '/';
                if (base && base !== '/') return base;
                const seg = window.location.pathname.split('/').filter(Boolean)[0];
                return seg ? `/${seg}/` : '/';
              };

              const appBase = getAppBase();
              const absoluteUrl = `${window.location.origin}${appBase.replace(/\/+$/,'')}/${previewPath.replace(/^\//,'')}`;

              // Open product details page in a new tab with a preview flag
              window.open(absoluteUrl, '_blank');
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          {!isNew && id && (
            <Button 
              variant="outline"
              onClick={() => navigate(`/admin/products/${id}?tab=variants`)}
            >
              <Package className="mr-2 h-4 w-4" />
              Manage Variants
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {Object.keys(validationErrors).length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors ({Object.keys(validationErrors).length})</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {Object.entries(validationErrors).slice(0, 5).map(([field, message]) => (
                <li key={field} className="text-sm">
                  <strong className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</strong> {message}
                </li>
              ))}
              {Object.keys(validationErrors).length > 5 && (
                <li className="text-sm font-medium">
                  ... and {Object.keys(validationErrors).length - 5} more error{Object.keys(validationErrors).length - 5 > 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic" className="relative">
            Basic Info
            {hasErrorsInTab('basic') && (
              <Badge variant="destructive" className="ml-2 h-4 px-1 text-[10px]">
                {getErrorsForTab('basic').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pricing" className="relative">
            Pricing & Stock
            {hasErrorsInTab('pricing') && (
              <Badge variant="destructive" className="ml-2 h-4 px-1 text-[10px]">
                {getErrorsForTab('pricing').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="specifications" className="relative">
            Specifications
            {hasErrorsInTab('specifications') && (
              <Badge variant="destructive" className="ml-2 h-4 px-1 text-[10px]">
                {getErrorsForTab('specifications').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="customization" className="relative">
            Form Order
            {hasErrorsInTab('customization') && (
              <Badge variant="destructive" className="ml-2 h-4 px-1 text-[10px]">
                {getErrorsForTab('customization').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="images" className="relative">
            Images
            {hasErrorsInTab('images') && (
              <Badge variant="destructive" className="ml-2 h-4 px-1 text-[10px]">
                {getErrorsForTab('images').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="seo" className="relative">
            SEO
            {hasErrorsInTab('seo') && (
              <Badge variant="destructive" className="ml-2 h-4 px-1 text-[10px]">
                {getErrorsForTab('seo').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  Product Name *
                  {validationErrors.name && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </span>
                  )}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationErrors.name) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.name;
                      setValidationErrors(newErrors);
                    }
                  }}
                  placeholder="Enter product name"
                  className={validationErrors.name ? 'border-destructive' : ''}
                />
                {validationErrors.name && (
                  <p className="text-xs text-destructive">{validationErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center gap-2">
                  URL Slug *
                  {validationErrors.slug && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </span>
                  )}
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setFormData({ ...formData, slug: e.target.value });
                    if (validationErrors.slug) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.slug;
                      setValidationErrors(newErrors);
                    }
                  }}
                  placeholder="product-url-slug"
                  className={validationErrors.slug ? 'border-destructive' : ''}
                />
                {validationErrors.slug && (
                  <p className="text-xs text-destructive">{validationErrors.slug}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                Short Description *
                {validationErrors.description && (
                  <span className="text-destructive text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </span>
                )}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (validationErrors.description) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.description;
                    setValidationErrors(newErrors);
                  }
                }}
                placeholder="Brief product description"
                rows={3}
                className={validationErrors.description ? 'border-destructive' : ''}
              />
              {validationErrors.description && (
                <p className="text-xs text-destructive">{validationErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="longDescription">Long Description</Label>
              <Textarea
                id="longDescription"
                value={formData.longDescription}
                onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                placeholder="Detailed product description"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  Category *
                  {validationErrors.categoryId && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </span>
                  )}
                </Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(v) => {
                    setFormData({ ...formData, categoryId: v });
                    if (validationErrors.categoryId) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.categoryId;
                      setValidationErrors(newErrors);
                    }
                  }}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger className={validationErrors.categoryId ? 'border-destructive' : ''}>
                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    {categories.length === 0 && !categoriesLoading && (
                      <SelectItem value="" disabled>No categories available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.categoryId && (
                  <p className="text-xs text-destructive">{validationErrors.categoryId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="Enter subcategory"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material" className="flex items-center gap-2">
                  Material *
                  {validationErrors.material && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </span>
                  )}
                </Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => {
                    setFormData({ ...formData, material: e.target.value });
                    if (validationErrors.material) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.material;
                      setValidationErrors(newErrors);
                    }
                  }}
                  placeholder="e.g., Stainless Steel"
                  className={validationErrors.material ? 'border-destructive' : ''}
                />
                {validationErrors.material && (
                  <p className="text-xs text-destructive">{validationErrors.material}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                placeholder="laser, etching, custom"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label htmlFor="featured">Featured Product</Label>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="space-y-4 border-b pb-4 mb-4">
              <h3 className="text-lg font-semibold">Production Type & Pricing Model</h3>
              <div className="space-y-2">
                <Label htmlFor="productionType">Production Type *</Label>
                <Select 
                  value={formData.productionType} 
                  onValueChange={(v: 'internal' | 'vendor') => {
                    setFormData({ 
                      ...formData, 
                      productionType: v,
                      quotationRequired: v === 'vendor',
                      price: v === 'vendor' ? 0 : formData.price,
                      stockQuantity: v === 'vendor' ? 0 : formData.stockQuantity
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">
                      <div className="flex flex-col">
                        <span className="font-semibold">Internal Production</span>
                        <span className="text-xs text-muted-foreground">Fixed price, tracked stock</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="vendor">
                      <div className="flex flex-col">
                        <span className="font-semibold">Vendor/Broker (Open PO)</span>
                        <span className="text-xs text-muted-foreground">Quotation required, no stock tracking</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.productionType === 'internal' 
                    ? '✅ Price & stock are REQUIRED. Customer can order directly with fixed price.' 
                    : '✅ Price & stock are OPTIONAL. Customer requests quotation first.'}
                </p>
              </div>
            </div>

            {formData.productionType === 'internal' ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-2">
                    Price *
                    {validationErrors.price && (
                      <span className="text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Error
                      </span>
                    )}
                  </Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 1;
                    setFormData({ ...formData, price: Math.max(1, value) });
                    if (validationErrors.price) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.price;
                      setValidationErrors(newErrors);
                    }
                  }}
                  placeholder="1"
                  className={validationErrors.price || formData.price <= 0 ? 'border-destructive' : ''}
                />
                {validationErrors.price && (
                  <p className="text-xs text-destructive">{validationErrors.price}</p>
                )}
                {!validationErrors.price && formData.price <= 0 && (
                  <p className="text-xs text-destructive">Price must be greater than 0</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceUnit">Price Unit</Label>
                <Input
                  id="priceUnit"
                  value={formData.priceUnit}
                  onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                  placeholder="per pcs"
                />
              </div>
            </div>
            
            ) : (
              <>
                <div className="bg-muted/50 p-4 rounded-lg border-2 border-dashed">
                  <p className="text-sm font-semibold mb-2">📋 Quotation-Based Pricing (Open PO)</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Product ini akan menggunakan model quotation. Customer akan request penawaran harga terlebih dahulu sebelum order.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendorPrice">Vendor Base Price (Optional)</Label>
                      <Input
                        id="vendorPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.vendorPrice || ''}
                        onChange={(e) => setFormData({ ...formData, vendorPrice: parseFloat(e.target.value) || null })}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">Harga dari vendor (untuk internal reference)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="markupPercentage">Markup Percentage (%)</Label>
                      <Input
                        id="markupPercentage"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.markupPercentage || 0}
                        onChange={(e) => setFormData({ ...formData, markupPercentage: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">Persentase markup untuk customer pricing</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrder">Minimum Order</Label>
                <Input
                  id="minOrder"
                  type="number"
                  value={formData.minOrder}
                  onChange={(e) => setFormData({ ...formData, minOrder: parseInt(e.target.value) })}
                />
              </div>
              {formData.productionType === 'internal' && (
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity" className="flex items-center gap-2">
                    Stock Quantity *
                    {validationErrors.stockQuantity && (
                      <span className="text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Error
                      </span>
                    )}
                  </Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => {
                      setFormData({ ...formData, stockQuantity: parseInt(e.target.value) });
                      if (validationErrors.stockQuantity) {
                        const newErrors = { ...validationErrors };
                        delete newErrors.stockQuantity;
                        setValidationErrors(newErrors);
                      }
                    }}
                    className={validationErrors.stockQuantity ? 'border-destructive' : ''}
                  />
                  {validationErrors.stockQuantity ? (
                    <p className="text-xs text-destructive">{validationErrors.stockQuantity}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Required for internal production</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="leadTime">Lead Time</Label>
                <Input
                  id="leadTime"
                  value={formData.leadTime}
                  onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                  placeholder="5-7 hari kerja"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="inStock"
                checked={formData.inStock}
                onCheckedChange={(checked) => setFormData({ ...formData, inStock: checked })}
              />
              <Label htmlFor="inStock">In Stock</Label>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Label>Product Specifications</Label>
              <Button variant="outline" size="sm" onClick={handleAddSpecification}>
                <Plus className="mr-2 h-4 w-4" />
                Add Specification
              </Button>
            </div>

            <div className="space-y-2">
              {formData.specifications.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Key"
                    value={spec.key}
                    onChange={(e) => {
                      const newSpecs = [...formData.specifications];
                      newSpecs[index].key = e.target.value;
                      setFormData({ ...formData, specifications: newSpecs });
                    }}
                  />
                  <Input
                    placeholder="Value"
                    value={spec.value}
                    onChange={(e) => {
                      const newSpecs = [...formData.specifications];
                      newSpecs[index].value = e.target.value;
                      setFormData({ ...formData, specifications: newSpecs });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSpecification(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customization" className="space-y-4">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Product Form Order Configuration</h3>
            
            {/* Product Type */}
            <div className="space-y-2">
              <Label htmlFor="productType">Tipe Produk *</Label>
              <Select value={formData.productType} onValueChange={(v) => setFormData({ ...formData, productType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metal">Etching Logam</SelectItem>
                  <SelectItem value="glass">Etching Kaca</SelectItem>
                  <SelectItem value="award">Plakat Penghargaan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bahan with Inline Add Option */}
            <div className="space-y-3">
              <Label htmlFor="bahan">Bahan *</Label>
              <Select value={formData.bahan} onValueChange={(v) => setFormData({ ...formData, bahan: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bahan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="akrilik">Akrilik</SelectItem>
                  <SelectItem value="kuningan">Kuningan</SelectItem>
                  <SelectItem value="tembaga">Tembaga</SelectItem>
                  <SelectItem value="stainless-steel">Stainless Steel</SelectItem>
                  <SelectItem value="aluminum">Aluminum</SelectItem>
                  {formData.bahanOptions.map((opt) => (
                    <SelectItem key={opt} value={opt.toLowerCase().replace(/\s+/g, '-')}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    id="newBahan"
                    placeholder="Tambah bahan baru..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const newVal = e.currentTarget.value.trim();
                        setFormData({ ...formData, bahanOptions: [...formData.bahanOptions, newVal] });
                        e.currentTarget.value = '';
                        toast.success(`Bahan "${newVal}" berhasil ditambahkan`);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('newBahan') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      const newVal = input.value.trim();
                      setFormData({ ...formData, bahanOptions: [...formData.bahanOptions, newVal] });
                      input.value = '';
                      toast.success(`Bahan "${newVal}" berhasil ditambahkan`);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </div>

            {/* Kualitas with Inline Add Option */}
            <div className="space-y-3">
              <Label htmlFor="kualitas">Kualitas *</Label>
              <Select value={formData.kualitas} onValueChange={(v) => setFormData({ ...formData, kualitas: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kualitas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="tinggi">Tinggi</SelectItem>
                  {formData.kualitasOptions.map((opt) => (
                    <SelectItem key={opt} value={opt.toLowerCase().replace(/\s+/g, '-')}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    id="newKualitas"
                    placeholder="Tambah kualitas baru..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const newVal = e.currentTarget.value.trim();
                        setFormData({ ...formData, kualitasOptions: [...formData.kualitasOptions, newVal] });
                        e.currentTarget.value = '';
                        toast.success(`Kualitas "${newVal}" berhasil ditambahkan`);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('newKualitas') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      const newVal = input.value.trim();
                      setFormData({ ...formData, kualitasOptions: [...formData.kualitasOptions, newVal] });
                      input.value = '';
                      toast.success(`Kualitas "${newVal}" berhasil ditambahkan`);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </div>

            {/* Ketebalan with Inline Add Option */}
            <div className="space-y-3">
              <Label htmlFor="ketebalan">Ketebalan</Label>
              <Select value={formData.ketebalan} onValueChange={(v) => setFormData({ ...formData, ketebalan: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ketebalan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5mm">0.5mm</SelectItem>
                  <SelectItem value="1mm">1mm</SelectItem>
                  <SelectItem value="2mm">2mm</SelectItem>
                  <SelectItem value="3mm">3mm</SelectItem>
                  {formData.ketebalanOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    id="newKetebalan"
                    placeholder="Tambah ketebalan baru (contoh: 5mm)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const newVal = e.currentTarget.value.trim();
                        setFormData({ ...formData, ketebalanOptions: [...formData.ketebalanOptions, newVal] });
                        e.currentTarget.value = '';
                        toast.success(`Ketebalan "${newVal}" berhasil ditambahkan`);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('newKetebalan') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      const newVal = input.value.trim();
                      setFormData({ ...formData, ketebalanOptions: [...formData.ketebalanOptions, newVal] });
                      input.value = '';
                      toast.success(`Ketebalan "${newVal}" berhasil ditambahkan`);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </div>

            {/* Ukuran with Inline Add Option */}
            <div className="space-y-3">
              <Label htmlFor="ukuran">Ukuran *</Label>
              <Select value={formData.ukuran} onValueChange={(v) => setFormData({ ...formData, ukuran: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ukuran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10x15">10cm x 15cm</SelectItem>
                  <SelectItem value="15x20">15cm x 20cm (Rekomendasi)</SelectItem>
                  <SelectItem value="20x30">20cm x 30cm</SelectItem>
                  <SelectItem value="30x40">30cm x 40cm</SelectItem>
                  <SelectItem value="custom">Custom Size</SelectItem>
                  {formData.ukuranOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    id="newUkuran"
                    placeholder="Tambah ukuran baru (contoh: 25cm x 35cm)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const newVal = e.currentTarget.value.trim();
                        setFormData({ ...formData, ukuranOptions: [...formData.ukuranOptions, newVal] });
                        e.currentTarget.value = '';
                        toast.success(`Ukuran "${newVal}" berhasil ditambahkan`);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('newUkuran') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      const newVal = input.value.trim();
                      setFormData({ ...formData, ukuranOptions: [...formData.ukuranOptions, newVal] });
                      input.value = '';
                      toast.success(`Ukuran "${newVal}" berhasil ditambahkan`);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </div>

            {/* Warna Background - Color Picker */}
            <ColorPicker
              value={formData.warnaBackground}
              onChange={(color) => setFormData({ ...formData, warnaBackground: color })}
              label="Warna Dasar/Background"
              showPresets={true}
              required={true}
            />

            {/* Design File Upload with Local File Support */}
            <div className="space-y-3">
              <Label htmlFor="designFileUrl">File Upload Design</Label>
              
              <div className="flex gap-2">
                <Input
                  id="designFileUrl"
                  value={formData.designFileUrl}
                  onChange={(e) => setFormData({ ...formData, designFileUrl: e.target.value })}
                  placeholder="URL atau upload dari komputer..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('File terlalu besar. Maksimal 10MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, designFileUrl: reader.result as string });
                          toast.success('File berhasil diupload');
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              
              {formData.designFileUrl && (
                <div className="relative group border rounded-lg p-2">
                  <img
                    src={formData.designFileUrl}
                    alt="Design preview"
                    className="w-full h-48 object-contain bg-muted rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={() => setFormData({ ...formData, designFileUrl: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Upload file dari komputer (max 10MB) atau masukkan URL
              </p>
            </div>

            {/* Custom Text Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Teks Custom (Opsional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      customTexts: [...formData.customTexts, { text: "", placement: "depan", position: "atas", color: "#000000" }]
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Text
                </Button>
              </div>

              <div className="space-y-3">
                {formData.customTexts.map((customText, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Teks Custom #{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newTexts = formData.customTexts.filter((_, i) => i !== index);
                          setFormData({ ...formData, customTexts: newTexts });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Input
                      value={customText.text}
                      onChange={(e) => {
                        const newTexts = [...formData.customTexts];
                        newTexts[index].text = e.target.value;
                        setFormData({ ...formData, customTexts: newTexts });
                      }}
                      placeholder="Masukkan teks custom"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Letak Teks</Label>
                        <Select
                          value={customText.placement}
                          onValueChange={(v) => {
                            const newTexts = [...formData.customTexts];
                            newTexts[index].placement = v;
                            setFormData({ ...formData, customTexts: newTexts });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="depan">Depan</SelectItem>
                            <SelectItem value="belakang">Belakang</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Posisi Teks</Label>
                        <Select
                          value={customText.position}
                          onValueChange={(v) => {
                            const newTexts = [...formData.customTexts];
                            newTexts[index].position = v;
                            setFormData({ ...formData, customTexts: newTexts });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="atas">Atas</SelectItem>
                            <SelectItem value="bawah">Bawah</SelectItem>
                            <SelectItem value="kiri">Kiri</SelectItem>
                            <SelectItem value="kanan">Kanan</SelectItem>
                            <SelectItem value="tengah">Tengah</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <ColorPicker
                      value={customText.color}
                      onChange={(color) => {
                        const newTexts = [...formData.customTexts];
                        newTexts[index].color = color;
                        setFormData({ ...formData, customTexts: newTexts });
                      }}
                      label="Warna Teks"
                      showPresets={true}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes WYSIWYG Editor */}
            <div className="space-y-2 border-t pt-4">
              <WysiwygEditor
                value={formData.notesWysiwyg}
                onChange={(content) => setFormData({ ...formData, notesWysiwyg: content })}
                label="Catatan Tambahan"
                placeholder="Tambahkan catatan khusus atau instruksi tambahan untuk produk ini..."
                height={300}
                required={true}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card className="p-6 space-y-4">
            {validationErrors.images && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationErrors.images}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                Product Images (Max 10MB per image) *
                {validationErrors.images && (
                  <span className="text-destructive text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </span>
                )}
              </Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = (e: any) => {
                    const files = Array.from(e.target.files || []) as File[];
                    files.forEach((file) => {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error(`File ${file.name} terlalu besar. Maksimal 10MB per gambar.`);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({
                          ...prev,
                          images: [...prev.images, reader.result as string]
                        }));
                        if (validationErrors.images) {
                          const newErrors = { ...validationErrors };
                          delete newErrors.images;
                          setValidationErrors(newErrors);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                  };
                  input.click();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Images
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={resolveImageUrl(image)}
                    alt={`Product ${index + 1}`}
                    className="w-full h-40 object-cover rounded border"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {index === 0 && (
                    <Badge className="absolute bottom-2 left-2">Primary</Badge>
                  )}
                </div>
              ))}
              <div 
                className="w-full h-40 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = (e: any) => {
                    const files = Array.from(e.target.files || []) as File[];
                    files.forEach((file) => {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error(`File ${file.name} terlalu besar. Maksimal 10MB per gambar.`);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({
                          ...prev,
                          images: [...prev.images, reader.result as string]
                        }));
                        if (validationErrors.images) {
                          const newErrors = { ...validationErrors };
                          delete newErrors.images;
                          setValidationErrors(newErrors);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                  };
                  input.click();
                }}
              >
                <div className="text-center">
                  <ImageIcon className={`mx-auto h-8 w-8 ${validationErrors.images ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <p className={`text-sm mt-2 ${validationErrors.images ? 'text-destructive' : 'text-muted-foreground'}`}>Upload Image</p>
                  <p className={`text-xs mt-1 ${validationErrors.images ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {validationErrors.images ? 'Required!' : 'Max 10MB'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle" className="flex items-center gap-2">
                SEO Title
                {validationErrors.seoTitle && (
                  <span className="text-destructive text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </span>
                )}
              </Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => {
                  setFormData({ ...formData, seoTitle: e.target.value });
                  if (validationErrors.seoTitle) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.seoTitle;
                    setValidationErrors(newErrors);
                  }
                }}
                placeholder="Product name - Company"
                maxLength={60}
                className={validationErrors.seoTitle || formData.seoTitle.length > 60 ? 'border-destructive' : ''}
              />
              <p className={`text-xs ${validationErrors.seoTitle || formData.seoTitle.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {formData.seoTitle.length}/60 characters
                {(validationErrors.seoTitle || formData.seoTitle.length > 60) && ' - SEO title must be less than 60 characters'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription" className="flex items-center gap-2">
                SEO Description
                {validationErrors.seoDescription && (
                  <span className="text-destructive text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </span>
                )}
              </Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) => {
                  setFormData({ ...formData, seoDescription: e.target.value });
                  if (validationErrors.seoDescription) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.seoDescription;
                    setValidationErrors(newErrors);
                  }
                }}
                placeholder="Brief description for search engines"
                rows={3}
                maxLength={160}
                className={validationErrors.seoDescription || formData.seoDescription.length > 160 ? 'border-destructive' : ''}
              />
              <p className={`text-xs ${validationErrors.seoDescription || formData.seoDescription.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {formData.seoDescription.length}/160 characters
                {(validationErrors.seoDescription || formData.seoDescription.length > 160) && ' - Must be less than 160 characters'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoKeywords">SEO Keywords (comma separated)</Label>
              <Input
                id="seoKeywords"
                value={formData.seoKeywords.join(', ')}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value.split(',').map(k => k.trim()) })}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Publish Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Live Preview Section */}
      <div className="border-t mt-6 pt-6">
        <LivePreview 
          previewUrl={`/products/${formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-')}?preview=true`}
          initialDevice="desktop"
          compactMode={true}
        />
      </div>
    </div>
  );
}
