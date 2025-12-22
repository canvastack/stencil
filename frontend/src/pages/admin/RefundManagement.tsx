import React, { useState } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  DataTable,
  Input,
  Label,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui/lazy-components';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  RotateCcw,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Edit2,
  Trash2,
  Filter,
  X,
  AlertCircle,
  TrendingUp,
  Shield,
  Users,
  Calendar,
  MessageSquare,
  Upload,
  Download,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  useRefunds, 
  useCreateRefundRequest, 
  useUpdateRefundRequest, 
  useDeleteRefund,
  useApproveRefund,
  useProcessRefund
} from '@/hooks/useRefunds';
import { 
  RefundRequest, 
  RefundStatus, 
  RefundReason, 
  RefundType,
  ApprovalDecision,
  CreateRefundRequestData 
} from '@/types/refund';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function RefundManagement() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    refundReason: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Create API compatible filters
  const apiFilters = {
    search: filters.search || undefined,
    status: filters.status !== 'all' ? filters.status as RefundStatus : undefined,
    refund_reason: filters.refundReason !== 'all' ? filters.refundReason as RefundReason : undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
  };

  const refundsQuery = useRefunds(apiFilters);
  const refunds = refundsQuery.data?.data || [];
  const pagination = refundsQuery.data?.meta || { page: 1, per_page: 15, total: 0, last_page: 1 };
  const isLoading = refundsQuery.isLoading;
  const error = refundsQuery.error?.message;
  
  // Ensure refunds is always an array for consistent data handling
  const refundsData = refunds || [];

  // Mutations
  const createRefundMutation = useCreateRefundRequest();
  const updateRefundMutation = useUpdateRefundRequest();
  const deleteRefundMutation = useDeleteRefund();
  const approveRefundMutation = useApproveRefund();
  const processRefundMutation = useProcessRefund();

  // Component state
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refundToDelete, setRefundToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [createForm, setCreateForm] = useState<CreateRefundRequestData>({
    orderId: '',
    refundReason: RefundReason.CustomerRequest,
    refundType: RefundType.PartialRefund,
    customerRequestAmount: 0,
    customerNotes: '',
  });

  const [approvalForm, setApprovalForm] = useState({
    decision: ApprovalDecision.Approved,
    decisionNotes: '',
    adjustedAmount: 0,
  });

  // Status color mapping
  const statusColors = {
    [RefundStatus.PendingReview]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [RefundStatus.UnderInvestigation]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [RefundStatus.PendingFinance]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    [RefundStatus.PendingManager]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [RefundStatus.Approved]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [RefundStatus.Processing]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    [RefundStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [RefundStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [RefundStatus.Disputed]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [RefundStatus.Cancelled]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const reasonColors = {
    [RefundReason.CustomerRequest]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [RefundReason.QualityIssue]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [RefundReason.TimelineDelay]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [RefundReason.VendorFailure]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    [RefundReason.ProductionError]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [RefundReason.ShippingDamage]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    [RefundReason.Other]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  // Status labels in Indonesian
  const statusLabels = {
    [RefundStatus.PendingReview]: 'Menunggu Review',
    [RefundStatus.UnderInvestigation]: 'Dalam Investigasi', 
    [RefundStatus.PendingFinance]: 'Menunggu Finance',
    [RefundStatus.PendingManager]: 'Menunggu Manager',
    [RefundStatus.Approved]: 'Disetujui',
    [RefundStatus.Processing]: 'Diproses',
    [RefundStatus.Completed]: 'Selesai',
    [RefundStatus.Rejected]: 'Ditolak',
    [RefundStatus.Disputed]: 'Sengketa',
    [RefundStatus.Cancelled]: 'Dibatalkan',
  };

  const reasonLabels = {
    [RefundReason.CustomerRequest]: 'Permintaan Customer',
    [RefundReason.QualityIssue]: 'Masalah Kualitas',
    [RefundReason.TimelineDelay]: 'Keterlambatan',
    [RefundReason.VendorFailure]: 'Kegagalan Vendor',
    [RefundReason.ProductionError]: 'Error Produksi',
    [RefundReason.ShippingDamage]: 'Kerusakan Pengiriman',
    [RefundReason.Other]: 'Lainnya',
  };

  // Helper function to safely format currency
  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'Rp -';
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Table columns configuration
  const columns: ColumnDef<RefundRequest>[] = [
    {
      accessorKey: 'requestNumber',
      header: 'Request Number',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.requestNumber}</div>
      ),
    },
    {
      accessorKey: 'order',
      header: 'Order',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.order?.orderNumber}</div>
          <div className="text-sm text-muted-foreground">{row.original.order?.customerName}</div>
        </div>
      ),
    },
    {
      accessorKey: 'refundReason',
      header: 'Alasan Refund',
      cell: ({ row }) => (
        <Badge variant="outline" className={reasonColors[row.original.refundReason]}>
          {reasonLabels[row.original.refundReason]}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'calculation.refundableToCustomer',
      header: 'Jumlah Refund',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.calculation?.refundableToCustomer)}
        </div>
      ),
    },
    {
      accessorKey: 'requestedAt',
      header: 'Tanggal Request',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.requestedAt ? format(new Date(row.original.requestedAt), 'dd/MM/yyyy HH:mm', { locale: id }) : '-'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewRefund(row.original)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {(row.original.status === RefundStatus.PendingReview || 
            row.original.status === RefundStatus.UnderInvestigation) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditRefund(row.original)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRefund(row.original.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {(row.original.status === RefundStatus.PendingFinance || 
            row.original.status === RefundStatus.PendingManager) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleApproveRefund(row.original)}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          {row.original.status === RefundStatus.Approved && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleProcessRefund(row.original.id)}
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Event handlers
  const handleCreateRefund = () => {
    setCreateForm({
      orderId: '',
      refundReason: RefundReason.CustomerRequest,
      refundType: RefundType.PartialRefund,
      customerRequestAmount: 0,
      customerNotes: '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleViewRefund = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setIsDetailDialogOpen(true);
  };

  const handleEditRefund = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setCreateForm({
      orderId: refund.orderId,
      refundReason: refund.refundReason,
      refundType: refund.refundType,
      customerRequestAmount: refund.customerRequestAmount,
      customerNotes: refund.customerNotes,
    });
    setIsCreateDialogOpen(true);
  };

  const handleApproveRefund = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setApprovalForm({
      decision: ApprovalDecision.Approved,
      decisionNotes: '',
      adjustedAmount: refund.calculation.refundableToCustomer,
    });
    setIsApprovalDialogOpen(true);
  };

  const handleDeleteRefund = (id: string) => {
    setRefundToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleProcessRefund = async (id: string) => {
    try {
      await processRefundMutation.mutateAsync({ id });
    } catch (error) {
      console.error('Process refund failed:', error);
    }
  };

  const handleSubmitCreateRefund = async () => {
    try {
      if (selectedRefund) {
        // Edit mode
        await updateRefundMutation.mutateAsync({
          id: selectedRefund.id,
          data: createForm
        });
      } else {
        // Create mode
        await createRefundMutation.mutateAsync(createForm);
      }
      setIsCreateDialogOpen(false);
      setSelectedRefund(null);
    } catch (error) {
      console.error('Submit refund failed:', error);
    }
  };

  const handleSubmitApproval = async () => {
    if (!selectedRefund) return;

    try {
      await approveRefundMutation.mutateAsync({
        id: selectedRefund.id,
        data: approvalForm
      });
      setIsApprovalDialogOpen(false);
      setSelectedRefund(null);
    } catch (error) {
      console.error('Approve refund failed:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!refundToDelete) return;

    try {
      await deleteRefundMutation.mutateAsync(refundToDelete);
      setIsDeleteDialogOpen(false);
      setRefundToDelete(null);
    } catch (error) {
      console.error('Delete refund failed:', error);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium">Error loading refunds</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Refund Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola permintaan refund dan approval workflow</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refundsQuery.refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleCreateRefund}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Refund Request
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <RotateCcw className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Refunds</p>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {refunds.filter(r => 
                      r.status === RefundStatus.PendingReview || 
                      r.status === RefundStatus.UnderInvestigation ||
                      r.status === RefundStatus.PendingFinance ||
                      r.status === RefundStatus.PendingManager
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {refunds.filter(r => r.status === RefundStatus.Completed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    Rp {refunds
                      .reduce((sum, r) => sum + (r.calculation.refundableToCustomer || 0), 0)
                      .toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search refunds..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundReason">Refund Reason</Label>
                  <Select value={filters.refundReason} onValueChange={(value) => setFilters({ ...filters, refundReason: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Reasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reasons</SelectItem>
                      {Object.entries(reasonLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="p-6">
          <DataTable
            columns={columns}
            data={refundsData}
            searchKey="requestNumber"
            searchPlaceholder="Search by request number..."
            loading={isLoading}
          />
        </Card>

        {/* Create/Edit Refund Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedRefund ? 'Edit Refund Request' : 'Create New Refund Request'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  placeholder="Enter order ID"
                  value={createForm.orderId}
                  onChange={(e) => setCreateForm({ ...createForm, orderId: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refundReason">Refund Reason</Label>
                  <Select
                    value={createForm.refundReason}
                    onValueChange={(value: RefundReason) => setCreateForm({ ...createForm, refundReason: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(reasonLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundType">Refund Type</Label>
                  <Select
                    value={createForm.refundType}
                    onValueChange={(value: RefundType) => setCreateForm({ ...createForm, refundType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RefundType.FullRefund}>Full Refund</SelectItem>
                      <SelectItem value={RefundType.PartialRefund}>Partial Refund</SelectItem>
                      <SelectItem value={RefundType.ReplacementOrder}>Replacement Order</SelectItem>
                      <SelectItem value={RefundType.CreditNote}>Credit Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerRequestAmount">Request Amount (Rp)</Label>
                <Input
                  id="customerRequestAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={createForm.customerRequestAmount || ''}
                  onChange={(e) => setCreateForm({ ...createForm, customerRequestAmount: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerNotes">Customer Notes</Label>
                <Textarea
                  id="customerNotes"
                  placeholder="Enter notes or description"
                  rows={4}
                  value={createForm.customerNotes}
                  onChange={(e) => setCreateForm({ ...createForm, customerNotes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedRefund(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitCreateRefund}
                disabled={createRefundMutation.isPending || updateRefundMutation.isPending}
              >
                {selectedRefund ? 'Update' : 'Create'} Refund Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Refund Request</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="decision">Decision</Label>
                <Select
                  value={approvalForm.decision}
                  onValueChange={(value: ApprovalDecision) => setApprovalForm({ ...approvalForm, decision: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ApprovalDecision.Approved}>Approve</SelectItem>
                    <SelectItem value={ApprovalDecision.Rejected}>Reject</SelectItem>
                    <SelectItem value={ApprovalDecision.NeedsInfo}>Needs More Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {approvalForm.decision === ApprovalDecision.Approved && (
                <div className="space-y-2">
                  <Label htmlFor="adjustedAmount">Adjusted Amount (Rp)</Label>
                  <Input
                    id="adjustedAmount"
                    type="number"
                    value={approvalForm.adjustedAmount || ''}
                    onChange={(e) => setApprovalForm({ ...approvalForm, adjustedAmount: Number(e.target.value) })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="decisionNotes">Decision Notes</Label>
                <Textarea
                  id="decisionNotes"
                  placeholder="Enter approval notes"
                  rows={3}
                  value={approvalForm.decisionNotes}
                  onChange={(e) => setApprovalForm({ ...approvalForm, decisionNotes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsApprovalDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApproval}
                disabled={approveRefundMutation.isPending}
              >
                Submit Decision
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <DialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus refund request ini? Aksi ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </DialogHeader>
            <DialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteRefundMutation.isPending}
              >
                Ya, Hapus
              </AlertDialogAction>
            </DialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Refund Request Detail</DialogTitle>
            </DialogHeader>

            {selectedRefund && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="calculation">Calculation</TabsTrigger>
                  <TabsTrigger value="approvals">Approvals</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Request Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Request Number:</span>{' '}
                          {selectedRefund.requestNumber}
                        </div>
                        <div>
                          <span className="font-medium">Order:</span>{' '}
                          {selectedRefund.order?.orderNumber}
                        </div>
                        <div>
                          <span className="font-medium">Customer:</span>{' '}
                          {selectedRefund.order?.customerName}
                        </div>
                        <div>
                          <span className="font-medium">Reason:</span>{' '}
                          <Badge variant="outline" className={reasonColors[selectedRefund.refundReason]}>
                            {reasonLabels[selectedRefund.refundReason]}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>{' '}
                          {selectedRefund.refundType.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Status & Timing</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Status:</span>{' '}
                          <Badge variant="outline" className={statusColors[selectedRefund.status]}>
                            {statusLabels[selectedRefund.status]}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Requested:</span>{' '}
                          {selectedRefund.requestedAt ? format(new Date(selectedRefund.requestedAt), 'dd/MM/yyyy HH:mm', { locale: id }) : '-'}
                        </div>
                        {selectedRefund.approvedAt && (
                          <div>
                            <span className="font-medium">Approved:</span>{' '}
                            {selectedRefund.approvedAt ? format(new Date(selectedRefund.approvedAt), 'dd/MM/yyyy HH:mm', { locale: id }) : '-'}
                          </div>
                        )}
                        {selectedRefund.processedAt && (
                          <div>
                            <span className="font-medium">Processed:</span>{' '}
                            {selectedRefund.processedAt ? format(new Date(selectedRefund.processedAt), 'dd/MM/yyyy HH:mm', { locale: id }) : '-'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedRefund.customerNotes && (
                    <div>
                      <h4 className="font-medium mb-2">Customer Notes</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {selectedRefund.customerNotes}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="calculation" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Financial Calculation</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Order Total:</span>
                          <span>{formatCurrency(selectedRefund.calculation?.orderTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customer Paid:</span>
                          <span>{formatCurrency(selectedRefund.calculation?.customerPaidAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vendor Cost Paid:</span>
                          <span>{formatCurrency(selectedRefund.calculation?.vendorCostPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Production Progress:</span>
                          <span>{selectedRefund.calculation?.productionProgress || 0}%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between font-medium text-green-600">
                          <span>Refundable to Customer:</span>
                          <span>{formatCurrency(selectedRefund.calculation?.refundableToCustomer)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Company Loss:</span>
                          <span>{formatCurrency(selectedRefund.calculation?.companyLoss)}</span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                          <span>Vendor Recoverable:</span>
                          <span>{formatCurrency(selectedRefund.calculation?.vendorRecoverable)}</span>
                        </div>
                        <div className="flex justify-between text-blue-600">
                          <span>Insurance Cover:</span>
                          <span>{formatCurrency(selectedRefund.calculation?.insuranceCover)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Applied Rules</h5>
                      <div className="flex flex-wrap gap-2">
                        {(selectedRefund.calculation?.appliedRules || []).map((rule, index) => (
                          <Badge key={index} variant="secondary">
                            {rule.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="approvals" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-4">Approval History</h4>
                    {selectedRefund.approvals && selectedRefund.approvals.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRefund.approvals.map((approval) => (
                          <div key={approval.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-medium">{approval.approver?.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  Level {approval.approvalLevel}
                                </span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={
                                  approval.decision === 'approved' ? 'bg-green-100 text-green-800' :
                                  approval.decision === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {approval.decision}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {approval.decidedAt ? format(new Date(approval.decidedAt), 'dd/MM/yyyy HH:mm', { locale: id }) : 'Pending'}
                            </div>
                            {approval.decisionNotes && (
                              <p className="text-sm mt-2">{approval.decisionNotes}</p>
                            )}
                            {approval.adjustedAmount && (
                              <p className="text-sm mt-2">
                                Adjusted Amount: Rp {approval.adjustedAmount.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No approvals yet.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-4">Request Timeline</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Request Created</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedRefund.requestedAt ? format(new Date(selectedRefund.requestedAt), 'dd/MM/yyyy HH:mm', { locale: id }) : '-'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedRefund.approvedAt && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium">Request Approved</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedRefund.approvedAt ? format(new Date(selectedRefund.approvedAt), 'dd/MM/yyyy HH:mm', { locale: id }) : '-'}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedRefund.processedAt && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium">Refund Processed</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedRefund.processedAt ? format(new Date(selectedRefund.processedAt), 'dd/MM/yyyy HH:mm', { locale: id }) : '-'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LazyWrapper>
  );
}