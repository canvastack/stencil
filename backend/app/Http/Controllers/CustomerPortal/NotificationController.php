<?php

namespace App\Http\Controllers\CustomerPortal;

use App\Http\Controllers\Controller;
use App\Application\CustomerQuote\Services\CustomerNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function __construct(
        private CustomerNotificationService $notificationService
    ) {}

    /**
     * Get all notifications for authenticated customer
     */
    public function index(Request $request): JsonResponse
    {
        $customer = $request->user('customer');
        $tenantId = $request->header('X-Tenant-ID');

        $notifications = $this->notificationService->getAllNotifications(
            $customer->id,
            $tenantId,
            $request->input('per_page', 20)
        );

        return response()->json($notifications);
    }

    /**
     * Get unread notifications
     */
    public function unread(Request $request): JsonResponse
    {
        $customer = $request->user('customer');
        $tenantId = $request->header('X-Tenant-ID');

        $notifications = $this->notificationService->getUnreadNotifications(
            $customer->id,
            $tenantId,
            $request->input('limit', 10)
        );

        return response()->json([
            'data' => $notifications,
            'unread_count' => $notifications->count(),
        ]);
    }

    /**
     * Get unread count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $customer = $request->user('customer');
        $tenantId = $request->header('X-Tenant-ID');

        $count = $this->notificationService->getUnreadCount(
            $customer->id,
            $tenantId
        );

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, string $uuid): JsonResponse
    {
        $customer = $request->user('customer');
        $tenantId = $request->header('X-Tenant-ID');

        $success = $this->notificationService->markAsRead(
            $uuid,
            $customer->id,
            $tenantId
        );

        if (!$success) {
            return response()->json([
                'message' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $customer = $request->user('customer');
        $tenantId = $request->header('X-Tenant-ID');

        $count = $this->notificationService->markAllAsRead(
            $customer->id,
            $tenantId
        );

        return response()->json([
            'message' => "Marked {$count} notifications as read",
            'count' => $count,
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy(Request $request, string $uuid): JsonResponse
    {
        $customer = $request->user('customer');
        $tenantId = $request->header('X-Tenant-ID');

        $success = $this->notificationService->deleteNotification(
            $uuid,
            $customer->id,
            $tenantId
        );

        if (!$success) {
            return response()->json([
                'message' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'message' => 'Notification deleted',
        ]);
    }
}
