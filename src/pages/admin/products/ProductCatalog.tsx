import { useState, useEffect, useCallback } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { useProducts } from '@/hooks/useProducts';
import type { Product, ProductFilters } from '@/types/product';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { resolveImageUrl } from '@/utils/imageUtils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Package,
  Star,
  ShoppingCart,
  ImageIcon,
  Download,
  Upload,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

export default function ProductCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    per_page: 12,
    search: '',
    category: '',
    status: '',
    featured: undefined,
    inStock: undefined,
  });
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { 
    products, 
    pagination, 
    isLoading, 
    error, 
    fetchProducts, 
    deleteProduct 
  } = useProducts();

  // Fetch products when filters change
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchProducts(filters);
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [filters, fetchProducts]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setFilters(prev => ({ 
      ...prev, 
      search: value,
      page: 1 // Reset to first page on search
    }));
  }, []);

  const handleFilterChange = useCallback((key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1 // Reset to first page on filter change
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleQuickView = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  }, []);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      await deleteProduct(productId);
    }
  }, [deleteProduct]);

  const formatPrice = useCallback((price: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
    }).format(price);
  }, []);

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      per_page: 12,
      search: '',
      category: '',
      status: '',
      featured: undefined,
      inStock: undefined,
    });
    setSearchQuery('');
  };

  // Enhanced Card with hover effects
  const EnhancedCard = ({ 
    children, 
    className = "",
    ...props 
  }: { 
    children: React.ReactNode; 
    className?: string;
    [key: string]: any;
  }) => (
    <Card 
      className={`relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
      {children}
    </Card>
  );

  // Calculate stats
  const productsData = products || [];
  const totalProducts = pagination?.total || 0;
  const featuredProducts = productsData.filter((p) => p.featured).length;
  const activeProducts = productsData.filter((p) => p.status === 'active').length;
  const totalValue = productsData.reduce((sum, p) => sum + (p.price || 0), 0);

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-3">
            <img
              src={resolveImageUrl(product.images?.[0] || product.image_url)}
              alt={product.name}
              className="h-12 w-12 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/100/100';
              }}
            />
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const product = row.original;
        return <Badge variant="outline">{product.category?.name || 'Uncategorized'}</Badge>;
      },
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const formatted = formatPrice(product.price, product.currency);
        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: 'stock_quantity',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-2">
            <span>{product.stock_quantity}</span>
            {product.stock_quantity <= 10 && (
              <Badge variant="destructive" className="text-xs">
                Low Stock
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Badge
            variant={
              product.status === 'published'
                ? 'default'
                : product.status === 'draft'
                ? 'secondary'
                : 'destructive'
            }
          >
            {product.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'featured',
      header: 'Featured',
      cell: ({ row }) => {
        const product = row.original;
        return product.featured ? (
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
        ) : null;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleQuickView(product)}>
                <Eye className="mr-2 h-4 w-4" />
                Quick View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to={`/admin/products/${product.id}/edit`} className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteProduct(product.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Product Grid Card Component
  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <div className="relative">
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
          {product.images.length > 0 ? (
            <img
              src={resolveImageUrl(product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleQuickView(product)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Quick View
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/admin/products/${product.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/admin/products/${product.id}`}>
                    <Package className="mr-2 h-4 w-4" />
                    Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-lg line-clamp-2 hover:text-blue-600 transition-colors">
                <Link to={`/admin/products/${product.id}`}>
                  {product.name}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground">{product.category}</p>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(product.price, product.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Min. order: {product.minOrder} {product.priceUnit}
                </p>
              </div>
              
              <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
            </div>
            
            {product.inStock && product.stockQuantity !== undefined && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="w-3 h-3" />
                <span>Stock: {product.stockQuantity}</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );

  // Product List Row Component  
  const ProductRow = ({ product }: { product: Product }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
            {product.images.length > 0 ? (
              <img
                src={resolveImageUrl(product.images[0])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold hover:text-blue-600 transition-colors">
                    <Link to={`/admin/products/${product.id}`}>
                      {product.name}
                    </Link>
                  </h3>
                  {product.featured && (
                    <Star className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{product.category}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  {product.description}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(product.price, product.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Min. {product.minOrder} {product.priceUnit}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4">
                <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
                
                {product.inStock ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    In Stock ({product.stockQuantity || 0})
                  </Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleQuickView(product)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/products/${product.id}/edit`}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your product inventory and catalog</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Stacked Cards */}
          <div className="space-y-3">
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Featured</p>
                  <p className="text-2xl font-bold">{featuredProducts}</p>
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeProducts}</p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Middle Column - Total Value */}
          <EnhancedCard className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="p-4 bg-blue-500/10 rounded-lg inline-block mb-4">
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Total Value</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatPrice(totalValue, 'IDR')}
              </p>
            </div>
          </EnhancedCard>

          {/* Right Column - Quick Actions */}
          <EnhancedCard className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-4">
              <div className="p-4 bg-purple-500/10 rounded-lg inline-block mb-4">
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/admin/products/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {/* Filters */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="mb-2 block">Search</Label>
                  <Input
                    placeholder="Product name, description, SKU..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Category</Label>
                  <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="etching">Etching</SelectItem>
                      <SelectItem value="engraving">Engraving</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="award">Awards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Status</Label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Filters auto-applied
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    disabled={isLoading}
                    size="icon"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>



      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading products: {error}</p>
            <Button
              variant="outline"
              onClick={() => fetchProducts(filters)}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

        {/* Products Data Table */}
        <Card className="p-6">
          <DataTable
            columns={columns}
            data={productsData}
            searchKey="name"
            searchPlaceholder="Search products..."
            loading={isLoading}
            datasetId="product-catalog"
          />
        </Card>

      {/* Quick View Dialog */}
      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Quick View</DialogTitle>
            <DialogDescription>
              Preview product details and specifications
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={resolveImageUrl(selectedProduct.images[0])}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-muted-foreground">{selectedProduct.category}</p>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(selectedProduct.price, selectedProduct.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Minimum order: {selectedProduct.minOrder} {selectedProduct.priceUnit}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProduct.description}
                  </p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={selectedProduct.status === 'published' ? 'default' : 'secondary'}>
                    {selectedProduct.status}
                  </Badge>
                  {selectedProduct.featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {selectedProduct.inStock ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      In Stock
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickViewOpen(false)}>
              Close
            </Button>
            {selectedProduct && (
              <>
                <Button variant="outline" asChild>
                  <Link to={`/admin/products/${selectedProduct.id}`}>
                    <Package className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </Button>
                <Button asChild>
                  <Link to={`/admin/products/${selectedProduct.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Product
                  </Link>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </LazyWrapper>
  );
}