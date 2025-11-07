import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, FileText, Package, Users, TrendingUp, Eye } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function Dashboard() {
  const { products } = useProducts();

  const stats = [
    {
      title: 'Total Orders',
      value: 245,
      icon: Package,
      trend: '+18%',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Revenue (MTD)',
      value: 'Rp 125.5M',
      icon: TrendingUp,
      trend: '+23%',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Active Products',
      value: products.filter(p => p.status === 'published').length,
      icon: LayoutDashboard,
      trend: '+12%',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Customers',
      value: 89,
      icon: Users,
      trend: '+15%',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
  ];

  const recentActivities = [
    { action: 'New order received', item: 'Brass Plaque - Order #1234', time: '15 minutes ago' },
    { action: 'Product delivered', item: 'Stainless Steel Nameplate', time: '2 hours ago' },
    { action: 'Customer review added', item: 'Glass Trophy Set - 5 stars', time: '5 hours ago' },
    { action: 'Low stock alert', item: 'Crystal Glass Premium', time: '1 day ago' },
    { action: 'Payment received', item: 'Order #1233 - Rp 4.5M', time: '2 days ago' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your CMS today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                <span className="text-sm text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates across your CMS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.item}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
            <CardDescription>Summary of your content library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Pending Orders</p>
                    <p className="text-sm text-muted-foreground">Awaiting processing</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">12</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Best Seller</p>
                    <p className="text-sm text-muted-foreground">This month</p>
                  </div>
                </div>
                <span className="text-sm font-medium">Brass Plaque</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Avg Order Value</p>
                    <p className="text-sm text-muted-foreground">Last 30 days</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">Rp 2.8M</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Switcher for Testing */}
        <div className="mt-6">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
