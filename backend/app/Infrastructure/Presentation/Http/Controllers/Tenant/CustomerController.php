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
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Customer::query();

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

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $perPage = $request->get('per_page', 20);

            $customers = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return CustomerResource::collection($customers)
                ->response()
                ->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil daftar customer',
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

    public function orders(Request $request, string $customerId): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = is_string($customerId) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $customerId);
            
            $customer = Customer::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $customerId)
                ->firstOrFail();
                
            $perPage = $request->get('per_page', 20);

            $orders = Order::with(['items', 'vendor', 'tenant'])
                ->where('customer_id', $customer->id)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

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
            return response()->json([
                'message' => 'Gagal mengambil pesanan customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
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
}
