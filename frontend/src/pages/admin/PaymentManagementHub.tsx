import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, History, CreditCard, BarChart3, FileText, RotateCcw, Ban, Receipt, XCircle } from 'lucide-react';

export default function PaymentManagementHub() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Payment Verification',
      description: 'Verify pending customer payments',
      icon: Clock,
      path: '/admin/payments/verification',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Payment History',
      description: 'View all payment records and history',
      icon: History,
      path: '/admin/payments/history',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Refund Management',
      description: 'Process payment refunds and reversals',
      icon: RotateCcw,
      path: '/admin/payments/refunds',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Failed Payments',
      description: 'Review and retry failed transactions',
      icon: XCircle,
      path: '/admin/payments/failed',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      disabled: true,
    },
    {
      title: 'Payment Reports',
      description: 'Generate payment reports and analytics',
      icon: BarChart3,
      path: '/admin/payments/reports',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Invoice Management',
      description: 'Manage invoices and receipts',
      icon: FileText,
      path: '/admin/invoices',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      disabled: true,
    },
    {
      title: 'Payment Receipts',
      description: 'Send and manage payment receipts',
      icon: Receipt,
      path: '/admin/payments/receipts',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      disabled: true,
    },
    {
      title: 'Cancelled Payments',
      description: 'View cancelled payment transactions',
      icon: Ban,
      path: '/admin/payments/cancelled',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      disabled: true,
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground">
          Process and manage customer payments and transactions
        </p>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.path}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                item.disabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${item.borderColor}`}
              onClick={() => !item.disabled && navigate(item.path)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${item.bgColor}`}>
                        <Icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      {item.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.disabled) navigate(item.path);
                  }}
                >
                  {item.disabled ? 'Coming Soon' : 'Open'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
          <CardDescription>Payment system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-600">-</p>
              <p className="text-sm text-muted-foreground">Pending Verification</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">-</p>
              <p className="text-sm text-muted-foreground">Verified Today</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <History className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">-</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
