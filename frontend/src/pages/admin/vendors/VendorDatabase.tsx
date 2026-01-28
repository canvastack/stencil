import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { 
  Building, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  Star,
  Package,
  DollarSign,
  Calendar,
  RefreshCw,
  Download,
  Upload,
  ArrowUpDown,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { toast } from '@/lib/toast-config';
import MapPicker, { LocationData } from '@/components/admin/MapPicker';
import { cn } from '@/lib/utils';
import { announceToScreenReader } from '@/lib/utils/accessibility';
import { useVendors } from '@/hooks/useVendors';
import { vendorsService } from '@/services/api/vendors';
import { ColumnDef } from '@tanstack/react-table';
import type { Vendor, VendorFilters } from '@/types/vendor/index';
import { VendorListSkeleton } from '@/components/vendor/VendorListSkeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { VendorFormDialog } from '@/components/vendor/VendorFormDialog';
import { useKeyboardShortcuts, KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import VendorComparison from '@/components/vendor/VendorComparison';



function VendorDatabase() {
  const [filters, setFilters] = useState<VendorFilters>({
    page: 1,
    per_page: 20,
    search: '',
    status: undefined,
  });

  const {
    vendors,
    pagination,
    isLoading,
    isSaving,
    error,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  } = useVendors();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [companySizeFilter, setCompanySizeFilter] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Vendor | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Handle filter changes and fetch data from API
  const handleFilterChange = useCallback((key: keyof VendorFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Reset to page 1 when filters change (except for page changes)
      if (key !== 'page') {
        newFilters.page = 1;
      }
      return newFilters;
    });
  }, []);

  // Fetch vendors when filters change
  useEffect(() => {
    fetchVendors(filters);
  }, [filters, fetchVendors]);

  // Update search filter when debounced search term changes
  useEffect(() => {
    handleFilterChange('search', debouncedSearchTerm);
  }, [debouncedSearchTerm, handleFilterChange]);

  // Update status filter
  useEffect(() => {
    const status = statusFilter === 'all' ? undefined : statusFilter as any;
    handleFilterChange('status', status);
  }, [statusFilter, handleFilterChange]);

  // Remove the old filteredVendors logic since we're using API filtering
  // const filteredVendors = useMemo(() => { ... }, [vendors, debouncedSearchTerm, statusFilter, ratingFilter, companySizeFilter]);

  const getStatusVariant = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  }, []);

  const getRatingStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={cn(
          "w-4 h-4",
          i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        )} 
      />
    ));
  }, []);

  const handleViewDetails = useCallback((vendor: any) => {
    setSelectedVendor(vendor);
    setIsDetailModalOpen(true);
  }, []);

  const handleViewLocation = useCallback((vendor: any) => {
    setSelectedLocation(vendor);
    setIsLocationModalOpen(true);
  }, []);

  const EnhancedCard = useCallback(({ 
    children, 
    className = "",
    ...props 
  }: { 
    children: React.ReactNode; 
    className?: string;
    [key: string]: any;
  }) => (
    <Card 
      className={`relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
      {children}
    </Card>
  ), []);

  const handleRefresh = useCallback(() => {
    fetchVendors(filters);
    toast.success('Vendor data refreshed');
    announceToScreenReader('Vendor data refreshed');
  }, [fetchVendors, filters]);

  const handleDelete = useCallback(async (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (window.confirm(`Are you sure you want to delete ${vendor?.name || 'this vendor'}?`)) {
      try {
        await deleteVendor(vendorId);
        toast.success('Vendor deleted successfully');
        announceToScreenReader(`Vendor ${vendor?.name || ''} deleted successfully`);
      } catch (error) {
        toast.error('Failed to delete vendor');
        announceToScreenReader('Failed to delete vendor. Please try again.');
      }
    }
  }, [deleteVendor, vendors]);

  const handleEdit = useCallback((vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsEditModalOpen(true);
  }, []);

  const handleAddVendor = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleCreateVendorSubmit = useCallback(async (data: any) => {
    try {
      await createVendor(data);
      announceToScreenReader(`Vendor ${data.name} created successfully`);
    } catch (error) {
      announceToScreenReader('Failed to create vendor. Please check the form and try again.');
    }
  }, [createVendor]);

  const handleUpdateVendorSubmit = useCallback(async (data: any) => {
    if (!editingVendor) return;
    try {
      await updateVendor(editingVendor.id, data);
      announceToScreenReader(`Vendor ${data.name} updated successfully`);
    } catch (error) {
      announceToScreenReader('Failed to update vendor. Please try again.');
    }
  }, [editingVendor, updateVendor]);

  const handleExportToCSV = useCallback(() => {
    try {
      const csvData = vendors.map(vendor => ({
        Name: vendor.name,
        Code: vendor.code,
        Company: vendor.company,
        Industry: vendor.industry,
        City: vendor.city,
        'Contact Person': vendor.contact_person,
        Email: vendor.email,
        Phone: vendor.phone,
        Address: vendor.address,
        Status: vendor.status,
        'Company Size': vendor.company_size,
        Rating: vendor.rating,
        'Total Orders': vendor.total_orders,
        'Total Value': vendor.total_value,
        'Average Lead Time': vendor.average_lead_time,
        'Payment Terms': vendor.payment_terms,
        'Tax ID': vendor.tax_id,
        'Bank Account': vendor.bank_account
      }));

      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','));
      const csvContent = [headers, ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vendors-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${vendors.length} vendors to CSV`);
      announceToScreenReader(`Exported ${vendors.length} vendors to CSV successfully`);
    } catch (error) {
      toast.error('Failed to export vendor data to CSV');
      announceToScreenReader('Failed to export vendor data. Please try again.');
    }
  }, [vendors]);

  const handleExportToExcel = useCallback(async () => {
    try {
      const XLSX = await import('xlsx');
      
      const excelData = vendors.map(vendor => ({
        'Vendor Name': vendor.name,
        'Vendor Code': vendor.code,
        'Company': vendor.company || '',
        'Industry': vendor.industry || '',
        'City': vendor.city || '',
        'Contact Person': vendor.contact_person || '',
        'Email': vendor.email,
        'Phone': vendor.phone || '',
        'Address': vendor.address || '',
        'Status': vendor.status,
        'Company Size': vendor.company_size || '',
        'Rating': vendor.rating || 0,
        'Total Orders': vendor.total_orders || 0,
        'Total Value': vendor.total_value || 0,
        'Avg Lead Time (days)': vendor.average_lead_time || 0,
        'Payment Terms': vendor.payment_terms || '',
        'Tax ID': vendor.tax_id || '',
        'Bank Account': vendor.bank_account || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      const columnWidths = [
        { wch: 25 }, // Vendor Name
        { wch: 15 }, // Vendor Code
        { wch: 20 }, // Company
        { wch: 15 }, // Industry
        { wch: 15 }, // City
        { wch: 20 }, // Contact Person
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 30 }, // Address
        { wch: 12 }, // Status
        { wch: 15 }, // Company Size
        { wch: 10 }, // Rating
        { wch: 12 }, // Total Orders
        { wch: 15 }, // Total Value
        { wch: 18 }, // Avg Lead Time
        { wch: 15 }, // Payment Terms
        { wch: 18 }, // Tax ID
        { wch: 20 }, // Bank Account
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendors');
      
      XLSX.writeFile(workbook, `vendors-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success(`Exported ${vendors.length} vendors to Excel`);
      announceToScreenReader(`Exported ${vendors.length} vendors to Excel successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export vendor data to Excel');
      announceToScreenReader('Failed to export vendor data. Please try again.');
    }
  }, [vendors]);

  const handleImportVendors = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            toast.success(`File "${file.name}" uploaded successfully. Import functionality will be implemented soon.`);
          } catch (error) {
            toast.error('Failed to import vendor data');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const handleSendEmail = useCallback((vendor: Vendor) => {
    const subject = encodeURIComponent(`Business Inquiry - ${vendor.name}`);
    const body = encodeURIComponent(`Dear ${vendor.name},\n\nI hope this email finds you well. I am reaching out regarding potential business collaboration.\n\nBest regards`);
    const mailtoLink = `mailto:${vendor.email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    toast.success(`Opening email client to contact ${vendor.name}`);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }, []);

  const toggleVendorSelection = useCallback((vendorId: string) => {
    setSelectedVendorIds((prev) => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }
      return next;
    });
  }, []);

  const selectAllVendors = useCallback(() => {
    setSelectedVendorIds(new Set(vendors.map((v) => v.id)));
    announceToScreenReader(`${vendors.length} vendors selected`);
  }, [vendors]);

  const deselectAllVendors = useCallback(() => {
    setSelectedVendorIds(new Set());
    announceToScreenReader('All vendors deselected');
  }, []);

  const handleBulkAction = useCallback(async () => {
    if (selectedVendorIds.size === 0) {
      toast.error('Please select at least one vendor');
      return;
    }

    const vendorIds = Array.from(selectedVendorIds);

    try {
      switch (bulkAction) {
        case 'status-active':
        case 'status-inactive':
        case 'status-suspended': {
          const status = bulkAction.replace('status-', '');
          await vendorsService.bulkUpdateStatus(vendorIds, status);
          toast.success(`Updated status for ${vendorIds.length} vendor${vendorIds.length > 1 ? 's' : ''}`);
          announceToScreenReader(`Status updated for ${vendorIds.length} vendors`);
          fetchVendors();
          break;
        }
        case 'delete': {
          const confirmed = window.confirm(
            `Are you sure you want to delete ${vendorIds.length} vendor${vendorIds.length > 1 ? 's' : ''}? This action cannot be undone.`
          );
          if (!confirmed) return;

          await vendorsService.bulkDelete(vendorIds);
          toast.success(`Deleted ${vendorIds.length} vendor${vendorIds.length > 1 ? 's' : ''}`);
          announceToScreenReader(`Deleted ${vendorIds.length} vendors successfully`);
          fetchVendors();
          break;
        }
        case 'export': {
          const selectedVendors = vendors.filter(v => vendorIds.includes(v.id));
          const csvData = selectedVendors.map(vendor => ({
            Name: vendor.name,
            Code: vendor.code,
            Company: vendor.company,
            Industry: vendor.industry,
            City: vendor.city,
            'Contact Person': vendor.contact_person,
            Email: vendor.email,
            Phone: vendor.phone,
            Address: vendor.address,
            Status: vendor.status,
            'Company Size': vendor.company_size,
            Rating: vendor.rating,
            'Total Orders': vendor.total_orders,
            'Total Value': vendor.total_value,
          }));

          const headers = Object.keys(csvData[0] || {}).join(',');
          const rows = csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','));
          const csvContent = [headers, ...rows].join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `vendors-bulk-export-${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success(`Exported ${vendorIds.length} vendor${vendorIds.length > 1 ? 's' : ''}`);
          break;
        }
      }

      deselectAllVendors();
      setIsSelectMode(false);
      setBulkAction('');
    } catch (error) {
      toast.error('Failed to perform bulk action');
      announceToScreenReader('Failed to perform bulk action. Please try again.');
    }
  }, [bulkAction, selectedVendorIds, vendors, fetchVendors, deselectAllVendors]);

  useEffect(() => {
    // Initial fetch with default filters
    fetchVendors(filters);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      announceToScreenReader(`${vendors.length} vendor${vendors.length !== 1 ? 's' : ''} found`);
    }
  }, [vendors.length, debouncedSearchTerm]);

  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: 'N',
      shiftKey: true,
      callback: handleAddVendor,
      description: 'Create new vendor',
    },
    {
      key: 'F',
      shiftKey: true,
      callback: () => {
        const searchInput = document.getElementById('vendor-search');
        searchInput?.focus();
      },
      description: 'Focus search input',
    },
    {
      key: 'R',
      shiftKey: true,
      callback: handleRefresh,
      description: 'Refresh vendor list',
    },
    {
      key: 'E',
      shiftKey: true,
      callback: handleExportToCSV,
      description: 'Export vendor data to CSV',
    },
    {
      key: '?',
      shiftKey: true,
      callback: () => setShowShortcutsModal(true),
      description: 'Show keyboard shortcuts',
      preventDefault: false,
    },
    {
      key: 'Escape',
      callback: () => {
        if (showShortcutsModal) setShowShortcutsModal(false);
        if (isDetailModalOpen) setIsDetailModalOpen(false);
        if (isEditModalOpen) setIsEditModalOpen(false);
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (isLocationModalOpen) setIsLocationModalOpen(false);
      },
      description: 'Close open modals',
      preventDefault: false,
    },
  ], [handleAddVendor, handleRefresh, handleExportToCSV, showShortcutsModal, isDetailModalOpen, isEditModalOpen, isAddModalOpen, isLocationModalOpen]);

  useKeyboardShortcuts(shortcuts);

  const VendorNameCell = memo(({ vendor }: { vendor: Vendor }) => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
        <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">{vendor.name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{vendor.company || 'N/A'}</div>
      </div>
    </div>
  ));
  VendorNameCell.displayName = 'VendorNameCell';

  const ContactCell = memo(({ vendor }: { vendor: Vendor }) => (
    <div className="space-y-1">
      <div className="text-sm text-gray-900 dark:text-gray-100">{vendor.email}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{vendor.phone || 'No phone'}</div>
    </div>
  ));
  ContactCell.displayName = 'ContactCell';

  const RatingCell = memo(({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {getRatingStars(rating || 0)}
      <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">{(rating || 0).toFixed(1)}</span>
    </div>
  ));
  RatingCell.displayName = 'RatingCell';

  const LocationCell = memo(({ vendor }: { vendor: Vendor }) => (
    <button
      onClick={() => handleViewLocation(vendor)}
      className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded transition-colors"
    >
      <MapPin className="w-4 h-4 text-blue-500 hover:text-blue-600" />
      <span className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">{vendor.city}</span>
    </button>
  ));
  LocationCell.displayName = 'LocationCell';

  const ActionsCell = memo(({ vendor }: { vendor: Vendor }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewDetails(vendor)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(vendor)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSendEmail(vendor)}>
          <Mail className="mr-2 h-4 w-4" />
          Send Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleDelete(vendor.id)}
          className="text-red-600 dark:text-red-400"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ));
  ActionsCell.displayName = 'ActionsCell';

  const columns: ColumnDef<Vendor>[] = useMemo(() => {
    const baseColumns: ColumnDef<Vendor>[] = [
      {
        accessorKey: 'name',
        header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Vendor Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <VendorNameCell vendor={row.original} />,
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => <ContactCell vendor={row.original} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return <Badge variant={getStatusVariant(status)}>{status.toUpperCase()}</Badge>;
      },
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => <RatingCell rating={row.getValue('rating') as number} />,
    },
    {
      accessorKey: 'total_orders',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Orders
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const orders = row.getValue('total_orders') as number;
        return <div className="font-medium">{orders || 0}</div>;
      },
    },
    {
      accessorKey: 'total_value',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Total Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('total_value') as number;
        return <div className="font-medium text-green-600 dark:text-green-400">{formatCurrency(value || 0)}</div>;
      },
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }) => <LocationCell vendor={row.original} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <ActionsCell vendor={row.original} />,
    },
  ];

  if (isSelectMode || isComparisonMode) {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value) {
                selectAllVendors();
              } else {
                deselectAllVendors();
              }
            }}
            aria-label={isComparisonMode ? "Select all vendors for comparison" : "Select all vendors on current page"}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedVendorIds.has(row.original.id)}
            onCheckedChange={(value) => toggleVendorSelection(row.original.id)}
            aria-label={`Select vendor ${row.original.name}${isComparisonMode ? ' for comparison' : ''}`}
            disabled={isComparisonMode && !selectedVendorIds.has(row.original.id) && selectedVendorIds.size >= 5}
          />
        ),
      },
      ...baseColumns,
    ];
  }

  return baseColumns;
}, [handleEdit, handleDelete, handleViewDetails, handleViewLocation, formatCurrency, getStatusVariant, isSelectMode, isComparisonMode, selectedVendorIds, toggleVendorSelection, selectAllVendors, deselectAllVendors]);

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vendor Database</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your vendor network and partnerships</p>
          </div>
          <div className="flex gap-2">
            {!isSelectMode && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh} 
                  disabled={isLoading}
                  aria-label="Refresh vendor list"
                  aria-busy={isLoading}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                  <span>Refresh</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline"
                      aria-label="Export vendor data"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      <span>Export</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportToCSV}>
                      <Download className="mr-2 h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportToExcel}>
                      <Download className="mr-2 h-4 w-4" />
                      Export as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  onClick={handleImportVendors}
                  aria-label="Import vendor data from file"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span>Import</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsSelectMode(true);
                    if (isComparisonMode) {
                      setIsComparisonMode(false);
                      deselectAllVendors();
                    }
                  }}
                  aria-label="Enter selection mode for bulk operations"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span>Select Mode</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsComparisonMode(!isComparisonMode);
                    if (isSelectMode) {
                      setIsSelectMode(false);
                      deselectAllVendors();
                    }
                  }}
                  aria-label={isComparisonMode ? 'Exit comparison mode' : 'Enter comparison mode'}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span>{isComparisonMode ? 'Exit Comparison' : 'Compare Vendors'}</span>
                </Button>
                <Button 
                  onClick={handleAddVendor}
                  aria-label="Add new vendor"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Add Vendor</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {isSelectMode && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllVendors}
                  aria-label={`Select all ${vendors.length} vendors`}
                >
                  Select All ({vendors.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllVendors}
                  disabled={selectedVendorIds.size === 0}
                  aria-label="Deselect all selected vendors"
                >
                  Deselect All
                </Button>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedVendorIds.size} vendor{selectedVendorIds.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={bulkAction}
                  onValueChange={setBulkAction}
                >
                  <SelectTrigger className="w-[220px]" aria-label="Select bulk action">
                    <SelectValue placeholder="Select bulk action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status-active">Set Status: Active</SelectItem>
                    <SelectItem value="status-inactive">Set Status: Inactive</SelectItem>
                    <SelectItem value="status-suspended">Set Status: Suspended</SelectItem>
                    <SelectItem value="export">Export Selected</SelectItem>
                    <SelectItem value="delete">Delete Selected</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="default"
                  onClick={handleBulkAction}
                  disabled={selectedVendorIds.size === 0 || !bulkAction}
                  aria-label="Apply selected bulk action"
                >
                  Apply Action
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSelectMode(false);
                    deselectAllVendors();
                    setBulkAction('');
                  }}
                  aria-label="Exit selection mode"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Comparison Mode Toolbar */}
        {isComparisonMode && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllVendors}
                  aria-label={`Select all ${vendors.length} vendors for comparison`}
                >
                  Select All ({vendors.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllVendors}
                  disabled={selectedVendorIds.size === 0}
                  aria-label="Deselect all selected vendors"
                >
                  Deselect All
                </Button>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedVendorIds.size} vendor{selectedVendorIds.size !== 1 ? 's' : ''} selected for comparison
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  onClick={() => setShowComparison(true)}
                  disabled={selectedVendorIds.size < 2}
                  aria-label={`Compare ${selectedVendorIds.size} selected vendors`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Compare {selectedVendorIds.size >= 2 ? `${selectedVendorIds.size} Vendors` : 'Vendors'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsComparisonMode(false);
                    deselectAllVendors();
                  }}
                  aria-label="Exit comparison mode"
                >
                  Cancel
                </Button>
              </div>
            </div>
            {selectedVendorIds.size < 2 && (
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Pilih minimal 2 vendor untuk membandingkan. Maksimal 5 vendor.
              </p>
            )}
            {selectedVendorIds.size > 5 && (
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                Anda telah memilih lebih dari 5 vendor. Hanya 5 vendor pertama yang akan dibandingkan.
              </p>
            )}
          </Card>
        )}

        {/* Filters */}
        <Card hover={false}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Label htmlFor="vendor-search" className="sr-only">
                  Search vendors by name, email, or company
                </Label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
                <Input
                  id="vendor-search"
                  type="search"
                  role="searchbox"
                  aria-label="Search vendors by name, email, or company"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div 
                  role="status" 
                  aria-live="polite" 
                  aria-atomic="true"
                  className="sr-only"
                >
                  {debouncedSearchTerm ? `${vendors.length} vendors found` : ''}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="status-filter" className="sr-only">
                  Filter by vendor status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" aria-label="Filter by vendor status">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Filter */}
              <div>
                <Label htmlFor="rating-filter" className="sr-only">
                  Filter by vendor rating
                </Label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger id="rating-filter" aria-label="Filter by vendor rating">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                    <SelectItem value="3.0">3.0+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Company Size Filter */}
              <div>
                <Label htmlFor="company-size-filter" className="sr-only">
                  Filter by company size
                </Label>
                <Select value={companySizeFilter} onValueChange={setCompanySizeFilter}>
                  <SelectTrigger id="company-size-filter" aria-label="Filter by company size">
                    <SelectValue placeholder="All Sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setRatingFilter('all');
                  setCompanySizeFilter('all');
                  announceToScreenReader('All filters cleared');
                }}
                aria-label="Clear all filters"
              >
                <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>Clear</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-label="Vendor statistics summary">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" aria-label={`${vendors.length} total vendors`}>{vendors.length}</p>
                </div>
                <Building className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Vendors</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" aria-label={`${vendors.filter(v => v.status === 'active').length} active vendors`}>
                    {vendors.filter(v => v.status === 'active').length}
                  </p>
                </div>
                <Star className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" aria-label={`${vendors.reduce((sum, v) => sum + (v.total_orders || 0), 0)} total orders`}>
                    {vendors.reduce((sum, v) => sum + (v.total_orders || 0), 0)}
                  </p>
                </div>
                <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" aria-label={`Total value ${formatCurrency(vendors.reduce((sum, v) => sum + (v.total_value || 0), 0))}`}>
                    {formatCurrency(vendors.reduce((sum, v) => sum + (v.total_value || 0), 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendors Data Table */}
        {isLoading && vendors.length === 0 ? (
          <VendorListSkeleton count={10} />
        ) : (
          <div className="relative">
            {isLoading && vendors.length > 0 && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-center justify-center rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <Card hover={false} className="p-6">
              <DataTable
                columns={columns}
                data={vendors}
                searchKey="name"
                searchPlaceholder="Search vendors..."
                loading={isLoading}
                datasetId="vendor-database"
                onSearchChange={(value) => setSearchTerm(value)}
                onPageSizeChange={(pageSize) => handleFilterChange('per_page', pageSize)}
                externalPagination={{
                  pageIndex: (pagination?.page || 1) - 1, // Convert to 0-based index
                  pageSize: pagination?.per_page || 20,
                  pageCount: pagination?.last_page || 1,
                  total: pagination?.total || 0,
                  onPageChange: (page) => handleFilterChange('page', page + 1), // Convert back to 1-based
                }}
              />
            </Card>
          </div>
        )}

        {vendors.length === 0 && !isLoading && (
          <Card hover={false} className="p-12">
            <div className="text-center space-y-4">
              <Building className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No vendors found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
              </div>
              <Button onClick={() => toast.info('Add vendor functionality coming soon')}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Vendor
              </Button>
            </div>
          </Card>
        )}

        {/* Vendor Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent 
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            aria-labelledby="vendor-detail-title"
            aria-describedby="vendor-detail-description"
          >
            <DialogHeader>
              <DialogTitle id="vendor-detail-title">Vendor Details - {selectedVendor?.name}</DialogTitle>
              <DialogDescription id="vendor-detail-description">
                View comprehensive vendor information including performance metrics and business details
              </DialogDescription>
            </DialogHeader>

            {selectedVendor && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Vendor Details</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="business">Business Info</TabsTrigger>
                  <TabsTrigger value="location">Map Location</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <Card hover={false} className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Basic Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Name:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Code:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Industry:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.city}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <Badge variant={getStatusVariant(selectedVendor.status)}>
                            {selectedVendor.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Company Size:</span>
                          <span className="font-medium capitalize text-gray-900 dark:text-gray-100">{selectedVendor.company_size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Contact Person:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.contact_person}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.email}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card hover={false} className="p-4">
                    <h3 className="font-semibold mb-4">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedVendor.specializations?.map((spec, index) => (
                        <Badge key={index} variant="outline">
                          {spec.replace('_', ' ').toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </Card>

                  {selectedVendor.certifications && selectedVendor.certifications.length > 0 && (
                    <Card hover={false} className="p-4">
                      <h3 className="font-semibold mb-4">Certifications</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedVendor.certifications.map((cert, index) => (
                          <Badge key={index} variant="secondary">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <Card hover={false} className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Performance Metrics
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Rating:</span>
                          <div className="flex items-center gap-2">
                            <div className="flex">{getRatingStars(selectedVendor.rating)}</div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.rating}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Orders:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.total_orders}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(selectedVendor.total_value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Avg Lead Time:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.average_lead_time} days</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="business" className="space-y-4">
                  <Card hover={false} className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Contact & Business Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Address:</span>
                          <span className="font-medium text-right text-gray-900 dark:text-gray-100">{selectedVendor.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Payment Terms:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.payment_terms}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tax ID:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.tax_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Bank Account:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.bank_account}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                  <Card hover={false} className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Vendor Location
                    </h3>
                    
                    {/* Vendor Info Header */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{selectedVendor.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedVendor.city}</p>
                      </div>
                    </div>

                    {/* Read-only Map Display */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 dark:bg-gray-700 p-8 text-center">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Vendor Location Map</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Read-only map view for vendor location
                        </p>
                        <div className="space-y-2 text-left max-w-md mx-auto">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedVendor.address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">City:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedVendor.city}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Coordinates:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {selectedVendor.latitude || -6.2088}, {selectedVendor.longitude || 106.8456}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`https://maps.google.com/search/${encodeURIComponent(selectedVendor?.city || '')}`, '_blank')}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View in Google Maps
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedLocation(selectedVendor);
                          setIsLocationModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Detailed Location
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                if (selectedVendor) {
                  handleEdit(selectedVendor);
                  setIsDetailModalOpen(false);
                }
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Vendor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Location Modal */}
        <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
          <DialogContent 
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            aria-labelledby="location-title"
            aria-describedby="location-description"
          >
            <DialogHeader>
              <DialogTitle id="location-title">Vendor Location Details</DialogTitle>
              <DialogDescription id="location-description">
                View and manage vendor location information
              </DialogDescription>
            </DialogHeader>
            
            {selectedLocation && (
              <div className="space-y-4">
                {/* Vendor Info Header */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{selectedLocation.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLocation.company || 'Vendor Company'}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLocation.email}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLocation.phone || 'Phone not available'}</p>
                    </div>
                  </div>
                </div>

                {/* Read-only Map Display */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-700 p-8">
                    <div className="text-center mb-6">
                      <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Interactive Map Location</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detailed location information for {selectedLocation.name}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Latitude:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedLocation.latitude || -6.2088}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Longitude:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedLocation.longitude || 106.8456}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">City:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedLocation.city}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Province:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedLocation.province || 'Not available'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Country:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedLocation.country || 'Indonesia'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Full Address:</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedLocation.address || `${selectedLocation.city}, Indonesia`}
                      </p>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        💡 This is a read-only view. Use the Edit button to modify location information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLocationModalOpen(false)}>
                Close
              </Button>
              <Button onClick={() => window.open(`https://maps.google.com/search/${encodeURIComponent(selectedLocation?.city || '')}`, '_blank')}>
                <MapPin className="w-4 h-4 mr-2" />
                View in Google Maps
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Edit Vendor Modal */}
        <VendorFormDialog
          mode="edit"
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          defaultValues={editingVendor || undefined}
          onSubmit={handleUpdateVendorSubmit}
          isSubmitting={isSaving}
        />

        {/* Add Vendor Modal */}
        <VendorFormDialog
          mode="create"
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSubmit={handleCreateVendorSubmit}
          isSubmitting={isSaving}
        />

        {/* Keyboard Shortcuts Help Modal */}
        <Dialog open={showShortcutsModal} onOpenChange={setShowShortcutsModal}>
          <DialogContent 
            aria-labelledby="shortcuts-title"
            aria-describedby="shortcuts-description"
          >
            <DialogHeader>
              <DialogTitle id="shortcuts-title">Keyboard Shortcuts</DialogTitle>
              <DialogDescription id="shortcuts-description">
                Speed up your workflow with these keyboard shortcuts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {shortcuts.filter(s => s.description !== 'Close open modals').map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                    {shortcut.shiftKey && 'Shift + '}
                    {shortcut.ctrlKey && 'Ctrl + '}
                    {shortcut.altKey && 'Alt + '}
                    {shortcut.metaKey && 'Cmd + '}
                    {shortcut.key === '?' ? '?' : shortcut.key.toUpperCase()}
                  </kbd>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShortcutsModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Vendor Comparison Modal */}
        <VendorComparison
          vendors={Array.from(selectedVendorIds)
            .map(id => vendors.find(v => v.id === id))
            .filter((v): v is Vendor => v !== undefined)
            .slice(0, 5)}
          open={showComparison}
          onClose={() => setShowComparison(false)}
        />
      </div>
    </LazyWrapper>
  );
}

export default memo(VendorDatabase);