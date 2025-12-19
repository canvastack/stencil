import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MoreVertical, Edit, Trash2, Tag, Package, Search, Filter, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/useCategories';
import { Category, CategoryFilters } from '@/types/category';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductCategories() {
  const {
    categories,
    isLoading,
    isSaving,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>({
    sort: 'sort_order',
    order: 'asc',
  });
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#ff8000',
    is_active: true,
  });

  // Load categories on component mount
  useEffect(() => {
    fetchCategories(filters);
  }, [fetchCategories, filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ 
        name: '', 
        slug: '', 
        description: '', 
        color: '#ff8000',
        is_active: true,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '#ff8000',
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      await deleteCategory(id);
    }
  };

  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search: search || undefined };
    setFilters(newFilters);
  };

  const handleFilterChange = (key: keyof CategoryFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-light bg-clip-text text-transparent">
            Product Categories
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize your products into categories for better navigation
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingCategory(null);
                setFormData({ 
                  name: '', 
                  slug: '', 
                  description: '', 
                  color: '#ff8000',
                  is_active: true,
                });
              }}
              className="bg-gradient-to-r from-primary to-orange-light hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Update the category information below' 
                  : 'Add a new product category to organize your items'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="e.g., Awards & Trophies"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="awards-trophies"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in the URL: /products/{formData.slug || 'category-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Category Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#ff8000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={String(formData.is_active)} 
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Active categories will be visible on the public website
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    `${editingCategory ? 'Update' : 'Create'} Category`
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search categories..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select 
              value={filters.is_active !== undefined ? String(filters.is_active) : 'all'} 
              onValueChange={(value) => 
                handleFilterChange('is_active', value === 'all' ? undefined : value === 'true')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select 
              value={filters.sort || 'sort_order'} 
              onValueChange={(value) => handleFilterChange('sort', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sort_order">Sort Order</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchCategories(filters)}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFilters({ sort: 'sort_order', order: 'asc' })}
              >
                <Filter className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-l-4 border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="w-8 h-8 rounded" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="group hover:shadow-lg transition-all duration-300 border-l-4 overflow-hidden"
              style={{ borderLeftColor: category.color || '#ff8000' }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color || '#ff8000'}20` }}
                    >
                      <Tag className="w-6 h-6" style={{ color: category.color || '#ff8000' }} />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        /{category.slug}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant={category.is_active ? "default" : "secondary"} className="text-xs">
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info(`Viewing products in ${category.name}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Products
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(category.id)}
                          className="text-destructive"
                          disabled={isSaving}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {category.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {category.product_count} {category.product_count === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(category.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => toast.info(`Viewing products in ${category.name}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Products
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(category)}
                    disabled={isSaving}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Tag className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600">Error Loading Categories</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Failed to load categories. Please try refreshing the page.
              </p>
            </div>
            <Button onClick={() => fetchCategories(filters)} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {!isLoading && categories && categories.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No categories yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Create your first category to organize your products
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
