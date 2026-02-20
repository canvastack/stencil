<?php

namespace App\Http\Controllers\CustomerPortal;

use App\Http\Controllers\Controller;
use App\Models\CustomerNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CustomerNotificationController extends Controller
{
    /**
     * Get paginated notifications for authenticated customer
     */
    public function index(Request $request): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized - No authenticated user'
            ], 401);
        }

        $perPage = (int) $request->input('per_page', 20);
        
        $notifications = CustomerNotification::where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }

    /**
     * Get unread notifications (limited)
     */
    public function unread(Request $request): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $limit = (int) $request->input('limit', 10);

        $notifications = CustomerNotification::where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->unread()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $notifications,
            'meta' => [
                'limit' => $limit,
                'total' => $notifications->count(),
            ]
        ]);
    }

    /**
     * Get unread notification count
     */
    public function unreadCount(): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $count = CustomerNotification::where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->unread()
            ->count();

        return response()->json([
            'count' => $count
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(string $id): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $notification = CustomerNotification::where('uuid', $id)
            ->where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'data' => $notification
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $updated = CustomerNotification::where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read',
            'count' => $updated
        ]);
    }
}
