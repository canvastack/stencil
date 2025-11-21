import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
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
import { DollarSign, TrendingUp, TrendingDown, Download, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { financialService } from '@/services/api/financial';
import { Transaction as APITransaction } from '@/services/api/financial';

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
}



export default function FinancialReport() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await financialService.getTransactions({ 
          per_page: 100,
          type: filterType !== 'all' ? filterType as 'income' | 'expense' : undefined,
          period: filterPeriod as 'day' | 'week' | 'month' | 'quarter' | 'year',
          date_from: startDate || undefined,
          date_to: endDate || undefined
        });
        const apiTransactions = response.data || [];
        
        // Transform API data to UI format
        const uiTransactions: Transaction[] = apiTransactions.map(t => ({
          id: t.id,
          date: t.date,
          type: t.type,
          category: t.category,
          description: t.description,
          amount: t.amount,
          paymentMethod: t.payment_method,
        }));
        
        setTransactions(uiTransactions);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to load financial data');
        toast.error('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filterType, filterPeriod, startDate, endDate]);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t =>
        [t.date, t.type, t.category, `"${t.description}"`, t.amount, t.paymentMethod].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Financial report exported as CSV');
  };

  const handleExportPDF = () => {
    // In a real implementation, you would use a library like jsPDF
    toast.success('PDF export feature will be implemented with jsPDF library');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalIncome),
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(totalExpense),
      icon: TrendingDown,
      trend: '+8.3%',
      trendUp: false,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
    {
      label: 'Net Profit',
      value: formatCurrency(netProfit),
      icon: TrendingUp,
      trend: '+15.2%',
      trendUp: true,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Track revenue, expenses, and profitability for etching business</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{stat.trend}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="income">Income Only</SelectItem>
                <SelectItem value="expense">Expense Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="p-6">
        <DataTable
          columns={[
            {
              accessorKey: 'date',
              header: 'Date',
              cell: ({ row }) => (
                <div>{new Date(row.getValue('date')).toLocaleDateString('id-ID')}</div>
              ),
            },
            {
              accessorKey: 'type',
              header: 'Type',
              cell: ({ row }) => (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    row.getValue('type') === 'income'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}
                >
                  {row.getValue('type') === 'income' ? 'Income' : 'Expense'}
                </span>
              ),
            },
            {
              accessorKey: 'category',
              header: 'Category',
            },
            {
              accessorKey: 'description',
              header: 'Description',
              cell: ({ row }) => (
                <div className="max-w-[300px] truncate">{row.getValue('description')}</div>
              ),
            },
            {
              accessorKey: 'paymentMethod',
              header: 'Payment Method',
            },
            {
              accessorKey: 'amount',
              header: 'Amount',
              cell: ({ row }) => {
                const transaction = row.original;
                return (
                  <div className={`text-right font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(row.getValue('amount'))}
                  </div>
                );
              },
            },
          ]}
          data={filteredTransactions}
          searchPlaceholder="Search transactions..."
          searchKey="description"
        />
      </Card>

      {/* Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Period Summary</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Profit/Loss</p>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
