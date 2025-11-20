<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $today = Carbon::today();
            $lastMonth = Carbon::now()->subMonth();

            $totalOrders = Order::count();
            $totalCustomers = Customer::count();
            $totalProducts = Product::count();
            $totalVendors = Vendor::count();
            $totalRevenue = Order::sum('total_paid_amount');

            $ordersThisMonth = Order::whereDate('created_at', '>=', $lastMonth)->count();
            $revenueThisMonth = Order::whereDate('created_at', '>=', $lastMonth)
                ->sum('total_paid_amount');

            $pendingOrders = Order::whereIn('status', ['new', 'sourcing_vendor', 'vendor_negotiation'])->count();
            $activeOrders = Order::whereIn('status', ['in_production', 'quality_check', 'ready_to_ship'])->count();
            $completedOrders = Order::where('status', 'completed')->count();

            $lowStockProducts = Product::where('track_inventory', true)
                ->whereRaw('stock_quantity <= low_stock_threshold')
                ->count();

            $activeCustomers = Customer::where('status', 'active')->count();
            $activeVendors = Vendor::where('status', 'active')->count();

            return response()->json([
                'message' => 'Data dashboard berhasil diambil',
                'data' => [
                    'totalOrders' => $totalOrders,
                    'totalCustomers' => $totalCustomers,
                    'totalProducts' => $totalProducts,
                    'totalVendors' => $totalVendors,
                    'totalRevenue' => $totalRevenue,
                    'ordersThisMonth' => $ordersThisMonth,
                    'revenueThisMonth' => $revenueThisMonth,
                    'pendingOrders' => $pendingOrders,
                    'activeOrders' => $activeOrders,
                    'completedOrders' => $completedOrders,
                    'lowStockProducts' => $lowStockProducts,
                    'activeCustomers' => $activeCustomers,
                    'activeVendors' => $activeVendors,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data dashboard',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        try {
            $period = $request->input('period', '30days');
            
            $startDate = match($period) {
                '7days' => Carbon::now()->subDays(7),
                '30days' => Carbon::now()->subDays(30),
                '90days' => Carbon::now()->subDays(90),
                '1year' => Carbon::now()->subYear(),
                default => Carbon::now()->subDays(30),
            };

            $ordersByStatus = Order::whereDate('created_at', '>=', $startDate)
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');

            $ordersByPaymentStatus = Order::whereDate('created_at', '>=', $startDate)
                ->select('payment_status', DB::raw('count(*) as count'))
                ->groupBy('payment_status')
                ->get()
                ->pluck('count', 'payment_status');

            $dailyRevenue = Order::whereDate('created_at', '>=', $startDate)
                ->where('payment_status', 'paid')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total_amount) as revenue'),
                    DB::raw('COUNT(*) as orders')
                )
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            $topProducts = Product::select('products.id', 'products.name', 'products.sku', 'products.price')
                ->selectRaw('COUNT(DISTINCT orders.id) as order_count')
                ->selectRaw('SUM(JSON_EXTRACT(orders.items, "$[*].quantity")) as total_quantity')
                ->leftJoin('orders', function($join) {
                    $join->whereRaw('JSON_CONTAINS(orders.items, JSON_OBJECT("product_id", products.id))');
                })
                ->whereDate('orders.created_at', '>=', $startDate)
                ->groupBy('products.id', 'products.name', 'products.sku', 'products.price')
                ->orderByDesc('order_count')
                ->limit(10)
                ->get();

            $topCustomers = Customer::select('customers.id', 'customers.name', 'customers.email', 'customers.total_orders', 'customers.total_spent')
                ->whereDate('customers.last_order_date', '>=', $startDate)
                ->orderByDesc('customers.total_spent')
                ->limit(10)
                ->get();

            return response()->json([
                'message' => 'Statistik dashboard berhasil diambil',
                'data' => [
                    'period' => $period,
                    'startDate' => $startDate->toIso8601String(),
                    'ordersByStatus' => $ordersByStatus,
                    'ordersByPaymentStatus' => $ordersByPaymentStatus,
                    'dailyRevenue' => $dailyRevenue,
                    'topProducts' => $topProducts,
                    'topCustomers' => $topCustomers,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil statistik dashboard',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }

    public function recent(Request $request): JsonResponse
    {
        try {
            $limit = $request->input('limit', 10);

            $recentOrders = Order::with(['customer:id,name,email', 'vendor:id,name'])
                ->select('id', 'uuid', 'order_number', 'customer_id', 'vendor_id', 'status', 'payment_status', 'total_amount', 'created_at')
                ->latest()
                ->limit($limit)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'uuid' => $order->uuid,
                        'orderNumber' => $order->order_number,
                        'customer' => $order->customer ? [
                            'id' => $order->customer->id,
                            'name' => $order->customer->name,
                            'email' => $order->customer->email,
                        ] : null,
                        'vendor' => $order->vendor ? [
                            'id' => $order->vendor->id,
                            'name' => $order->vendor->name,
                        ] : null,
                        'status' => $order->status,
                        'paymentStatus' => $order->payment_status,
                        'totalAmount' => $order->total_amount,
                        'createdAt' => $order->created_at?->toIso8601String(),
                    ];
                });

            $recentCustomers = Customer::select('id', 'uuid', 'name', 'email', 'customer_type', 'status', 'created_at')
                ->latest()
                ->limit($limit)
                ->get()
                ->map(function ($customer) {
                    return [
                        'id' => $customer->id,
                        'uuid' => $customer->uuid,
                        'name' => $customer->name,
                        'email' => $customer->email,
                        'customerType' => $customer->customer_type,
                        'status' => $customer->status,
                        'createdAt' => $customer->created_at?->toIso8601String(),
                    ];
                });

            $recentProducts = Product::select('id', 'name', 'sku', 'slug', 'price', 'status', 'featured', 'created_at')
                ->latest()
                ->limit($limit)
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'slug' => $product->slug,
                        'price' => $product->price,
                        'status' => $product->status,
                        'featured' => $product->featured,
                        'createdAt' => $product->created_at?->toIso8601String(),
                    ];
                });

            return response()->json([
                'message' => 'Aktivitas terbaru berhasil diambil',
                'data' => [
                    'recentOrders' => $recentOrders,
                    'recentCustomers' => $recentCustomers,
                    'recentProducts' => $recentProducts,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil aktivitas terbaru',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga'
            ], 500);
        }
    }
}