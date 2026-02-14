<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Notification Controller
 * 
 * Handles in-app notifications for tenant users.
 */
class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $perPage = $request->get('per_page', 15);
        $unreadOnly = $request->boolean('unread_only', false);

        $query = $user->notifications();

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'notifications' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'has_more' => $notifications->hasMorePages(),
            ],
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Get unread notification count
     */
    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count()
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, string $notificationId): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = $user->notifications()->find($notificationId);

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'unread_count' => $user->unreadNotifications()->count()
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read',
            'unread_count' => 0
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy(string $notificationId): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = $user->notifications()->find($notificationId);

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted',
            'unread_count' => $user->unreadNotifications()->count()
        ]);
    }

    /**
     * Get notification preferences for the authenticated user
     */
    public function preferences(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Get tenant ID from user or tenant context
        $tenantId = $user->tenant_id;
        
        if (!$tenantId) {
            return response()->json(['error' => 'Tenant not found'], 400);
        }
        
        // Get or create notification preferences
        $notificationPreference = \App\Infrastructure\Persistence\Eloquent\Models\NotificationPreference::firstOrCreate(
            [
                'tenant_id' => $tenantId,
                'user_id' => $user->id,
            ],
            [
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'preferences' => [
                    // Vendor Portal Notifications
                    'vendor_quote_accepted' => [
                        'email' => true,
                        'in_app' => true,
                    ],
                    'vendor_quote_rejected' => [
                        'email' => true,
                        'in_app' => true,
                    ],
                    'vendor_quote_countered' => [
                        'email' => true,
                        'in_app' => true,
                    ],
                    'vendor_quote_message' => [
                        'email' => true,
                        'in_app' => true,
                    ],
                    // General Notifications
                    'order_status_changes' => [
                        'email' => true,
                        'in_app' => true,
                    ],
                    'payment_updates' => [
                        'email' => true,
                        'in_app' => true,
                    ],
                    'system_announcements' => [
                        'email' => true,
                        'in_app' => true,
                    ],
                ],
            ]
        );

        return response()->json([
            'preferences' => $notificationPreference->preferences
        ]);
    }

    /**
     * Update notification preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request->validate([
            'preferences' => 'required|array',
            'preferences.*.email' => 'boolean',
            'preferences.*.in_app' => 'boolean',
        ]);

        // Get tenant ID from user or tenant context
        $tenantId = $user->tenant_id;
        
        if (!$tenantId) {
            return response()->json(['error' => 'Tenant not found'], 400);
        }
        
        // Get or create notification preferences
        $notificationPreference = \App\Infrastructure\Persistence\Eloquent\Models\NotificationPreference::firstOrCreate(
            [
                'tenant_id' => $tenantId,
                'user_id' => $user->id,
            ],
            [
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'preferences' => [],
            ]
        );

        // Merge new preferences with existing ones
        $currentPreferences = $notificationPreference->preferences ?? [];
        $newPreferences = array_merge($currentPreferences, $request->input('preferences'));
        
        $notificationPreference->preferences = $newPreferences;
        $notificationPreference->save();

        return response()->json([
            'message' => 'Preferences updated successfully',
            'preferences' => $notificationPreference->preferences
        ]);
    }

    /**
     * Get order-specific notifications
     */
    public function orderNotifications(Request $request, string $orderUuid): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Fix PostgreSQL JSON query syntax - use proper JSON path extraction
        $notifications = $user->notifications()
            ->whereRaw("data::jsonb ->> 'order_uuid' = ?", [$orderUuid])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'notifications' => $notifications,
            'count' => $notifications->count()
        ]);
    }

    /**
     * Get notification preferences for a specific order
     */
    public function orderNotificationPreferences(string $orderUuid): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Get tenant ID from user
        $tenantId = $user->tenant_id;
        
        if (!$tenantId) {
            return response()->json(['error' => 'Tenant not found'], 400);
        }
        
        // Get or create notification preferences
        $notificationPreference = \App\Infrastructure\Persistence\Eloquent\Models\NotificationPreference::firstOrCreate(
            [
                'tenant_id' => $tenantId,
                'user_id' => $user->id,
            ],
            [
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'preferences' => [
                    'order_status_changes' => [
                        'email' => true,
                        'in_app' => true,
                        'sms' => false,
                    ],
                ],
            ]
        );

        // Return preferences in the format expected by frontend
        return response()->json([
            'orderId' => $orderUuid,
            'customerId' => $user->id,
            'channels' => [
                [
                    'type' => 'inApp',
                    'enabled' => $notificationPreference->preferences['order_status_changes']['in_app'] ?? true,
                ],
                [
                    'type' => 'email',
                    'enabled' => $notificationPreference->preferences['order_status_changes']['email'] ?? true,
                ],
                [
                    'type' => 'sms',
                    'enabled' => $notificationPreference->preferences['order_status_changes']['sms'] ?? false,
                ],
            ],
            'preferences' => [
                'orderCreated' => true,
                'orderConfirmed' => true,
                'orderProcessing' => true,
                'orderShipped' => true,
                'orderDelivered' => true,
                'orderCancelled' => true,
                'orderRefunded' => true,
            ],
        ]);
    }

    /**
     * Send email notification
     */
    public function sendEmail(Request $request): JsonResponse
    {
        $request->validate([
            'orderId' => 'required|string',
            'type' => 'required|string',
            'status' => 'required|string',
            'templateData' => 'required|array',
        ]);

        // Log the email notification request
        \Log::info('Email notification requested', [
            'order_id' => $request->orderId,
            'type' => $request->type,
            'status' => $request->status,
        ]);

        // TODO: Implement actual email sending logic
        // For now, just return success
        return response()->json([
            'message' => 'Email notification queued successfully',
            'orderId' => $request->orderId,
            'type' => $request->type,
        ]);
    }

    /**
     * Send SMS notification
     */
    public function sendSms(Request $request): JsonResponse
    {
        $request->validate([
            'orderId' => 'required|string',
            'message' => 'required|string',
            'type' => 'required|string',
        ]);

        // Log the SMS notification request
        \Log::info('SMS notification requested', [
            'order_id' => $request->orderId,
            'type' => $request->type,
            'message' => $request->message,
        ]);

        // TODO: Implement actual SMS sending logic
        // For now, just return success
        return response()->json([
            'message' => 'SMS notification queued successfully',
            'orderId' => $request->orderId,
            'type' => $request->type,
        ]);
    }

    /**
     * Log notification activity
     */
    public function logActivity(Request $request): JsonResponse
    {
        $request->validate([
            'orderId' => 'required|string',
            'notificationType' => 'required|string',
            'channels' => 'required|array',
            'status' => 'required|string|in:sent,failed',
            'timestamp' => 'required|string',
        ]);

        // Log the notification activity
        \Log::info('Notification activity logged', [
            'order_id' => $request->orderId,
            'notification_type' => $request->notificationType,
            'channels' => $request->channels,
            'status' => $request->status,
            'timestamp' => $request->timestamp,
            'error' => $request->error ?? null,
        ]);

        return response()->json([
            'message' => 'Activity logged successfully',
            'orderId' => $request->orderId,
        ]);
    }

    /**
     * Store a new notification (for testing purposes)
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'string|in:info,success,warning,error',
        ]);

        $notification = $user->notifications()->create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'App\Notifications\CustomNotification',
            'data' => [
                'title' => $request->title,
                'message' => $request->message,
                'type' => $request->get('type', 'info'),
            ],
            'read_at' => null,
        ]);

        return response()->json([
            'message' => 'Notification created successfully',
            'notification' => $notification
        ], 201);
    }
}