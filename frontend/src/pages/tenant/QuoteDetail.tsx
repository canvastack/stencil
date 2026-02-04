import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Home,
  FileText,
} from 'lucide-react';
import { QuoteDetailView } from '@/components/tenant/quotes/QuoteDetailView';
import { QuoteActions } from '@/components/tenant/quotes/QuoteActions';
import { quoteService, Quote } from '@/services/tenant/quoteService';
import { useToast } from '@/hooks/use-toast';

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quote data on mount
  useEffect(() => {
    if (!id) {
      setError('Quote ID is required');
      setLoading(false);
      return;
    }

    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await quoteService.getQuote(id);
      setQuote(data);
    } catch (err: any) {
      console.error('Error fetching quote:', err);
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        setError('Quote not found. It may have been deleted or you may not have permission to view it.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view this quote.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load quote. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle action completion (refresh quote data)
  const handleActionComplete = () => {
    fetchQuote();
    toast({
      title: 'Success',
      description: 'Quote action completed successfully.',
      variant: 'default',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quote details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quote) {
    return (
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/quotes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Quote Details</h1>
        </div>

        {/* Error Card */}
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Quote</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'Quote not found or could not be loaded'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/admin/quotes')}>
              Back to Quotes
            </Button>
            <Button onClick={fetchQuote}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <span>/</span>
        <Link to="/admin/quotes" className="hover:text-foreground transition-colors">
          Quotes
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {quote.quote_number}
        </span>
      </nav>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/quotes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Quote Details
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage quote {quote.quote_number}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/quotes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quotes
        </Button>
      </div>

      {/* Expired Quote Warning */}
      {new Date(quote.valid_until) < new Date() && quote.status !== 'expired' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quote has expired on {new Date(quote.valid_until).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}. It can no longer be accepted.
          </AlertDescription>
        </Alert>
      )}

      {/* Quote Detail View */}
      <QuoteDetailView 
        quote={quote} 
        loading={false}
        showActions={false} // Actions are shown separately below
      />

      {/* Quote Actions */}
      {!['accepted', 'rejected', 'expired', 'cancelled'].includes(quote.status) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>
          <QuoteActions 
            quote={quote} 
            onActionComplete={handleActionComplete}
          />
        </Card>
      )}

      {/* Read-Only Notice for Closed Quotes */}
      {['accepted', 'rejected', 'expired', 'cancelled'].includes(quote.status) && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>This quote is read-only.</strong>
            {' '}
            {quote.status === 'accepted' && 'This quote has been accepted and cannot be modified.'}
            {quote.status === 'rejected' && 'This quote has been rejected and cannot be modified.'}
            {quote.status === 'expired' && 'This quote has expired and cannot be modified.'}
            {quote.status === 'cancelled' && 'This quote has been cancelled and cannot be modified.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
