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
import { toast } from '@/hooks/use-toast';
import { usePaymentStore } from '@/stores/paymentStore';
import { Payment } from '@/services/tenant/paymentService';
import { 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Shield,
  CreditCard,
  ArrowUpDown
} from 'lucide-react';

interface AuditEvent {
  id: string;
  payment_id: string;
  event_type: 'created' | 'submitted' | 'verified' | 'rejected' | 'processed' | 'failed' | 'refunded' | 'cancelled';
  description: string;
  user_id: string;
  user_name: string;
  user_role: string;
  metadata: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export const PaymentAuditTrail: React.FC = () => {
  const {
    selectedPayment,
    payments,
    loading,
    setCurrentPage,
    currentPage,
    totalPages,
    perPage,
  } = usePaymentStore();

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('7');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [detailsDialog, setDetailsDialog] = useState<AuditEvent | null>(null);
  const [exportDialog, setExportDialog] = useState(false);

  // Mock audit events data - in real implementation, this would come from API
  const mockAuditEvents: AuditEvent[] = [
    {
      id: '1',
      payment_id: selectedPayment?.id || 'payment_1',
      event_type: 'created',
      description: 'Payment record created',
      user_id: 'user_1',
      user_name: 'John Doe',
      user_role: 'Customer',
      metadata: { amount: 150000, method: 'bank_transfer' },
      timestamp: '2024-12-01T10:00:00Z',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0...'
    },
    {
      id: '2',
      payment_id: selectedPayment?.id || 'payment_1',
      event_type: 'submitted',
      description: 'Payment submitted for verification',
      user_id: 'user_1',
      user_name: 'John Doe',
      user_role: 'Customer',
      metadata: { verification_method: 'manual', risk_score: 0.2 },
      timestamp: '2024-12-01T10:05:00Z',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0...'
    },
    {
      id: '3',
      payment_id: selectedPayment?.id || 'payment_1',
      event_type: 'verified',
      description: 'Payment verification completed',
      user_id: 'admin_1',
      user_name: 'Admin User',
      user_role: 'Payment Administrator',
      metadata: { verification_notes: 'Bank transfer confirmed', auto_processed: true },
      timestamp: '2024-12-01T11:30:00Z',
      ip_address: '192.168.1.200',
      user_agent: 'Mozilla/5.0...'
    },
    {
      id: '4',
      payment_id: selectedPayment?.id || 'payment_1',
      event_type: 'processed',
      description: 'Payment successfully processed',
      user_id: 'system',
      user_name: 'System',
      user_role: 'Automated Process',
      metadata: { gateway_transaction_id: 'TXN_ABC123', processing_fee: 2500 },
      timestamp: '2024-12-01T11:35:00Z',
      ip_address: '10.0.0.1',
      user_agent: 'System/1.0'
    }
  ];

  useEffect(() => {
    loadAuditTrail();
  }, [selectedPayment, searchTerm, selectedEventType, selectedDateRange, selectedUserId, sortOrder]);

  const loadAuditTrail = async () => {
    if (!selectedPayment) return;

    setAuditLoading(true);
    try {
      // In real implementation, this would be an API call
      // const events = await paymentService.getAuditTrail(selectedPayment.id, filters);
      
      // For now, use mock data with filtering
      const filteredEvents = mockAuditEvents.filter(event => {
        const matchesSearch = !searchTerm || 
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.user_name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesEventType = selectedEventType === 'all' || event.event_type === selectedEventType;
        
        const matchesUserId = selectedUserId === 'all' || event.user_id === selectedUserId;
        
        // Date filtering
        const eventDate = new Date(event.timestamp);
        const daysDiff = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        const matchesDateRange = selectedDateRange === 'all' || daysDiff <= parseInt(selectedDateRange);
        
        return matchesSearch && matchesEventType && matchesUserId && matchesDateRange;
      });

      // Sort by timestamp
      filteredEvents.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      setAuditEvents(filteredEvents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load audit trail",
        variant: "destructive",
      });
    } finally {
      setAuditLoading(false);
    }
  };

  const handleExportAuditTrail = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      // In real implementation, this would call the API to generate the export
      const exportData = {
        payment_id: selectedPayment?.id,
        events: auditEvents,
        export_date: new Date().toISOString(),
        filters: {
          search: searchTerm,
          event_type: selectedEventType,
          date_range: selectedDateRange,
          user_id: selectedUserId,
          sort_order: sortOrder
        }
      };

      // Mock download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment_audit_trail_${selectedPayment?.id}_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Audit trail exported as ${format.toUpperCase()}`,
      });

      setExportDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export audit trail",
        variant: "destructive",
      });
    }
  };

  const getEventIcon = (eventType: AuditEvent['event_type']) => {
    const iconMap = {
      created: Activity,
      submitted: FileText,
      verified: CheckCircle,
      rejected: XCircle,
      processed: CreditCard,
      failed: AlertTriangle,
      refunded: ArrowUpDown,
      cancelled: XCircle,
    };

    const Icon = iconMap[eventType] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const getEventBadge = (eventType: AuditEvent['event_type']) => {
    const badgeConfig = {
      created: { variant: 'secondary' as const, label: 'Created' },
      submitted: { variant: 'default' as const, label: 'Submitted' },
      verified: { variant: 'default' as const, label: 'Verified' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
      processed: { variant: 'default' as const, label: 'Processed' },
      failed: { variant: 'destructive' as const, label: 'Failed' },
      refunded: { variant: 'secondary' as const, label: 'Refunded' },
      cancelled: { variant: 'secondary' as const, label: 'Cancelled' },
    };

    const config = badgeConfig[eventType];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getEventIcon(eventType)}
        {config.label}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!selectedPayment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a payment to view its audit trail</p>
            </div>
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
            <Shield className="w-5 h-5" />
            Payment Audit Trail - #{selectedPayment.id.slice(-8)}
          </CardTitle>
          <div className="text-sm text-gray-600">
            Complete history of all actions performed on this payment
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search audit trail..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Event: {selectedEventType === 'all' ? 'All' : selectedEventType}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedEventType('all')}>
                  All Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedEventType('created')}>
                  Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedEventType('submitted')}>
                  Submitted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedEventType('verified')}>
                  Verified
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedEventType('rejected')}>
                  Rejected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedEventType('processed')}>
                  Processed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedEventType('failed')}>
                  Failed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last {selectedDateRange === 'all' ? 'All' : `${selectedDateRange} days`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedDateRange('1')}>
                  Last 24 hours
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange('7')}>
                  Last 7 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange('30')}>
                  Last 30 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange('90')}>
                  Last 90 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDateRange('all')}>
                  All time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </Button>

            <Dialog open={exportDialog} onOpenChange={setExportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Audit Trail</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Export the complete audit trail for payment #{selectedPayment.id.slice(-8)}
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleExportAuditTrail('csv')}>
                      Export as CSV
                    </Button>
                    <Button onClick={() => handleExportAuditTrail('json')}>
                      Export as JSON
                    </Button>
                    <Button onClick={() => handleExportAuditTrail('pdf')}>
                      Export as PDF
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Audit Trail Table */}
          {auditLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-gray-500">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No audit events found
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          {getEventBadge(event.event_type)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            {event.description}
                            {event.metadata && typeof event.metadata === 'object' && Object.keys(event.metadata).length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                <p>Metadata: {JSON.stringify(event.metadata)}</p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event.user_name}</div>
                            <div className="text-xs text-gray-500">{event.user_role}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{formatTimestamp(event.timestamp)}</div>
                            {event.ip_address && (
                              <div className="text-xs text-gray-500">
                                IP: {event.ip_address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailsDialog(event)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={!!detailsDialog} onOpenChange={() => setDetailsDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Event Details</DialogTitle>
          </DialogHeader>
          {detailsDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Event ID:</strong>
                  <p className="text-sm text-gray-600">{detailsDialog.id}</p>
                </div>
                <div>
                  <strong>Event Type:</strong>
                  <p className="text-sm text-gray-600">{getEventBadge(detailsDialog.event_type)}</p>
                </div>
                <div>
                  <strong>User:</strong>
                  <p className="text-sm text-gray-600">
                    {detailsDialog.user_name} ({detailsDialog.user_role})
                  </p>
                </div>
                <div>
                  <strong>Timestamp:</strong>
                  <p className="text-sm text-gray-600">{formatTimestamp(detailsDialog.timestamp)}</p>
                </div>
                <div>
                  <strong>IP Address:</strong>
                  <p className="text-sm text-gray-600">{detailsDialog.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <strong>User Agent:</strong>
                  <p className="text-sm text-gray-600 truncate" title={detailsDialog.user_agent}>
                    {detailsDialog.user_agent || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <strong>Description:</strong>
                <p className="text-sm text-gray-600 mt-1">{detailsDialog.description}</p>
              </div>

              {Object.keys(detailsDialog.metadata).length > 0 && (
                <div>
                  <strong>Metadata:</strong>
                  <pre className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded-lg overflow-auto">
                    {JSON.stringify(detailsDialog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};