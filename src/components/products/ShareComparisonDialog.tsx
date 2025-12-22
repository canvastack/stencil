import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Share2, Copy, Check, Loader2, Link2, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { comparisonService } from '@/services/api/comparison';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import type { ComparisonConfig, ComparisonShareLink } from '@/types/comparison';

interface ShareComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareComparisonDialog: React.FC<ShareComparisonDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { comparedProducts, notes } = useProductComparison();
  
  const [expiresIn, setExpiresIn] = useState<string>('7');
  const [maxAccess, setMaxAccess] = useState<string>('');
  const [shareLink, setShareLink] = useState<ComparisonShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  const createShareLinkMutation = useMutation({
    mutationFn: async () => {
      const config: ComparisonConfig = {
        productIds: comparedProducts.map(p => p.id),
        notes,
        highlightDifferences: true,
      };

      const options = {
        expiresIn: expiresIn ? parseInt(expiresIn) * 24 * 60 * 60 : undefined,
        maxAccess: maxAccess ? parseInt(maxAccess) : undefined,
      };

      return await comparisonService.createShareLink(config, options);
    },
    onSuccess: (link) => {
      setShareLink(link);
      toast.success('Share link created');
    },
    onError: (error: any) => {
      toast.error('Failed to create share link', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateLink = () => {
    if (comparedProducts.length < 2) {
      toast.error('Please add at least 2 products to share');
      return;
    }

    createShareLinkMutation.mutate();
  };

  const handleClose = () => {
    setShareLink(null);
    setExpiresIn('7');
    setMaxAccess('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Comparison
          </DialogTitle>
          <DialogDescription>
            Generate a shareable link for this product comparison
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {shareLink ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Share link created successfully! Copy and share it with others.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink.url}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="gap-2 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                    <span>Token</span>
                  </div>
                  <p className="font-mono text-xs">{shareLink.token}</p>
                </div>

                {shareLink.expiresAt && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Expires</span>
                    </div>
                    <p className="text-sm">{new Date(shareLink.expiresAt).toLocaleDateString()}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>Access Count</span>
                  </div>
                  <p className="text-sm">
                    {shareLink.accessCount} / {shareLink.maxAccess || '∞'}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Status</span>
                  </div>
                  <Badge variant={shareLink.isActive ? 'default' : 'destructive'}>
                    {shareLink.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  Anyone with this link can view this comparison. The link will expire after {expiresIn} days
                  {maxAccess && ` or ${maxAccess} views`}.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Products to share</span>
                  <Badge variant="secondary">{comparedProducts.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {comparedProducts.map(p => p.name).join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Link Expiration</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger id="expires">
                    <SelectValue placeholder="Select expiration time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="0">Never expires</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The link will be automatically disabled after this period
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAccess">Maximum Views (Optional)</Label>
                <Input
                  id="maxAccess"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxAccess}
                  onChange={(e) => setMaxAccess(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Limit how many times this comparison can be viewed
                </p>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  The shared link will include all products and notes in this comparison. Recipients won't need to log in to view it.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          {shareLink ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateLink}
                disabled={createShareLinkMutation.isPending || comparedProducts.length < 2}
                className="gap-2"
              >
                {createShareLinkMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Generate Share Link
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
