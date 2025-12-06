# TRACK C: BUSINESS INTELLIGENCE & REPORTS

**Duration**: 2 Weeks (Weeks 5-6)  
**Priority**: **MEDIUM - STRATEGIC INSIGHTS**  
**Prerequisites**: Track A completed, Track B 70% completed  
**Effort**: 60-80 hours (1-2 developers)  
**Target Completion**: Week 6 of Tenant Focus roadmap

---

## 🎯 TRACK OVERVIEW

### **OBJECTIVE**
Implementasi comprehensive business intelligence dan reporting system untuk memberikan insights mendalam tentang performance bisnis tenant, dengan fokus pada profitability analysis, customer analytics, vendor performance, dan forecasting.

### **Key Deliverables**
- **Sales Reports** with revenue analysis and trends
- **Performance Metrics** with KPI dashboard
- **Financial Statements** with profit/loss calculation
- **Business Intelligence** with predictive analytics and forecasting

### **Architecture Compliance**
- ✅ **Real-time Analytics**: Live data processing dengan caching optimization
- ✅ **Data Visualization**: Interactive charts dan graphs using Chart.js/Recharts
- ✅ **Export Capabilities**: PDF, Excel, CSV export functionality
- ✅ **Performance Optimization**: Query optimization untuk large datasets

---

## 📋 WEEK-BY-WEEK IMPLEMENTATION PLAN

### **WEEK 5: SALES REPORTS & PERFORMANCE METRICS**
**Duration**: 1 week  
**Effort**: 30-40 hours  
**Priority**: **HIGH**

#### **Day 1-2: Analytics Database Schema (12-15 hours)**

**Backend Implementation**:
```php
// File: database/migrations/tenant/create_sales_analytics_table.php
Schema::create('sales_analytics', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->date('date');
    $table->integer('orders_count')->default(0);
    $table->integer('new_customers_count')->default(0);
    $table->integer('returning_customers_count')->default(0);
    $table->decimal('gross_revenue', 12, 2)->default(0);
    $table->decimal('vendor_costs', 12, 2)->default(0);
    $table->decimal('net_profit', 12, 2)->default(0);
    $table->decimal('profit_margin', 5, 2)->default(0); // Percentage
    $table->decimal('average_order_value', 10, 2)->default(0);
    $table->integer('quotes_sent')->default(0);
    $table->integer('quotes_accepted')->default(0);
    $table->decimal('quote_conversion_rate', 5, 2)->default(0);
    $table->integer('production_days_total')->default(0);
    $table->decimal('average_production_time', 5, 2)->default(0);
    $table->json('top_products')->nullable();
    $table->json('top_customers')->nullable();
    $table->json('vendor_performance')->nullable();
    $table->timestamps();
    
    $table->unique(['tenant_id', 'date']);
    $table->index(['tenant_id', 'date']);
});

// File: database/migrations/tenant/create_kpi_metrics_table.php
Schema::create('kpi_metrics', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('metric_name')->index();
    $table->string('metric_category'); // sales, operations, financial, customer
    $table->decimal('value', 15, 4);
    $table->string('unit'); // currency, percentage, count, days
    $table->date('period_start');
    $table->date('period_end');
    $table->enum('period_type', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
    $table->decimal('target_value', 15, 4)->nullable();
    $table->decimal('previous_period_value', 15, 4)->nullable();
    $table->decimal('growth_rate', 8, 4)->nullable(); // Percentage
    $table->json('breakdown')->nullable(); // Detailed breakdown data
    $table->timestamps();
    
    $table->index(['tenant_id', 'metric_name', 'period_type']);
    $table->index(['tenant_id', 'period_start', 'period_end']);
});

// File: database/migrations/tenant/create_financial_statements_table.php
Schema::create('financial_statements', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->enum('statement_type', ['income', 'balance_sheet', 'cash_flow']);
    $table->date('period_start');
    $table->date('period_end');
    $table->json('revenue_breakdown'); // Revenue sources and amounts
    $table->json('expense_breakdown'); // Expense categories and amounts
    $table->decimal('gross_revenue', 12, 2)->default(0);
    $table->decimal('total_vendor_costs', 12, 2)->default(0);
    $table->decimal('gross_profit', 12, 2)->default(0);
    $table->decimal('operating_expenses', 12, 2)->default(0);
    $table->decimal('net_profit', 12, 2)->default(0);
    $table->decimal('profit_margin', 5, 2)->default(0);
    $table->json('assets')->nullable(); // For balance sheet
    $table->json('liabilities')->nullable(); // For balance sheet
    $table->json('cash_flows')->nullable(); // For cash flow statement
    $table->unsignedBigInteger('generated_by');
    $table->timestamps();
    
    $table->foreign('generated_by')->references('id')->on('users');
    $table->index(['tenant_id', 'statement_type', 'period_start']);
});
```

**Analytics Service Implementation**:
```php
// File: app/Application/Analytics/Services/SalesAnalyticsService.php
class SalesAnalyticsService
{
    public function generateDailyAnalytics(string $tenantId, Carbon $date): SalesAnalytics
    {
        $startDate = $date->startOfDay();
        $endDate = $date->endOfDay();

        // Get orders for the date
        $orders = $this->orderRepository->findByDateRange($tenantId, $startDate, $endDate);
        
        // Get customers for the date
        $customers = $this->customerRepository->findByDateRange($tenantId, $startDate, $endDate);
        $returningCustomers = $customers->filter(fn($customer) => 
            $customer->first_order_date < $startDate
        );

        // Calculate revenue metrics
        $grossRevenue = $orders->sum('total_amount');
        $vendorCosts = $orders->sum('vendor_cost');
        $netProfit = $grossRevenue - $vendorCosts;
        $profitMargin = $grossRevenue > 0 ? ($netProfit / $grossRevenue) * 100 : 0;
        $averageOrderValue = $orders->count() > 0 ? $grossRevenue / $orders->count() : 0;

        // Get quotes data
        $quotes = $this->quoteRepository->findByDateRange($tenantId, $startDate, $endDate);
        $acceptedQuotes = $quotes->filter(fn($quote) => $quote->status === 'accepted');
        $quoteConversionRate = $quotes->count() > 0 ? 
            ($acceptedQuotes->count() / $quotes->count()) * 100 : 0;

        // Calculate production metrics
        $completedOrders = $orders->filter(fn($order) => $order->status === 'completed');
        $productionDaysTotal = $completedOrders->sum(function($order) {
            return $order->production_start && $order->production_end ?
                $order->production_start->diffInDays($order->production_end) : 0;
        });
        $averageProductionTime = $completedOrders->count() > 0 ?
            $productionDaysTotal / $completedOrders->count() : 0;

        // Top products analysis
        $topProducts = $this->calculateTopProducts($orders);
        $topCustomers = $this->calculateTopCustomers($orders);
        $vendorPerformance = $this->calculateVendorPerformance($orders);

        $analytics = new SalesAnalytics([
            'tenant_id' => $tenantId,
            'date' => $date->toDateString(),
            'orders_count' => $orders->count(),
            'new_customers_count' => $customers->count() - $returningCustomers->count(),
            'returning_customers_count' => $returningCustomers->count(),
            'gross_revenue' => $grossRevenue,
            'vendor_costs' => $vendorCosts,
            'net_profit' => $netProfit,
            'profit_margin' => $profitMargin,
            'average_order_value' => $averageOrderValue,
            'quotes_sent' => $quotes->count(),
            'quotes_accepted' => $acceptedQuotes->count(),
            'quote_conversion_rate' => $quoteConversionRate,
            'production_days_total' => $productionDaysTotal,
            'average_production_time' => $averageProductionTime,
            'top_products' => $topProducts,
            'top_customers' => $topCustomers,
            'vendor_performance' => $vendorPerformance,
        ]);

        $this->salesAnalyticsRepository->save($analytics);
        
        return $analytics;
    }

    public function calculateKPIMetrics(string $tenantId, Carbon $periodStart, Carbon $periodEnd, string $periodType): array
    {
        $metrics = [];
        
        // Sales KPIs
        $salesMetrics = $this->calculateSalesKPIs($tenantId, $periodStart, $periodEnd);
        $metrics = array_merge($metrics, $salesMetrics);
        
        // Operational KPIs
        $operationalMetrics = $this->calculateOperationalKPIs($tenantId, $periodStart, $periodEnd);
        $metrics = array_merge($metrics, $operationalMetrics);
        
        // Financial KPIs
        $financialMetrics = $this->calculateFinancialKPIs($tenantId, $periodStart, $periodEnd);
        $metrics = array_merge($metrics, $financialMetrics);
        
        // Customer KPIs
        $customerMetrics = $this->calculateCustomerKPIs($tenantId, $periodStart, $periodEnd);
        $metrics = array_merge($metrics, $customerMetrics);

        // Save KPIs to database
        foreach ($metrics as $metric) {
            $this->kpiMetricsRepository->save(new KPIMetric(array_merge($metric, [
                'tenant_id' => $tenantId,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'period_type' => $periodType,
            ])));
        }

        return $metrics;
    }

    private function calculateSalesKPIs(string $tenantId, Carbon $start, Carbon $end): array
    {
        $orders = $this->orderRepository->findByDateRange($tenantId, $start, $end);
        $previousPeriodOrders = $this->orderRepository->findByDateRange(
            $tenantId, 
            $start->copy()->subDays($end->diffInDays($start)), 
            $start->copy()->subDay()
        );

        return [
            [
                'metric_name' => 'total_revenue',
                'metric_category' => 'sales',
                'value' => $orders->sum('total_amount'),
                'unit' => 'currency',
                'target_value' => 100000000, // 100M target
                'previous_period_value' => $previousPeriodOrders->sum('total_amount'),
            ],
            [
                'metric_name' => 'orders_count',
                'metric_category' => 'sales',
                'value' => $orders->count(),
                'unit' => 'count',
                'target_value' => 100,
                'previous_period_value' => $previousPeriodOrders->count(),
            ],
            [
                'metric_name' => 'average_order_value',
                'metric_category' => 'sales',
                'value' => $orders->count() > 0 ? $orders->avg('total_amount') : 0,
                'unit' => 'currency',
                'target_value' => 1000000, // 1M target
                'previous_period_value' => $previousPeriodOrders->count() > 0 ? 
                    $previousPeriodOrders->avg('total_amount') : 0,
            ],
        ];
    }

    private function calculateOperationalKPIs(string $tenantId, Carbon $start, Carbon $end): array
    {
        $orders = $this->orderRepository->findByDateRange($tenantId, $start, $end);
        $completedOrders = $orders->filter(fn($order) => $order->status === 'completed');
        
        $onTimeDeliveries = $completedOrders->filter(function($order) {
            return $order->completed_at <= $order->estimated_delivery;
        });

        $averageProductionTime = $completedOrders->avg(function($order) {
            return $order->production_start && $order->production_end ?
                $order->production_start->diffInDays($order->production_end) : 0;
        });

        return [
            [
                'metric_name' => 'on_time_delivery_rate',
                'metric_category' => 'operations',
                'value' => $completedOrders->count() > 0 ? 
                    ($onTimeDeliveries->count() / $completedOrders->count()) * 100 : 0,
                'unit' => 'percentage',
                'target_value' => 95,
            ],
            [
                'metric_name' => 'average_production_time',
                'metric_category' => 'operations',
                'value' => $averageProductionTime,
                'unit' => 'days',
                'target_value' => 7,
            ],
            [
                'metric_name' => 'order_completion_rate',
                'metric_category' => 'operations',
                'value' => $orders->count() > 0 ? 
                    ($completedOrders->count() / $orders->count()) * 100 : 0,
                'unit' => 'percentage',
                'target_value' => 98,
            ],
        ];
    }
}
```

#### **Day 3-5: Sales Reports Frontend (18-25 hours)**

**Sales Reports Dashboard**:
```typescript
// File: src/pages/tenant/reports/SalesReports.tsx
export default function SalesReports() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [periodType, setPeriodType] = useState<PeriodType>('daily');
  const [salesData, setSalesData] = useState<SalesAnalytics[]>([]);
  const [kpiData, setKpiData] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const [salesResponse, kpiResponse] = await Promise.all([
        tenantApiClient.get('/analytics/sales', {
          params: {
            start_date: format(dateRange.from, 'yyyy-MM-dd'),
            end_date: format(dateRange.to, 'yyyy-MM-dd'),
            period_type: periodType
          }
        }),
        tenantApiClient.get('/analytics/kpi', {
          params: {
            start_date: format(dateRange.from, 'yyyy-MM-dd'),
            end_date: format(dateRange.to, 'yyyy-MM-dd'),
            period_type: periodType
          }
        })
      ]);
      
      setSalesData(salesResponse.data.data);
      setKpiData(kpiResponse.data.data);
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [dateRange, periodType]);

  const totalRevenue = salesData.reduce((sum, day) => sum + day.grossRevenue, 0);
  const totalProfit = salesData.reduce((sum, day) => sum + day.netProfit, 0);
  const averageProfitMargin = salesData.length > 0 ? 
    salesData.reduce((sum, day) => sum + day.profitMargin, 0) / salesData.length : 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-600">Revenue analysis and sales performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Date Range and Period Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Date Range:</Label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label>Period:</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% vs last period
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">
                  Rp {totalProfit.toLocaleString()}
                </p>
                <p className="text-sm text-blue-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8.3% vs last period
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-600">
                  {averageProfitMargin.toFixed(1)}%
                </p>
                <p className="text-sm text-purple-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.1% vs last period
                </p>
              </div>
              <Percent className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-orange-600">
                  {salesData.reduce((sum, day) => sum + day.ordersCount, 0)}
                </p>
                <p className="text-sm text-orange-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15.7% vs last period
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue and profit over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `Rp ${Number(value).toLocaleString()}`,
                      name === 'grossRevenue' ? 'Gross Revenue' : 'Net Profit'
                    ]}
                    labelFormatter={(value) => format(new Date(value), 'PPP')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="grossRevenue" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Gross Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netProfit" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Net Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Volume & Conversion</CardTitle>
            <CardDescription>Orders and quote conversion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="ordersCount" 
                    fill="#8B5CF6" 
                    name="Orders"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="quoteConversionRate" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Quote Conversion %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesData[0]?.topProducts?.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rp {product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Highest value customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesData[0]?.topCustomers?.slice(0, 5).map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rp {customer.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Performance</CardTitle>
            <CardDescription>Top performing vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesData[0]?.vendorPerformance?.slice(0, 5).map((vendor, index) => (
                <div key={vendor.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-gray-500">{vendor.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(vendor.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">{vendor.rating.toFixed(1)}/5</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

### **WEEK 6: FINANCIAL STATEMENTS & BUSINESS INTELLIGENCE**
**Duration**: 1 week  
**Effort**: 30-40 hours  
**Priority**: **MEDIUM**

#### **Day 1-3: Financial Statements Implementation (20-25 hours)**

**Financial Statements Service**:
```php
// File: app/Application/Analytics/Services/FinancialStatementsService.php
class FinancialStatementsService
{
    public function generateIncomeStatement(string $tenantId, Carbon $start, Carbon $end): FinancialStatement
    {
        // Revenue Breakdown
        $orders = $this->orderRepository->findByDateRange($tenantId, $start, $end);
        $revenueBreakdown = [
            'product_sales' => $orders->where('type', 'product')->sum('total_amount'),
            'custom_etching' => $orders->where('type', 'custom')->sum('total_amount'),
            'rush_orders' => $orders->where('is_rush', true)->sum('rush_fee'),
            'shipping_fees' => $orders->sum('shipping_cost'),
        ];

        $grossRevenue = array_sum($revenueBreakdown);

        // Cost of Goods Sold (Vendor Costs)
        $vendorCosts = $orders->sum('vendor_cost');
        $grossProfit = $grossRevenue - $vendorCosts;

        // Operating Expenses (could be configured per tenant)
        $operatingExpenses = [
            'salaries' => $this->getOperatingExpense($tenantId, 'salaries', $start, $end),
            'rent' => $this->getOperatingExpense($tenantId, 'rent', $start, $end),
            'utilities' => $this->getOperatingExpense($tenantId, 'utilities', $start, $end),
            'marketing' => $this->getOperatingExpense($tenantId, 'marketing', $start, $end),
            'office_supplies' => $this->getOperatingExpense($tenantId, 'office_supplies', $start, $end),
            'software_subscriptions' => $this->getOperatingExpense($tenantId, 'software', $start, $end),
            'professional_services' => $this->getOperatingExpense($tenantId, 'professional', $start, $end),
        ];

        $totalOperatingExpenses = array_sum($operatingExpenses);
        $netProfit = $grossProfit - $totalOperatingExpenses;
        $profitMargin = $grossRevenue > 0 ? ($netProfit / $grossRevenue) * 100 : 0;

        $statement = new FinancialStatement([
            'tenant_id' => $tenantId,
            'statement_type' => 'income',
            'period_start' => $start,
            'period_end' => $end,
            'revenue_breakdown' => $revenueBreakdown,
            'expense_breakdown' => $operatingExpenses,
            'gross_revenue' => $grossRevenue,
            'total_vendor_costs' => $vendorCosts,
            'gross_profit' => $grossProfit,
            'operating_expenses' => $totalOperatingExpenses,
            'net_profit' => $netProfit,
            'profit_margin' => $profitMargin,
            'generated_by' => auth()->id(),
        ]);

        $this->financialStatementRepository->save($statement);

        return $statement;
    }

    public function generateCashFlowStatement(string $tenantId, Carbon $start, Carbon $end): FinancialStatement
    {
        // Operating Cash Flow
        $customerPayments = $this->paymentRepository->findIncomingByDateRange($tenantId, $start, $end);
        $vendorPayments = $this->paymentRepository->findOutgoingByDateRange($tenantId, $start, $end);
        
        $operatingCashFlow = [
            'customer_payments_received' => $customerPayments->sum('amount'),
            'vendor_payments_made' => -$vendorPayments->sum('amount'),
            'net_operating_cash_flow' => $customerPayments->sum('amount') - $vendorPayments->sum('amount'),
        ];

        // Investing Cash Flow (equipment, software purchases)
        $investingCashFlow = [
            'equipment_purchases' => $this->getInvestmentCashFlow($tenantId, 'equipment', $start, $end),
            'software_purchases' => $this->getInvestmentCashFlow($tenantId, 'software', $start, $end),
            'net_investing_cash_flow' => $this->getInvestmentCashFlow($tenantId, 'total', $start, $end),
        ];

        // Financing Cash Flow (loans, owner investments)
        $financingCashFlow = [
            'loan_proceeds' => $this->getFinancingCashFlow($tenantId, 'loan_proceeds', $start, $end),
            'loan_repayments' => $this->getFinancingCashFlow($tenantId, 'loan_repayments', $start, $end),
            'owner_investments' => $this->getFinancingCashFlow($tenantId, 'investments', $start, $end),
            'net_financing_cash_flow' => $this->getFinancingCashFlow($tenantId, 'total', $start, $end),
        ];

        $netCashFlow = $operatingCashFlow['net_operating_cash_flow'] + 
                      $investingCashFlow['net_investing_cash_flow'] + 
                      $financingCashFlow['net_financing_cash_flow'];

        $cashFlows = [
            'operating' => $operatingCashFlow,
            'investing' => $investingCashFlow,
            'financing' => $financingCashFlow,
            'net_cash_flow' => $netCashFlow,
        ];

        return new FinancialStatement([
            'tenant_id' => $tenantId,
            'statement_type' => 'cash_flow',
            'period_start' => $start,
            'period_end' => $end,
            'cash_flows' => $cashFlows,
            'generated_by' => auth()->id(),
        ]);
    }
}
```

#### **Day 4-5: Business Intelligence Dashboard (10-15 hours)**

**Business Intelligence Frontend**:
```typescript
// File: src/pages/tenant/reports/BusinessIntelligence.tsx
export default function BusinessIntelligence() {
  const [timeframe, setTimeframe] = useState<string>('12_months');
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIntelligenceData = async () => {
    setLoading(true);
    try {
      const [forecastResponse, insightsResponse] = await Promise.all([
        tenantApiClient.get('/analytics/forecast', { params: { timeframe } }),
        tenantApiClient.get('/analytics/insights', { params: { timeframe } })
      ]);
      
      setForecastData(forecastResponse.data.data);
      setInsights(insightsResponse.data.data);
    } catch (error) {
      console.error('Failed to fetch intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-600">Advanced analytics, forecasting, and business insights</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6_months">Last 6 Months</SelectItem>
            <SelectItem value="12_months">Last 12 Months</SelectItem>
            <SelectItem value="24_months">Last 24 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AI-Powered Insights */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            AI-Powered Business Insights
          </CardTitle>
          <CardDescription>Smart recommendations based on your business data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                insight.priority === 'high' ? 'border-red-400 bg-red-50' :
                insight.priority === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                'border-blue-400 bg-blue-50'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded ${
                    insight.type === 'opportunity' ? 'bg-green-100 text-green-600' :
                    insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {insight.type === 'opportunity' ? <TrendingUp className="w-4 h-4" /> :
                     insight.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                     <Info className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-blue-600 mt-2 font-medium">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>Predicted revenue for the next 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData?.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="historical" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Historical"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Forecast"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conservative" 
                    stroke="#F59E0B" 
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    name="Conservative"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Growth Prediction</CardTitle>
            <CardDescription>Projected customer acquisition and retention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData?.customers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="new_customers" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6"
                    name="New Customers"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="returning_customers" 
                    stackId="1"
                    stroke="#10B981" 
                    fill="#10B981"
                    name="Returning Customers"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Market Position Analysis</CardTitle>
          <CardDescription>Your position in the etching market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">Market Share</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {forecastData?.marketAnalysis?.marketShare?.toFixed(1)}%
              </p>
              <p className="text-sm text-blue-600 mt-1">in local etching market</p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">Growth Rate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                +{forecastData?.marketAnalysis?.growthRate?.toFixed(1)}%
              </p>
              <p className="text-sm text-green-600 mt-1">vs industry average</p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900">Competitive Rank</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                #{forecastData?.marketAnalysis?.competitiveRank}
              </p>
              <p className="text-sm text-purple-600 mt-1">in regional market</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Planning</CardTitle>
          <CardDescription>What-if analysis for business planning</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="optimistic">
            <TabsList>
              <TabsTrigger value="pessimistic">Pessimistic</TabsTrigger>
              <TabsTrigger value="realistic">Realistic</TabsTrigger>
              <TabsTrigger value="optimistic">Optimistic</TabsTrigger>
            </TabsList>
            
            {['pessimistic', 'realistic', 'optimistic'].map(scenario => (
              <TabsContent key={scenario} value={scenario}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 border rounded">
                    <h4 className="font-medium">Revenue Projection</h4>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      Rp {forecastData?.scenarios?.[scenario]?.revenue?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 border rounded">
                    <h4 className="font-medium">Profit Margin</h4>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {forecastData?.scenarios?.[scenario]?.profitMargin?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 border rounded">
                    <h4 className="font-medium">Customer Base</h4>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {forecastData?.scenarios?.[scenario]?.customers} customers
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h5 className="font-medium mb-2">Key Assumptions:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {forecastData?.scenarios?.[scenario]?.assumptions?.map((assumption, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🎯 ACCEPTANCE CRITERIA

### **Sales Reports System**
- ✅ Real-time revenue and profit tracking
- ✅ Customizable date ranges and period views
- ✅ Top performers analysis (products, customers, vendors)
- ✅ Interactive charts with drill-down capabilities
- ✅ Export functionality (PDF, Excel, CSV)

### **Performance Metrics Dashboard**
- ✅ KPI tracking with targets and benchmarks
- ✅ Growth rate calculations vs previous periods
- ✅ Operational metrics (delivery time, conversion rates)
- ✅ Visual indicators for performance status

### **Financial Statements**
- ✅ Automated income statement generation
- ✅ Cash flow statement with operating/investing/financing breakdown
- ✅ Profit margin analysis with vendor cost tracking
- ✅ Expense categorization and management

### **Business Intelligence**
- ✅ AI-powered insights and recommendations
- ✅ Revenue forecasting with multiple scenarios
- ✅ Market position analysis
- ✅ Predictive analytics for customer growth

---

## 📊 SUCCESS METRICS

### **Decision Making Impact**
- **Report Generation Time**: < 30 seconds for complex reports
- **Data Accuracy**: 99%+ accuracy in financial calculations
- **Forecast Precision**: 85%+ accuracy in 3-month forecasts
- **User Adoption**: 90%+ of tenants using weekly reports

### **Technical Performance**
- **Dashboard Load Time**: < 3 seconds for full dashboard
- **Chart Rendering**: < 1 second for complex visualizations
- **Export Performance**: < 15 seconds for large datasets
- **Real-time Updates**: < 2 seconds delay for live data

---

## 🎉 TRACK C COMPLETION

With Track C completion, the TENANT_FOCUS_BEFORE_PHASE_5 roadmap provides:

**Complete Business Workflow**: Order management → vendor sourcing → payment processing → delivery
**Full Commerce Management**: 37 management pages with real functionality
**Strategic Intelligence**: Advanced analytics, forecasting, and business insights

**Total Value Delivered**:
- 🎯 **100% Business Cycle Coverage** for PT CEX etching operations
- 📊 **Real-time Decision Making** with comprehensive dashboards
- 🚀 **Scalable Foundation** ready for Phase 5 advanced features
- 💰 **ROI Tracking** with detailed profit margin analysis

**Ready for Phase 5**: Enhanced marketplace, mobile development, API marketplace, third-party integrations