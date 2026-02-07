import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileEdit,
  X,
} from 'lucide-react';
import { QuoteForm } from '@/components/tenant/quotes/QuoteForm';
import { quoteService, Quote, UpdateQuoteRequest } from '@/services/tenant/quoteService';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Editable statuses - only these can be edited
// draft: Initial state before sending
// open: Sent to vendor, awaiting response
// sent: Sent but can still be edited if needed
// countered: Vendor made counter offer, can be revised
const EDITABLE_STATUSES = ['draft', 'open', 'sent', 'countered'] as const;

export default function QuoteEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // State management
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

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
      
      console.log('[QuoteEdit] Fetched quote data:', data);
      
      // Check if data is valid
      if (!data || !data.id) {
        console.error('[QuoteEdit] Invalid quote data:', data);
        setError('Quote data is empty or invalid');
        setQuote(null);
        return;
      }
      
      // Validate that quote can be edited
      if (!EDITABLE_STATUSES.includes(data.status as any)) {
        console.warn('[QuoteEdit] Quote status not editable:', data.status);
        setError(`This quote cannot be edited. Only quotes with status "draft", "open", "sent", or "countered" can be edited. Current status: ${data.status}`);
        setQuote(null);
      } else {
        console.log('[QuoteEdit] Quote loaded successfully:', data.quote_number);
        setQuote(data);
      }
    } catch (err: any) {
      console.error('[QuoteEdit] Error fetching quote:', err);
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        setError('Quote not found. It may have been deleted or you may not have permission to view it.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to edit this quote.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load quote. Please try again.');
      }
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: UpdateQuoteRequest) => {
    if (!id) return;

    setSaving(true);
    try {
      await quoteService.updateQuote(id, data);
      
      toast({
        title: 'Success',
        description: 'Quote updated successfully.',
        variant: 'default',
      });

      // Clear unsaved changes flag
      setHasUnsavedChanges(false);

      // Redirect to detail page
      navigate(`/admin/quotes/${id}`);
    } catch (err: any) {
      console.error('Error updating quote:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to update quote. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(`/admin/quotes/${id}`);
      setShowUnsavedDialog(true);
    } else {
      navigate(`/admin/quotes/${id}`);
    }
  };

  // Handle navigation with unsaved changes
  const handleConfirmNavigation = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  // Detect form changes (this would be called from QuoteForm if it exposed a change handler)
  // For now, we'll set it to true on any form interaction
  useEffect(() => {
    if (quote && !loading) {
      // Set up a listener for form changes
      // This is a simple implementation - in production you might want more sophisticated change detection
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          // Modern browsers ignore custom messages, but we still need to set returnValue
          return (e.returnValue = '');
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [quote, loading, hasUnsavedChanges]);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quote...</p>
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
          <h1 className="text-3xl font-bold">Edit Quote</h1>
        </div>

        {/* Error Card */}
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Cannot Edit Quote</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'Quote not found or cannot be edited'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/admin/quotes')}>
              Back to Quotes
            </Button>
            {id && (
              <Button onClick={() => navigate(`/admin/quotes/${id}`)}>
                View Quote
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileEdit className="w-8 h-8" />
              Edit Quote
            </h1>
            <p className="text-muted-foreground mt-1">
              Editing {quote.quote_number}
            </p>
          </div>
        </div>
      </div>

      {/* Actions - Sticky Header Style */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-4 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Updating quote {quote.quote_number}. Customer, vendor, and order cannot be changed.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm"
              form="quote-edit-form"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FileEdit className="w-4 h-4 mr-2" />
                  Update Quote
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Status Warning for 'countered' quotes */}
      {quote.status === 'countered' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This quote has been countered. 
            Changes will update the current counter offer. 
            The vendor will need to review the updated terms.
          </AlertDescription>
        </Alert>
      )}

      {/* Quote Form */}
      <QuoteForm
        mode="edit"
        initialData={{
          ...quote,
          customer_id: quote.customer_id || quote.customer?.id, // Ensure customer_id is set
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
        formId="quote-edit-form"
      />

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page? 
              All unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
