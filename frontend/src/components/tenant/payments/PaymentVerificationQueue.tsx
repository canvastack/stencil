import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { usePaymentStore } from '@/stores/paymentStore';
import { Payment } from '@/services/tenant/paymentService';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Eye
} from 'lucide-react';

export const PaymentVerificationQueue: React.FC = () => {
  const {
    verificationQueue,
    verificationLoading,
    selectedPaymentIds,
    filters,
    currentPage,
    totalPages,
    totalCount,
    perPage,
    setSelectedPaymentIds,
    setFilters,
    setCurrentPage,
    fetchVerificationQueue,
    verifyPayment,
    bulkVerifyPayments,
    setSelectedPayment
  } = usePaymentStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Payment['verification_status'] | 'all'>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'low' | 'medium' | 'high' | 'all'>('all');
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [bulkVerificationDialog, setBulkVerificationDialog] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<Payment['verification_status']>('verified');
  const [autoProcess, setAutoProcess] = useState(false);

  useEffect(() => {
    loadVerificationQueue();
  }, [currentPage, selectedStatus, selectedRiskLevel, searchTerm]);

  const loadVerificationQueue = async () => {
    const params: any = {
      page: currentPage,
      per_page: perPage,
    };

    if (selectedStatus !== 'all') {
      params.status = selectedStatus;
    }

    if (selectedRiskLevel !== 'all') {
      params.risk_level = selectedRiskLevel;
    }

    if (searchTerm) {
      params.search = searchTerm;
    }

    try {
      await fetchVerificationQueue(params);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load verification queue",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: Payment['verification_status'] | 'all') => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleRiskFilter = (riskLevel: 'low' | 'medium' | 'high' | 'all') => {
    setSelectedRiskLevel(riskLevel);
    setCurrentPage(1);
  };

  const handlePaymentSelect = (paymentId: string) => {
    const isSelected = selectedPaymentIds.includes(paymentId);
    if (isSelected) {
      setSelectedPaymentIds(selectedPaymentIds.filter(id => id !== paymentId));
    } else {
      setSelectedPaymentIds([...selectedPaymentIds, paymentId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPaymentIds.length === verificationQueue.length) {
      setSelectedPaymentIds([]);
    } else {
      setSelectedPaymentIds(verificationQueue.map(payment => payment.id));
    }
  };

  const handleVerifyPayment = async (payment: Payment, status: Payment['verification_status'], notes?: string) => {
    try {
      await verifyPayment(payment.id, {
        verification_status: status,
        verification_notes: notes,
        auto_process: autoProcess
      });
      
      toast({
        title: "Success",
        description: `Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
      });
      
      setVerificationDialog(false);
      setVerificationNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    }
  };

  const handleBulkVerification = async () => {
    if (selectedPaymentIds.length === 0) {
      toast({
        title: "Warning",
        description: "Please select payments to verify",
        variant: "destructive",
      });
      return;
    }

    try {
      await bulkVerifyPayments(selectedPaymentIds, {
        verification_status: verificationStatus,
        verification_notes: verificationNotes,
        auto_process: autoProcess
      });

      toast({
        title: "Success",
        description: `${selectedPaymentIds.length} payments ${verificationStatus === 'verified' ? 'verified' : 'rejected'} successfully`,
      });

      setBulkVerificationDialog(false);
      setSelectedPaymentIds([]);
      setVerificationNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process bulk verification",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Payment['verification_status']) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      verified: { variant: 'default' as const, icon: CheckCircle, label: 'Verified' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
      requires_review: { variant: 'secondary' as const, icon: AlertTriangle, label: 'Requires Review' }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getRiskLevelBadge = (riskLevel: 'low' | 'medium' | 'high') => {
    const riskConfig = {
      low: { variant: 'default' as const, label: 'Low Risk' },
      medium: { variant: 'secondary' as const, label: 'Medium Risk' },
      high: { variant: 'destructive' as const, label: 'High Risk' }
    };

    const config = riskConfig[riskLevel];

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  if (verificationLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Payment Verification Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by payment ID, customer..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Status: {selectedStatus === 'all' ? 'All' : selectedStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleStatusFilter('all')}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter('pending')}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter('requires_review')}>
                  Requires Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter('verified')}>
                  Verified
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter('rejected')}>
                  Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risk: {selectedRiskLevel === 'all' ? 'All' : selectedRiskLevel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleRiskFilter('all')}>
                  All Risk Levels
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRiskFilter('low')}>
                  Low Risk
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRiskFilter('medium')}>
                  Medium Risk
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRiskFilter('high')}>
                  High Risk
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bulk Actions */}
          {selectedPaymentIds.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedPaymentIds.length} payments selected
              </span>
              <Dialog open={bulkVerificationDialog} onOpenChange={setBulkVerificationDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">Bulk Verify</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Payment Verification</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk-status">Verification Status</Label>
                      <select
                        id="bulk-status"
                        className="w-full mt-1 p-2 border rounded-md"
                        value={verificationStatus}
                        onChange={(e) => setVerificationStatus(e.target.value as Payment['verification_status'])}
                      >
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                        <option value="requires_review">Requires Review</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="bulk-notes">Verification Notes</Label>
                      <Textarea
                        id="bulk-notes"
                        placeholder="Add verification notes (optional)"
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bulk-auto-process"
                        checked={autoProcess}
                        onCheckedChange={(checked) => setAutoProcess(checked as boolean)}
                      />
                      <Label htmlFor="bulk-auto-process">
                        Auto-process verified payments
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleBulkVerification}>
                        Verify {selectedPaymentIds.length} Payments
                      </Button>
                      <Button variant="outline" onClick={() => setBulkVerificationDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedPaymentIds([])}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Verification Queue Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPaymentIds.length === verificationQueue.length && verificationQueue.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verificationQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No payments in verification queue
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  verificationQueue.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPaymentIds.includes(payment.id)}
                          onCheckedChange={() => handlePaymentSelect(payment.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        #{payment.id.slice(-8)}
                      </TableCell>
                      <TableCell>{payment.customer_name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{getStatusBadge(payment.verification_status)}</TableCell>
                      <TableCell>{getRiskLevelBadge(payment.risk_level || 'low')}</TableCell>
                      <TableCell>
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedPayment(payment)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleVerifyPayment(payment, 'verified')}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleVerifyPayment(payment, 'rejected')}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedPayment(payment);
                              setVerificationDialog(true);
                            }}>
                              <FileText className="w-4 h-4 mr-2" />
                              Add Notes & Verify
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} payments
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Verification Dialog */}
      <Dialog open={verificationDialog} onOpenChange={setVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-status">Verification Decision</Label>
              <select
                id="verification-status"
                className="w-full mt-1 p-2 border rounded-md"
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as Payment['verification_status'])}
              >
                <option value="verified">Approve Payment</option>
                <option value="rejected">Reject Payment</option>
                <option value="requires_review">Requires Additional Review</option>
              </select>
            </div>

            <div>
              <Label htmlFor="verification-notes">Verification Notes</Label>
              <Textarea
                id="verification-notes"
                placeholder="Add verification notes explaining your decision"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-process"
                checked={autoProcess}
                onCheckedChange={(checked) => setAutoProcess(checked as boolean)}
              />
              <Label htmlFor="auto-process">
                Auto-process payment if verified
              </Label>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => handleVerifyPayment(
                  usePaymentStore.getState().selectedPayment!,
                  verificationStatus,
                  verificationNotes
                )}
              >
                Submit Verification
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setVerificationDialog(false);
                  setVerificationNotes('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};