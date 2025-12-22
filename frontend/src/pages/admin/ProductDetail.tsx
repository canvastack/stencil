import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { productsService } from '@/services/api/products';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { ColorPicker } from '@/components/ui/color-picker';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Package,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { resolveImageUrl } from '@/utils/imageUtils';

interface ProductVariant {
  id: string;
  uuid?: string;
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  stock?: number;
  color?: string;
  size?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  images?: string[];
  status?: 'active' | 'inactive' | 'discontinued';
  createdAt?: string;
  updatedAt?: string;
}

interface VariantFormData {
  sku: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  color: string;
  size: string;
  weight: number;
  status: 'active' | 'inactive' | 'discontinued';
}

const variantColumns: ColumnDef<ProductVariant>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => {
      const sku = row.getValue('sku') as string;
      return <span className="font-mono text-sm">{sku || 'N/A'}</span>;
    },
  },
  {
    accessorKey: 'name',
    header: 'Variant Name',
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      return <span>{name || 'Unnamed'}</span>;
    },
  },
  {
    accessorKey: 'color',
    header: 'Color',
    cell: ({ row }) => {
      const color = row.getValue('color') as string;
      const size = (row.original as ProductVariant).size;
      return (
        <span className="text-sm">
          {color && size ? `${color} / ${size}` : color || size || 'N/A'}
        </span>
      );
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = row.getValue('price') as number;
      return (
        <span className="font-semibold">
          {price ? `Rp ${price.toLocaleString('id-ID')}` : 'N/A'}
        </span>
      );
    },
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => {
      const stock = row.getValue('stock') as number;
      const status = (row.original as ProductVariant).status;
      return (
        <Badge variant={stock > 0 ? 'default' : 'destructive'}>
          {stock || 0} units
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant =
        status === 'active'
          ? 'default'
          : status === 'inactive'
            ? 'secondary'
            : 'destructive';
      return (
        <Badge variant={variant as any}>
          {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Active'}
        </Badge>
      );
    },
  },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { product, isLoading: productLoading, error: productError } = useProduct(id);

  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'overview');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);

  const defaultFormData: VariantFormData = {
    sku: '',
    name: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    color: '',
    size: '',
    weight: 0,
    status: 'active',
  };

  const [formData, setFormData] = useState<VariantFormData>(defaultFormData);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'overview' || tabParam === 'variants')) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (product?.uuid) {
      loadVariants();
    }
  }, [product?.uuid]);

  useEffect(() => {
    if (selectedVariant) {
      setFormData({
        sku: selectedVariant.sku || '',
        name: selectedVariant.name || '',
        description: selectedVariant.description || '',
        price: selectedVariant.price || 0,
        cost: selectedVariant.cost || 0,
        stock: selectedVariant.stock || 0,
        color: selectedVariant.color || '',
        size: selectedVariant.size || '',
        weight: selectedVariant.weight || 0,
        status: selectedVariant.status || 'active',
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [selectedVariant]);

  const loadVariants = async () => {
    if (!product?.uuid) return;
    setIsLoadingVariants(true);
    try {
      const data = await productsService.getProductVariants(product.uuid);
      setVariants(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load product variants');
      console.error(error);
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const handleCreateVariant = () => {
    setSelectedVariant(null);
    setFormData(defaultFormData);
    setIsVariantDialogOpen(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setIsVariantDialogOpen(true);
  };

  const handleDeleteVariant = (variantId: string) => {
    setVariantToDelete(variantId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!product?.uuid || !variantToDelete) return;
    setIsSaving(true);
    try {
      await productsService.deleteVariant(product.uuid, variantToDelete);
      setVariants(variants.filter((v) => v.id !== variantToDelete));
      setIsDeleteDialogOpen(false);
      setVariantToDelete(null);
      toast.success('Variant deleted successfully');
    } catch (error) {
      toast.error('Failed to delete variant');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVariant = async () => {
    if (!product?.uuid) return;
    if (!formData.sku || !formData.name) {
      toast.error('SKU and name are required');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedVariant) {
        await productsService.updateVariant(product.uuid, selectedVariant.id, formData);
        setVariants(
          variants.map((v) =>
            v.id === selectedVariant.id ? { ...v, ...formData } : v
          )
        );
        toast.success('Variant updated successfully');
      } else {
        const newVariant = await productsService.createVariant(product.uuid, formData);
        setVariants([...variants, newVariant]);
        toast.success('Variant created successfully');
      }
      setIsVariantDialogOpen(false);
      setSelectedVariant(null);
    } catch (error) {
      toast.error(selectedVariant ? 'Failed to update variant' : 'Failed to create variant');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const actionColumns: ColumnDef<ProductVariant>[] = [
    ...variantColumns,
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const variant = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditVariant(variant)}
              disabled={isSaving}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteVariant(variant.id)}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold">Product not found</p>
        <Button variant="outline" onClick={() => navigate('/admin/products/catalog')}>
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products/catalog')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">{product.slug}</p>
          </div>
        </div>
        <Link to={`/admin/products/${product.uuid}/edit`}>
          <Button>Edit Product</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Section 1: Basic Info */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Product Name</Label>
                <p className="font-semibold">{product.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">URL Slug</Label>
                <p className="font-mono text-sm">{product.slug}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Short Description</Label>
              <p className="text-sm">{product.description}</p>
            </div>

            {product.longDescription && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Long Description</Label>
                <p className="text-sm">{product.longDescription}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-semibold">
                  {typeof product.category === 'object' && product.category !== null
                    ? product.category.name
                    : product.category || 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Subcategory</Label>
                <p className="font-semibold">{product.subcategory || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Material</Label>
                <p className="font-semibold">{product.material || 'N/A'}</p>
              </div>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Status</Label>
                <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Featured</Label>
                <Badge variant={product.featured ? 'default' : 'secondary'}>
                  {product.featured ? 'Featured' : 'Not Featured'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Section 2: Pricing & Stock */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Pricing & Stock</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Price</Label>
                <p className="text-2xl font-bold">
                  {product.price ? `Rp ${product.price.toLocaleString('id-ID')}` : 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Currency</Label>
                <p className="font-semibold">{product.currency || 'IDR'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Price Unit</Label>
                <p className="font-semibold">{product.priceUnit || 'per pcs'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Minimum Order</Label>
                <p className="font-semibold">{product.minOrder || 1}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Stock Quantity</Label>
                <p className="font-semibold">{product.stockQuantity}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Lead Time</Label>
                <p className="font-semibold">{product.leadTime || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Stock Status</Label>
              <Badge variant={product.inStock ? 'default' : 'destructive'}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </Badge>
            </div>
          </Card>

          {/* Section 3: Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Specifications</h3>
              <div className="space-y-2">
                {product.specifications.map((spec: any, index: number) => (
                  <div key={index} className="flex justify-between py-2 border-b last:border-0">
                    <span className="font-semibold text-sm">{spec.key}</span>
                    <span className="text-muted-foreground text-sm">{spec.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Section 4: Product Images */}
          {product.images && product.images.length > 0 && (
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Product Images</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {product.images.map((image: string, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={resolveImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-40 object-cover rounded border"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm">Image {index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Section 5: SEO */}
          {(product.seoTitle || product.seoDescription || product.seoKeywords) && (
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">SEO Information</h3>
              {product.seoTitle && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">SEO Title</Label>
                  <p className="text-sm">{product.seoTitle}</p>
                </div>
              )}
              {product.seoDescription && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">SEO Description</Label>
                  <p className="text-sm">{product.seoDescription}</p>
                </div>
              )}
              {product.seoKeywords && product.seoKeywords.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">SEO Keywords</Label>
                  <div className="flex flex-wrap gap-2">
                    {product.seoKeywords.map((keyword: string, index: number) => (
                      <Badge key={index} variant="outline">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Product Variants</h2>
            <Button onClick={handleCreateVariant} disabled={isSaving || isLoadingVariants}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {isLoadingVariants ? (
            <Card className="p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </Card>
          ) : variants.length > 0 ? (
            <Card>
              <DataTable columns={actionColumns} data={variants} />
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No variants yet</p>
              <Button onClick={handleCreateVariant} disabled={isSaving}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Variant
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedVariant ? 'Edit Variant' : 'Create New Variant'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleFormChange}
                placeholder="e.g., PROD-001-RED-M"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="name">Variant Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g., Red - Medium"
                disabled={isSaving}
              />
            </div>

            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
              label="Color"
              showPresets={true}
            />

            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                name="size"
                value={formData.size}
                onChange={handleFormChange}
                placeholder="e.g., Medium"
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (Rp)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleFormChange}
                  placeholder="0"
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost (Rp)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  value={formData.cost}
                  onChange={handleFormChange}
                  placeholder="0"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock (units)</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleFormChange}
                  placeholder="0"
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={handleFormChange}
                  placeholder="0"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  status: value as 'active' | 'inactive' | 'discontinued',
                }));
              }}>
                <SelectTrigger id="status" disabled={isSaving}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Variant description"
                disabled={isSaving}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariantDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveVariant} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedVariant ? 'Update' : 'Create'} Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Variant</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this variant? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
