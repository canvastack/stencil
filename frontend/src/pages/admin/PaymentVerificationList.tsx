import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, Eye, CheckCircle, XCircle, Clock, DollarSign, AlertCircle, RefreshCw,
  Download, BarChart3, UserPlus, CheckSquare, FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import PaymentVerificationModal from '@/components/admin/PaymentVerificationModal';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentStats {
  pending_count: number;
  verified_today: number;
  rejected_today: number;
  revenue_today: number;
  pending_amount: number;
  oldest_pending_time: string | null;
}

interface Payment {
  id: number;
  uuid: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  customer: {
    name: string;
    email: string | null;
  };
  bank_details: {
    destination_bank: string | null;
    destination_account_number: string | null;
    transfer_datetime: string | null;
  };
  quote_number: string | null;
  submitted_at: string;
  waiting_time: string;
}

export default function PaymentVerificationList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignToUserId, setAssignToUserId] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsResponse = await tenantApiClient.get('/admin/payment-verification/statistics') as any;
      if (statsResponse && statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Load pending payments - tenantApiClient unwraps paginated responses
      const paymentsResponse = await tenantApiClient.get('/admin/payment-verification/pending', {
        params: { search: searchTerm }
      }) as any;
      
      // Check if response is the unwrapped paginated data (has data array and pagination fields)
      if (Array.isArray(paymentsResponse)) {
        // Response is already unwrapped to just the array
        setPayments(paymentsResponse);
      } else if (paymentsResponse && paymentsResponse.success && paymentsResponse.data) {
        // Response still has success wrapper
        setPayments(paymentsResponse.data);
      } else if (paymentsResponse && paymentsResponse.data && Array.isArray(paymentsResponse.data)) {
        // Response is paginated structure with data array
        setPayments(paymentsResponse.data);
      }
    } catch (error: any) {
      console.error('Failed to load payment data:', error);
      toast.error(error.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleSearch = () => {
    loadData();
  };

  const handleViewDetails = (uuid: string) => {
    setSelectedPayment(uuid);
    setIsModalOpen(true);
  };

  const handleVerificationComplete = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
    loadData(); // Reload data
  };

  const togglePaymentSelection = (uuid: string) => {
    const newSelection = new Set(selectedPayments);
    if (newSelection.has(uuid)) {
      newSelection.delete(uuid);
    } else {
      newSelection.add(uuid);
    }
    setSelectedPayments(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedPayments.size === payments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(payments.map(p => p.uuid)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayments.size === 0) {
      toast.error('No payments selected');
      return;
    }

    if (!confirm(`Are you sure you want to approve ${selectedPayments.size} payment(s)?`)) {
      return;
    }

    try {
      setBulkProcessing(true);
      const response = await tenantApiClient.post('/admin/payment-verification/bulk-approve', {
        payment_uuids: Array.from(selectedPayments),
      }) as any;

      if (response && response.success) {
        toast.success(response.message || 'Bulk approval completed');
        setSelectedPayments(new Set());
        loadData();
      }
    } catch (error: any) {
      console.error('Failed to bulk approve:', error);
      toast.error(error.message || 'Failed to bulk approve payments');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleDownloadProof = async (uuid: string) => {
    try {
      const response = await tenantApiClient.get(`/admin/payment-verification/${uuid}/download-proof`, {
        responseType: 'blob',
      }) as any;

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-proof-${uuid}.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Payment proof downloaded');
    } catch (error: any) {
      console.error('Failed to download proof:', error);
      toast.error('Failed to download payment proof');
    }
  };

  const handleAssignPayment = async () => {
    if (!selectedPayment || !assignToUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      const response = await tenantApiClient.post(`/admin/payment-verification/${selectedPayment}/assign`, {
        assigned_to_user_id: parseInt(assignToUserId),
      }) as any;

      if (response && response.success) {
        toast.success('Payment assigned successfully');
        setShowAssignDialog(false);
        setAssignToUserId('');
        loadData();
      }
    } catch (error: any) {
      console.error('Failed to assign payment:', error);
      toast.error(error.message || 'Failed to assign payment');
    }
  };

  const columns: ColumnDef<Payment>[] = [
    // Only show checkbox column when in select mode
    ...(isSelectMode ? [{
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={selectedPayments.size === payments.length && payments.length > 0}
          onCheckedChange={toggleSelectAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedPayments.has(row.original.uuid)}
          onCheckedChange={() => togglePaymentSelection(row.original.uuid)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }] : []),
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.reference}</div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customer.name}</div>
          {row.original.customer.email && (
            <div className="text-xs text-muted-foreground">{row.original.customer.email}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="font-bold">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: row.original.currency,
            minimumFractionDigits: 0,
          }).format(row.original.amount)}
        </div>
      ),
    },
    {
      accessorKey: 'bank_details',
      header: 'Bank Transfer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.bank_details.destination_bank || 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.bank_details.destination_account_number || 'N/A'}
          </div>
          {row.original.bank_details.transfer_datetime && (
            <div className="text-xs text-muted-foreground">
              {new Date(row.original.bank_details.transfer_datetime).toLocaleString('id-ID')}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'quote_number',
      header: 'Quote',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.quote_number || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'waiting_time',
      header: 'Waiting Time',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{row.original.waiting_time}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleViewDetails(row.original.uuid)}>
              <Eye className="h-4 w-4 mr-2" />
              Review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadProof(row.original.uuid)}>
              <Download className="h-4 w-4 mr-2" />
              Download Proof
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedPayment(row.original.uuid);
              setShowAssignDialog(true);
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to Admin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Payment Verification</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Review and verify customer payment submissions</p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
        <div className="flex flex-wrap gap-2 items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh} 
            disabled={loading || refreshing}
            aria-label="Refresh payment list"
          >
            <RefreshCw className={cn("w-4 h-4 md:mr-2", (loading || refreshing) && "animate-spin")} />
            <span className="hidden md:inline">Refresh</span>
          </Button>

          <Button
            variant={showAnalytics ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Analytics</span>
          </Button>

          <Button
            variant={isSelectMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) {
                // Exit select mode, clear selection
                setSelectedPayments(new Set());
              }
              toast.info(isSelectMode ? 'Selection mode deactivated' : 'Selection mode active - Select payments to bulk approve');
            }}
            aria-label={isSelectMode ? 'Exit selection mode' : 'Enter selection mode for bulk operations'}
          >
            <CheckSquare className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">{isSelectMode ? 'Exit Select Mode' : 'Select Mode'}</span>
          </Button>

          {isSelectMode && selectedPayments.size > 0 && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkApprove}
                disabled={bulkProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">
                  Approve Selected ({selectedPayments.size})
                </span>
                <span className="md:hidden">{selectedPayments.size}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayments(new Set())}
              >
                Clear Selection
              </Button>
            </>
          )}
          
          <div className="flex-1 max-w-md">
            <div className="flex gap-2">
              <Input
                placeholder="Search by reference, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className={cn(refreshing && "animate-pulse")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Verification
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pending_count}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.oldest_pending_time ? `Oldest: ${stats.oldest_pending_time}` : 'No pending payments'}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(refreshing && "animate-pulse")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified Today
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.verified_today}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Revenue: {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(stats.revenue_today)}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(refreshing && "animate-pulse")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected Today
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.rejected_today}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Payments rejected
              </p>
            </CardContent>
          </Card>

          <Card className={cn(refreshing && "animate-pulse")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Amount
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(stats.pending_amount)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Awaiting verification
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments Table */}
      <Card hover={false} className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No pending payments</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={payments}
            searchKey="reference"
            searchPlaceholder="Search payments..."
            loading={loading || refreshing}
            showPagination={false}
            getRowId={(payment) => payment.uuid}
          />
        )}
      </Card>

      {/* Verification Modal */}
      {selectedPayment && (
        <PaymentVerificationModal
          paymentUuid={selectedPayment}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPayment(null);
          }}
          onVerificationComplete={handleVerificationComplete}
        />
      )}

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Payment to Admin</DialogTitle>
            <DialogDescription>
              Select an admin user to assign this payment verification task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-select">Admin User</Label>
              <Select value={assignToUserId} onValueChange={setAssignToUserId}>
                <SelectTrigger id="admin-select">
                  <SelectValue placeholder="Select admin user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Admin User 1</SelectItem>
                  <SelectItem value="2">Admin User 2</SelectItem>
                  <SelectItem value="3">Admin User 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignPayment}>
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Panel */}
      {showAnalytics && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Payment Analytics</h3>
            <Button variant="outline" size="sm" onClick={() => setShowAnalytics(false)}>
              Close
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average Verification Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.5 hours</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Detailed analytics and reports coming soon...
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
