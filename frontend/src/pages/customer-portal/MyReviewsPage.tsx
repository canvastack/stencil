import { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  Edit, 
  Trash2, 
  Plus, 
  CheckCircle, 
  Clock, 
  Image as ImageIcon,
  RefreshCw,
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Search,
  ArrowUpDown,
  Package,
  ThumbsUp,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Input,
} from '@/components/ui/lazy-components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { customerReviewApi } from '@/services/api/customerReviewApi';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';

interface Review {
  id: number;
  uuid: string;
  product: {
    id: number;
    uuid: string;
    name: string;
    image: string;
  };
  order: {
    id: number;
    uuid: string;
    order_number: string;
  } | null;
  rating: number;
  title: string;
  content: string;
  images: string[];
  is_verified_purchase: boolean;
  is_approved: boolean;
  approved_at: string | null;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

interface EligibleProduct {
  id: number;
  uuid: string;
  name: string;
  image: string;
  order: {
    id: number;
    uuid: string;
    order_number: string;
    completed_at: string;
  } | null;
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligibleProducts, setEligibleProducts] = useState<EligibleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<EligibleProduct | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    content: '',
    images: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  useEffect(() => {
    loadReviews();
    loadEligibleProducts();
  }, []);

  const loadReviews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await customerReviewApi.getMyReviews();
      if (response.success) {
        setReviews(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load reviews:', error);
      setError(error.response?.status === 401 ? 'API not implemented yet' : 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadEligibleProducts = async () => {
    try {
      const response = await customerReviewApi.getEligibleProducts();
      if (response.success) {
        setEligibleProducts(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load eligible products:', error);
      // Don't set error here, just log it
    }
  };

  const handleOpenReviewDialog = (product: EligibleProduct) => {
    setSelectedProduct(product);
    setReviewForm({
      rating: 0,
      title: '',
      content: '',
      images: [],
    });
    setEditingReview(null);
    setShowReviewDialog(true);
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setReviewForm({
      rating: review.rating,
      title: review.title,
      content: review.content,
      images: review.images,
    });
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (reviewForm.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!reviewForm.title.trim()) {
      toast.error('Please enter a review title');
      return;
    }
    if (reviewForm.content.length < 50) {
      toast.error('Review content must be at least 50 characters');
      return;
    }
    if (reviewForm.content.length > 1000) {
      toast.error('Review content must not exceed 1000 characters');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingReview) {
        // Update existing review
        const response = await customerReviewApi.updateReview(editingReview.uuid, reviewForm);
        if (response.success) {
          toast.success('Review updated successfully');
          setShowReviewDialog(false);
          loadReviews();
        }
      } else if (selectedProduct) {
        // Submit new review
        const response = await customerReviewApi.submitReview({
          product_id: selectedProduct.id,
          order_id: selectedProduct.order?.id,
          ...reviewForm,
        });
        if (response.success) {
          toast.success('Review submitted successfully. It will be visible after admin approval.');
          setShowReviewDialog(false);
          loadReviews();
          loadEligibleProducts();
        }
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (review: Review) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await customerReviewApi.deleteReview(review.uuid);
      if (response.success) {
        toast.success('Review deleted successfully');
        loadReviews();
        loadEligibleProducts();
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Failed to delete review');
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    loadReviews(true);
    toast.success('Reviews refreshed');
  };

  /**
   * Handle export
   */
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    toast.info(`Exporting reviews as ${format.toUpperCase()}...`);
    // TODO: Implement export functionality
  };

  /**
   * Filter reviews based on search and status
   */
  const filteredReviews = useMemo(() => {
    let filtered = reviews;
    
    // Filter by status
    if (statusFilter === 'approved') {
      filtered = filtered.filter((r) => r.is_approved);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter((r) => !r.is_approved);
    }
    
    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((r) => 
        r.product.name?.toLowerCase().includes(searchLower) ||
        r.title?.toLowerCase().includes(searchLower) ||
        r.content?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [reviews, statusFilter, search]);

  /**
   * Calculate stats from reviews
   */
  const stats = useMemo(() => {
    return {
      total: reviews.length,
      approved: reviews.filter((r) => r.is_approved).length,
      pending: reviews.filter((r) => !r.is_approved).length,
      avgRating: reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0',
    };
  }, [reviews]);

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (review: Review) => {
    if (review.is_approved) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  /**
   * Table columns definition for My Reviews
   */
  const reviewColumns: ColumnDef<Review>[] = useMemo(() => [
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex items-center gap-3">
            <img
              src={review.product.image || '/placeholder.svg'}
              alt={review.product.name}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1">
              <div className="font-medium">{review.product.name}</div>
              {review.order && (
                <div className="text-sm text-muted-foreground">
                  Order: {review.order.order_number}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'rating',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Rating
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const rating = row.getValue('rating') as number;
        return renderStars(rating);
      },
    },
    {
      accessorKey: 'title',
      header: 'Review',
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div>
            <div className="font-medium mb-1">{review.title}</div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {review.content}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'is_approved',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex flex-col gap-2">
            {getStatusBadge(review)}
            {review.is_verified_purchase && (
              <Badge variant="outline" className="text-xs w-fit">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'helpful_count',
      header: 'Helpful',
      cell: ({ row }) => {
        const count = row.getValue('helpful_count') as number;
        return (
          <div className="flex items-center gap-1 text-sm">
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            {count}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Posted
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue('created_at') as string;
        return (
          <div className="text-sm">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex gap-2">
            {!review.is_approved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditReview(review)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteReview(review)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [handleEditReview, handleDeleteReview]);

  /**
   * Table columns definition for Eligible Products
   */
  const eligibleColumns: ColumnDef<EligibleProduct>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-3">
            <img
              src={product.image || '/placeholder.svg'}
              alt={product.name}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1">
              <div className="font-medium">{product.name}</div>
              {product.order && (
                <div className="text-sm text-muted-foreground">
                  Order: {product.order.order_number}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'order.completed_at',
      header: 'Completed',
      cell: ({ row }) => {
        const product = row.original;
        if (!product.order) return '-';
        return (
          <div className="text-sm">
            {formatDistanceToNow(new Date(product.order.completed_at), { addSuffix: true })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Button onClick={() => handleOpenReviewDialog(product)}>
            <Plus className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        );
      },
    },
  ], [handleOpenReviewDialog]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle API not implemented yet
  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">My Reviews</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage your product reviews and share your experience
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Reviews Coming Soon</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              The product review system is currently being set up. You'll be able to review products and share your experience here soon.
            </p>
            <Button onClick={() => window.location.href = '/customer/dashboard'} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">My Reviews</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage your product reviews and share your experience
          </p>
        </div>
      </div>

      <Tabs defaultValue="my-reviews" className="space-y-4 md:space-y-6">
        <TabsList>
          <TabsTrigger value="my-reviews">
            My Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="write-review">
            Write Review ({eligibleProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-reviews" className="space-y-4 md:space-y-6">
          {/* Sticky Toolbar */}
          <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh} 
                disabled={loading || refreshing}
              >
                <RefreshCw className={cn("w-4 h-4 md:mr-2", (loading || refreshing) && "animate-spin")} />
                <span className="hidden md:inline">Refresh</span>
              </Button>
              
              {/* Live Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="hidden md:inline text-xs text-gray-600 dark:text-gray-400">Live</span>
              </div>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    disabled={loading || filteredReviews.length === 0}
                  >
                    <Download className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Statistics Cards - 4 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={cn(refreshing && "animate-pulse")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Reviews
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  All your reviews
                </p>
              </CardContent>
            </Card>

            <Card className={cn(refreshing && "animate-pulse")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.approved}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Published reviews
                </p>
              </CardContent>
            </Card>

            <Card className={cn(refreshing && "animate-pulse")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.pending}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card className={cn(refreshing && "animate-pulse")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Rating
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Star className="w-5 h-5 text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgRating}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Out of 5 stars
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product, title, or content..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'approved' | 'pending')}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardContent className="p-6">
              <DataTable
                columns={reviewColumns}
                data={filteredReviews}
                loading={loading}
              />
            </CardContent>
          </Card>

          {/* Empty State */}
          {!loading && filteredReviews.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                <p className="text-muted-foreground mb-4">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by reviewing products you\'ve purchased'}
                </p>
                {(search || statusFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('all');
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="write-review" className="space-y-4 md:space-y-6">
          {/* Data Table for Eligible Products */}
          <Card>
            <CardContent className="p-6">
              <DataTable
                columns={eligibleColumns}
                data={eligibleProducts}
                loading={loading}
              />
            </CardContent>
          </Card>

          {/* Empty State */}
          {!loading && eligibleProducts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No products to review</h3>
                <p className="text-muted-foreground mb-4">
                  Complete an order to leave a review
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReview ? 'Edit Review' : 'Write a Review'}
            </DialogTitle>
            <DialogDescription>
              {editingReview
                ? 'Update your review (only possible before approval)'
                : 'Share your experience with this product'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedProduct && (
              <div className="flex gap-4 p-4 bg-muted rounded-lg">
                <img
                  src={selectedProduct.image || '/placeholder.svg'}
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{selectedProduct.name}</p>
                  {selectedProduct.order && (
                    <p className="text-sm text-muted-foreground">
                      Order: {selectedProduct.order.order_number}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Rating *</Label>
              {renderStars(reviewForm.rating, true, (rating) =>
                setReviewForm({ ...reviewForm, rating })
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Review Title *</Label>
              <Input
                id="title"
                placeholder="Summarize your experience"
                value={reviewForm.title}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, title: e.target.value })
                }
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {reviewForm.title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Review Content *</Label>
              <Textarea
                id="content"
                placeholder="Share your detailed experience with this product (minimum 50 characters)"
                value={reviewForm.content}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, content: e.target.value })
                }
                rows={6}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {reviewForm.content.length}/1000 characters (minimum 50)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Photos (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Photo upload coming soon
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
