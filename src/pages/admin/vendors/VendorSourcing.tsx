import { useState, useEffect } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TabbedModal } from '@/components/ui/tabbed-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Filter,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  Star,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  Edit,
  MessageSquare,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast-config';
import { useVendorSourcing } from '@/hooks/useVendors';

export default function VendorSourcing() {
  const [activeTab, setActiveTab] = useState('requests');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);



  const {
    sourcingRequests,
    vendorQuotes,
    isLoading,
    error,
    fetchSourcingRequests,
    createSourcingRequest,
  } = useVendorSourcing();

  useEffect(() => {
    fetchSourcingRequests();
  }, [fetchSourcingRequests]);
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'negotiating': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'negotiating': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const handleNegotiate = (request: any) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
    toast.info('Opening negotiation for sourcing request');
  };

  const handleNegotiateQuote = (quote: any) => {
    toast.info(`Opening negotiation with ${quote.vendorName}`);
  };

  const handleRefresh = async () => {
    try {
      await fetchSourcingRequests();
      toast.success('Data sourcing berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui data sourcing');
    }
  };

  const handleExportReport = () => {
    try {
      // Simulate export functionality
      const csvData = filteredRequests.map(req => ({
        'Order ID': req.orderId,
        'Title': req.title,
        'Status': req.status,
        'Material': req.requirements?.material || 'N/A',
        'Quantity': req.requirements?.quantity || 0,
        'Budget': req.requirements?.budget || 0,
        'Deadline': req.requirements?.deadline || 'N/A',
        'Responses': req.responses,
        'Best Quote': req.bestQuote || 'N/A',
        'Created At': req.createdAt
      }));
      
      // Convert to CSV
      const csvHeaders = Object.keys(csvData[0] || {}).join(',');
      const csvRows = csvData.map(row => Object.values(row).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sourcing-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report berhasil diexport');
    } catch (error) {
      toast.error('Gagal export report');
    }
  };

  const filteredRequests = sourcingRequests.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (searchTerm && !req.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vendor Sourcing</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage vendor sourcing requests and responses</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Requests</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sourcingRequests.filter(r => r.status === 'active').length}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Negotiation</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sourcingRequests.filter(r => r.status === 'negotiating').length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sourcingRequests.filter(r => r.status === 'completed').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">16M</p>
                </div>
                <Building className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card hover={false}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sourcing Requests */}
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{request.title}</h3>
                      <Badge variant={getStatusVariant(request.status)} className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status.toUpperCase()}
                      </Badge>
                      {request.assignedVendor && (
                        <Badge variant="outline">
                          <Building className="w-3 h-3 mr-1" />
                          {request.assignedVendor}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{request.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Material</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{request.requirements?.material || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{request.requirements?.quantity || 0} pcs</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Budget</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(request.requirements?.budget || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Deadline</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{request.requirements?.deadline ? new Date(request.requirements.deadline).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Order: {request.orderId}</span>
                        <span>{request.responses} responses</span>
                        {request.bestQuote && (
                          <span>Best: {formatCurrency(request.bestQuote)}</span>
                        )}
                        <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(request)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button size="sm" onClick={() => handleNegotiate(request)}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Negotiate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <Card hover={false} className="p-12">
            <div className="text-center space-y-4">
              <Building className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No sourcing requests found</h3>
                <p className="text-gray-600 dark:text-gray-400">Create your first sourcing request to start vendor negotiations</p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Request
              </Button>
            </div>
          </Card>
        )}

        {/* Detail Modal */}
        <TabbedModal
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          title="Sourcing Request Details"
          description="Complete information and vendor responses"
          defaultTab="overview"
          tabs={selectedRequest ? [
            {
              value: "overview",
              label: "Overview",
              icon: <Eye className="w-4 h-4" />,
              content: (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Card hover={false} className="p-4">
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Request Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.orderId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                          <Badge variant={getStatusVariant(selectedRequest.status)}>
                            {selectedRequest.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </Card>

                    <Card hover={false} className="p-4">
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Budget & Timeline</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                          <p className="font-medium text-lg text-green-600 dark:text-green-400">{formatCurrency(selectedRequest.requirements?.budget || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Deadline</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.requirements?.deadline ? new Date(selectedRequest.requirements.deadline).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Vendor Responses</p>
                          <p className="font-medium text-blue-600 dark:text-blue-400">{selectedRequest.responses} vendors</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )
            },
            {
              value: "requirements",
              label: "Requirements",
              icon: <CheckCircle className="w-4 h-4" />,
              content: (
                <Card hover={false} className="p-4">
                  <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Technical Requirements</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Material</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.requirements?.material || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Dimensions</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.requirements?.dimensions || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Quantity</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.requirements?.quantity || 0} pcs</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Finish Type</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.requirements?.finishType || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            },
            {
              value: "responses",
              label: "Vendor Responses",
              icon: <Building className="w-4 h-4" />,
              content: (
                <div className="space-y-4">
                  {(vendorQuotes || [])
                    .filter(response => response.sourcingId === selectedRequest.id)
                    .map((response) => (
                    <Card key={response.id} hover={false} className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                            <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{response.vendorName}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    "w-3 h-3",
                                    i < Math.floor(response.vendorRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                  )} 
                                />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">{response.vendorRating}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">{response.status}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Quoted Price</p>
                          <p className="font-bold text-xl text-green-700 dark:text-green-300">{formatCurrency(response.quotedPrice)}</p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Lead Time</p>
                          <p className="font-bold text-xl text-blue-700 dark:text-blue-300">{response.leadTime} days</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">{response.notes}</p>
                      </div>

                      {response.certifications.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Certifications</p>
                          <div className="flex gap-2 flex-wrap">
                            {response.certifications.map((cert, index) => (
                              <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" onClick={() => handleNegotiateQuote(response)}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Negotiate
                        </Button>
                        <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20">
                          <Send className="w-4 h-4 mr-2" />
                          Accept Quote
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {(!vendorQuotes || vendorQuotes.filter(response => response.sourcingId === selectedRequest.id).length === 0) && (
                    <Card hover={false} className="p-8 text-center">
                      <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No Vendor Responses Yet</h4>
                      <p className="text-gray-600 dark:text-gray-400">Waiting for vendors to submit their quotes</p>
                    </Card>
                  )}
                </div>
              )
            }
          ] : []}
        />
      </div>
    </LazyWrapper>
  );
}