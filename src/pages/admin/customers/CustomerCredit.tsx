import React, { useState, useMemo, useEffect } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer, CustomerFilters } from '@/types/customer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building,
  ArrowUpDown,
  Download,
  Upload,
  RefreshCw,
  XCircle,
  History,
  Calculator,
  Banknote
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface CreditTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'credit_limit_increase' | 'credit_limit_decrease' | 'payment' | 'invoice' | 'adjustment';
  amount: number;
  previousBalance: number;
  newBalance: number;
  description: string;
  createdAt: string;
  createdBy: string;
}

interface CustomerCreditData extends Customer {
  creditUtilization: number;
  creditScore: number;
  paymentHistory: string;
  lastPaymentDate: string;
  overdueAmount: number;
  daysPastDue: number;
}

interface CreditAdjustmentForm {
  customerId: string;
  customerName: string;
  currentLimit: number;
  newLimit: number;
  reason: string;
  notes: string;
}

const defaultAdjustmentForm: CreditAdjustmentForm = {
  customerId: '',
  customerName: '',
  currentLimit: 0,
  newLimit: 0,
  reason: '',
  notes: '',
};

export default function CustomerCredit() {
  const { customers: apiCustomers, isLoading: customersLoading, fetchCustomers } = useCustomers();
  const [customers, setCustomers] = useState<CustomerCreditData[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCreditData | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<CreditAdjustmentForm>(defaultAdjustmentForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'good' | 'warning' | 'critical'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'company'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load customers from API
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Transform API customers to CustomerCreditData format
  useEffect(() => {
    if (apiCustomers && apiCustomers.length > 0) {
      const creditCustomers: CustomerCreditData[] = apiCustomers.map(customer => ({
        ...customer,
        customerType: customer.type,
        creditLimit: 100000000, // Default values - would come from API
        outstandingBalance: 0,
        creditUtilization: 0,
        creditScore: 80,
        paymentHistory: 'good',
        lastPaymentDate: new Date().toISOString().split('T')[0],
        overdueAmount: 0,
        daysPastDue: 0,
        totalOrders: customer.total_orders || 0,
        lifetimeValue: customer.lifetime_value || 0,
        createdAt: customer.created_at
      }));
      setCustomers(creditCustomers);
    }
  }, [apiCustomers]);

  // Mock data untuk demonstrasi
  const mockCustomers: CustomerCreditData[] = [
    {
      id: '1',
      uuid: 'cust-001',
      name: 'PT. Teknologi Maju',
      email: 'procurement@teknologimaju.co.id',
      customerType: 'company',
      creditLimit: 500000000,
      outstandingBalance: 125000000,
      creditUtilization: 25,
      creditScore: 95,
      paymentHistory: 'excellent',
      status: 'active',
      lastPaymentDate: '2024-12-01',
      overdueAmount: 0,
      daysPastDue: 0,
      totalOrders: 45,
      lifetimeValue: 2500000000,
      createdAt: '2023-05-15'
    },
    {
      id: '2',
      uuid: 'cust-002',
      name: 'CV. Berkah Jaya',
      email: 'owner@berkahjaya.com',
      customerType: 'company',
      creditLimit: 100000000,
      outstandingBalance: 85000000,
      creditUtilization: 85,
      creditScore: 70,
      paymentHistory: 'good',
      status: 'active',
      lastPaymentDate: '2024-11-15',
      overdueAmount: 15000000,
      daysPastDue: 7,
      totalOrders: 23,
      lifetimeValue: 450000000,
      createdAt: '2023-08-20'
    },
    {
      id: '3',
      uuid: 'cust-003',
      name: 'Ahmad Budiman',
      email: 'ahmad.budiman@gmail.com',
      customerType: 'individual',
      creditLimit: 25000000,
      outstandingBalance: 5000000,
      creditUtilization: 20,
      creditScore: 88,
      paymentHistory: 'excellent',
      status: 'active',
      lastPaymentDate: '2024-11-28',
      overdueAmount: 0,
      daysPastDue: 0,
      totalOrders: 12,
      lifetimeValue: 85000000,
      createdAt: '2024-01-10'
    },
    {
      id: '4',
      uuid: 'cust-004',
      name: 'PT. Industri Kreatif',
      email: 'finance@industrikreatif.co.id',
      customerType: 'company',
      creditLimit: 200000000,
      outstandingBalance: 195000000,
      creditUtilization: 97.5,
      creditScore: 45,
      paymentHistory: 'poor',
      status: 'active',
      lastPaymentDate: '2024-09-15',
      overdueAmount: 75000000,
      daysPastDue: 45,
      totalOrders: 18,
      lifetimeValue: 320000000,
      createdAt: '2023-11-05'
    },
    {
      id: '5',
      uuid: 'cust-005',
      name: 'Sari Dewi',
      email: 'sari.dewi@hotmail.com',
      customerType: 'individual',
      creditLimit: 15000000,
      outstandingBalance: 8500000,
      creditUtilization: 56.7,
      creditScore: 75,
      paymentHistory: 'good',
      status: 'active',
      lastPaymentDate: '2024-11-20',
      overdueAmount: 2500000,
      daysPastDue: 12,
      totalOrders: 8,
      lifetimeValue: 45000000,
      createdAt: '2024-03-22'
    }
  ];

  const mockTransactions: CreditTransaction[] = [
    {
      id: '1',
      customerId: '1',
      customerName: 'PT. Teknologi Maju',
      type: 'payment',
      amount: -50000000,
      previousBalance: 175000000,
      newBalance: 125000000,
      description: 'Payment received for Invoice #INV-2024-001',
      createdAt: '2024-12-01',
      createdBy: 'Finance Team'
    },
    {
      id: '2',
      customerId: '2',
      customerName: 'CV. Berkah Jaya',
      type: 'invoice',
      amount: 25000000,
      previousBalance: 60000000,
      newBalance: 85000000,
      description: 'New invoice #INV-2024-045 created',
      createdAt: '2024-11-25',
      createdBy: 'System'
    },
    {
      id: '3',
      customerId: '1',
      customerName: 'PT. Teknologi Maju',
      type: 'credit_limit_increase',
      amount: 100000000,
      previousBalance: 175000000,
      newBalance: 175000000,
      description: 'Credit limit increased due to excellent payment history',
      createdAt: '2024-11-20',
      createdBy: 'Credit Manager'
    }
  ];

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || customer.customerType === typeFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'good') {
        matchesStatus = customer.creditScore >= 80 && customer.daysPastDue === 0;
      } else if (statusFilter === 'warning') {
        matchesStatus = (customer.creditScore >= 60 && customer.creditScore < 80) || 
                       (customer.daysPastDue > 0 && customer.daysPastDue <= 30);
      } else if (statusFilter === 'critical') {
        matchesStatus = customer.creditScore < 60 || customer.daysPastDue > 30;
      }
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalCreditLimit = mockCustomers.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalOutstanding = mockCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);
    const totalOverdue = mockCustomers.reduce((sum, c) => sum + c.overdueAmount, 0);
    const avgCreditScore = mockCustomers.reduce((sum, c) => sum + c.creditScore, 0) / mockCustomers.length;
    const customersAtRisk = mockCustomers.filter(c => c.creditScore < 60 || c.daysPastDue > 30).length;
    const utilizationRate = totalCreditLimit > 0 ? (totalOutstanding / totalCreditLimit) * 100 : 0;

    return {
      totalCreditLimit,
      totalOutstanding,
      totalOverdue,
      avgCreditScore,
      customersAtRisk,
      utilizationRate
    };
  }, []);

  // Get credit status
  const getCreditStatus = (customer: CustomerCreditData) => {
    if (customer.creditScore >= 80 && customer.daysPastDue === 0) {
      return { status: 'good', label: 'Good', color: 'success' };
    } else if ((customer.creditScore >= 60 && customer.creditScore < 80) || 
               (customer.daysPastDue > 0 && customer.daysPastDue <= 30)) {
      return { status: 'warning', label: 'Warning', color: 'warning' };
    } else {
      return { status: 'critical', label: 'Critical', color: 'destructive' };
    }
  };

  // DataTable columns
  const columns: ColumnDef<CustomerCreditData>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Customer Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.customerType === 'company' ? (
            <Building className="h-4 w-4 text-blue-600" />
          ) : (
            <User className="h-4 w-4 text-green-600" />
          )}
          <div>
            <div className="font-medium">{row.getValue('name')}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'creditLimit',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Credit Limit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-medium">
            Rp {row.getValue<number>('creditLimit').toLocaleString('id-ID')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'outstandingBalance',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Outstanding
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const balance = row.getValue<number>('outstandingBalance');
        const limit = row.original.creditLimit;
        const utilization = limit > 0 ? (balance / limit) * 100 : 0;
        
        return (
          <div className="text-right">
            <div className="font-medium">
              Rp {balance.toLocaleString('id-ID')}
            </div>
            <div className="text-sm text-muted-foreground">
              {utilization.toFixed(1)}% utilized
            </div>
            <Progress 
              value={utilization} 
              className="w-20 h-1 mt-1"
              indicatorClassName={utilization > 90 ? 'bg-red-500' : utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'creditScore',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Credit Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const score = row.getValue<number>('creditScore');
        const getScoreColor = () => {
          if (score >= 80) return 'text-green-600';
          if (score >= 60) return 'text-yellow-600';
          return 'text-red-600';
        };
        
        return (
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor()}`}>
              {score}
            </div>
            <div className="text-xs text-muted-foreground">
              {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Poor'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'overdueAmount',
      header: 'Overdue',
      cell: ({ row }) => {
        const overdueAmount = row.getValue<number>('overdueAmount');
        const daysPastDue = row.original.daysPastDue;
        
        if (overdueAmount > 0) {
          return (
            <div className="text-right">
              <div className="font-medium text-red-600">
                Rp {overdueAmount.toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-red-500">
                {daysPastDue} days past due
              </div>
            </div>
          );
        }
        
        return (
          <div className="text-center">
            <Badge variant="success" className="text-xs">
              Current
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusInfo = getCreditStatus(row.original);
        
        return (
          <Badge variant={statusInfo.color as any}>
            {statusInfo.status === 'good' && <CheckCircle className="h-3 w-3 mr-1" />}
            {statusInfo.status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {statusInfo.status === 'critical' && <XCircle className="h-3 w-3 mr-1" />}
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewCustomer(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreditAdjustment(row.original)}>
              <Calculator className="mr-2 h-4 w-4" />
              Adjust Credit Limit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleViewTransactionHistory(row.original)}>
              <History className="mr-2 h-4 w-4" />
              Transaction History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlePaymentProcessing(row.original)}>
              <Banknote className="mr-2 h-4 w-4" />
              Process Payment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleViewCustomer = (customer: CustomerCreditData) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleCreditAdjustment = (customer: CustomerCreditData) => {
    setSelectedCustomer(customer);
    setAdjustmentForm({
      customerId: customer.id,
      customerName: customer.name,
      currentLimit: customer.creditLimit,
      newLimit: customer.creditLimit,
      reason: '',
      notes: '',
    });
    setIsAdjustmentModalOpen(true);
  };

  const handleViewTransactionHistory = (customer: CustomerCreditData) => {
    setSelectedCustomer(customer);
    setIsTransactionHistoryOpen(true);
  };

  const handlePaymentProcessing = (customer: CustomerCreditData) => {
    // This would open a payment processing modal
    toast.info('Payment processing feature coming soon!');
  };

  const handleSaveCreditAdjustment = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Credit limit adjusted successfully!');
      setIsAdjustmentModalOpen(false);
      setAdjustmentForm(defaultAdjustmentForm);
    } catch (error) {
      toast.error('Failed to adjust credit limit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Credit Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage customer credit limits and payment terms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Credit Report
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Credit Scores
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Credit Limit</p>
                <p className="text-xl font-bold">
                  Rp {(stats.totalCreditLimit / 1000000000).toFixed(1)}B
                </p>
              </div>
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                <p className="text-xl font-bold text-orange-600">
                  Rp {(stats.totalOutstanding / 1000000000).toFixed(1)}B
                </p>
              </div>
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                <p className="text-xl font-bold text-red-600">
                  Rp {(stats.totalOverdue / 1000000).toFixed(0)}M
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Credit Score</p>
                <p className="text-xl font-bold text-green-600">
                  {stats.avgCreditScore.toFixed(0)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">At Risk</p>
                <p className="text-xl font-bold text-red-600">
                  {stats.customersAtRisk}
                </p>
              </div>
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utilization</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.utilizationRate.toFixed(1)}%
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'good' | 'warning' | 'critical') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by credit status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="good">Good Credit</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value: 'all' | 'individual' | 'company') => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Customer Credit Overview ({filteredCustomers.length})
          </CardTitle>
          <CardDescription>
            Monitor customer credit limits, utilization, and payment performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredCustomers}
            searchKey="name"
            searchPlaceholder="Search customers..."
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Credit Adjustment Modal */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Credit Limit</DialogTitle>
            <DialogDescription>
              Modify the credit limit for {adjustmentForm.customerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Credit Limit</Label>
                <div className="text-2xl font-bold text-blue-600">
                  Rp {adjustmentForm.currentLimit.toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <Label htmlFor="newLimit">New Credit Limit</Label>
                <Input
                  id="newLimit"
                  type="number"
                  value={adjustmentForm.newLimit}
                  onChange={(e) => setAdjustmentForm(prev => ({
                    ...prev,
                    newLimit: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Adjustment</Label>
              <Select value={adjustmentForm.reason} onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, reason: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_history_improved">Payment History Improved</SelectItem>
                  <SelectItem value="business_expansion">Business Expansion</SelectItem>
                  <SelectItem value="payment_issues">Payment Issues</SelectItem>
                  <SelectItem value="risk_assessment">Risk Assessment Update</SelectItem>
                  <SelectItem value="customer_request">Customer Request</SelectItem>
                  <SelectItem value="manual_review">Manual Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter additional notes about this adjustment..."
                value={adjustmentForm.notes}
                onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Current Limit:</span>
                  <span>Rp {adjustmentForm.currentLimit.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Limit:</span>
                  <span className={adjustmentForm.newLimit > adjustmentForm.currentLimit ? 'text-green-600' : 'text-red-600'}>
                    Rp {adjustmentForm.newLimit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Change:</span>
                  <span className={adjustmentForm.newLimit > adjustmentForm.currentLimit ? 'text-green-600' : 'text-red-600'}>
                    {adjustmentForm.newLimit > adjustmentForm.currentLimit ? '+' : ''}
                    Rp {(adjustmentForm.newLimit - adjustmentForm.currentLimit).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAdjustmentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCreditAdjustment}
              disabled={isLoading || !adjustmentForm.reason}
            >
              {isLoading ? 'Saving...' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCustomer?.customerType === 'company' ? (
                <Building className="h-5 w-5 text-blue-600" />
              ) : (
                <User className="h-5 w-5 text-green-600" />
              )}
              {selectedCustomer?.name} - Credit Profile
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="payments">Payment History</TabsTrigger>
                <TabsTrigger value="limits">Credit Limits</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {selectedCustomer.creditScore}
                      </div>
                      <div className="text-sm text-muted-foreground">Credit Score</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {selectedCustomer.creditUtilization.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Utilization</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {selectedCustomer.totalOrders}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Orders</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {selectedCustomer.daysPastDue}
                      </div>
                      <div className="text-sm text-muted-foreground">Days Past Due</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <div className="text-center text-muted-foreground">
                  Payment history details would be displayed here
                </div>
              </TabsContent>

              <TabsContent value="limits" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Credit Limits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Credit Limit:</span>
                          <span className="font-medium">
                            Rp {selectedCustomer.creditLimit.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Outstanding:</span>
                          <span className="font-medium">
                            Rp {selectedCustomer.outstandingBalance.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Available Credit:</span>
                          <span className="font-medium text-green-600">
                            Rp {(selectedCustomer.creditLimit - selectedCustomer.outstandingBalance).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction History Modal */}
      <Dialog open={isTransactionHistoryOpen} onOpenChange={setIsTransactionHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Credit Transaction History - {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center text-muted-foreground">
              Transaction history would be displayed here with full audit trail
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}