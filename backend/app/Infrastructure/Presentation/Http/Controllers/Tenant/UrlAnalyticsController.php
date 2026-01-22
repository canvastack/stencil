<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Application\TenantConfiguration\Services\UrlAccessAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class UrlAnalyticsController extends Controller
{
    public function __construct(
        private UrlAccessAnalyticsService $analyticsService
    ) {}

    public function overview(Request $request): JsonResponse
    {
        try {
            // Optional permission check - commented out for now
            // if (auth()->user() && !auth()->user()->can('settings.analytics.view')) {
            //     throw new \Illuminate\Auth\Access\AuthorizationException();
            // }

            $tenantUuid = $request->attributes->get('tenant_uuid');
            
            if (!$tenantUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant tidak ditemukan dalam konteks request',
                ], 400);
            }

            $validated = $request->validate([
                'period' => 'nullable|string|in:today,7days,30days,90days,1year',
            ]);

            $period = $validated['period'] ?? '30days';
            
            $overview = $this->analyticsService->getAccessOverview($tenantUuid, $period);

            return response()->json([
                'success' => true,
                'message' => 'Ikhtisar analitik URL berhasil diambil',
                'data' => $overview,
            ], 200);

        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk melihat analitik URL',
            ], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('[UrlAnalyticsController] Failed to get overview', [
                'tenant_uuid' => $request->attributes->get('tenant_uuid'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil ikhtisar analitik URL',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga',
            ], 500);
        }
    }

    public function trends(Request $request): JsonResponse
    {
        try {
            // Optional permission check - commented out for now
            // if (auth()->user() && !auth()->user()->can('settings.analytics.view')) {
            //     throw new \Illuminate\Auth\Access\AuthorizationException();
            // }

            $tenantUuid = $request->attributes->get('tenant_uuid');
            
            if (!$tenantUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant tidak ditemukan dalam konteks request',
                ], 400);
            }

            $validated = $request->validate([
                'period' => 'nullable|string|in:today,7days,30days,90days,1year',
                'group_by' => 'nullable|string|in:hour,day,week,month',
            ]);

            $period = $validated['period'] ?? '30days';
            $groupBy = $validated['group_by'] ?? 'day';
            
            $trends = $this->analyticsService->getAccessTrends($tenantUuid, $period, $groupBy);

            return response()->json([
                'success' => true,
                'message' => 'Tren akses URL berhasil diambil',
                'data' => [
                    'period' => $period,
                    'group_by' => $groupBy,
                    'trends' => $trends,
                ],
            ], 200);

        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk melihat tren URL',
            ], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('[UrlAnalyticsController] Failed to get trends', [
                'tenant_uuid' => $request->attributes->get('tenant_uuid'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil tren akses URL',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga',
            ], 500);
        }
    }

    public function geographic(Request $request): JsonResponse
    {
        try {
            // Optional permission check - commented out for now
            // if (auth()->user() && !auth()->user()->can('settings.analytics.view')) {
            //     throw new \Illuminate\Auth\Access\AuthorizationException();
            // }

            $tenantUuid = $request->attributes->get('tenant_uuid');
            
            if (!$tenantUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant tidak ditemukan dalam konteks request',
                ], 400);
            }

            $validated = $request->validate([
                'period' => 'nullable|string|in:today,7days,30days,90days,1year',
            ]);

            $period = $validated['period'] ?? '30days';
            
            $distribution = $this->analyticsService->getGeographicDistribution($tenantUuid, $period);

            return response()->json([
                'success' => true,
                'message' => 'Distribusi geografis berhasil diambil',
                'data' => [
                    'period' => $period,
                    'distribution' => $distribution,
                ],
            ], 200);

        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk melihat distribusi geografis',
            ], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('[UrlAnalyticsController] Failed to get geographic distribution', [
                'tenant_uuid' => $request->attributes->get('tenant_uuid'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil distribusi geografis',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga',
            ], 500);
        }
    }

    public function urlConfigPerformance(Request $request): JsonResponse
    {
        try {
            // Optional permission check - commented out for now
            // if (auth()->user() && !auth()->user()->can('settings.analytics.view')) {
            //     throw new \Illuminate\Auth\Access\AuthorizationException();
            // }

            $tenantUuid = $request->attributes->get('tenant_uuid');
            
            if (!$tenantUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant tidak ditemukan dalam konteks request',
                ], 400);
            }

            $validated = $request->validate([
                'period' => 'nullable|string|in:today,7days,30days,90days,1year',
            ]);

            $period = $validated['period'] ?? '30days';
            
            $performance = $this->analyticsService->getUrlConfigPerformance($tenantUuid, $period);

            return response()->json([
                'success' => true,
                'message' => 'Performa konfigurasi URL berhasil diambil',
                'data' => [
                    'period' => $period,
                    'configurations' => $performance,
                ],
            ], 200);

        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk melihat performa URL',
            ], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('[UrlAnalyticsController] Failed to get URL config performance', [
                'tenant_uuid' => $request->attributes->get('tenant_uuid'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil performa konfigurasi URL',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga',
            ], 500);
        }
    }

    public function referrers(Request $request): JsonResponse
    {
        try {
            // Optional permission check - commented out for now
            // if (auth()->user() && !auth()->user()->can('settings.analytics.view')) {
            //     throw new \Illuminate\Auth\Access\AuthorizationException();
            // }

            $tenantUuid = $request->attributes->get('tenant_uuid');
            
            if (!$tenantUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant tidak ditemukan dalam konteks request',
                ], 400);
            }

            $validated = $request->validate([
                'period' => 'nullable|string|in:today,7days,30days,90days,1year',
                'limit' => 'nullable|integer|min:1|max:100',
            ]);

            $period = $validated['period'] ?? '30days';
            $limit = $validated['limit'] ?? 20;
            
            $referrers = $this->analyticsService->getTopReferrers($tenantUuid, $period, $limit);

            return response()->json([
                'success' => true,
                'message' => 'Referrer teratas berhasil diambil',
                'data' => [
                    'period' => $period,
                    'limit' => $limit,
                    'referrers' => $referrers,
                ],
            ], 200);

        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk melihat referrer',
            ], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('[UrlAnalyticsController] Failed to get referrers', [
                'tenant_uuid' => $request->attributes->get('tenant_uuid'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil referrer teratas',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga',
            ], 500);
        }
    }

    public function devices(Request $request): JsonResponse
    {
        try {
            // Optional permission check - commented out for now
            // if (auth()->user() && !auth()->user()->can('settings.analytics.view')) {
            //     throw new \Illuminate\Auth\Access\AuthorizationException();
            // }

            $tenantUuid = $request->attributes->get('tenant_uuid');
            
            if (!$tenantUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant tidak ditemukan dalam konteks request',
                ], 400);
            }

            $validated = $request->validate([
                'period' => 'nullable|string|in:today,7days,30days,90days,1year',
            ]);

            $period = $validated['period'] ?? '30days';
            
            $deviceStats = $this->analyticsService->getDeviceStats($tenantUuid, $period);

            return response()->json([
                'success' => true,
                'message' => 'Statistik perangkat berhasil diambil',
                'data' => [
                    'period' => $period,
                    'stats' => $deviceStats,
                ],
            ], 200);

        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk melihat statistik perangkat',
            ], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('[UrlAnalyticsController] Failed to get device stats', [
                'tenant_uuid' => $request->attributes->get('tenant_uuid'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik perangkat',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan yang tidak terduga',
            ], 500);
        }
    }
}
