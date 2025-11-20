<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Presentation\Http\Requests\Vendor\StoreVendorRequest;
use App\Infrastructure\Presentation\Http\Requests\Vendor\UpdateVendorRequest;
use App\Infrastructure\Presentation\Http\Resources\Vendor\VendorResource;
use App\Domain\Vendor\Services\VendorEvaluationService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VendorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Vendor::query();

            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'ILIKE', '%' . $request->search . '%')
                      ->orWhere('code', 'ILIKE', '%' . $request->search . '%')
                      ->orWhere('email', 'ILIKE', '%' . $request->search . '%');
                });
            }

            if ($request->filled('category')) {
                $query->where('category', $request->category);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $perPage = $request->get('per_page', 20);

            $vendors = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return VendorResource::collection($vendors)
                ->response()
                ->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil daftar vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function search(Request $request, VendorEvaluationService $vendorEvaluationService): JsonResponse
    {
        try {
            $validated = $request->validate([
                'query' => 'nullable|string|max:255',
                'category' => 'nullable|string|max:100',
                'status' => 'nullable|string|max:50',
                'limit' => 'nullable|integer|min:1|max:100',
                'sort_by' => 'nullable|string|in:name,created_at,total_orders,rating',
                'sort_order' => 'nullable|string|in:asc,desc',
                'include_performance' => 'nullable|boolean',
                'min_score' => 'nullable|numeric|min:0|max:100',
            ]);

            $queryTerm = $validated['query'] ?? $request->get('search');
            $limit = $validated['limit'] ?? 25;
            $sortBy = $validated['sort_by'] ?? 'name';
            $sortOrder = $validated['sort_order'] ?? 'asc';
            $includePerformance = (bool) ($validated['include_performance'] ?? false);
            $minScore = $validated['min_score'] ?? null;

            $builder = Vendor::with('orders');

            if ($queryTerm) {
                $builder->where(function ($q) use ($queryTerm) {
                    $q->where('name', 'ILIKE', '%' . $queryTerm . '%')
                      ->orWhere('code', 'ILIKE', '%' . $queryTerm . '%')
                      ->orWhere('email', 'ILIKE', '%' . $queryTerm . '%');
                });
            }

            if (!empty($validated['category'])) {
                $builder->where('category', $validated['category']);
            }

            if (!empty($validated['status'])) {
                $builder->where('status', $validated['status']);
            }

            $vendors = $builder
                ->orderBy($sortBy, $sortOrder)
                ->limit($limit)
                ->get();

            $results = collect();

            foreach ($vendors as $vendor) {
                $payload = (new VendorResource($vendor))->toArray($request);

                if ($includePerformance) {
                    $evaluation = $vendorEvaluationService->evaluateVendor($vendor);

                    if ($minScore !== null && $evaluation['overall_score'] <= $minScore) {
                        continue;
                    }

                    $payload['performance'] = $evaluation;
                }

                $results->push($payload);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pencarian vendor berhasil',
                'data' => $results,
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
                'message' => 'Validasi pencarian vendor gagal',
                'error' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan pencarian vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga',
            ], 500);
        }
    }

    public function export(Request $request, VendorEvaluationService $vendorEvaluationService): StreamedResponse|JsonResponse
    {
        try {
            $validated = $request->validate([
                'query' => 'nullable|string|max:255',
                'category' => 'nullable|string|max:100',
                'status' => 'nullable|string|max:50',
                'min_score' => 'nullable|numeric|min:0|max:100',
            ]);

            $builder = Vendor::with('orders');

            if (!empty($validated['query'])) {
                $builder->where(function ($q) use ($validated) {
                    $q->where('name', 'ILIKE', '%' . $validated['query'] . '%')
                      ->orWhere('code', 'ILIKE', '%' . $validated['query'] . '%')
                      ->orWhere('email', 'ILIKE', '%' . $validated['query'] . '%');
                });
            }

            if (!empty($validated['category'])) {
                $builder->where('category', $validated['category']);
            }

            if (!empty($validated['status'])) {
                $builder->where('status', $validated['status']);
            }

            $vendors = $builder->orderBy('name')->get();
            $filename = 'vendors-export-' . now()->format('Ymd_His') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            if ($vendors->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Tidak ada data vendor yang cocok untuk diekspor',
                    'data' => [
                        'exported' => 0,
                        'filename' => null,
                    ],
                ], 200);
            }

            $minScore = $validated['min_score'] ?? null;

            $callback = function () use ($vendors, $vendorEvaluationService, $minScore) {
                $handle = fopen('php://output', 'w');
                fputcsv($handle, [
                    'ID',
                    'UUID',
                    'Name',
                    'Code',
                    'Email',
                    'Category',
                    'Status',
                    'Total Orders',
                    'Rating',
                    'Overall Score',
                    'Performance Rating',
                    'On Time Rate',
                    'Average Lead Time',
                    'Quality Acceptance Rate',
                ]);

                foreach ($vendors as $vendor) {
                    $evaluation = $vendorEvaluationService->evaluateVendor($vendor);

                    if ($minScore !== null && $evaluation['overall_score'] <= $minScore) {
                        continue;
                    }

                    $metrics = $evaluation['metrics'];

                    fputcsv($handle, [
                        $vendor->id,
                        $vendor->uuid,
                        $vendor->name,
                        $vendor->code,
                        $vendor->email,
                        $vendor->category,
                        $vendor->status,
                        $vendor->total_orders,
                        $vendor->rating,
                        $evaluation['overall_score'],
                        $evaluation['performance_rating'],
                        $metrics['delivery_performance']['on_time_rate'] ?? null,
                        $metrics['delivery_performance']['avg_lead_time_days'] ?? null,
                        $metrics['quality_score']['acceptance_rate'] ?? null,
                    ]);
                }

                fclose($handle);
            };

            return response()->streamDownload($callback, $filename, $headers);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi ekspor vendor gagal',
                'error' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga',
            ], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail($id);
            return (new VendorResource($vendor))->response()->setStatusCode(200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Vendor tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil detail vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function store(StoreVendorRequest $request): JsonResponse
    {
        try {
            $vendor = Vendor::create($request->validated());
            return (new VendorResource($vendor))->response()->setStatusCode(201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function update(UpdateVendorRequest $request, int $id): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail($id);
            $vendor->update($request->validated());
            return (new VendorResource($vendor))->response()->setStatusCode(200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Vendor tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail($id);
            $vendor->delete();
            return response()->json(['message' => 'Vendor berhasil dihapus'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Vendor tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function activate(Request $request, int $id): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail($id);
            $vendor->update(['status' => 'active']);
            return (new VendorResource($vendor))->response()->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengaktifkan vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function deactivate(Request $request, int $id): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail($id);
            $vendor->update(['status' => 'inactive']);
            return (new VendorResource($vendor))->response()->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menonaktifkan vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }
}
