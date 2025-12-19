import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts, useProduct } from '@/hooks/useProducts';
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
import { ArrowLeft, Save, Eye, X, Plus, Image as ImageIcon, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { ColorPicker } from '@/components/ui/color-picker';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import { LivePreview } from '@/components/admin/LivePreview';

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  // Only fetch product data when editing an existing product
  const { product, isLoading } = useProduct(isNew ? '' : (id || ''));
  const { createProduct, updateProduct } = useProducts();

  const defaultFormData = {
    name: '',
    slug: '',
    description: '',
    longDescription: '',
    category: '',
    subcategory: '',
    tags: [] as string[],
    material: '',
    price: 0,
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

  useEffect(() => {
    if (isNew) {
      // For new products, set default form values
      setFormData(defaultFormData);
    } else if (product) {
      // For existing products, merge product data with defaults
      // Handle category field - backend returns object, form needs string
      const categoryValue = typeof product.category === 'object' && product.category !== null
        ? product.category.name || ''
        : product.category || '';
      
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
        category: categoryValue,
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
  }, [product, isNew]);

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Product name and slug are required');
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        await createProduct({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          longDescription: formData.longDescription,
          price: formData.price,
          currency: formData.currency,
          priceUnit: formData.priceUnit,
          minOrder: formData.minOrder,
          category: formData.category,
          subcategory: formData.subcategory,
          tags: formData.tags,
          material: formData.material,
          images: formData.images.length > 0 ? formData.images : [],
          inStock: formData.inStock,
          stockQuantity: formData.stockQuantity,
          leadTime: formData.leadTime,
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          seoKeywords: formData.seoKeywords,
          status: formData.status,
          featured: formData.featured,
          specifications: formData.specifications,
          customizable: formData.customizable,
          customOptions: formData.customOptions,
        });
      } else {
        await updateProduct(id || '', {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          longDescription: formData.longDescription,
          price: formData.price,
          currency: formData.currency,
          priceUnit: formData.priceUnit,
          minOrder: formData.minOrder,
          category: formData.category,
          subcategory: formData.subcategory,
          tags: formData.tags,
          material: formData.material,
          images: formData.images.length > 0 ? formData.images : [],
          inStock: formData.inStock,
          stockQuantity: formData.stockQuantity,
          leadTime: formData.leadTime,
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          seoKeywords: formData.seoKeywords,
          status: formData.status,
          featured: formData.featured,
          specifications: formData.specifications,
          customizable: formData.customizable,
          customOptions: formData.customOptions,
        });
      }
      toast.success(isNew ? 'Product created successfully' : 'Product updated successfully');
      navigate('/admin/products/catalog');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save product');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading product...</p>
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

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="customization">Form Order</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="product-url-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief product description"
                rows={3}
              />
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
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Etching">Etching</SelectItem>
                    <SelectItem value="Awards">Awards</SelectItem>
                    <SelectItem value="Signage">Signage</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="material">Material *</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="e.g., Stainless Steel"
                />
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  placeholder="0"
                />
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
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                />
              </div>
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
            <div className="flex justify-between items-center">
              <Label>Product Images (Max 10MB per image)</Label>
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
                      };
                      reader.readAsDataURL(file);
                    });
                  };
                  input.click();
                }}
              >
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Upload Image</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="Product name - Company"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">{formData.seoTitle.length}/60 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="Brief description for search engines"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">{formData.seoDescription.length}/160 characters</p>
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
