<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * Admin Audit Log Controller
 * 
 * Handles admin operations for viewing and exporting vendor audit logs.
 * 
 * Requirements:
 * - 16.5: Display audit logs on admin vendor detail page
 * - 16.6: Filter audit logs by date range and action type
 * - 16.7: Retain audit logs for at least 2 years
 * - 16.8: Export audit logs to CSV format
 */
class AdminAuditLogController extends Controller
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {
    }

    /**
     * Get audit logs with filters
     * 
     * GET /api/v1/admin/audit-logs
     * 
     * Query Parameters:
     * - vendor_id: Filter by vendor user ID (optional)
     * - action_type: Filter by action type (optional)
     * - resource_type: Filter by resource type (optional)
     * - date_from: Filter from date (Y-m-d format, optional)
     * - date_to: Filter to date (Y-m-d format, optional)
     * - page: Page number (default: 1)
     * - per_page: Items per page (default: 50, max: 100)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Validate request (Laravel will automatically return 422 on validation failure)
        $validated = $request->validate([
            'vendor_id' => 'nullable|integer|min:1',
            'action_type' => 'nullable|string|max:50',
            'resource_type' => 'nullable|string|max:50',
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        try {
            // Get tenant ID from request (set by TenantContextMiddleware or from authenticated user)
            $tenantId = $request->get('tenant_id') ?? $request->user()->tenant_id ?? null;
            if (!$tenantId) {
                return response()->json([
                    'message' => 'Tenant context not found',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 400);
            }

            // Build filters
            $filters = [];
            if (isset($validated['vendor_id'])) {
                $filters['user_id'] = $validated['vendor_id'];
                $filters['user_type'] = 'vendor'; // Only vendor actions
            }
            if (isset($validated['action_type'])) {
                $filters['action_type'] = $validated['action_type'];
            }
            if (isset($validated['resource_type'])) {
                $filters['resource_type'] = $validated['resource_type'];
            }
            if (isset($validated['date_from'])) {
                $filters['date_from'] = $validated['date_from'] . ' 00:00:00';
            }
            if (isset($validated['date_to'])) {
                $filters['date_to'] = $validated['date_to'] . ' 23:59:59';
            }

            // Get pagination parameters
            $page = (int) ($validated['page'] ?? 1);
            $perPage = (int) ($validated['per_page'] ?? 50);

            // Fetch audit logs
            $result = $this->auditLogRepository->findWithFilters(
                tenantId: $tenantId,
                filters: $filters,
                page: $page,
                perPage: $perPage
            );

            Log::info('Admin fetched audit logs', [
                'tenant_id' => $tenantId,
                'filters' => $filters,
                'page' => $page,
                'per_page' => $perPage,
                'total_results' => $result['total'],
            ]);

            return response()->json([
                'message' => 'Audit logs retrieved successfully',
                'data' => $result['data'],
                'meta' => [
                    'total' => $result['total'],
                    'page' => $result['page'],
                    'per_page' => $result['per_page'],
                    'last_page' => $result['last_page'],
                    'filters' => $result['filters'],
                ]
            ], 200);

        } catch (InvalidArgumentException $e) {
            Log::warning('Failed to fetch audit logs', [
                'error' => $e->getMessage(),
                'filters' => $validated ?? [],
            ]);

            return response()->json([
                'message' => 'Failed to fetch audit logs',
                'error' => $e->getMessage()
            ], 400);

        } catch (\Exception $e) {
            Log::error('Unexpected error fetching audit logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred',
                'error' => 'INTERNAL_SERVER_ERROR'
            ], 500);
        }
    }

    /**
     * Get audit log statistics
     * 
     * GET /api/v1/admin/audit-logs/statistics
     * 
     * Query Parameters:
     * - date_from: Filter from date (Y-m-d format, optional)
     * - date_to: Filter to date (Y-m-d format, optional)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function statistics(Request $request): JsonResponse
    {
        // Validate request (Laravel will automatically return 422 on validation failure)
        $validated = $request->validate([
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d',
        ]);

        try {
            // Get tenant ID from request (set by TenantContextMiddleware or from authenticated user)
            $tenantId = $request->get('tenant_id') ?? $request->user()->tenant_id ?? null;
            if (!$tenantId) {
                return response()->json([
                    'message' => 'Tenant context not found',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 400);
            }

            // Build filters
            $filters = [];
            if (isset($validated['date_from'])) {
                $filters['date_from'] = $validated['date_from'] . ' 00:00:00';
            }
            if (isset($validated['date_to'])) {
                $filters['date_to'] = $validated['date_to'] . ' 23:59:59';
            }

            // Get statistics
            $statistics = $this->auditLogRepository->getStatistics(
                tenantId: $tenantId,
                filters: $filters
            );

            return response()->json([
                'message' => 'Audit log statistics retrieved successfully',
                'data' => $statistics
            ], 200);

        } catch (\Exception $e) {
            Log::error('Unexpected error fetching audit log statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred',
                'error' => 'INTERNAL_SERVER_ERROR'
            ], 500);
        }
    }

    /**
     * Export audit logs to CSV
     * 
     * GET /api/v1/admin/audit-logs/export
     * 
     * Query Parameters:
     * - vendor_id: Filter by vendor user ID (optional)
     * - action_type: Filter by action type (optional)
     * - resource_type: Filter by resource type (optional)
     * - date_from: Filter from date (Y-m-d format, optional)
     * - date_to: Filter to date (Y-m-d format, optional)
     * 
     * @param Request $request
     * @return Response
     */
    public function export(Request $request): Response
    {
        // Validate request (Laravel will automatically return 422 on validation failure)
        $validated = $request->validate([
            'vendor_id' => 'nullable|integer|min:1',
            'action_type' => 'nullable|string|max:50',
            'resource_type' => 'nullable|string|max:50',
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d',
        ]);

        try {
            // Get tenant ID from request (set by TenantContextMiddleware or from authenticated user)
            $tenantId = $request->get('tenant_id') ?? $request->user()->tenant_id ?? null;
            if (!$tenantId) {
                return response('Tenant context not found', 400);
            }

            // Build filters
            $filters = [];
            if (isset($validated['vendor_id'])) {
                $filters['user_id'] = $validated['vendor_id'];
                $filters['user_type'] = 'vendor';
            }
            if (isset($validated['action_type'])) {
                $filters['action_type'] = $validated['action_type'];
            }
            if (isset($validated['resource_type'])) {
                $filters['resource_type'] = $validated['resource_type'];
            }
            if (isset($validated['date_from'])) {
                $filters['date_from'] = $validated['date_from'] . ' 00:00:00';
            }
            if (isset($validated['date_to'])) {
                $filters['date_to'] = $validated['date_to'] . ' 23:59:59';
            }

            // Export to CSV
            $csv = $this->auditLogRepository->exportToCsv(
                tenantId: $tenantId,
                filters: $filters
            );

            Log::info('Admin exported audit logs to CSV', [
                'tenant_id' => $tenantId,
                'filters' => $filters,
            ]);

            // Generate filename with timestamp
            $filename = 'audit-logs-' . date('Y-m-d-His') . '.csv';

            return response($csv, 200)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            Log::error('Unexpected error exporting audit logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response('An unexpected error occurred', 500);
        }
    }
}

