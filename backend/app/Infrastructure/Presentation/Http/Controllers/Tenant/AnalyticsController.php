<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Domain\Customer\Services\CustomerSegmentationService;
use App\Domain\Vendor\Services\VendorEvaluationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function __construct(
        private CustomerSegmentationService $customerSegmentationService,
        private VendorEvaluationService $vendorEvaluationService
    ) {}

    public function overview(Request $request): JsonResponse
    {
        try {
            $period = $request->input('period', '30days');
            $startDate = $this->getStartDate($period);

            $totalOrders = Order::whereDate('created_at', '>=', $startDate)->count();
            $totalRevenue = Order::whereDate('created_at', '>=', $startDate)
                ->sum('total_paid_amount');
            
            $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

            $newCustomers = Customer::whereDate('created_at', '>=', $startDate)->count();
            $activeCustomers = Customer::where('status', 'active')
                ->whereHas('orders', function($q) use ($startDate) {
                    $q->whereDate('created_at', '>=', $startDate);
                })
                ->count();

            $conversionRate = $newCustomers > 0 
                ? ($activeCustomers / $newCustomers) * 100 
                : 0;

            $completedOrders = Order::where('status', 'completed')
                ->whereDate('created_at', '>=', $startDate)
                ->count();
            
            $completionRate = $totalOrders > 0 
                ? ($completedOrders / $totalOrders) * 100 
                : 0;

            return response()->json([
                'message' => 'Ikhtisar analitik berhasil diambil',
                'data' => [
                    'totalOrders' => $totalOrders,
                    'totalRevenue' => $totalRevenue,
                    'averageOrderValue' => round($averageOrderValue, 2),
                    'newCustomers' => $newCustomers,
                    'activeCustomers' => $activeCustomers,
                    'conversionRate' => round($conversionRate, 2),
                    'completedOrders' => $completedOrders,
                    'completionRate' => round($completionRate, 2),
                    'period' => $period,
                    'startDate' => $startDate->toIso8601String(),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil ikhtisar analitik',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function sales(Request $request): JsonResponse
    {
        try {
            $period = $request->input('period', '30days');
            $startDate = $this->getStartDate($period);

            $dailySales = Order::whereDate('created_at', '>=', $startDate)
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as orders'),
                    DB::raw('SUM(total_amount) as revenue'),
                    DB::raw('AVG(total_amount) as average_value')
                )
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            $salesByStatus = Order::whereDate('created_at', '>=', $startDate)
                ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as revenue'))
                ->groupBy('status')
                ->get();

            $salesByProductionType = Order::whereDate('created_at', '>=', $startDate)
                ->select('production_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as revenue'))
                ->groupBy('production_type')
                ->get();

            $paymentMethodBreakdown = Order::whereDate('created_at', '>=', $startDate)
                ->whereNotNull('payment_method')
                ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as revenue'))
                ->groupBy('payment_method')
                ->get();

            $monthlyGrowth = Order::whereDate('created_at', '>=', $startDate)
                ->select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('COUNT(*) as orders'),
                    DB::raw('SUM(total_amount) as revenue')
                )
                ->groupBy('year', 'month')
                ->orderBy('year', 'asc')
                ->orderBy('month', 'asc')
                ->get();

            return response()->json([
                'message' => 'Analitik penjualan berhasil diambil',
                'data' => [
                    'period' => $period,
                    'startDate' => $startDate->toIso8601String(),
                    'dailySales' => $dailySales,
                    'salesByStatus' => $salesByStatus,
                    'salesByProductionType' => $salesByProductionType,
                    'paymentMethodBreakdown' => $paymentMethodBreakdown,
                    'monthlyGrowth' => $monthlyGrowth,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil analitik penjualan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function customers(Request $request): JsonResponse
    {
        try {
            $period = $request->input('period', '30days');
            $startDate = $this->getStartDate($period);

            $customersByType = Customer::whereDate('created_at', '>=', $startDate)
                ->select('customer_type', DB::raw('COUNT(*) as count'))
                ->groupBy('customer_type')
                ->get()
                ->pluck('count', 'customer_type');

            $customersByStatus = Customer::whereDate('created_at', '>=', $startDate)
                ->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');

            $topSpendingCustomers = Customer::select('id', 'name', 'email', 'customer_type', 'total_orders', 'total_spent')
                ->whereDate('last_order_date', '>=', $startDate)
                ->orderByDesc('total_spent')
                ->limit(20)
                ->get();

            $customerAcquisition = Customer::whereDate('created_at', '>=', $startDate)
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as new_customers')
                )
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            $customerLifetimeValue = Customer::select(
                    DB::raw('AVG(total_spent) as average_ltv'),
                    DB::raw('MAX(total_spent) as max_ltv'),
                    DB::raw('MIN(total_spent) as min_ltv')
                )
                ->whereDate('created_at', '>=', $startDate)
                ->first();

            $repeatCustomerRate = Customer::whereDate('created_at', '>=', $startDate)
                ->selectRaw('
                    COUNT(CASE WHEN total_orders > 1 THEN 1 END) as repeat_customers,
                    COUNT(*) as total_customers
                ')
                ->first();

            $repeatRate = $repeatCustomerRate->total_customers > 0
                ? ($repeatCustomerRate->repeat_customers / $repeatCustomerRate->total_customers) * 100
                : 0;

            $segmentDistribution = $this->customerSegmentationService->getSegmentDistribution();
            $topSegmentCustomers = $this->customerSegmentationService->getHighValueCustomers(10)->values();
            $atRiskCustomers = $this->customerSegmentationService->getAtRiskCustomers(10)->values();

            return response()->json([
                'message' => 'Analitik pelanggan berhasil diambil',
                'data' => [
                    'period' => $period,
                    'startDate' => $startDate->toIso8601String(),
                    'customersByType' => $customersByType,
                    'customersByStatus' => $customersByStatus,
                    'topSpendingCustomers' => $topSpendingCustomers,
                    'customerAcquisition' => $customerAcquisition,
                    'lifetimeValue' => [
                        'average' => round($customerLifetimeValue->average_ltv ?? 0, 2),
                        'max' => $customerLifetimeValue->max_ltv ?? 0,
                        'min' => $customerLifetimeValue->min_ltv ?? 0,
                    ],
                    'repeatCustomerRate' => round($repeatRate, 2),
                    'segmentationSummary' => [
                        'distribution' => $segmentDistribution,
                        'topCustomers' => $topSegmentCustomers,
                        'atRiskCustomers' => $atRiskCustomers,
                    ],
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil analitik pelanggan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function products(Request $request): JsonResponse
    {
        try {
            $period = $request->input('period', '30days');
            $startDate = $this->getStartDate($period);

            $productsByStatus = Product::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');

            $featuredProducts = Product::where('featured', true)->count();
            $customizableProducts = Product::where('customizable', true)->count();
            $productsRequiringQuote = Product::where('requires_quote', true)->count();

            $topViewedProducts = Product::select('id', 'name', 'sku', 'slug', 'view_count', 'price', 'status')
                ->orderByDesc('view_count')
                ->limit(20)
                ->get();

            $topRatedProducts = Product::select('id', 'name', 'sku', 'slug', 'average_rating', 'review_count', 'price')
                ->where('review_count', '>', 0)
                ->orderByDesc('average_rating')
                ->limit(20)
                ->get();

            $productsByProductionType = Product::select('production_type', DB::raw('COUNT(*) as count'))
                ->groupBy('production_type')
                ->get()
                ->pluck('count', 'production_type');

            $inventoryHealth = Product::where('track_inventory', true)
                ->selectRaw('
                    COUNT(CASE WHEN stock_quantity > low_stock_threshold THEN 1 END) as in_stock,
                    COUNT(CASE WHEN stock_quantity <= low_stock_threshold AND stock_quantity > 0 THEN 1 END) as low_stock,
                    COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock
                ')
                ->first();

            return response()->json([
                'message' => 'Analitik produk berhasil diambil',
                'data' => [
                    'period' => $period,
                    'startDate' => $startDate->toIso8601String(),
                    'productsByStatus' => $productsByStatus,
                    'categories' => [
                        'featured' => $featuredProducts,
                        'customizable' => $customizableProducts,
                        'requiresQuote' => $productsRequiringQuote,
                    ],
                    'topViewedProducts' => $topViewedProducts,
                    'topRatedProducts' => $topRatedProducts,
                    'productsByProductionType' => $productsByProductionType,
                    'inventoryHealth' => [
                        'inStock' => $inventoryHealth->in_stock ?? 0,
                        'lowStock' => $inventoryHealth->low_stock ?? 0,
                        'outOfStock' => $inventoryHealth->out_of_stock ?? 0,
                    ],
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil analitik produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function inventory(Request $request): JsonResponse
    {
        try {
            $totalProducts = Product::count();
            $trackedProducts = Product::where('track_inventory', true)->count();

            $stockSummary = Product::where('track_inventory', true)
                ->selectRaw('
                    SUM(stock_quantity) as total_stock,
                    AVG(stock_quantity) as average_stock,
                    COUNT(CASE WHEN stock_quantity > low_stock_threshold THEN 1 END) as healthy_stock,
                    COUNT(CASE WHEN stock_quantity <= low_stock_threshold AND stock_quantity > 0 THEN 1 END) as low_stock,
                    COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock
                ')
                ->first();

            $lowStockProducts = Product::where('track_inventory', true)
                ->whereRaw('stock_quantity <= low_stock_threshold')
                ->where('stock_quantity', '>', 0)
                ->select('id', 'name', 'sku', 'stock_quantity', 'low_stock_threshold', 'price')
                ->orderBy('stock_quantity', 'asc')
                ->limit(50)
                ->get();

            $outOfStockProducts = Product::where('track_inventory', true)
                ->where('stock_quantity', 0)
                ->select('id', 'name', 'sku', 'price', 'status')
                ->limit(50)
                ->get();

            $stockValueByStatus = Product::where('track_inventory', true)
                ->select(
                    'status',
                    DB::raw('COUNT(*) as product_count'),
                    DB::raw('SUM(stock_quantity) as total_units'),
                    DB::raw('SUM(stock_quantity * price) as stock_value')
                )
                ->groupBy('status')
                ->get();

            $totalStockValue = Product::where('track_inventory', true)
                ->selectRaw('SUM(stock_quantity * price) as total_value')
                ->first();

            return response()->json([
                'message' => 'Analitik inventori berhasil diambil',
                'data' => [
                    'summary' => [
                        'totalProducts' => $totalProducts,
                        'trackedProducts' => $trackedProducts,
                        'totalStock' => $stockSummary->total_stock ?? 0,
                        'averageStock' => round($stockSummary->average_stock ?? 0, 2),
                        'totalStockValue' => $totalStockValue->total_value ?? 0,
                    ],
                    'health' => [
                        'healthyStock' => $stockSummary->healthy_stock ?? 0,
                        'lowStock' => $stockSummary->low_stock ?? 0,
                        'outOfStock' => $stockSummary->out_of_stock ?? 0,
                    ],
                    'lowStockProducts' => $lowStockProducts,
                    'outOfStockProducts' => $outOfStockProducts,
                    'stockValueByStatus' => $stockValueByStatus,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil analitik inventori',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function customerSegmentation(Request $request): JsonResponse
    {
        try {
            $limit = max(1, min(100, (int) $request->get('limit', 25)));
            $segmentDistribution = $this->customerSegmentationService->getSegmentDistribution();
            $topCustomers = $this->customerSegmentationService->getHighValueCustomers($limit)->values();
            $atRiskCustomers = $this->customerSegmentationService->getAtRiskCustomers($limit)->values();

            return response()->json([
                'message' => 'Analitik segmentasi pelanggan berhasil diambil',
                'data' => [
                    'distribution' => $segmentDistribution,
                    'topCustomers' => $topCustomers,
                    'atRiskCustomers' => $atRiskCustomers,
                ],
                'meta' => [
                    'limit' => $limit,
                    'generatedAt' => now()->toIso8601String(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil analitik segmentasi pelanggan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function vendors(Request $request): JsonResponse
    {
        try {
            $limit = max(1, min(50, (int) $request->get('limit', 10)));
            $threshold = (float) $request->get('underperforming_threshold', 60);

            $evaluations = $this->vendorEvaluationService->evaluateAllVendors()->values();
            $averageScore = round($evaluations->avg('overall_score') ?? 0, 2);
            $ratingBreakdown = $evaluations->groupBy('performance_rating')->map->count();

            $topPerformers = $evaluations->take($limit)->values();
            $underperforming = $evaluations
                ->filter(fn ($evaluation) => $evaluation->overall_score < $threshold)
                ->values();

            $slaSnapshot = $topPerformers->map(function ($evaluation) {
                $metrics = $evaluation->metrics->delivery_performance ?? [];
                return [
                    'vendorId' => $evaluation->vendor_id,
                    'vendorName' => $evaluation->vendor_name,
                    'onTimeRate' => $metrics['on_time_rate'] ?? null,
                    'avgLeadTimeDays' => $metrics['avg_lead_time_days'] ?? null,
                ];
            });

            return response()->json([
                'message' => 'Analitik vendor berhasil diambil',
                'data' => [
                    'summary' => [
                        'totalVendors' => $evaluations->count(),
                        'averageScore' => $averageScore,
                        'underperformingThreshold' => $threshold,
                        'ratingBreakdown' => $ratingBreakdown,
                    ],
                    'topPerformers' => $topPerformers,
                    'underperformingVendors' => $underperforming,
                    'slaSnapshot' => $slaSnapshot,
                ],
                'meta' => [
                    'limit' => $limit,
                    'generatedAt' => now()->toIso8601String(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil analitik vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function salesReport(Request $request): JsonResponse
    {
        try {
            $startDate = $request->input('start_date') 
                ? Carbon::parse($request->input('start_date'))
                : Carbon::now()->subDays(30);
            $endDate = $request->input('end_date')
                ? Carbon::parse($request->input('end_date'))
                : Carbon::now();

            $summary = Order::whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as average_order_value,
                    SUM(CASE WHEN payment_status = "paid" THEN total_amount ELSE 0 END) as paid_revenue,
                    SUM(CASE WHEN payment_status = "unpaid" THEN total_amount ELSE 0 END) as unpaid_revenue
                ')
                ->first();

            $ordersByDay = Order::whereBetween('created_at', [$startDate, $endDate])
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as orders'),
                    DB::raw('SUM(total_amount) as revenue')
                )
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            return response()->json([
                'message' => 'Laporan penjualan berhasil dibuat',
                'data' => [
                    'period' => [
                        'startDate' => $startDate->toIso8601String(),
                        'endDate' => $endDate->toIso8601String(),
                    ],
                    'summary' => $summary,
                    'ordersByDay' => $ordersByDay,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat laporan penjualan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function customerReport(Request $request): JsonResponse
    {
        try {
            $startDate = $request->input('start_date') 
                ? Carbon::parse($request->input('start_date'))
                : Carbon::now()->subDays(30);
            $endDate = $request->input('end_date')
                ? Carbon::parse($request->input('end_date'))
                : Carbon::now();

            $summary = Customer::whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('
                    COUNT(*) as total_customers,
                    SUM(total_orders) as total_orders,
                    SUM(total_spent) as total_spent,
                    AVG(total_spent) as average_spent
                ')
                ->first();

            $customersByType = Customer::whereBetween('created_at', [$startDate, $endDate])
                ->select('customer_type', DB::raw('COUNT(*) as count'))
                ->groupBy('customer_type')
                ->get();

            $topCustomers = Customer::whereBetween('created_at', [$startDate, $endDate])
                ->orderByDesc('total_spent')
                ->limit(20)
                ->get();

            return response()->json([
                'message' => 'Laporan pelanggan berhasil dibuat',
                'data' => [
                    'period' => [
                        'startDate' => $startDate->toIso8601String(),
                        'endDate' => $endDate->toIso8601String(),
                    ],
                    'summary' => $summary,
                    'customersByType' => $customersByType,
                    'topCustomers' => $topCustomers,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat laporan pelanggan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function inventoryReport(Request $request): JsonResponse
    {
        try {
            $products = Product::where('track_inventory', true)
                ->select(
                    'id', 'name', 'sku', 'stock_quantity', 'low_stock_threshold', 
                    'price', 'status', 'featured'
                )
                ->orderBy('stock_quantity', 'asc')
                ->get()
                ->map(function($product) {
                    $stockStatus = 'healthy';
                    if ($product->stock_quantity == 0) {
                        $stockStatus = 'out_of_stock';
                    } elseif ($product->stock_quantity <= $product->low_stock_threshold) {
                        $stockStatus = 'low_stock';
                    }
                    
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'stockQuantity' => $product->stock_quantity,
                        'lowStockThreshold' => $product->low_stock_threshold,
                        'price' => $product->price,
                        'stockValue' => $product->stock_quantity * $product->price,
                        'status' => $product->status,
                        'stockStatus' => $stockStatus,
                        'featured' => $product->featured,
                    ];
                });

            return response()->json([
                'message' => 'Laporan inventori berhasil dibuat',
                'data' => [
                    'products' => $products,
                    'totalProducts' => $products->count(),
                    'totalStockValue' => $products->sum('stockValue'),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat laporan inventori',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function exportSales(Request $request): JsonResponse
    {
        try {
            $format = $request->input('format', 'json');
            
            $startDate = $request->input('start_date') 
                ? Carbon::parse($request->input('start_date'))
                : Carbon::now()->subDays(30);
            $endDate = $request->input('end_date')
                ? Carbon::parse($request->input('end_date'))
                : Carbon::now();

            $orders = Order::with(['customer:id,name,email', 'vendor:id,name'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            return response()->json([
                'message' => 'Data penjualan berhasil diekspor',
                'data' => $orders,
                'format' => $format,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengekspor data penjualan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function exportCustomers(Request $request): JsonResponse
    {
        try {
            $format = $request->input('format', 'json');
            
            $customers = Customer::with(['orders:id,customer_id,order_number,total_amount,status'])
                ->get();

            return response()->json([
                'message' => 'Data pelanggan berhasil diekspor',
                'data' => $customers,
                'format' => $format,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengekspor data pelanggan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function exportInventory(Request $request): JsonResponse
    {
        try {
            $format = $request->input('format', 'json');
            
            $products = Product::where('track_inventory', true)
                ->select(
                    'id', 'name', 'sku', 'slug', 'stock_quantity', 'low_stock_threshold',
                    'price', 'status', 'featured', 'created_at', 'updated_at'
                )
                ->get();

            return response()->json([
                'message' => 'Data inventori berhasil diekspor',
                'data' => $products,
                'format' => $format,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengekspor data inventori',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    private function getStartDate(string $period): Carbon
    {
        return match($period) {
            '7days' => Carbon::now()->subDays(7),
            '30days' => Carbon::now()->subDays(30),
            '90days' => Carbon::now()->subDays(90),
            '1year' => Carbon::now()->subYear(),
            default => Carbon::now()->subDays(30),
        };
    }
}