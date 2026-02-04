import { Link } from 'react-router-dom';
import { Quote } from '@/services/tenant/quoteService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Building2,
  User,
  Mail,
  Phone,
  Package,
  Calendar,
  DollarSign,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { QuoteHistory } from './QuoteHistory';

interface QuoteDetailViewProps {
  quote: Quote | null;
  loading?: boolean;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: FileText },
  open: { label: 'Open', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: FileText },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Send },
  countered: { label: 'Countered', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: RefreshCw },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: XCircle },
  revised: { label: 'Revised', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: RefreshCw },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
};

// USD conversion rate (approximate, should come from backend in production)
const USD_RATE = 15750;

const convertToUSD = (idrAmount: number): string => {
  const usdAmount = idrAmount / USD_RATE;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usdAmount);
};

const getStatusBadge = (status: Quote['status']) => {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    icon: FileText
  };
  const Icon = config.icon;
  
  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Loading skeleton component
const QuoteDetailSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
    </Card>

    {/* Content Skeletons */}
    {[1, 2, 3, 4].map((i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const QuoteDetailView = ({
  quote,
  loading = false,
  showActions = true,
  onAccept,
  onReject,
  onCounter,
}: QuoteDetailViewProps) => {
  if (loading) {
    return <QuoteDetailSkeleton />;
  }

  if (!quote) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground">Quote not found</p>
        </CardContent>
      </Card>
    );
  }

  const isReadOnly = ['accepted', 'rejected', 'expired', 'cancelled'].includes(quote.status);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{quote.quote_number}</CardTitle>
                {getStatusBadge(quote.status)}
                {isReadOnly && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Read-Only
                  </Badge>
                )}
              </div>
              <CardDescription>
                Created on {formatDate(quote.created_at)}
              </CardDescription>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(quote.grand_total, quote.currency)}</p>
              <p className="text-sm text-muted-foreground">{convertToUSD(quote.grand_total)}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quote Title & Description */}
      {(quote.title || quote.description) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quote.title && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Title</p>
                <p className="text-base">{quote.title}</p>
              </div>
            )}
            {quote.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-base text-muted-foreground">{quote.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Information Section */}
      {quote.order_id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Related Order</p>
                  <p className="font-medium">Order #{quote.order_id}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/admin/orders/${quote.order_id}`}>
                    View Order
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer & Vendor Information - Side by Side on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="font-medium">{quote.customer.name}</p>
            </div>
            {quote.customer.company && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Company</p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <p>{quote.customer.company}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${quote.customer.email}`} className="text-primary hover:underline">
                  {quote.customer.email}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="font-medium">{quote.vendor.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Company</p>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <p>{quote.vendor.company}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${quote.vendor.email}`} className="text-primary hover:underline">
                  {quote.vendor.email}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quote Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Quote Items
          </CardTitle>
          <CardDescription>
            {quote.items.length} item{quote.items.length !== 1 ? 's' : ''} in this quote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Vendor Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((item, index) => (
                  <TableRow key={item.id || `item-${index}`}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        {item.product && (
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.product.sku}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity} {item.product?.unit || 'pcs'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p>{formatCurrency(item.unit_price, quote.currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {convertToUSD(item.unit_price)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.vendor_cost ? (
                        <div>
                          <p>{formatCurrency(item.vendor_cost, quote.currency)}</p>
                          <p className="text-xs text-muted-foreground">
                            {convertToUSD(item.vendor_cost)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div>
                        <p>{formatCurrency(item.total_price, quote.currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {convertToUSD(item.total_price)}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator className="my-4" />

          {/* Totals Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(quote.total_amount, quote.currency)}</p>
                <p className="text-xs text-muted-foreground">{convertToUSD(quote.total_amount)}</p>
              </div>
            </div>
            
            {quote.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(quote.tax_amount, quote.currency)}</p>
                  <p className="text-xs text-muted-foreground">{convertToUSD(quote.tax_amount)}</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-base font-bold">
              <span>Grand Total</span>
              <div className="text-right">
                <p>{formatCurrency(quote.grand_total, quote.currency)}</p>
                <p className="text-sm font-normal text-muted-foreground">{convertToUSD(quote.grand_total)}</p>
              </div>
            </div>

            {/* Profit Margin Calculation */}
            {quote.items.some(item => item.vendor_cost) && (
              <>
                <Separator />
                <div className="bg-muted/50 p-3 rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Vendor Cost</span>
                    <span className="font-medium">
                      {formatCurrency(
                        quote.items.reduce((sum, item) => sum + (item.vendor_cost || 0) * item.quantity, 0),
                        quote.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profit Margin</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(
                        quote.items.reduce((sum, item) => {
                          const vendorCost = (item.vendor_cost || 0) * item.quantity;
                          return sum + (item.total_price - vendorCost);
                        }, 0),
                        quote.currency
                      )}
                      {' '}
                      ({(
                        (quote.items.reduce((sum, item) => {
                          const vendorCost = (item.vendor_cost || 0) * item.quantity;
                          return sum + (item.total_price - vendorCost);
                        }, 0) / quote.total_amount) * 100
                      ).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Valid Until */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Validity Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Valid until:</span>
            <span className="font-medium">{formatDate(quote.valid_until)}</span>
            {new Date(quote.valid_until) < new Date() && (
              <Badge variant="destructive" className="ml-2">Expired</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      {quote.terms_and_conditions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Terms & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: quote.terms_and_conditions }}
            />
          </CardContent>
        </Card>
      )}

      {/* Internal Notes (Admin Only) */}
      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Internal Notes
            </CardTitle>
            <CardDescription>
              These notes are only visible to admin users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: quote.notes }}
            />
          </CardContent>
        </Card>
      )}

      {/* Negotiation History Timeline */}
      {quote.revision_history && quote.revision_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Negotiation History
            </CardTitle>
            <CardDescription>
              Complete timeline of all quote revisions and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Quote */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div className="w-0.5 h-full bg-border" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Current Version</span>
                    <Badge variant="outline">Rev. {quote.revision_number}</Badge>
                    {getStatusBadge(quote.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatDate(quote.updated_at)}
                  </p>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Amount: </span>
                    <span className="font-medium">{formatCurrency(quote.grand_total, quote.currency)}</span>
                    <span className="text-muted-foreground ml-2">({convertToUSD(quote.grand_total)})</span>
                  </div>
                </div>
              </div>

              {/* Revision History */}
              {quote.revision_history.map((revision, index) => (
                <div key={revision.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    {index < quote.revision_history!.length - 1 && (
                      <div className="w-0.5 h-full bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Revision {revision.revision_number}</span>
                      {getStatusBadge(revision.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formatDate(revision.created_at)}
                    </p>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-medium">{formatCurrency(revision.grand_total, revision.currency)}</span>
                      <span className="text-muted-foreground ml-2">({convertToUSD(revision.grand_total)})</span>
                    </div>
                    {revision.description && (
                      <p className="text-sm text-muted-foreground mt-2">{revision.description}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Initial Creation */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Quote Created</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(quote.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Negotiation History (from history JSON field) */}
      {quote.history && quote.history.length > 0 && (
        <QuoteHistory 
          history={quote.history} 
          currency={quote.currency}
        />
      )}

      {/* Action Buttons (if provided) */}
      {showActions && !isReadOnly && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3 justify-end">
              <Button variant="outline" asChild>
                <Link to="/admin/quotes">Back to Quotes</Link>
              </Button>
              
              {onCounter && ['open', 'sent'].includes(quote.status) && (
                <Button variant="outline" onClick={onCounter}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Counter Offer
                </Button>
              )}
              
              {onReject && ['open', 'countered', 'sent'].includes(quote.status) && (
                <Button variant="destructive" onClick={onReject}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Quote
                </Button>
              )}
              
              {onAccept && ['open', 'countered'].includes(quote.status) && 
                new Date(quote.valid_until) > new Date() && (
                <Button onClick={onAccept}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Quote
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read-Only Notice */}
      {isReadOnly && (
        <Card className="border-muted">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <FileText className="w-5 h-5" />
              <div>
                <p className="font-medium">This quote is read-only</p>
                <p className="text-sm">
                  {quote.status === 'accepted' && 'This quote has been accepted and cannot be modified.'}
                  {quote.status === 'rejected' && 'This quote has been rejected and cannot be modified.'}
                  {quote.status === 'expired' && 'This quote has expired and cannot be modified.'}
                  {quote.status === 'cancelled' && 'This quote has been cancelled and cannot be modified.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
