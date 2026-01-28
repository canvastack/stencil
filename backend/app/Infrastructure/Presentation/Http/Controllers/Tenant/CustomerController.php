<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Presentation\Http\Requests\Customer\StoreCustomerRequest;
use App\Infrastructure\Presentation\Http\Requests\Customer\UpdateCustomerRequest;
use App\Infrastructure\Presentation\Http\Resources\Customer\CustomerResource;
use App\Infrastructure\Presentation\Http\Resources\Order\OrderResource;
use App\Domain\Customer\Services\CustomerSegmentationService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            // Ensure tenant scoping
            $tenant = $this->resolveTenant($request);
            $query = Customer::where('tenant_id', $tenant->id);

            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'ILIKE', '%' . $request->search . '%')
                      ->orWhere('email', 'ILIKE', '%' . $request->search . '%')
                      ->orWhere('company', 'ILIKE', '%' . $request->search . '%');
                });
            }

            if ($request->filled('customer_type')) {
                $query->where('customer_type', $request->customer_type);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('city')) {
                $query->where(function ($q) use ($request) {
                    $q->where('city', 'ILIKE', '%' . $request->city . '%')
                      ->orWhere('phone', 'ILIKE', '%' . $request->city . '%');
                });
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $perPage = $request->get('per_page', 20);

            // Calculate filtered statistics BEFORE pagination
            $filteredQuery = clone $query;
            $filteredStats = [
                'total' => $filteredQuery->count(),
                'active' => (clone $filteredQuery)->where('status', 'active')->count(),
                'inactive' => (clone $filteredQuery)->where('status', 'inactive')->count(),
                'blocked' => (clone $filteredQuery)->where('status', 'blocked')->count(),
                'individual' => (clone $filteredQuery)->where('customer_type', 'individual')->count(),
                'business' => (clone $filteredQuery)->where('customer_type', 'business')->count(),
            ];

            // Calculate filtered revenue
            // First try using total_spent field for consistency
            $filteredRevenue = (clone $filteredQuery)->sum('total_spent') ?? 0;
            
            // If total_spent is 0 but we have customers with orders, calculate from orders
            $customersWithOrdersFiltered = (clone $filteredQuery)->has('orders')->count();
            if ($filteredRevenue == 0 && $customersWithOrdersFiltered > 0) {
                $filteredRevenue = (clone $filteredQuery)
                    ->whereHas('orders', function($orderQuery) use ($tenant) {
                        $orderQuery->where('tenant_id', $tenant->id);
                    })
                    ->withSum(['orders' => function($orderQuery) use ($tenant) {
                        $orderQuery->where('tenant_id', $tenant->id);
                    }], 'total_amount')
                    ->get()
                    ->sum('orders_sum_total_amount') ?? 0;
            }

            $filteredStats['totalRevenue'] = $filteredRevenue;

            // Debug logging
            \Log::info('[CustomerController] Pagination params:', [
                'tenant_id' => $tenant->id,
                'per_page' => $perPage,
                'page' => $request->get('page', 1),
                'total_customers' => $query->count(),
                'filtered_stats' => $filteredStats
            ]);

            $customers = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            // Debug pagination response
            \Log::info('[CustomerController] Pagination response:', [
                'tenant_id' => $tenant->id,
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
                'count' => $customers->count()
            ]);

            $response = CustomerResource::collection($customers)->additional([
                'filtered_stats' => $filteredStats,
                'message' => 'Customer list retrieved successfully'
            ]);
            
            // Debug the actual response structure
            \Log::info('[CustomerController] Response structure:', [
                'tenant_id' => $tenant->id,
                'response_keys' => array_keys($response->response()->getData(true)),
                'meta_keys' => array_keys($response->response()->getData(true)['meta'] ?? []),
                'links_keys' => array_keys($response->response()->getData(true)['links'] ?? []),
                'filtered_stats' => $filteredStats
            ]);

            return $response->response()->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil daftar customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        try {
            // CRITICAL: Ensure tenant scoping for security
            $tenant = $this->resolveTenant($request);
            
            // Get overall tenant statistics (ONLY for current tenant)
            $totalCustomers = Customer::where('tenant_id', $tenant->id)->count();
            $activeCustomers = Customer::where('tenant_id', $tenant->id)->where('status', 'active')->count();
            $inactiveCustomers = Customer::where('tenant_id', $tenant->id)->where('status', 'inactive')->count();
            $blockedCustomers = Customer::where('tenant_id', $tenant->id)->where('status', 'blocked')->count();
            $individualCustomers = Customer::where('tenant_id', $tenant->id)->where('customer_type', 'individual')->count();
            $businessCustomers = Customer::where('tenant_id', $tenant->id)->where('customer_type', 'business')->count();
            
            // Calculate revenue from customers who have orders (ONLY for current tenant)
            $customersWithOrders = Customer::where('tenant_id', $tenant->id)->has('orders')->count();
            
            // Use total_spent field from customers table for consistency
            $totalRevenue = Customer::where('tenant_id', $tenant->id)->sum('total_spent') ?? 0;
            
            // If total_spent is 0 but we have orders, calculate from orders table
            if ($totalRevenue == 0 && $customersWithOrders > 0) {
                $totalRevenue = Customer::where('tenant_id', $tenant->id)
                    ->whereHas('orders', function($query) use ($tenant) {
                        $query->where('tenant_id', $tenant->id);
                    })
                    ->withSum(['orders' => function($query) use ($tenant) {
                        $query->where('tenant_id', $tenant->id);
                    }], 'total_amount')
                    ->get()
                    ->sum('orders_sum_total_amount') ?? 0;
            }
            
            // Calculate average order value and customer metrics (ONLY for current tenant)
            $totalOrders = Order::where('tenant_id', $tenant->id)->whereNotNull('customer_id')->count();
            $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;
            $averageRevenuePerCustomer = $customersWithOrders > 0 ? $totalRevenue / $customersWithOrders : 0;

            \Log::info('[CustomerController] Stats calculated for tenant:', [
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'totalCustomers' => $totalCustomers,
                'activeCustomers' => $activeCustomers,
                'businessCustomers' => $businessCustomers,
                'customersWithOrders' => $customersWithOrders,
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $totalOrders,
                'averageOrderValue' => $averageOrderValue,
                'averageRevenuePerCustomer' => $averageRevenuePerCustomer
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Customer statistics retrieved successfully',
                'data' => [
                    'total' => $totalCustomers,
                    'active' => $activeCustomers,
                    'inactive' => $inactiveCustomers,
                    'blocked' => $blockedCustomers,
                    'individual' => $individualCustomers,
                    'business' => $businessCustomers,
                    'totalRevenue' => $totalRevenue,
                    'averageOrderValue' => $averageOrderValue,
                    'customersWithOrders' => $customersWithOrders,
                    'averageRevenuePerCustomer' => $averageRevenuePerCustomer,
                ],
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                ]
            ], 200);
        } catch (\Exception $e) {
            \Log::error('[CustomerController] Stats error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = is_string($id) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
            
            $customer = Customer::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();
                
            return (new CustomerResource($customer))->response()->setStatusCode(200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil detail customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }
    
    private function resolveTenant(Request $request)
    {
        $candidate = $request->get('current_tenant')
            ?? $request->attributes->get('tenant')
            ?? (function_exists('tenant') ? tenant() : null);

        if (! $candidate && app()->bound('tenant.current')) {
            $candidate = app('tenant.current');
        }

        if (! $candidate && app()->bound('current_tenant')) {
            $candidate = app('current_tenant');
        }

        if (! $candidate) {
            $candidate = config('multitenancy.current_tenant');
        }

        if ($candidate) {
            return $candidate;
        }

        throw new \RuntimeException('Tenant context tidak ditemukan');
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        try {
            $customer = Customer::create($request->validated());
            return (new CustomerResource($customer))->response()->setStatusCode(201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function update(UpdateCustomerRequest $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = is_string($id) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
            
            $customer = Customer::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();
                
            $customer->update($request->validated());
            return (new CustomerResource($customer))->response()->setStatusCode(200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = is_string($id) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
            
            $customer = Customer::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();
                
            $customer->delete();
            return response()->json(['message' => 'Customer berhasil dihapus'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function search(Request $request, CustomerSegmentationService $segmentationService): JsonResponse
    {
        try {
            $validated = $request->validate([
                'query' => 'nullable|string|max:255',
                'status' => 'nullable|string|max:50',
                'customer_type' => 'nullable|string|max:50',
                'segments' => 'nullable|array',
                'segments.*' => 'string|max:50',
                'limit' => 'nullable|integer|min:1|max:100',
                'sort_by' => 'nullable|string|in:name,created_at,total_spent,total_orders',
                'sort_order' => 'nullable|string|in:asc,desc',
                'include_segmentation' => 'nullable|boolean',
            ]);

            $queryTerm = $validated['query'] ?? $request->get('search');
            $limit = $validated['limit'] ?? 25;
            $sortBy = $validated['sort_by'] ?? 'name';
            $sortOrder = $validated['sort_order'] ?? 'asc';
            $includeSegmentation = (bool) ($validated['include_segmentation'] ?? false);

            $builder = Customer::with('orders');

            if ($queryTerm) {
                $builder->where(function ($q) use ($queryTerm) {
                    $q->where('name', 'ILIKE', '%' . $queryTerm . '%')
                      ->orWhere('email', 'ILIKE', '%' . $queryTerm . '%')
                      ->orWhere('company', 'ILIKE', '%' . $queryTerm . '%');
                });
            }

            if (!empty($validated['status'])) {
                $builder->where('status', $validated['status']);
            }

            if (!empty($validated['customer_type'])) {
                $builder->where('customer_type', $validated['customer_type']);
            }

            if (!empty($validated['segments'])) {
                $segmentIds = $segmentationService->segmentAllCustomers()
                    ->filter(fn ($entry) => in_array($entry['segment'], $validated['segments'], true))
                    ->pluck('customer_id')
                    ->unique()
                    ->values();

                if ($segmentIds->isEmpty()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Pencarian customer berhasil',
                        'data' => [
                            'query' => $queryTerm,
                            'results' => [],
                        ],
                        'meta' => [
                            'limit' => $limit,
                            'count' => 0,
                            'filters' => $validated,
                            'generatedAt' => now()->toIso8601String(),
                        ],
                    ], 200);
                }

                $builder->whereIn('id', $segmentIds);
            }

            $customers = $builder
                ->orderBy($sortBy, $sortOrder)
                ->limit($limit)
                ->get();

            $results = $customers->map(function (Customer $customer) use ($request, $includeSegmentation, $segmentationService) {
                $payload = (new CustomerResource($customer))->toArray($request);

                if ($includeSegmentation) {
                    $rfm = $segmentationService->calculateRFMScore($customer);
                    $churn = $segmentationService->getChurnRisk($customer);

                    $payload['segmentation'] = [
                        'rfm' => $rfm,
                        'churnRisk' => $churn,
                    ];
                }

                return $payload;
            });

            return response()->json([
                'success' => true,
                'message' => 'Pencarian customer berhasil',
                'data' => [
                    'query' => $queryTerm,
                    'results' => $results,
                ],
                'meta' => [
                    'limit' => $limit,
                    'count' => $results->count(),
                    'filters' => $validated,
                    'generatedAt' => now()->toIso8601String(),
                ],
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi pencarian gagal',
                'error' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan pencarian customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga',
            ], 500);
        }
    }

    public function export(Request $request, CustomerSegmentationService $segmentationService): StreamedResponse|JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'nullable|string|max:50',
                'customer_type' => 'nullable|string|max:50',
                'query' => 'nullable|string|max:255',
                'segments' => 'nullable|array',
                'segments.*' => 'string|max:50',
            ]);

            $builder = Customer::with('orders');

            if (!empty($validated['query'])) {
                $builder->where(function ($q) use ($validated) {
                    $q->where('name', 'ILIKE', '%' . $validated['query'] . '%')
                      ->orWhere('email', 'ILIKE', '%' . $validated['query'] . '%')
                      ->orWhere('company', 'ILIKE', '%' . $validated['query'] . '%');
                });
            }

            if (!empty($validated['status'])) {
                $builder->where('status', $validated['status']);
            }

            if (!empty($validated['customer_type'])) {
                $builder->where('customer_type', $validated['customer_type']);
            }

            if (!empty($validated['segments'])) {
                $segmentIds = $segmentationService->segmentAllCustomers()
                    ->filter(fn ($entry) => in_array($entry['segment'], $validated['segments'], true))
                    ->pluck('customer_id')
                    ->unique()
                    ->values();

                if ($segmentIds->isEmpty()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Tidak ada data customer yang cocok untuk diekspor',
                        'data' => [
                            'exported' => 0,
                            'filename' => null,
                        ],
                    ], 200);
                }

                $builder->whereIn('id', $segmentIds);
            }

            $customers = $builder->orderBy('name')->get();
            $filename = 'customers-export-' . now()->format('Ymd_His') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function () use ($customers, $segmentationService) {
                $handle = fopen('php://output', 'w');
                fputcsv($handle, [
                    'ID',
                    'UUID',
                    'Name',
                    'Email',
                    'Customer Type',
                    'Status',
                    'Total Orders',
                    'Total Spent',
                    'Last Order Date',
                    'RFM Score',
                    'Segment',
                    'Recency Days',
                    'Frequency',
                    'Monetary Value',
                ]);

                foreach ($customers as $customer) {
                    $rfm = $segmentationService->calculateRFMScore($customer);

                    fputcsv($handle, [
                        $customer->id,
                        $customer->uuid,
                        $customer->name,
                        $customer->email,
                        $customer->customer_type,
                        $customer->status,
                        $customer->total_orders,
                        $customer->total_spent,
                        optional($customer->last_order_date)->toDateString(),
                        $rfm['rfm_score'] ?? null,
                        $rfm['segment'] ?? null,
                        $rfm['recency_days'] ?? null,
                        $rfm['frequency_count'] ?? null,
                        $rfm['monetary_value'] ?? null,
                    ]);
                }

                fclose($handle);
            };

            return response()->streamDownload($callback, $filename, $headers);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi ekspor customer gagal',
                'error' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga',
            ], 500);
        }
    }

    public function inactive(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $customers = Customer::where('status', 'inactive')
                ->orderBy($request->get('sort_by', 'updated_at'), $request->get('sort_order', 'desc'))
                ->paginate($perPage);

            return CustomerResource::collection($customers)
                ->additional([
                    'message' => 'Daftar customer tidak aktif berhasil diambil',
                ])
                ->response()
                ->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil customer tidak aktif',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function create(Request $request): JsonResponse
    {
        try {
            // Return form data for creating a new customer
            return response()->json([
                'success' => true,
                'message' => 'Form data untuk customer baru',
                'data' => [
                    'customer_types' => ['individual', 'company'],
                    'statuses' => ['active', 'inactive', 'pending'],
                    'default_values' => [
                        'status' => 'active',
                        'customer_type' => 'individual'
                    ]
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data form customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function creditAnalysis(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'nullable|integer|exists:customers,id',
                'limit' => 'nullable|integer|min:1|max:100'
            ]);

            $limit = $validated['limit'] ?? 20;
            $query = Customer::with(['orders' => function($q) {
                $q->select('customer_id', 'total_amount', 'status', 'created_at')
                  ->orderBy('created_at', 'desc');
            }]);

            if (!empty($validated['customer_id'])) {
                $query->where('id', $validated['customer_id']);
            }

            $customers = $query->limit($limit)->get();

            $creditAnalysis = $customers->map(function ($customer) {
                $orders = $customer->orders;
                $totalSpent = $orders->sum('total_amount');
                $avgOrderValue = $orders->count() > 0 ? $totalSpent / $orders->count() : 0;
                $lastOrderDate = $orders->first()?->created_at;
                
                return [
                    'customer_id' => $customer->id,
                    'customer_uuid' => $customer->uuid,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'total_orders' => $orders->count(),
                    'total_spent' => $totalSpent,
                    'average_order_value' => $avgOrderValue,
                    'last_order_date' => $lastOrderDate?->toDateString(),
                    'credit_score' => min(100, max(0, ($totalSpent / 1000000) * 10 + ($orders->count() * 5))),
                    'risk_level' => $this->calculateRiskLevel($customer, $orders)
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Analisis kredit customer berhasil',
                'data' => [
                    'credit_analysis' => $creditAnalysis,
                    'summary' => [
                        'total_customers' => $customers->count(),
                        'average_credit_score' => $creditAnalysis->avg('credit_score'),
                        'high_risk_customers' => $creditAnalysis->where('risk_level', 'high')->count()
                    ]
                ]
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi analisis kredit gagal',
                'error' => $e->validator->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan analisis kredit',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    private function calculateRiskLevel($customer, $orders): string
    {
        $totalSpent = $orders->sum('total_amount');
        $orderCount = $orders->count();
        $lastOrderDate = $orders->first()?->created_at;
        
        // Calculate days since last order
        $daysSinceLastOrder = $lastOrderDate ? now()->diffInDays($lastOrderDate) : 999;
        
        // Risk calculation logic
        if ($totalSpent < 500000 || $orderCount < 2 || $daysSinceLastOrder > 180) {
            return 'high';
        } elseif ($totalSpent < 2000000 || $orderCount < 5 || $daysSinceLastOrder > 90) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    public function orders(Request $request, string $customerId): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = is_string($customerId) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $customerId);
            
            $customer = Customer::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $customerId)
                ->firstOrFail();
                
            $perPage = $request->get('per_page', 20);

            // Debug logging
            \Log::info('[CustomerController] Orders query debug:', [
                'customer_id' => $customer->id,
                'customer_uuid' => $customer->uuid,
                'tenant_id' => $tenant->id,
                'per_page' => $perPage
            ]);

            $orders = Order::with(['vendor', 'tenant'])
                ->where('tenant_id', $tenant->id)
                ->where('customer_id', $customer->id)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            \Log::info('[CustomerController] Orders query result:', [
                'orders_count' => $orders->count(),
                'total_orders' => $orders->total(),
                'current_page' => $orders->currentPage(),
                'per_page' => $orders->perPage()
            ]);

            return OrderResource::collection($orders)
                ->additional([
                    'customer' => [
                        'id' => $customer->uuid,
                        'uuid' => $customer->uuid,
                        'name' => $customer->name,
                        'email' => $customer->email,
                    ],
                    'message' => 'Daftar pesanan customer berhasil diambil',
                ])
                ->response()
                ->setStatusCode(200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        } catch (\Exception $e) {
            \Log::error('[CustomerController] Orders error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Gagal mengambil pesanan customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function ordersDebug(Request $request, string $customerId): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = is_string($customerId) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $customerId);
            
            $customer = Customer::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $customerId)
                ->firstOrFail();
                
            $orders = Order::where('tenant_id', $tenant->id)
                ->where('customer_id', $customer->id)
                ->get(['id', 'order_number', 'total_amount', 'items', 'created_at']);

            $debug = [
                'customer' => [
                    'id' => $customer->id,
                    'uuid' => $customer->uuid,
                    'name' => $customer->name,
                    'tenant_id' => $customer->tenant_id,
                ],
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name ?? 'Unknown',
                ],
                'orders_raw' => $orders->toArray(),
                'orders_count' => $orders->count(),
                'query_info' => [
                    'tenant_id' => $tenant->id,
                    'customer_id' => $customer->id,
                    'is_uuid' => $isUuid,
                    'customer_param' => $customerId,
                ]
            ];

            return response()->json($debug, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function addTag(Request $request, int $customerId): JsonResponse
    {
        try {
            $customer = Customer::findOrFail($customerId);
            $data = $request->validate([
                'tags' => 'required|array|min:1',
                'tags.*' => 'string|max:50',
            ]);

            $currentMetadata = $customer->metadata ?? [];
            $existingTags = collect($currentMetadata['tags'] ?? []);
            $updatedTags = $existingTags->merge($data['tags'])->filter()->unique()->values()->all();
            $currentMetadata['tags'] = $updatedTags;

            $customer->metadata = $currentMetadata;
            $customer->save();

            return response()->json([
                'message' => 'Tag customer berhasil ditambahkan',
                'data' => [
                    'tags' => $updatedTags,
                ],
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validasi tag customer gagal',
                'error' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menambahkan tag customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function removeTag(Request $request, int $customerId, string $tag): JsonResponse
    {
        try {
            $customer = Customer::findOrFail($customerId);
            $metadata = $customer->metadata ?? [];
            $existingTags = collect($metadata['tags'] ?? []);
            $filteredTags = $existingTags
                ->filter(fn ($existingTag) => mb_strtolower($existingTag) !== mb_strtolower($tag))
                ->values()
                ->all();

            $metadata['tags'] = $filteredTags;
            $customer->metadata = $metadata;
            $customer->save();

            return response()->json([
                'message' => 'Tag customer berhasil dihapus',
                'data' => [
                    'tags' => $filteredTags,
                ],
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus tag customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function getSegment(Request $request, string $customerId): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = is_string($customerId) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $customerId);
            
            $customer = Customer::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $customerId)
                ->firstOrFail();

            // Calculate customer segment based on business logic
            $totalOrders = Order::where('tenant_id', $tenant->id)
                ->where('customer_id', $customer->id)
                ->count();
            $totalSpent = Order::where('tenant_id', $tenant->id)
                ->where('customer_id', $customer->id)
                ->sum('total_amount');
            $lastOrderDate = Order::where('tenant_id', $tenant->id)
                ->where('customer_id', $customer->id)
                ->latest()
                ->first()?->created_at;
            $daysSinceLastOrder = $lastOrderDate ? now()->diffInDays($lastOrderDate) : 999;

            // Determine segment based on RFM analysis
            $segment = $this->calculateCustomerSegment($totalOrders, $totalSpent, $daysSinceLastOrder);

            return response()->json([
                'success' => true,
                'message' => 'Customer segment berhasil diambil',
                'data' => [
                    'customer_id' => $customer->uuid,
                    'segment' => $segment,
                    'metrics' => [
                        'total_orders' => $totalOrders,
                        'total_spent' => $totalSpent,
                        'days_since_last_order' => $daysSinceLastOrder,
                        'last_order_date' => $lastOrderDate?->toDateString()
                    ]
                ]
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil segment customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    private function calculateCustomerSegment(int $totalOrders, int $totalSpent, int $daysSinceLastOrder): array
    {
        // Define segment thresholds
        $highValueThreshold = 5000000; // 5 million IDR
        $mediumValueThreshold = 1000000; // 1 million IDR
        $frequentOrdersThreshold = 5;
        $recentActivityThreshold = 90; // days

        // Calculate segment
        if ($totalSpent >= $highValueThreshold && $totalOrders >= $frequentOrdersThreshold && $daysSinceLastOrder <= $recentActivityThreshold) {
            $segmentName = 'VIP Customer';
            $segmentDescription = 'High-value, frequent, and active customer';
            $segmentColor = '#gold';
        } elseif ($totalSpent >= $mediumValueThreshold && $totalOrders >= 3 && $daysSinceLastOrder <= 180) {
            $segmentName = 'Premium Customer';
            $segmentDescription = 'Valuable customer with regular activity';
            $segmentColor = '#silver';
        } elseif ($totalOrders >= $frequentOrdersThreshold) {
            $segmentName = 'Loyal Customer';
            $segmentDescription = 'Frequent customer with good engagement';
            $segmentColor = '#bronze';
        } elseif ($daysSinceLastOrder <= $recentActivityThreshold) {
            $segmentName = 'Active Customer';
            $segmentDescription = 'Recently active customer';
            $segmentColor = '#green';
        } elseif ($daysSinceLastOrder > 365) {
            $segmentName = 'Inactive Customer';
            $segmentDescription = 'Customer needs re-engagement';
            $segmentColor = '#red';
        } else {
            $segmentName = 'Standard Customer';
            $segmentDescription = 'Regular customer with moderate activity';
            $segmentColor = '#blue';
        }

        return [
            'name' => $segmentName,
            'description' => $segmentDescription,
            'color' => $segmentColor,
            'priority' => $this->getSegmentPriority($segmentName)
        ];
    }

    private function getSegmentPriority(string $segmentName): int
    {
        return match($segmentName) {
            'VIP Customer' => 1,
            'Premium Customer' => 2,
            'Loyal Customer' => 3,
            'Active Customer' => 4,
            'Standard Customer' => 5,
            'Inactive Customer' => 6,
            default => 5
        };
    }

    /**
     * Get customer payment history
     */
    public function paymentHistory(Request $request, string $customerId): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = is_string($customerId) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $customerId);
            
            $customer = Customer::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $customerId)
                ->firstOrFail();

            $validated = $request->validate([
                'limit' => 'nullable|integer|min:1|max:100',
                'type' => 'nullable|string|in:all,incoming,outgoing',
                'status' => 'nullable|string|in:all,pending,completed,failed,refunded'
            ]);

            $limit = $validated['limit'] ?? 50;
            $typeFilter = $validated['type'] ?? 'all';
            $statusFilter = $validated['status'] ?? 'all';

            // Query payment transactions for this customer
            $query = DB::table('order_payment_transactions')
                ->join('orders', 'order_payment_transactions.order_id', '=', 'orders.id')
                ->where('order_payment_transactions.tenant_id', $tenant->id)
                ->where('order_payment_transactions.customer_id', $customer->id)
                ->select([
                    'order_payment_transactions.uuid',
                    'order_payment_transactions.direction',
                    'order_payment_transactions.type',
                    'order_payment_transactions.status',
                    'order_payment_transactions.amount',
                    'order_payment_transactions.currency',
                    'order_payment_transactions.method',
                    'order_payment_transactions.reference',
                    'order_payment_transactions.paid_at',
                    'order_payment_transactions.created_at',
                    'orders.order_number',
                    'orders.uuid as order_uuid'
                ])
                ->orderBy('order_payment_transactions.created_at', 'desc');

            // Apply filters
            if ($typeFilter !== 'all') {
                $query->where('order_payment_transactions.direction', $typeFilter);
            }

            if ($statusFilter !== 'all') {
                $query->where('order_payment_transactions.status', $statusFilter);
            }

            $transactions = $query->limit($limit)->get();

            // Format the response
            $paymentHistory = $transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->uuid,
                    'order_number' => $transaction->order_number,
                    'order_uuid' => $transaction->order_uuid,
                    'direction' => $transaction->direction,
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                    'amount' => $transaction->amount,
                    'currency' => $transaction->currency,
                    'method' => $transaction->method,
                    'reference' => $transaction->reference,
                    'paid_at' => $transaction->paid_at,
                    'created_at' => $transaction->created_at,
                    'formatted_amount' => 'Rp ' . number_format($transaction->amount, 0, ',', '.'),
                    'status_label' => ucfirst($transaction->status),
                    'type_label' => ucfirst(str_replace('_', ' ', $transaction->type))
                ];
            });

            // Calculate summary statistics
            $totalIncoming = $transactions->where('direction', 'incoming')->where('status', 'completed')->sum('amount');
            $totalOutgoing = $transactions->where('direction', 'outgoing')->where('status', 'completed')->sum('amount');
            $pendingAmount = $transactions->where('status', 'pending')->sum('amount');
            $lastPaymentDate = $transactions->where('status', 'completed')->first()?->paid_at;

            return response()->json([
                'success' => true,
                'message' => 'Payment history berhasil diambil',
                'data' => [
                    'customer' => [
                        'id' => $customer->uuid,
                        'name' => $customer->name,
                        'email' => $customer->email
                    ],
                    'payment_history' => $paymentHistory,
                    'summary' => [
                        'total_transactions' => $transactions->count(),
                        'total_incoming' => $totalIncoming,
                        'total_outgoing' => $totalOutgoing,
                        'net_amount' => $totalIncoming - $totalOutgoing,
                        'pending_amount' => $pendingAmount,
                        'last_payment_date' => $lastPaymentDate,
                        'formatted_total_incoming' => 'Rp ' . number_format($totalIncoming, 0, ',', '.'),
                        'formatted_total_outgoing' => 'Rp ' . number_format($totalOutgoing, 0, ',', '.'),
                        'formatted_net_amount' => 'Rp ' . number_format($totalIncoming - $totalOutgoing, 0, ',', '.'),
                        'formatted_pending_amount' => 'Rp ' . number_format($pendingAmount, 0, ',', '.')
                    ]
                ]
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi parameter gagal',
                'error' => $e->validator->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil payment history',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }
}
