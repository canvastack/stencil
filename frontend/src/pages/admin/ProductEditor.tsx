import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts, useProduct, useProductBySlug } from '@/hooks/useProducts';
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery';
import { useFormConfiguration } from '@/hooks/useFormConfiguration';
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
import { ArrowLeft, Save, Eye, X, Plus, Image as ImageIcon, Trash2, Package, AlertCircle, CheckCircle2, FileText, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { ColorPicker } from '@/components/ui/color-picker';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import { SpecificationInput } from '@/components/ui/specification-input';
import { LivePreview } from '@/components/admin/LivePreview';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ZodError } from 'zod';
import { DynamicFormField } from '@/components/form-builder/DynamicFormField';

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  // Only fetch product data when editing an existing product
  const { product, isLoading } = useProduct(isNew ? '' : (id || ''));
  const { createProduct, updateProduct, fetchProductBySlug } = useProducts();
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
    productionType: '' as '' | 'internal' | 'vendor',
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
  const [originalFormData, setOriginalFormData] = useState(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [slugCheckTimeout, setSlugCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [formBuilderMode, setFormBuilderMode] = useState<'simple' | 'advanced'>('simple');

  const { 
    configuration: formConfiguration, 
    isLoading: formConfigLoading,
    fetchConfiguration: refetchFormConfiguration
  } = useFormConfiguration(!isNew && product?.uuid ? product.uuid : undefined);

  React.useEffect(() => {
    if (activeTab === 'customization' && !isNew && product?.uuid && refetchFormConfiguration) {
      console.log('[ProductEditor] Customization tab activated, refetching form configuration...');
      refetchFormConfiguration();
    }
  }, [activeTab, product?.uuid, isNew, refetchFormConfiguration]);

  React.useEffect(() => {
    const handleFocus = () => {
      if (!isNew && product?.uuid && refetchFormConfiguration) {
        console.log('[ProductEditor] Window focus regained, refetching form configuration...');
        refetchFormConfiguration();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [product?.uuid, isNew, refetchFormConfiguration]);

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
    product_type: 'customization',
    size: 'customization',
    bahan: 'customization',
    bahanOptions: 'customization',
    bahan_options: 'customization',
    kualitas: 'customization',
    kualitasOptions: 'customization',
    kualitas_options: 'customization',
    ketebalan: 'customization',
    ketebalanOptions: 'customization',
    ketebalan_options: 'customization',
    ukuran: 'customization',
    ukuranOptions: 'customization',
    ukuran_options: 'customization',
    warnaBackground: 'customization',
    warna_background: 'customization',
    designFileUrl: 'customization',
    design_file_url: 'customization',
    customTexts: 'customization',
    custom_texts: 'customization',
    notesWysiwyg: 'customization',
    notes_wysiwyg: 'customization',
    availableSizes: 'customization',
    available_sizes: 'customization',
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

  const formatFieldName = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'production_type': 'Production Type',
      'productionType': 'Production Type',
      'category_id': 'Category',
      'categoryId': 'Category',
      'long_description': 'Long Description',
      'longDescription': 'Long Description',
      'product_type': 'Product Type',
      'productType': 'Product Type',
      'bahan': 'Material (Bahan)',
      'bahan_options': 'Material Options',
      'bahanOptions': 'Material Options',
      'kualitas': 'Quality (Kualitas)',
      'kualitas_options': 'Quality Options',
      'kualitasOptions': 'Quality Options',
      'ketebalan': 'Thickness (Ketebalan)',
      'ketebalan_options': 'Thickness Options',
      'ketebalanOptions': 'Thickness Options',
      'ukuran': 'Size (Ukuran)',
      'ukuran_options': 'Size Options',
      'ukuranOptions': 'Size Options',
      'warna_background': 'Background Color',
      'warnaBackground': 'Background Color',
      'design_file_url': 'Design File URL',
      'designFileUrl': 'Design File URL',
      'custom_texts': 'Custom Texts',
      'customTexts': 'Custom Texts',
      'notes_wysiwyg': 'Product Notes',
      'notesWysiwyg': 'Product Notes',
      'seo_title': 'SEO Title',
      'seoTitle': 'SEO Title',
      'seo_description': 'SEO Description',
      'seoDescription': 'SEO Description',
      'seo_keywords': 'SEO Keywords',
      'seoKeywords': 'SEO Keywords',
      'price_unit': 'Price Unit',
      'priceUnit': 'Price Unit',
      'min_order': 'Minimum Order',
      'minOrder': 'Minimum Order',
      'stock_quantity': 'Stock Quantity',
      'stockQuantity': 'Stock Quantity',
      'lead_time': 'Lead Time',
      'leadTime': 'Lead Time',
      'vendor_price': 'Vendor Price',
      'vendorPrice': 'Vendor Price',
      'markup_percentage': 'Markup Percentage',
      'markupPercentage': 'Markup Percentage',
    };

    if (fieldMap[field]) {
      return fieldMap[field];
    }

    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const parseValidationError = (error: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        errors[field] = err.message;
      });
    } else if (error?.originalError?.response?.data?.errors) {
      const backendErrors = error.originalError.response.data.errors;
      Object.entries(backendErrors).forEach(([field, messages]: [string, any]) => {
        const messageArray = Array.isArray(messages) ? messages : [messages];
        errors[field] = messageArray[0] || 'Validation error';
      });
    } else if (error?.response?.data?.errors) {
      const backendErrors = error.response.data.errors;
      Object.entries(backendErrors).forEach(([field, messages]: [string, any]) => {
        const messageArray = Array.isArray(messages) ? messages : [messages];
        errors[field] = messageArray[0] || 'Validation error';
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
      setOriginalFormData(defaultFormData);
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
      
      // Handle specifications - backend returns object, form needs array with proper value types
      let specificationsArray: Array<{ key: string; value: any }> = [];
      if (product.specifications) {
        if (Array.isArray(product.specifications)) {
          specificationsArray = product.specifications;
        } else if (typeof product.specifications === 'object') {
          // Convert object to array format while preserving value types
          specificationsArray = Object.entries(product.specifications).map(([key, value]) => ({
            key,
            value: value
          }));
        }
      }
      
      const loadedFormData = {
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
        productionType: product.productionType ?? '',
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
      };
      
      setFormData(loadedFormData);
      setOriginalFormData(loadedFormData);
    }
  }, [product, isNew, categories]);

  // Check if form has any changes
  const hasFormChanges = (): boolean => {
    if (isNew) return true; // For new products, always enable save
    
    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  };

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
    if (!formData.productionType || formData.productionType.trim().length === 0) {
      errors.productionType = 'Production Type is required';
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
      const errorFields = Object.keys(errors).slice(0, 3).map(formatFieldName).join(', ');
      toast.error(`Please fix: ${errorFields}${errorCount > 3 ? `, and ${errorCount - 3} more field${errorCount - 3 > 1 ? 's' : ''}` : ''}`, {
        duration: 6000,
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
          productType: formData.productType,
          bahan: formData.bahan,
          bahanOptions: formData.bahanOptions,
          kualitas: formData.kualitas,
          kualitasOptions: formData.kualitasOptions,
          ketebalan: formData.ketebalan,
          ketebalanOptions: formData.ketebalanOptions,
          ukuran: formData.ukuran,
          ukuranOptions: formData.ukuranOptions,
          warnaBackground: formData.warnaBackground,
          designFileUrl: formData.designFileUrl,
          customTexts: formData.customTexts,
          notesWysiwyg: formData.notesWysiwyg,
          availableSizes: formData.availableSizes,
          size: formData.size,
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
          productType: formData.productType,
          bahan: formData.bahan,
          bahanOptions: formData.bahanOptions,
          kualitas: formData.kualitas,
          kualitasOptions: formData.kualitasOptions,
          ketebalan: formData.ketebalan,
          ketebalanOptions: formData.ketebalanOptions,
          ukuran: formData.ukuran,
          ukuranOptions: formData.ukuranOptions,
          warnaBackground: formData.warnaBackground,
          designFileUrl: formData.designFileUrl,
          customTexts: formData.customTexts,
          notesWysiwyg: formData.notesWysiwyg,
          availableSizes: formData.availableSizes,
          size: formData.size,
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
        const errorFields = Object.keys(parsedErrors).slice(0, 3).map(formatFieldName).join(', ');
        toast.error(`Validation failed: ${errorFields}${errorCount > 3 ? `, and ${errorCount - 3} more` : ''}`, {
          duration: 6000,
        });
      } else {
        toast.error('Failed to save product. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateUniqueSlug = (baseSlug: string): string => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    setIsSlugChecking(true);
    try {
      const existingProduct = await fetchProductBySlug(slug);
      
      if (existingProduct) {
        if (isNew || existingProduct.uuid !== id) {
          setSlugAvailable(false);
          const uniqueSlug = generateUniqueSlug(slug.replace(/-[a-z0-9]{6}$/, ''));
          setFormData(prev => ({ ...prev, slug: uniqueSlug }));
          toast.warning(`Slug "${slug}" sudah digunakan. Diubah menjadi "${uniqueSlug}"`);
        } else {
          setSlugAvailable(true);
        }
      } else {
        setSlugAvailable(true);
      }
    } catch (error) {
      setSlugAvailable(true);
    } finally {
      setIsSlugChecking(false);
    }
  };

  useEffect(() => {
    if (slugCheckTimeout) {
      clearTimeout(slugCheckTimeout);
    }

    if (formData.slug && formData.slug.length >= 3) {
      const timeout = setTimeout(() => {
        checkSlugAvailability(formData.slug);
      }, 500);
      setSlugCheckTimeout(timeout);
    }

    return () => {
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
      }
    };
  }, [formData.slug]);

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

  const handleSpecificationChange = (index: number, spec: { key: string; value: any }) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index] = spec;
    setFormData({ ...formData, specifications: newSpecs });
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
          <Button onClick={handleSave} disabled={isSaving || !hasFormChanges()}>
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
        <Alert variant="destructive" className="mb-4 border-red-600 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900 dark:text-red-200 font-semibold">
            Validation Errors ({Object.keys(validationErrors).length})
          </AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-300">
            <p className="text-sm mb-2 font-medium">Please fix the following errors before saving:</p>
            <ul className="list-none mt-3 space-y-2 bg-white dark:bg-gray-900/50 rounded-md p-3 border border-red-200 dark:border-red-800">
              {Object.entries(validationErrors).slice(0, 10).map(([field, message]) => (
                <li key={field} className="text-sm text-gray-900 dark:text-gray-100 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>
                    <strong className="text-red-700 dark:text-red-400 font-semibold">{formatFieldName(field)}:</strong>
                    <span className="ml-1.5 text-gray-700 dark:text-gray-300">{message}</span>
                  </span>
                </li>
              ))}
              {Object.keys(validationErrors).length > 10 && (
                <li className="text-sm font-medium text-red-600 dark:text-red-400 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>... and {Object.keys(validationErrors).length - 10} more error{Object.keys(validationErrors).length - 10 > 1 ? 's' : ''}</span>
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
                    const newName = e.target.value;
                    const autoSlug = generateSlugFromName(newName);
                    setFormData({ ...formData, name: newName, slug: autoSlug });
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
                  {isSlugChecking && (
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Checking...
                    </span>
                  )}
                  {!isSlugChecking && slugAvailable === true && (
                    <span className="text-green-600 text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Available
                    </span>
                  )}
                  {!isSlugChecking && slugAvailable === false && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Not Available
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
                <p className="text-xs text-muted-foreground">
                  Slug akan otomatis di-generate dari Product Name. Edit manual jika diperlukan.
                </p>
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
              <WysiwygEditor
                value={formData.longDescription}
                onChange={(content) => setFormData({ ...formData, longDescription: content })}
                label="Long Description"
                placeholder="Detailed product description with rich text formatting..."
                height={400}
                required={false}
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
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories available</div>
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
                <Label htmlFor="productionType" className="flex items-center gap-2">
                  Production Type *
                  {validationErrors.productionType && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </span>
                  )}
                </Label>
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
                    if (validationErrors.productionType) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.productionType;
                      setValidationErrors(newErrors);
                    }
                  }}
                >
                  <SelectTrigger className={validationErrors.productionType ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select production type..." />
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
                {validationErrors.productionType && (
                  <p className="text-xs text-destructive">{validationErrors.productionType}</p>
                )}
                {formData.productionType && (
                  <p className="text-xs text-muted-foreground">
                    {formData.productionType === 'internal' 
                      ? '✅ Price & stock are REQUIRED. Customer can order directly with fixed price.' 
                      : '✅ Price & stock are OPTIONAL. Customer requests quotation first.'}
                  </p>
                )}
              </div>
            </div>

            {!formData.productionType ? (
              <div className="bg-muted/30 p-6 rounded-lg border-2 border-dashed text-center">
                <p className="text-sm text-muted-foreground">Please select a production type above to configure pricing & stock settings.</p>
              </div>
            ) : formData.productionType === 'internal' ? (
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
              <div>
                <Label className="text-lg font-semibold">Product Specifications</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Tambahkan spesifikasi produk dengan format yang fleksibel: text, array, atau key-value pairs
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddSpecification}>
                <Plus className="mr-2 h-4 w-4" />
                Add Specification
              </Button>
            </div>

            {formData.specifications.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">Belum ada spesifikasi produk</p>
                <Button variant="outline" onClick={handleAddSpecification}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Spesifikasi Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.specifications.map((spec, index) => (
                  <SpecificationInput
                    key={index}
                    index={index}
                    value={spec}
                    onChange={(newSpec) => handleSpecificationChange(index, newSpec)}
                    onRemove={() => handleRemoveSpecification(index)}
                  />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="customization" className="space-y-4">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-semibold">Product Form Order Configuration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {formConfiguration 
                    ? 'Form builder configuration sudah dibuat. Edit untuk mengubah form pemesanan.' 
                    : 'Belum ada form configuration. Buat form builder untuk customize order form.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {formConfiguration && (
                  <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Form Active
                  </Badge>
                )}
                <Button
                  type="button"
                  variant={formConfiguration ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isNew || !product) {
                      toast.error('Simpan produk terlebih dahulu', {
                        description: 'Form Builder hanya tersedia untuk produk yang sudah disimpan'
                      });
                      return;
                    }
                    navigate(`/admin/products/${product.uuid}/form-builder`);
                  }}
                  disabled={isNew || !product}
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  {formConfiguration ? 'Edit Form Builder' : 'Create Form Builder'}
                </Button>
              </div>
            </div>

            {isNew && (
              <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertTitle className="text-yellow-900 dark:text-yellow-200">Simpan Produk Terlebih Dahulu</AlertTitle>
                <AlertDescription className="text-yellow-800 dark:text-yellow-300 text-sm">
                  💡 Form Builder hanya tersedia setelah produk disimpan. Simpan produk ini untuk mulai membuat form order custom.
                </AlertDescription>
              </Alert>
            )}

            {!isNew && formConfigLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Memuat form configuration...</p>
                </div>
              </div>
            )}

            {!isNew && !formConfigLoading && formConfiguration?.formSchema && (
              <div className="space-y-6">
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-900 dark:text-blue-200">Form Preview</AlertTitle>
                  <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
                    Berikut adalah preview dari form order yang akan ditampilkan kepada customer. 
                    Klik tombol "Edit Form Builder" di atas untuk mengubah konfigurasi form.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg p-6 bg-muted/30">
                  <div className="mb-6">
                    {formConfiguration.formSchema.title && (
                      <h4 className="text-xl font-semibold mb-2">{formConfiguration.formSchema.title}</h4>
                    )}
                    {formConfiguration.formSchema.description && (
                      <p className="text-sm text-muted-foreground">{formConfiguration.formSchema.description}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {formConfiguration.formSchema.fields
                      ?.sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((field) => (
                        <div key={field.id} className="bg-background p-4 rounded-lg border">
                          <DynamicFormField
                            field={field}
                            value={undefined}
                            onChange={() => {}}
                            error={undefined}
                          />
                        </div>
                      ))}
                  </div>

                  {formConfiguration.formSchema.fields?.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Belum ada field yang ditambahkan ke form ini.</p>
                      <p className="text-sm text-muted-foreground mt-2">Klik "Edit Form Builder" untuk menambahkan field.</p>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Form Configuration Details</p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>• Total Fields: {formConfiguration.formSchema.fields?.length || 0}</p>
                        <p>• Version: {formConfiguration.formSchema.version || '1.0'}</p>
                        <p>• Last Modified: {formConfiguration.updated_at ? new Date(formConfiguration.updated_at).toLocaleDateString('id-ID') : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isNew && !formConfigLoading && !formConfiguration && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Belum Ada Form Configuration</h4>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Form order untuk produk ini belum dibuat. Klik tombol "Create Form Builder" di atas untuk membuat form pemesanan yang dapat dikustomisasi sesuai kebutuhan produk Anda.
                </p>
                <Button
                  variant="default"
                  onClick={() => {
                    if (product?.uuid) {
                      navigate(`/admin/products/${product.uuid}/form-builder`);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Form Sekarang
                </Button>
              </div>
            )}
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
