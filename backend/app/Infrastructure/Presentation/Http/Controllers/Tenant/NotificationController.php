<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Notification;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationPreference;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\Multitenancy\Models\Tenant as BaseTenant;

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('limit', 20);
        $page = $request->input('page', 1);
        $unreadOnly = $request->boolean('unread_only', false);
        
        $tenantId = $this->getCurrentTenantId($request);
        $userId = auth()->id();
        
        $query = Notification::where('tenant_id', $tenantId)
            ->where('user_id', $userId);
            
        if ($unreadOnly) {
            $query->whereNull('read_at');
        }
        
        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'data' => collect($notifications->items())->map(function ($notification) {
                return $this->transformNotification($notification);
            })->toArray(),
            'meta' => [
                'total' => $notifications->total(),
                'hasMore' => $notifications->hasMorePages(),
                'current_page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
                'last_page' => $notifications->lastPage(),
            ]
        ]);
    }

    /**
     * Get notification preferences.
     */
    public function preferences(Request $request)
    {
        $tenantId = $this->getCurrentTenantId($request);
        $userId = auth()->id();
        
        $preferences = NotificationPreference::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->first();
            
        if (!$preferences) {
            // Return default preferences
            return response()->json([
                'inApp' => true,
                'email' => true,
                'sms' => false,
                'pushNotifications' => false,
                'types' => [
                    'order_updates' => true,
                    'payment_updates' => true,
                    'system_updates' => true,
                    'marketing' => false,
                ]
            ]);
        }
        
        return response()->json($preferences->preferences);
    }

    /**
     * Update notification preferences.
     */
    public function updatePreferences(Request $request)
    {
        $request->validate([
            'inApp' => 'sometimes|boolean',
            'email' => 'sometimes|boolean',
            'sms' => 'sometimes|boolean',
            'pushNotifications' => 'sometimes|boolean',
            'types' => 'sometimes|array',
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $userId = auth()->id();
        
        $preferences = NotificationPreference::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
            ],
            [
                'preferences' => $request->all(),
            ]
        );
        
        return response()->json($preferences->preferences);
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(Request $request, string $id)
    {
        $tenantId = $this->getCurrentTenantId($request);
        $userId = auth()->id();
        
        $notification = Notification::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->where('uuid', $id)
            ->firstOrFail();
            
        $notification->update(['read_at' => now()]);
        
        return response()->json([
            'data' => $this->transformNotification($notification)
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request)
    {
        $tenantId = $this->getCurrentTenantId($request);
        $userId = auth()->id();
        
        Notification::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        
        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Get unread notifications count.
     */
    public function unreadCount(Request $request)
    {
        $tenantId = $this->getCurrentTenantId($request);
        $userId = auth()->id();
        
        $count = Notification::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
        
        return response()->json(['count' => $count]);
    }

    /**
     * Create a new notification.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|in:info,success,warning,error',
            'action_url' => 'nullable|url',
            'data' => 'nullable|array',
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $userId = auth()->id();
        
        $notification = Notification::create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'title' => $request->input('title'),
            'message' => $request->input('message'),
            'type' => $request->input('type'),
            'action_url' => $request->input('action_url'),
            'data' => $request->input('data', []),
        ]);
        
        return response()->json([
            'data' => $this->transformNotification($notification)
        ], 201);
    }

    /**
     * Transform notification to frontend format.
     */
    private function transformNotification(Notification $notification): array
    {
        return [
            'id' => $notification->uuid,
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'actionUrl' => $notification->action_url,
            'data' => $notification->data ?? [],
            'read' => $notification->read_at !== null,
            'readAt' => $notification->read_at?->toISOString(),
            'createdAt' => $notification->created_at->toISOString(),
        ];
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