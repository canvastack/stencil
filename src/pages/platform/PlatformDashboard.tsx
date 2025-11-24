import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import {
  Building2,
  Users,
  CreditCard,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign
} from 'lucide-react';

const PlatformDashboard = () => {
  const { account } = usePlatformAuth();

  const stats = [
    {
      title: 'Total Tenants',
      value: '12',
      change: '+2 this month',
      changeType: 'increase' as const,
      icon: Building2,
      color: 'blue'
    },
    {
      title: 'Active Subscriptions',
      value: '10',
      change: '+1 this week',
      changeType: 'increase' as const,
      icon: CreditCard,
      color: 'green'
    },
    {
      title: 'Platform Users',
      value: '45',
      change: '+5 this month',
      changeType: 'increase' as const,
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Monthly Revenue',
      value: '$4,250',
      change: '+12% from last month',
      changeType: 'increase' as const,
      icon: DollarSign,
      color: 'orange'
    }
  ];

  const recentActivity = [
    {
      tenant: 'Demo Etching Business',
      action: 'Created new order',
      time: '2 minutes ago',
      status: 'active'
    },
    {
      tenant: 'Acme Corporation',
      action: 'Upgraded subscription',
      time: '1 hour ago',
      status: 'success'
    },
    {
      tenant: 'TechStart Inc',
      action: 'Payment failed',
      time: '3 hours ago',
      status: 'error'
    },
    {
      tenant: 'Creative Agency',
      action: 'New user registered',
      time: '5 hours ago',
      status: 'active'
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Platform Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {account?.name}. Here's what's happening with your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'increase' ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <p className={`text-xs ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Activity
            </h2>
            <Activity className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.tenant}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.action}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      activity.status === 'success' ? 'default' :
                      activity.status === 'error' ? 'destructive' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Platform Health
            </h2>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">System Status</span>
              <Badge variant="default" className="bg-green-600">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
              <Badge variant="default" className="bg-green-600">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">API Response Time</span>
              <Badge variant="secondary">85ms avg</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Storage Usage</span>
              <Badge variant="secondary">65% (2.1 GB)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Backup Status</span>
              <Badge variant="default" className="bg-blue-600">Updated 2h ago</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlatformDashboard;