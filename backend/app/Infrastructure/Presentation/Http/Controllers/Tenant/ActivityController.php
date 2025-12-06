<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\Multitenancy\Models\Tenant as BaseTenant;
use Illuminate\Validation\Rule;

class ActivityController extends Controller
{
    /**
     * Store activity logs in batch.
     */
    public function batchStore(Request $request)
    {
        $request->validate([
            'activities' => 'required|array|max:50',
            'activities.*.action' => 'required|string|max:100',
            'activities.*.resource' => 'required|string|max:100',
            'activities.*.resourceId' => 'nullable|string|max:255',
            'activities.*.details' => 'sometimes|array',
            'activities.*.ipAddress' => 'nullable|string|max:45',
            'activities.*.userAgent' => 'nullable|string|max:512',
            'activities.*.duration' => 'nullable|integer|min:0',
            'activities.*.status' => 'sometimes|string|in:success,error,pending',
            'activities.*.createdAt' => 'sometimes|string|date',
            'activities.*.tenantId' => 'nullable|string',
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $userId = auth()->id();
        $user = auth()->user();

        $activities = [];
        
        foreach ($request->input('activities') as $activityData) {
            $activities[] = [
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'user_email' => $user ? $user->email : 'system@unknown.com',
                'user_name' => $user ? $user->name : 'System User',
                'action' => $activityData['action'],
                'resource' => $activityData['resource'],
                'resource_id' => $activityData['resourceId'] ?? null,
                'details' => json_encode($activityData['details'] ?? []),
                'ip_address' => $activityData['ipAddress'] ?? $request->ip(),
                'user_agent' => $activityData['userAgent'] ?? $request->userAgent(),
                'duration' => $activityData['duration'] ?? null,
                'status' => $activityData['status'] ?? 'success',
                'created_at' => isset($activityData['createdAt']) ? 
                    \Carbon\Carbon::parse($activityData['createdAt']) : 
                    now(),
                'updated_at' => now(),
            ];
        }

        DB::table('activity_logs')->insert($activities);

        return response()->json([
            'message' => 'Activity logs stored successfully',
            'count' => count($activities),
        ], 201);
    }

    /**
     * Display a listing of activity logs.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);
        
        $tenantId = $this->getCurrentTenantId($request);
        $query = ActivityLog::where('tenant_id', $tenantId);
            
        // Apply filters
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }
        
        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }
        
        if ($request->filled('resource')) {
            $query->where('resource', $request->input('resource'));
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'LIKE', "%{$search}%")
                  ->orWhere('resource', 'LIKE', "%{$search}%")
                  ->orWhere('user_name', 'LIKE', "%{$search}%")
                  ->orWhere('user_email', 'LIKE', "%{$search}%");
            });
        }
        
        // Date range filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        
        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);
        
        $activities = $query->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'data' => $activities->items(),
            'meta' => [
                'current_page' => $activities->currentPage(),
                'per_page' => $activities->perPage(),
                'total' => $activities->total(),
                'last_page' => $activities->lastPage(),
                'from' => $activities->firstItem(),
                'to' => $activities->lastItem(),
            ],
        ]);
    }

    /**
     * Get activity statistics.
     */
    public function statistics(Request $request)
    {
        $tenantId = $this->getCurrentTenantId($request);
        
        $totalActivities = ActivityLog::where('tenant_id', $tenantId)->count();
        $uniqueUsers = ActivityLog::where('tenant_id', $tenantId)
            ->distinct('user_id')
            ->count();
        
        $averageDuration = ActivityLog::where('tenant_id', $tenantId)
            ->whereNotNull('duration')
            ->avg('duration') ?? 0;
        
        $actionBreakdown = ActivityLog::where('tenant_id', $tenantId)
            ->select('action', DB::raw('count(*) as count'))
            ->groupBy('action')
            ->pluck('count', 'action')
            ->toArray();
        
        $resourceBreakdown = ActivityLog::where('tenant_id', $tenantId)
            ->select('resource', DB::raw('count(*) as count'))
            ->groupBy('resource')
            ->pluck('count', 'resource')
            ->toArray();
        
        $statusBreakdown = ActivityLog::where('tenant_id', $tenantId)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
        
        $dailyActivity = ActivityLog::where('tenant_id', $tenantId)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => $item->count,
                ];
            })
            ->toArray();

        return response()->json([
            'data' => [
                'totalActivities' => $totalActivities,
                'uniqueUsers' => $uniqueUsers,
                'averageDuration' => round($averageDuration, 2),
                'actionBreakdown' => $actionBreakdown,
                'resourceBreakdown' => $resourceBreakdown,
                'statusBreakdown' => $statusBreakdown,
                'dailyActivity' => $dailyActivity,
            ],
        ]);
    }

    /**
     * Resolve the current tenant context.
     */
    private function resolveTenant(Request $request): BaseTenant
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

        if ($candidate instanceof BaseTenant) {
            return $candidate;
        }

        throw new \RuntimeException('Tenant context tidak ditemukan');
    }

    /**
     * Get current tenant ID from the request context.
     */
    private function getCurrentTenantId(Request $request): int
    {
        $tenant = $this->resolveTenant($request);
        return $tenant->id;
    }
}