import React, { useState, Suspense } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DataTable
} from '@/components/ui/lazy-components';
import { Star, Search, Filter, Trash2, Eye, Check, X, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

interface Review {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

const mockReviews: Review[] = [
  {
    id: '1',
    customerName: 'Alice Johnson',
    productName: 'Custom Brass Plaque',
    rating: 5,
    comment: 'Excellent quality and fast delivery. The engraving is perfect!',
    status: 'approved',
    date: '2024-01-15',
  },
  {
    id: '2',
    customerName: 'Bob Wilson',
    productName: 'Glass Trophy Set',
    rating: 4,
    comment: 'Good quality but delivery took longer than expected.',
    status: 'pending',
    date: '2024-01-14',
  },
  {
    id: '3',
    customerName: 'Carol Davis',
    productName: 'Metal Nameplate',
    rating: 2,
    comment: 'The product quality is below expectations.',
    status: 'rejected',
    date: '2024-01-13',
  },
];

export default function ReviewList() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStatusChange = (reviewId: string, newStatus: 'approved' | 'rejected') => {
    setReviews(reviews.map(review =>
      review.id === reviewId ? { ...review, status: newStatus } : review
    ));
    toast.success(`Review ${newStatus} successfully`);
  };

  const handleDelete = (reviewId: string) => {
    setReviews(reviews.filter(review => review.id !== reviewId));
    toast.success('Review deleted successfully');
  };

  const columns: ColumnDef<Review>[] = [
    {
      accessorKey: 'customerName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: 'productName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Product
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: 'rating',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Rating
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < row.original.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-1 text-sm text-muted-foreground">
            {row.original.rating}/5
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'comment',
      header: 'Comment',
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">{row.getValue('comment')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <Badge variant={
          row.getValue('status') === 'approved' ? 'default' :
          row.getValue('status') === 'rejected' ? 'destructive' : 'secondary'
        }>
          {row.getValue('status')}
        </Badge>
      ),
    },
    {
      accessorKey: 'date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedReview(review);
                setIsDialogOpen(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {review.status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusChange(review.id, 'approved')}
                >
                  <Check className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusChange(review.id, 'rejected')}
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(review.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Star className="w-8 h-8 text-primary" />
            Customer Reviews
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and moderate customer reviews
          </p>
        </div>
      </div>

      <LazyWrapper>
        <Card className="p-6">
          <DataTable
            columns={columns}
            data={reviews}
            searchPlaceholder="Search reviews..."
            searchKey="customerName"
          />
        </Card>
      </LazyWrapper>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer</label>
                  <p className="text-sm text-muted-foreground">{selectedReview.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Product</label>
                  <p className="text-sm text-muted-foreground">{selectedReview.productName}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Rating</label>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < selectedReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm text-muted-foreground">
                    {selectedReview.rating}/5
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Comment</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedReview.comment}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge variant={
                    selectedReview.status === 'approved' ? 'default' :
                    selectedReview.status === 'rejected' ? 'destructive' : 'secondary'
                  } className="mt-1">
                    {selectedReview.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedReview.date}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
