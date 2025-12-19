import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  DollarSign, 
  Clock, 
  Search,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Order } from '@/types/order';
import { Vendor } from '@/types/vendor/index';
import { vendorsService } from '@/services/api/vendors';

interface VendorSourcingProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onVendorAssigned: (orderId: string, vendorId: string) => Promise<void>;
  isLoading?: boolean;
}

export function VendorSourcing({
  order,
  isOpen,
  onClose,
  onVendorAssigned,
  isLoading = false
}: VendorSourcingProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [estimatedDays, setEstimatedDays] = useState<string>('');
  const [negotiationNotes, setNegotiationNotes] = useState('');

  // Load vendors on component mount
  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen]);

  // Filter vendors based on search and filters
  useEffect(() => {
    let filtered = vendors;

    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.category === categoryFilter);
    }

    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter(vendor => (vendor.rating || 0) >= minRating);
    }

    setFilteredVendors(filtered);
  }, [vendors, searchTerm, categoryFilter, ratingFilter]);

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const response = await vendorsService.getVendors({ 
        per_page: 100, 
        status: 'active' 
      });
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setEstimatedDays(vendor.average_lead_time_days?.toString() || '7');
  };

  const handleAssignVendor = async () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }

    if (!estimatedCost || !estimatedDays) {
      toast.error('Please provide cost and delivery estimates');
      return;
    }

    try {
      await onVendorAssigned(order.uuid || order.id, selectedVendor.id);
      
      // Reset form
      setSelectedVendor(null);
      setEstimatedCost('');
      setEstimatedDays('');
      setNegotiationNotes('');
      onClose();
      
      toast.success('Vendor assigned successfully');
    } catch (error) {
      toast.error('Failed to assign vendor', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const getVendorRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  const getVendorCategories = () => {
    const categories = [...new Set(vendors.map(v => v.category))];
    return categories;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vendor Sourcing - Order #{order.orderNumber}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Find and assign suitable vendor for production based on PT CEX business requirements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span>
                  <p>{order.customerName}</p>
                </div>
                <div>
                  <span className="font-medium">Items:</span>
                  <p>{order.items.length} item(s)</p>
                </div>
                <div>
                  <span className="font-medium">Estimated Value:</span>
                  <p className="font-semibold">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="vendor-list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vendor-list">Available Vendors</TabsTrigger>
              <TabsTrigger value="vendor-details" disabled={!selectedVendor}>
                Vendor Details & Negotiation
              </TabsTrigger>
            </TabsList>

            {/* Vendor List Tab */}
            <TabsContent value="vendor-list" className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Search Vendors</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, contact..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {getVendorCategories().map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Minimum Rating</Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Rating</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="5">5 Stars Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={fetchVendors}
                    disabled={loadingVendors}
                    className="w-full"
                  >
                    {loadingVendors ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>

              {/* Vendor Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    {loadingVendors ? 'Loading vendors...' : 'No vendors found matching your criteria'}
                  </div>
                ) : (
                  filteredVendors.map(vendor => (
                    <Card 
                      key={vendor.id} 
                      className={`cursor-pointer transition-all ${
                        selectedVendor?.id === vendor.id 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleVendorSelect(vendor)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{vendor.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {vendor.category}
                            </CardDescription>
                          </div>
                          {selectedVendor?.id === vendor.id && (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Rating */}
                          {getVendorRating(vendor.rating)}
                          
                          {/* Contact Info */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{vendor.contact_person}</span>
                            </div>
                            {vendor.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{vendor.phone}</span>
                              </div>
                            )}
                            {vendor.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span>{vendor.email}</span>
                              </div>
                            )}
                          </div>

                          {/* Performance Stats */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-semibold">{vendor.total_orders || 0}</div>
                              <div className="text-xs text-muted-foreground">Orders</div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-semibold">
                                {vendor.average_lead_time_days || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">Avg Days</div>
                            </div>
                          </div>

                          {/* Status */}
                          <Badge className={
                            vendor.status === 'active' ? 
                            'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'
                          }>
                            {vendor.status.toUpperCase()}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Vendor Details & Negotiation Tab */}
            <TabsContent value="vendor-details" className="space-y-4">
              {selectedVendor && (
                <div className="space-y-6">
                  {/* Selected Vendor Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Building2 className="w-6 h-6" />
                        {selectedVendor.name}
                      </CardTitle>
                      <CardDescription>
                        Complete vendor information and negotiation details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-medium">Contact Information</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Contact Person:</span> {selectedVendor.contact_person}</p>
                            <p><span className="font-medium">Email:</span> {selectedVendor.email}</p>
                            <p><span className="font-medium">Phone:</span> {selectedVendor.phone}</p>
                            <p><span className="font-medium">Category:</span> {selectedVendor.category}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-medium">Performance History</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Rating:</span> {selectedVendor.rating}/5</p>
                            <p><span className="font-medium">Total Orders:</span> {selectedVendor.total_orders || 0}</p>
                            <p><span className="font-medium">Avg Delivery:</span> {selectedVendor.average_lead_time_days || 'N/A'} days</p>
                            <p><span className="font-medium">Payment Terms:</span> {selectedVendor.payment_terms}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Negotiation Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Negotiation Details
                      </CardTitle>
                      <CardDescription>
                        Set estimated costs and timeline for this order
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Estimated Vendor Cost (Rp)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={estimatedCost}
                            onChange={(e) => setEstimatedCost(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Cost quote from vendor (before markup)
                          </p>
                        </div>
                        
                        <div>
                          <Label>Estimated Production Days</Label>
                          <Input
                            type="number"
                            placeholder="7"
                            value={estimatedDays}
                            onChange={(e) => setEstimatedDays(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Production timeline from vendor
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label>Negotiation Notes</Label>
                        <Textarea
                          placeholder="Add notes about pricing, terms, special requirements..."
                          value={negotiationNotes}
                          onChange={(e) => setNegotiationNotes(e.target.value)}
                          rows={4}
                        />
                      </div>

                      {/* Profit Calculation Preview */}
                      {estimatedCost && (
                        <div className="p-3 border rounded-lg bg-green-50">
                          <h5 className="font-medium text-green-800 mb-2">Profitability Preview</h5>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-green-700">Vendor Cost:</span>
                              <p className="font-semibold">Rp {parseFloat(estimatedCost).toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                              <span className="text-green-700">Customer Price:</span>
                              <p className="font-semibold">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                              <span className="text-green-700">Estimated Profit:</span>
                              <p className="font-semibold text-green-600">
                                Rp {(order.totalAmount - parseFloat(estimatedCost)).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignVendor}
            disabled={!selectedVendor || !estimatedCost || !estimatedDays || isLoading}
          >
            {isLoading ? 'Assigning...' : 'Assign Vendor & Start Negotiation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VendorSourcing;