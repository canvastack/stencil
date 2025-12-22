import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';

interface Contract {
  id: string;
  vendor_id: string;
  vendor_name: string;
  contract_number: string;
  title: string;
  type: 'service' | 'purchase' | 'framework' | 'maintenance';
  status: 'draft' | 'active' | 'pending' | 'expired' | 'terminated' | 'renewed';
  start_date: string;
  end_date: string;
  total_value: number;
  currency: string;
  renewal_terms?: string;
  auto_renewal: boolean;
  payment_terms: string;
  created_at: string;
  updated_at: string;
}

// Mock data - dalam implementasi nyata, ini akan dari API
const mockContracts: Contract[] = [
  {
    id: '1',
    vendor_id: '101',
    vendor_name: 'PT Teknologi Maju',
    contract_number: 'CTR-2024-001',
    title: 'Layanan IT Support & Maintenance',
    type: 'service',
    status: 'active',
    start_date: '2024-01-15',
    end_date: '2024-12-31',
    total_value: 120000000,
    currency: 'IDR',
    renewal_terms: '6 bulan sebelum berakhir',
    auto_renewal: true,
    payment_terms: 'NET 30',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    vendor_id: '102',
    vendor_name: 'CV Bahan Bangunan Jaya',
    contract_number: 'CTR-2024-002',
    title: 'Supply Material Konstruksi Q1-Q2 2024',
    type: 'purchase',
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-06-30',
    total_value: 450000000,
    currency: 'IDR',
    renewal_terms: 'Negotiable',
    auto_renewal: false,
    payment_terms: 'NET 21',
    created_at: '2023-12-20T10:15:00Z',
    updated_at: '2024-01-01T08:00:00Z'
  },
  {
    id: '3',
    vendor_id: '103',
    vendor_name: 'PT Logistik Express',
    contract_number: 'CTR-2024-003',
    title: 'Framework Agreement - Delivery Services',
    type: 'framework',
    status: 'pending',
    start_date: '2024-03-01',
    end_date: '2025-02-28',
    total_value: 0, // Framework contract
    currency: 'IDR',
    renewal_terms: 'Annual review',
    auto_renewal: false,
    payment_terms: 'Per delivery - NET 14',
    created_at: '2024-02-15T16:20:00Z',
    updated_at: '2024-02-20T11:45:00Z'
  }
];

const VendorContracts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'terminated':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'expired':
      case 'terminated':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service':
        return 'bg-blue-100 text-blue-800';
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'framework':
        return 'bg-purple-100 text-purple-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredContracts = mockContracts.filter(contract => {
    const matchesSearch = contract.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const contractColumns: ColumnDef<Contract>[] = [
    {
      accessorKey: 'contract_number',
      header: 'Contract Number',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('contract_number')}</div>
      ),
    },
    {
      accessorKey: 'vendor_name',
      header: 'Vendor',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('vendor_name')}</div>
          <div className="text-sm text-gray-600">{row.original.title}</div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className={getTypeColor(row.getValue('type'))}>
          {(row.getValue('type') as string).charAt(0).toUpperCase() + (row.getValue('type') as string).slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.getValue('status'))}
          <Badge variant={getStatusVariant(row.getValue('status'))}>
            {(row.getValue('status') as string).charAt(0).toUpperCase() + (row.getValue('status') as string).slice(1)}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'total_value',
      header: 'Value',
      cell: ({ row }) => {
        const value = row.getValue('total_value') as number;
        return value > 0 ? formatCurrency(value) : 'Framework';
      },
    },
    {
      accessorKey: 'end_date',
      header: 'Expiry',
      cell: ({ row }) => {
        const endDate = row.getValue('end_date') as string;
        const daysLeft = getDaysUntilExpiry(endDate);
        return (
          <div>
            <div className="text-sm">{new Date(endDate).toLocaleDateString('id-ID')}</div>
            {daysLeft <= 30 && (
              <div className={`text-xs ${daysLeft <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                {daysLeft > 0 ? `${daysLeft} hari lagi` : `Expired ${Math.abs(daysLeft)} hari lalu`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  console.log('View contract button clicked!', row.original.contract_number);
                  toast.info(`👁️ Melihat detail kontrak ${row.original.contract_number}`, {
                    duration: 3000,
                    position: 'top-right'
                  });
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Contract Details</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  console.log('Edit contract button clicked!', row.original.contract_number);
                  toast.info(`✏️ Mengedit kontrak ${row.original.contract_number}`, {
                    duration: 3000,
                    position: 'top-right'
                  });
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Contract</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  console.log('Delete contract button clicked!', row.original.contract_number);
                  toast.warning(`🗑️ Menghapus kontrak ${row.original.contract_number}?`, {
                    duration: 3000,
                    position: 'top-right'
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Contract</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  // Contract statistics
  const stats = {
    total: mockContracts.length,
    active: mockContracts.filter(c => c.status === 'active').length,
    pending: mockContracts.filter(c => c.status === 'pending').length,
    expiringSoon: mockContracts.filter(c => getDaysUntilExpiry(c.end_date) <= 30 && getDaysUntilExpiry(c.end_date) > 0).length,
    totalValue: mockContracts.reduce((sum, c) => sum + c.total_value, 0),
  };

  const handleExport = () => {
    console.log('Export contracts button clicked!');
    toast.success('📄 Data kontrak vendor berhasil diekspor', {
      duration: 4000,
      position: 'top-right'
    });
  };

  const handleNewContract = () => {
    console.log('New contract button clicked!');
    toast.info('📝 Form kontrak baru akan segera tersedia', {
      duration: 4000,
      position: 'top-right'
    });
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vendor Contracts & Terms</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola kontrak dan perjanjian dengan vendor</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleNewContract}>
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Contracts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.expiringSoon}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </Card>
        </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Contracts</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Contracts</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search contracts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={contractColumns} 
                data={filteredContracts}
                searchKey="vendor_name"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Active Contracts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={contractColumns} 
                data={mockContracts.filter(c => c.status === 'active')}
                searchKey="vendor_name"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={contractColumns} 
                data={mockContracts.filter(c => c.status === 'pending')}
                searchKey="vendor_name"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockContracts
                  .filter(c => getDaysUntilExpiry(c.end_date) <= 30 && getDaysUntilExpiry(c.end_date) > 0)
                  .map((contract) => {
                    const daysLeft = getDaysUntilExpiry(contract.end_date);
                    return (
                      <div key={contract.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{contract.vendor_name}</h4>
                            <p className="text-sm text-gray-600">{contract.contract_number} • {contract.title}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${daysLeft <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                              {daysLeft} hari
                            </div>
                            <div className="text-sm text-gray-600">tersisa</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Expires: {new Date(contract.end_date).toLocaleDateString('id-ID')}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toast.success(`Renewing contract ${contract.contract_number}`)}
                            >
                              <FileCheck className="h-4 w-4 mr-1" />
                              Renew
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => toast.info(`Viewing contract ${contract.contract_number}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {mockContracts.filter(c => getDaysUntilExpiry(c.end_date) <= 30 && getDaysUntilExpiry(c.end_date) > 0).length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-600">Tidak ada kontrak yang akan berakhir dalam 30 hari ke depan</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Service Agreement Template', type: 'service', description: 'Standard template for service contracts' },
                  { name: 'Purchase Order Template', type: 'purchase', description: 'Template for purchase agreements' },
                  { name: 'Framework Agreement Template', type: 'framework', description: 'Multi-year framework contract template' },
                  { name: 'Maintenance Contract Template', type: 'maintenance', description: 'Equipment and software maintenance template' },
                ].map((template, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h4 className="font-semibold">{template.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toast.info(`Previewing ${template.name}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => toast.success(`Using template: ${template.name}`)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default VendorContracts;